import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '../src/pages/api/blog/[slug]';
import { createToken } from '../src/lib/auth';
import { createMockDB, createMockLocals, jsonRequest, authRequest, parseResponse } from './helpers/d1-mock';
import type { MockDB } from './helpers/d1-mock';

const TEST_SECRET = 'test-secret-key-for-jwt-signing';
const BASE_URL = 'https://example.com/api/blog/test-post';

const MOCK_POST = {
  id: 1,
  slug: 'test-post',
  title: 'Test Post',
  excerpt: 'A test',
  content: 'Full content',
  content_html: '<p>Full content</p>',
  status: 'published',
  allow_comments: 1,
  comments_close_at: null,
  published_at: '2025-01-01T00:00:00Z',
  tag_names: 'JS,TS',
  tag_slugs: 'js,ts',
  tag_colors: '#F7DF1E,#3178C6',
};

describe('Blog Slug API — GET /api/blog/[slug]', () => {
  let db: MockDB;

  beforeEach(() => {
    db = createMockDB();
  });

  it('should return a published post by slug', async () => {
    db._mockResults.set('WHERE bp.slug', MOCK_POST);

    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await GET({ params, request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.post.title).toBe('Test Post');
    expect(body.post.tags).toHaveLength(2);
    expect(body.post.tags[0].name).toBe('JS');
    expect(body.post.tag_names).toBeUndefined();
  });

  it('should return 404 for non-existent slug', async () => {
    db._mockResults.set('WHERE bp.slug', null);

    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);
    const params = { slug: 'non-existent' };

    const res = await GET({ params, request, locals } as any);
    expect(res.status).toBe(404);
  });

  it('should hide draft posts from non-admins', async () => {
    db._mockResults.set('WHERE bp.slug', { ...MOCK_POST, status: 'draft' });

    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await GET({ params, request, locals } as any);
    expect(res.status).toBe(404);
  });

  it('should show draft posts to admins', async () => {
    db._mockResults.set('WHERE bp.slug', { ...MOCK_POST, status: 'draft' });

    const adminToken = await createToken(1, 'admin', TEST_SECRET);
    const request = authRequest(BASE_URL, adminToken);
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await GET({ params, request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.post.status).toBe('draft');
  });

  it('should handle posts with no tags', async () => {
    db._mockResults.set('WHERE bp.slug', { ...MOCK_POST, tag_names: null, tag_slugs: null, tag_colors: null });

    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await GET({ params, request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(body.post.tags).toEqual([]);
  });

  it('should return error if slug param is missing', async () => {
    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);
    const params = { slug: undefined };

    const res = await GET({ params, request, locals } as any);
    expect(res.status).toBe(400);
  });
});

describe('Blog Slug API — PUT /api/blog/[slug]', () => {
  let db: MockDB;
  let adminToken: string;

  beforeEach(async () => {
    db = createMockDB();
    adminToken = await createToken(1, 'admin', TEST_SECRET);
    // Default: post exists
    db._mockResults.set('SELECT * FROM blog_posts WHERE slug', { ...MOCK_POST });
  });

  it('should reject unauthenticated requests', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'PUT',
      body: { title: 'Updated' },
    });
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await PUT({ params, request, locals } as any);
    expect(res.status).toBe(401);
  });

  it('should return 404 for non-existent post', async () => {
    db._mockResults.set('SELECT * FROM blog_posts WHERE slug', null);

    const request = authRequest(BASE_URL, adminToken, {
      method: 'PUT',
      body: { title: 'Updated' },
    });
    const locals = createMockLocals(db);
    const params = { slug: 'non-existent' };

    const res = await PUT({ params, request, locals } as any);
    expect(res.status).toBe(404);
  });

  it('should update a post successfully', async () => {
    // No slug collision
    db._mockResults.set('SELECT id FROM blog_posts WHERE slug', null);

    const request = authRequest(BASE_URL, adminToken, {
      method: 'PUT',
      body: { title: 'Updated Title' },
    });
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await PUT({ params, request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('updated');
  });

  it('should reject duplicate slug when changing slug', async () => {
    // Slug collision exists
    db._mockResults.set('SELECT id FROM blog_posts WHERE slug', { id: 99 });

    const request = authRequest(BASE_URL, adminToken, {
      method: 'PUT',
      body: { slug: 'existing-slug' },
    });
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await PUT({ params, request, locals } as any);
    expect(res.status).toBe(400);
    expect((await parseResponse(res)).error).toContain('slug already exists');
  });

  it('should update tags when provided', async () => {
    db._mockResults.set('SELECT id FROM tags WHERE slug', { id: 5 });

    const request = authRequest(BASE_URL, adminToken, {
      method: 'PUT',
      body: { tags: ['React', 'Node'] },
    });
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await PUT({ params, request, locals } as any);
    expect(res.status).toBe(200);

    // Should clear old tags and insert new ones
    const deleteTagsQuery = db._queries.find(q => q.query.includes('DELETE FROM blog_post_tags'));
    expect(deleteTagsQuery).toBeDefined();
  });

  it('should return 500 if JWT_SECRET is missing', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'PUT',
      body: { title: 'Updated' },
    });
    const locals = createMockLocals(db, { JWT_SECRET: '' });
    const params = { slug: 'test-post' };

    const res = await PUT({ params, request, locals } as any);
    expect(res.status).toBe(500);
  });
});

describe('Blog Slug API — DELETE /api/blog/[slug]', () => {
  let db: MockDB;
  let adminToken: string;

  beforeEach(async () => {
    db = createMockDB();
    adminToken = await createToken(1, 'admin', TEST_SECRET);
  });

  it('should reject unauthenticated requests', async () => {
    const request = jsonRequest(BASE_URL, { method: 'DELETE' });
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await DELETE({ params, request, locals } as any);
    expect(res.status).toBe(401);
  });

  it('should return 404 for non-existent post', async () => {
    db._mockResults.set('SELECT id FROM blog_posts WHERE slug', null);

    const request = authRequest(BASE_URL, adminToken, { method: 'DELETE' });
    const locals = createMockLocals(db);
    const params = { slug: 'non-existent' };

    const res = await DELETE({ params, request, locals } as any);
    expect(res.status).toBe(404);
  });

  it('should delete a post successfully', async () => {
    db._mockResults.set('SELECT id FROM blog_posts WHERE slug', { id: 1 });

    const request = authRequest(BASE_URL, adminToken, { method: 'DELETE' });
    const locals = createMockLocals(db);
    const params = { slug: 'test-post' };

    const res = await DELETE({ params, request, locals } as any);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('deleted');
  });

  it('should return error if slug param is missing', async () => {
    const request = authRequest(BASE_URL, adminToken, { method: 'DELETE' });
    const locals = createMockLocals(db);
    const params = { slug: undefined };

    const res = await DELETE({ params, request, locals } as any);
    expect(res.status).toBe(400);
  });
});
