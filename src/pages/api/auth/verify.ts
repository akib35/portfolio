/**
 * 2FA Code Verification endpoint
 * POST /api/auth/verify — Verify the 6-digit code to complete login
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { createToken, jsonResponse, errorResponse } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  try {
    const body = await request.json() as { pending_token?: string; code?: string };

    if (!body.pending_token || !body.code) {
      return errorResponse('Pending token and code are required');
    }

    const code = body.code.trim();
    const pendingToken = body.pending_token.trim();

    if (!/^\d{6}$/.test(code)) {
      return errorResponse('Invalid code format');
    }

    // Look up the pending 2FA code (token stored with IP prefix: ip:x.x.x.x:UUID)
    const record = await env.DB.prepare(
      `SELECT ac.id, ac.user_id, ac.code, ac.expires_at, ac.used, ac.attempts,
              au.username, au.display_name
       FROM auth_codes ac
       JOIN admin_users au ON au.id = ac.user_id
       WHERE ac.pending_token LIKE ? AND ac.used = 0`
    ).bind(`%:${pendingToken}`).first<{
      id: number;
      user_id: number;
      code: string;
      expires_at: string;
      used: number;
      attempts: number;
      username: string;
      display_name: string;
    }>();

    if (!record) {
      return errorResponse('Invalid or expired verification token', 401);
    }

    // Check max attempts (brute-force protection)
    const MAX_VERIFY_ATTEMPTS = 5;
    if ((record.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
      await env.DB.prepare('UPDATE auth_codes SET used = 1 WHERE id = ?').bind(record.id).run();
      return errorResponse('Too many failed attempts. Please log in again.', 429);
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      await env.DB.prepare('UPDATE auth_codes SET used = 1 WHERE id = ?').bind(record.id).run();
      return errorResponse('Verification code has expired. Please log in again.', 401);
    }

    // Verify the code
    if (record.code !== code) {
      // Increment attempts counter
      await env.DB.prepare('UPDATE auth_codes SET attempts = COALESCE(attempts, 0) + 1 WHERE id = ?').bind(record.id).run();
      return errorResponse('Incorrect verification code', 401);
    }

    // Mark as used
    await env.DB.prepare('UPDATE auth_codes SET used = 1 WHERE id = ?').bind(record.id).run();

    // Update last login
    await env.DB.prepare(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(record.user_id).run();

    // Create JWT
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) return errorResponse('Server misconfiguration', 500);
    const token = await createToken(record.user_id, record.username, jwtSecret);

    // Return token in both JSON and Set-Cookie
    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: record.user_id,
          username: record.username,
          display_name: record.display_name,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `admin_token=${token}; Path=/; SameSite=Lax; Max-Age=86400`,
        },
      }
    );
  } catch (error) {
    console.error('2FA verification error:', error);
    return errorResponse('Verification failed', 500);
  }
};
