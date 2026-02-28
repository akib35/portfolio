import { describe, it, expect, beforeEach } from 'vitest';
import { POST, GET } from '../src/pages/api/auth/login';
import { hashPassword, createToken } from '../src/lib/auth';
import { createMockDB, createMockLocals, jsonRequest, authRequest, parseResponse } from './helpers/d1-mock';
import type { MockDB } from './helpers/d1-mock';

const TEST_SECRET = 'test-secret-key-for-jwt-signing';
const BASE_URL = 'https://example.com/api/auth/login';

describe('Auth Login API — POST /api/auth/login', () => {
  let db: MockDB;

  beforeEach(async () => {
    db = createMockDB();
    // Default: rate limit OK
    db._mockResults.set('SELECT COUNT', { cnt: 0 });
    // Default: admin exists (no auto-seed needed)
    db._mockResults.set('SELECT COUNT(*) as count FROM admin_users', { count: 1 });
  });

  it('should require username', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { password: 'test' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('Username and password are required');
  });

  it('should require password', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { username: 'admin' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
  });

  it('should reject invalid credentials (user not found)', async () => {
    db._mockResults.set('SELECT id, username, password_hash', null);

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { username: 'nonexistent', password: 'wrong' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(401);
    expect((await parseResponse(res)).error).toContain('Invalid credentials');
  });

  it('should reject invalid password', async () => {
    const passHash = await hashPassword('correct-password');
    db._mockResults.set('SELECT id, username, password_hash', {
      id: 1, username: 'admin', password_hash: passHash, display_name: 'Admin',
    });

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { username: 'admin', password: 'wrong-password' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(401);
    expect((await parseResponse(res)).error).toContain('Invalid credentials');
  });

  it('should succeed and return 2FA pending token', async () => {
    const passHash = await hashPassword('Akib@123');
    db._mockResults.set('SELECT id, username, password_hash', {
      id: 1, username: 'akib', password_hash: passHash, display_name: 'Md Akib Hasan',
    });

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { username: 'akib', password: 'Akib@123' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.requires_2fa).toBe(true);
    expect(body.pending_token).toBeDefined();
    expect(typeof body.pending_token).toBe('string');
    expect(body.pending_token.length).toBeGreaterThan(0);
  });

  it('should handle logout action', async () => {
    const request = jsonRequest(`${BASE_URL}?action=logout`, { method: 'POST' });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Logged out');

    // Should clear cookie
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toContain('admin_token=');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('should enforce rate limits', async () => {
    // Simulate max attempts exceeded
    db._mockResults.set('SELECT COUNT', { cnt: 10 });

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { username: 'admin', password: 'test' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(429);
    expect((await parseResponse(res)).error).toContain('Too many login attempts');
  });
});

describe('Auth Login API — GET /api/auth/login', () => {
  let db: MockDB;

  beforeEach(() => {
    db = createMockDB();
  });

  it('should return setup check', async () => {
    const request = jsonRequest(`${BASE_URL}?check=setup`);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.needs_setup).toBe(false);
  });

  it('should return 401 if not authenticated', async () => {
    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    expect(res.status).toBe(401);
  });

  it('should return user info for valid token', async () => {
    const adminToken = await createToken(1, 'admin', TEST_SECRET);
    db._mockResults.set('SELECT id, username', {
      id: 1, username: 'admin', display_name: 'Admin', created_at: '2025-01-01', last_login: '2025-01-02',
    });

    const request = authRequest(BASE_URL, adminToken);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
    expect(body.user.username).toBe('admin');
  });

  it('should return 401 for expired/invalid token', async () => {
    const request = authRequest(BASE_URL, 'invalid-token');
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    expect(res.status).toBe(401);
  });

  it('should return 500 if JWT_SECRET is missing', async () => {
    const adminToken = await createToken(1, 'admin', TEST_SECRET);
    const request = authRequest(BASE_URL, adminToken);
    const locals = createMockLocals(db, { JWT_SECRET: '' });

    const res = await GET({ request, locals } as any);
    expect(res.status).toBe(500);
  });
});
