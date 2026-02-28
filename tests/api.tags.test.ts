import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../src/pages/api/tags';
import { createToken } from '../src/lib/auth';
import { createMockDB, createMockLocals, jsonRequest, authRequest, parseResponse } from './helpers/d1-mock';
import type { MockDB } from './helpers/d1-mock';

const TEST_SECRET = 'test-secret-key-for-jwt-signing';
const BASE_URL = 'https://example.com/api/tags';

describe('Tags API — GET /api/tags', () => {
  let db: MockDB;

  beforeEach(() => {
    db = createMockDB();
  });

  it('should return list of tags with post counts', async () => {
    db._mockAllResults.set('FROM tags', [
      { id: 1, name: 'JavaScript', slug: 'javascript', color: '#F7DF1E', post_count: 5 },
      { id: 2, name: 'TypeScript', slug: 'typescript', color: '#3178C6', post_count: 3 },
    ]);

    const locals = createMockLocals(db);
    const res = await GET({ locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tags).toHaveLength(2);
    expect(body.tags[0].name).toBe('JavaScript');
    expect(body.tags[0].post_count).toBe(5);
  });

  it('should return empty array when no tags exist', async () => {
    db._mockAllResults.set('FROM tags', []);

    const locals = createMockLocals(db);
    const res = await GET({ locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.tags).toHaveLength(0);
  });
});

describe('Tags API — POST /api/tags', () => {
  let db: MockDB;
  let adminToken: string;

  beforeEach(async () => {
    db = createMockDB();
    adminToken = await createToken(1, 'admin', TEST_SECRET);
  });

  it('should reject unauthenticated requests', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { name: 'NewTag' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(401);
  });

  it('should require tag name', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: {},
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('Tag name is required');
  });

  it('should reject empty tag name', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { name: '   ' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
  });

  it('should reject duplicate tag slug', async () => {
    db._mockResults.set('SELECT id FROM tags WHERE slug', { id: 1 });

    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { name: 'JavaScript' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('already exists');
  });

  it('should create a new tag with default color', async () => {
    db._mockResults.set('SELECT id FROM tags WHERE slug', null);

    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { name: 'Rust' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.slug).toBe('rust');
  });

  it('should create a tag with custom color', async () => {
    db._mockResults.set('SELECT id FROM tags WHERE slug', null);

    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { name: 'Go', color: '#00ADD8' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.slug).toBe('go');
  });

  it('should return 500 if JWT_SECRET is missing', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { name: 'Test' },
    });
    const locals = createMockLocals(db, { JWT_SECRET: '' });

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(500);
  });
});
