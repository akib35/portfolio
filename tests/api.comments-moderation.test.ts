import { describe, it, expect, beforeEach } from 'vitest';
import { PATCH, DELETE } from '../src/pages/api/comments/[id]';
import { createToken } from '../src/lib/auth';
import { createMockDB, createMockLocals, authRequest, jsonRequest, parseResponse } from './helpers/d1-mock';
import type { MockDB } from './helpers/d1-mock';

const TEST_SECRET = 'test-secret-key-for-jwt-signing';
const BASE_URL = 'https://example.com/api/comments/1';

describe('Comment Moderation API — PATCH /api/comments/[id]', () => {
  let db: MockDB;
  let adminToken: string;

  beforeEach(async () => {
    db = createMockDB();
    adminToken = await createToken(1, 'admin', TEST_SECRET);
    // Default: comment exists
    db._mockResults.set('FROM comments c', {
      id: 1, author_name: 'User', author_email: 'user@test.com', content: 'Test comment', post_title: 'Test Post',
    });
  });

  it('should reject unauthenticated requests', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'PATCH',
      body: { is_approved: true },
    });
    const locals = createMockLocals(db);
    const params = { id: '1' };

    const res = await PATCH({ params, request, locals } as any);
    expect(res.status).toBe(401);
  });

  it('should require is_approved field', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'PATCH',
      body: {},
    });
    const locals = createMockLocals(db);
    const params = { id: '1' };

    const res = await PATCH({ params, request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('is_approved is required');
  });

  it('should reject invalid comment ID', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'PATCH',
      body: { is_approved: true },
    });
    const locals = createMockLocals(db);
    const params = { id: 'abc' };

    const res = await PATCH({ params, request, locals } as any);
    expect(res.status).toBe(400);
    expect((await parseResponse(res)).error).toContain('Invalid comment ID');
  });

  it('should return 404 for non-existent comment', async () => {
    db._mockResults.set('FROM comments c', null);

    const request = authRequest(BASE_URL, adminToken, {
      method: 'PATCH',
      body: { is_approved: true },
    });
    const locals = createMockLocals(db);
    const params = { id: '999' };

    const res = await PATCH({ params, request, locals } as any);
    expect(res.status).toBe(404);
  });

  it('should approve a comment', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'PATCH',
      body: { is_approved: true },
    });
    const locals = createMockLocals(db);
    const params = { id: '1' };

    const res = await PATCH({ params, request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('approved');
    expect(body.email_sent).toBe(false);
  });

  it('should reject a comment', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'PATCH',
      body: { is_approved: false },
    });
    const locals = createMockLocals(db);
    const params = { id: '1' };

    const res = await PATCH({ params, request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('rejected');
  });

  it('should not send email if send_email is false', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'PATCH',
      body: { is_approved: false, send_email: false },
    });
    const locals = createMockLocals(db);
    const params = { id: '1' };

    const res = await PATCH({ params, request, locals } as any);
    const body = await parseResponse(res);

    expect(body.email_sent).toBe(false);
  });

  it('should return 500 if JWT_SECRET is missing', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'PATCH',
      body: { is_approved: true },
    });
    const locals = createMockLocals(db, { JWT_SECRET: '' });
    const params = { id: '1' };

    const res = await PATCH({ params, request, locals } as any);
    expect(res.status).toBe(500);
  });
});

describe('Comment Moderation API — DELETE /api/comments/[id]', () => {
  let db: MockDB;
  let adminToken: string;

  beforeEach(async () => {
    db = createMockDB();
    adminToken = await createToken(1, 'admin', TEST_SECRET);
    db._mockResults.set('FROM comments c', {
      id: 1, author_name: 'User', author_email: 'user@test.com', content: 'Test', post_title: 'Post',
    });
  });

  it('should reject unauthenticated requests', async () => {
    const request = jsonRequest(BASE_URL, { method: 'DELETE' });
    const locals = createMockLocals(db);
    const params = { id: '1' };

    const res = await DELETE({ params, request, locals } as any);
    expect(res.status).toBe(401);
  });

  it('should reject invalid comment ID', async () => {
    const request = authRequest(BASE_URL, adminToken, { method: 'DELETE' });
    const locals = createMockLocals(db);
    const params = { id: 'abc' };

    const res = await DELETE({ params, request, locals } as any);
    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent comment', async () => {
    db._mockResults.set('FROM comments c', null);

    const request = authRequest(BASE_URL, adminToken, { method: 'DELETE' });
    const locals = createMockLocals(db);
    const params = { id: '999' };

    const res = await DELETE({ params, request, locals } as any);
    expect(res.status).toBe(404);
  });

  it('should delete a comment successfully', async () => {
    const request = authRequest(BASE_URL, adminToken, { method: 'DELETE' });
    const locals = createMockLocals(db);
    const params = { id: '1' };

    const res = await DELETE({ params, request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('deleted');
    expect(body.email_sent).toBe(false);
  });

  it('should delete with optional rejection email body', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'DELETE',
      body: { send_email: false, rejection_reason: 'spam' },
    });
    const locals = createMockLocals(db);
    const params = { id: '1' };

    const res = await DELETE({ params, request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('should return 500 if JWT_SECRET is missing', async () => {
    const request = authRequest(BASE_URL, adminToken, { method: 'DELETE' });
    const locals = createMockLocals(db, { JWT_SECRET: '' });
    const params = { id: '1' };

    const res = await DELETE({ params, request, locals } as any);
    expect(res.status).toBe(500);
  });
});
