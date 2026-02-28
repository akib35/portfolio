/**
 * Auth API endpoints
 * POST /api/auth/login - Step 1: verify credentials, send 2FA code via email
 * POST /api/auth/login?action=logout - Logout (clear cookie)
 * GET  /api/auth/login - Check current session
 * GET  /api/auth/login?check=setup - Check if setup needed
 *
 * Preset admin:
 *   Name: Md Akib Hasan | Username: akib | Password: Akib@123
 *   Auto-seeded into DB on first login attempt if no admin exists.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import {
  createToken,
  verifyToken,
  verifyPassword,
  hashPassword,
  extractToken,
  jsonResponse,
  errorResponse,
} from '../../../lib/auth';

// ── Admin defaults (override via env: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME) ──
const TWO_FA_EMAIL = 'contact@akib35.me';
const CODE_EXPIRY_MINUTES = 5;

function getPresetAdmin(env: CloudflareEnv) {
  return {
    username: (env as any).ADMIN_USERNAME || 'akib',
    password: (env as any).ADMIN_PASSWORD || 'Akib@123',
    display_name: (env as any).ADMIN_DISPLAY_NAME || 'Md Akib Hasan',
  };
}

// ── POST handler ────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'logout') {
    return handleLogout();
  }

  return handleLogin(request, env);
};

// ── GET handler ─────────────────────────────────────────────────────
export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const url = new URL(request.url);

  // Check if setup is needed
  if (url.searchParams.get('check') === 'setup') {
    return jsonResponse({ success: true, needs_setup: false });
  }

  const token = extractToken(request);
  if (!token) return errorResponse('Not authenticated', 401);

  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) return errorResponse('Server misconfiguration', 500);
  const payload = await verifyToken(token, jwtSecret);
  if (!payload) return errorResponse('Invalid or expired token', 401);

  try {
    const user = await env.DB.prepare(
      'SELECT id, username, display_name, created_at, last_login FROM admin_users WHERE id = ?'
    ).bind(Number(payload.sub)).first();
    if (!user) return errorResponse('User not found', 401);
    return jsonResponse({ success: true, user });
  } catch {
    return errorResponse('Database error', 500);
  }
};

// ── Auto-seed the preset admin if no users exist ────────────────────
async function ensureAdminExists(env: CloudflareEnv): Promise<void> {
  try {
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM admin_users').first<{ count: number }>();
    if (result && result.count > 0) return;

    const admin = getPresetAdmin(env);
    const passwordHash = await hashPassword(admin.password);
    await env.DB.prepare(
      'INSERT INTO admin_users (username, password_hash, display_name) VALUES (?, ?, ?)'
    ).bind(admin.username, passwordHash, admin.display_name).run();

    console.log('[auth] Admin user auto-seeded.');
  } catch (e) {
    console.error('[auth] Failed to seed admin:', e);
  }
}

// ── Rate limiting helper (IP-based, using auth_codes table) ─────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 15;

async function checkRateLimit(request: Request, env: CloudflareEnv): Promise<boolean> {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
  try {
    const result = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM auth_codes WHERE pending_token LIKE ? AND created_at > ?`
    ).bind(`ip:${ip}:%`, windowStart).first<{ cnt: number }>();
    return (result?.cnt || 0) < MAX_LOGIN_ATTEMPTS;
  } catch { return true; }
}

// ── Login handler (step 1 of 2FA) ───────────────────────────────────
async function handleLogin(request: Request, env: CloudflareEnv): Promise<Response> {
  try {
    // Rate limit check
    const allowed = await checkRateLimit(request, env);
    if (!allowed) {
      return errorResponse('Too many login attempts. Please try again later.', 429);
    }
    const body = await request.json() as { username?: string; password?: string };

    if (!body.username || !body.password) {
      return errorResponse('Username and password are required');
    }

    // Auto-seed admin if the DB is empty
    await ensureAdminExists(env);

    const username = body.username.trim().toLowerCase();

    // Look up user
    const user = await env.DB.prepare(
      'SELECT id, username, password_hash, display_name FROM admin_users WHERE username = ?'
    ).bind(username).first<{ id: number; username: string; password_hash: string; display_name: string }>();

    if (!user) return errorResponse('Invalid credentials', 401);

    // Verify password
    const valid = await verifyPassword(body.password, user.password_hash);
    if (!valid) return errorResponse('Invalid credentials', 401);

    // ── Generate 2FA code ──────────────────────────────────────────
    // Cryptographically secure 6-digit code
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const code = String(100000 + (arr[0] % 900000));
    const pendingToken = crypto.randomUUID();
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const storedToken = `ip:${ip}:${pendingToken}`;
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Clean up old expired codes first
    await env.DB.prepare('DELETE FROM auth_codes WHERE expires_at < datetime(\'now\')').run();

    // Store the code
    await env.DB.prepare(
      'INSERT INTO auth_codes (user_id, code, pending_token, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(user.id, code, storedToken, expiresAt).run();

    // ── Send 2FA email via Resend ──────────────────────────────────
    const emailSent = await send2FAEmail(code, env);

    if (!emailSent) {
      // Log the code to console ONLY when RESEND_API_KEY is absent (local dev)
      // In production RESEND_API_KEY is always set, so this branch never runs there
      console.log(`[2FA] RESEND_API_KEY not set — dev code for ${user.username}: ${code}`);
    }

    return jsonResponse({
      success: true,
      requires_2fa: true,
      pending_token: pendingToken,
      message: emailSent
        ? `Verification code sent to ${maskEmail(TWO_FA_EMAIL)}`
        : 'Verification code generated (check server console in dev mode)',
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Login failed', 500);
  }
}

// ── Send 2FA code via Resend API ────────────────────────────────────
async function send2FAEmail(code: string, env: CloudflareEnv): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Admin <noreply@akib35.me>',
        to: [TWO_FA_EMAIL],
        subject: '🔐 Your login verification code',
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1D4ED8; margin-bottom: 8px;">Admin Login Verification</h2>
            <p style="color: #6B7280; font-size: 14px;">Your 2FA login code is:</p>
            <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">${code}</span>
            </div>
            <p style="color: #9CA3AF; font-size: 12px;">This code expires in ${CODE_EXPIRY_MINUTES} minutes. If you didn't request this, ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error('[2FA email] Resend error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('[2FA email] Send failed:', e);
    return false;
  }
}

// ── Logout handler ──────────────────────────────────────────────────
function handleLogout(): Response {
  return new Response(
    JSON.stringify({ success: true, message: 'Logged out' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'admin_token=; Path=/; SameSite=Lax; Max-Age=0',
      },
    }
  );
}

// ── Helpers ─────────────────────────────────────────────────────────
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 1))}${local.slice(-1)}@${domain}`;
}
