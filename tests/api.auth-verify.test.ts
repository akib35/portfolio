import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../src/pages/api/auth/verify';
import { createMockDB, createMockLocals, jsonRequest, parseResponse } from './helpers/d1-mock';
import type { MockDB } from './helpers/d1-mock';

const TEST_SECRET = 'test-secret-key-for-jwt-signing';
const BASE_URL = 'https://example.com/api/auth/verify';

describe('Auth Verify API — POST /api/auth/verify', () => {
  let db: MockDB;

  const validRecord = {
    id: 1,
    user_id: 1,
    code: '123456',
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min from now
    used: 0,
    attempts: 0,
    username: 'admin',
    display_name: 'Admin User',
  };

  beforeEach(() => {
    db = createMockDB();
    db._mockResults.set('FROM auth_codes', { ...validRecord });
  });

  it('should require pending_token', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { code: '123456' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('Pending token and code are required');
  });

  it('should require code', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
  });

  it('should reject non-6-digit code format', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid', code: 'abc' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid code format');
  });

  it('should reject 5-digit code', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid', code: '12345' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
  });

  it('should reject invalid/expired pending token', async () => {
    db._mockResults.set('FROM auth_codes', null);

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'invalid-uuid', code: '123456' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(401);
    expect((await parseResponse(res)).error).toContain('Invalid or expired');
  });

  it('should reject after too many failed attempts', async () => {
    db._mockResults.set('FROM auth_codes', { ...validRecord, attempts: 5 });

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid', code: '123456' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(429);
    expect((await parseResponse(res)).error).toContain('Too many failed attempts');
  });

  it('should reject expired code', async () => {
    db._mockResults.set('FROM auth_codes', {
      ...validRecord,
      expires_at: new Date(Date.now() - 60 * 1000).toISOString(), // 1 min ago
    });

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid', code: '123456' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(401);
    expect((await parseResponse(res)).error).toContain('expired');
  });

  it('should reject incorrect code and increment attempts', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid', code: '999999' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(401);
    expect((await parseResponse(res)).error).toContain('Incorrect verification code');

    // Should have incremented attempts
    const attemptQuery = db._queries.find(q => q.query.includes('attempts = COALESCE'));
    expect(attemptQuery).toBeDefined();
  });

  it('should verify correct code and return JWT', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid', code: '123456' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.token.split('.')).toHaveLength(3); // JWT format
    expect(body.user).toBeDefined();
    expect(body.user.username).toBe('admin');
    expect(body.user.display_name).toBe('Admin User');

    // Should set cookie
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toContain('admin_token=');
    expect(setCookie).toContain('Max-Age=86400');
  });

  it('should mark auth code as used after successful verification', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid', code: '123456' },
    });
    const locals = createMockLocals(db);

    await POST({ request, locals } as any);

    const usedQuery = db._queries.find(q => q.query.includes('UPDATE auth_codes SET used = 1'));
    expect(usedQuery).toBeDefined();
  });

  it('should update last_login timestamp', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid', code: '123456' },
    });
    const locals = createMockLocals(db);

    await POST({ request, locals } as any);

    const loginQuery = db._queries.find(q => q.query.includes('UPDATE admin_users SET last_login'));
    expect(loginQuery).toBeDefined();
  });

  it('should return 500 if JWT_SECRET is missing', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { pending_token: 'some-uuid', code: '123456' },
    });
    const locals = createMockLocals(db, { JWT_SECRET: '' });

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(500);
  });
});
