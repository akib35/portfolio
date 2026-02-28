import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../src/pages/api/comments';
import { createToken } from '../src/lib/auth';
import { createMockDB, createMockLocals, jsonRequest, authRequest, parseResponse } from './helpers/d1-mock';
import type { MockDB } from './helpers/d1-mock';

const TEST_SECRET = 'test-secret-key-for-jwt-signing';
const BASE_URL = 'https://example.com/api/comments';

describe('Comments API — GET /api/comments', () => {
  let db: MockDB;
  let adminToken: string;

  beforeEach(async () => {
    db = createMockDB();
    adminToken = await createToken(1, 'admin', TEST_SECRET);
  });

  it('should require post_id or post_slug parameter', async () => {
    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('post_id or post_slug is required');
  });

  it('should return comments for a post by post_id', async () => {
    const mockComments = [
      { id: 1, blog_post_id: 1, author_name: 'User', content: 'Great post!', is_approved: 1, ip_address: '1.2.3.4', author_email: 'user@test.com' },
    ];
    db._mockAllResults.set('FROM comments', mockComments);

    const request = jsonRequest(`${BASE_URL}?post_id=1`);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.comments).toBeDefined();
    // Non-admin: sensitive fields should be stripped
    expect(body.comments[0].ip_address).toBeUndefined();
    expect(body.comments[0].author_email).toBeUndefined();
  });

  it('should return comments for a post by post_slug', async () => {
    db._mockResults.set('SELECT id FROM blog_posts WHERE slug', { id: 1 });
    db._mockAllResults.set('FROM comments', [
      { id: 1, author_name: 'User', content: 'Nice!', is_approved: 1 },
    ]);

    const request = jsonRequest(`${BASE_URL}?post_slug=my-post`);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('should return 404 for non-existent post slug', async () => {
    db._mockResults.set('SELECT id FROM blog_posts WHERE slug', null);

    const request = jsonRequest(`${BASE_URL}?post_slug=non-existent`);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    expect(res.status).toBe(404);
  });

  it('should include sensitive fields for admin', async () => {
    const mockComments = [
      { id: 1, author_name: 'User', content: 'Hello', ip_address: '1.2.3.4', author_email: 'test@test.com', user_agent: 'Mozilla/5.0' },
    ];
    db._mockAllResults.set('FROM comments', mockComments);

    const request = authRequest(`${BASE_URL}?post_id=1`, adminToken);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.comments[0].ip_address).toBe('1.2.3.4');
    expect(body.comments[0].author_email).toBe('test@test.com');
  });

  it('should list all comments across posts for admin with ?all=true', async () => {
    db._mockAllResults.set('FROM comments c', [
      { id: 1, author_name: 'User1', post_title: 'Post A' },
      { id: 2, author_name: 'User2', post_title: 'Post B' },
    ]);

    const request = authRequest(`${BASE_URL}?all=true`, adminToken);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.comments.length).toBe(2);
  });

  it('should not allow non-admin to use ?all=true', async () => {
    const request = jsonRequest(`${BASE_URL}?all=true`);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    // Without admin token and without post_id, should fail
    expect(res.status).toBe(400);
  });
});

describe('Comments API — POST /api/comments', () => {
  let db: MockDB;

  beforeEach(() => {
    db = createMockDB();
  });

  it('should require author_name', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_email: 'test@test.com', content: 'Hello', post_slug: 'my-post' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('Name is required');
  });

  it('should require author_email', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_name: 'User', content: 'Hello', post_slug: 'my-post' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('Email is required');
  });

  it('should require content', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_name: 'User', author_email: 'test@test.com', post_slug: 'my-post' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain('Comment content is required');
  });

  it('should reject invalid email format', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_name: 'User', author_email: 'not-an-email', content: 'Hello', post_slug: 'my-post' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
    expect((await parseResponse(res)).error).toContain('Invalid email');
  });

  it('should reject name longer than 100 characters', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_name: 'A'.repeat(101), author_email: 'test@test.com', content: 'Hello', post_slug: 'my-post' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
    expect((await parseResponse(res)).error).toContain('too long');
  });

  it('should reject content longer than 5000 characters', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_name: 'User', author_email: 'test@test.com', content: 'A'.repeat(5001), post_slug: 'my-post' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
    expect((await parseResponse(res)).error).toContain('too long');
  });

  it('should require blog_post_id or post_slug', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_name: 'User', author_email: 'test@test.com', content: 'Hello' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
    expect((await parseResponse(res)).error).toContain('blog_post_id or post_slug is required');
  });

  it('should return 404 if post_slug does not exist', async () => {
    db._mockResults.set('SELECT id, allow_comments', null);

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_name: 'User', author_email: 'test@test.com', content: 'Hello', post_slug: 'nonexistent' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(404);
  });

  it('should return 403 if comments are disabled', async () => {
    // First query: post_slug lookup
    db._mockResults.set('allow_comments', { id: 1, allow_comments: 0, comments_close_at: null });

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_name: 'User', author_email: 'test@test.com', content: 'Hello', post_slug: 'my-post' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(403);
    expect((await parseResponse(res)).error).toContain('Comments are disabled');
  });

  it('should create comment successfully with post_id', async () => {
    db._mockResults.set('SELECT id, allow_comments', { id: 1, allow_comments: 1, comments_close_at: null });

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { author_name: 'User', author_email: 'test@test.com', content: 'Great post!', blog_post_id: 1 },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toContain('moderation');
  });

  it('should sanitize XSS in content', async () => {
    db._mockResults.set('SELECT id, allow_comments', { id: 1, allow_comments: 1, comments_close_at: null });

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: {
        author_name: 'User',
        author_email: 'test@test.com',
        content: '<script>alert("xss")</script>',
        blog_post_id: 1,
      },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(201);

    // Check the query bindings for sanitized content
    const insertQuery = db._queries.find(q => q.query.includes('INSERT INTO comments'));
    expect(insertQuery).toBeDefined();
    if (insertQuery) {
      const content = insertQuery.bindings[4]; // sanitizedContent position
      expect(content).not.toContain('<script>');
      expect(content).toContain('&lt;script&gt;');
    }
  });

  it('should return 404 for non-existent parent comment', async () => {
    // Post lookup succeeds
    db._mockResults.set('allow_comments, comments_close_at FROM blog_posts WHERE slug', { id: 1, allow_comments: 1, comments_close_at: null });
    db._mockResults.set('allow_comments, comments_close_at FROM blog_posts WHERE id', { id: 1, allow_comments: 1, comments_close_at: null });
    // Parent comment lookup returns null
    db._mockResults.set('SELECT id FROM comments WHERE id', null);

    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: {
        author_name: 'User',
        author_email: 'test@test.com',
        content: 'Reply',
        blog_post_id: 1,
        parent_id: 999,
      },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(404);
    expect((await parseResponse(res)).error).toContain('Parent comment not found');
  });
});
