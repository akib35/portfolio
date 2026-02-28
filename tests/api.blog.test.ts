import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../src/pages/api/blog/index';
import { createToken } from '../src/lib/auth';
import { createMockDB, createMockLocals, jsonRequest, authRequest, parseResponse } from './helpers/d1-mock';
import type { MockDB } from './helpers/d1-mock';

const TEST_SECRET = 'test-secret-key-for-jwt-signing';
const BASE_URL = 'https://example.com/api/blog';

describe('Blog API — GET /api/blog', () => {
  let db: MockDB;

  beforeEach(() => {
    db = createMockDB();
    db._mockResults.set('SELECT COUNT', { total: 2 });
  });

  it('should return paginated blog posts for public', async () => {
    db._mockAllResults.set('FROM blog_posts', [
      { id: 1, slug: 'post-1', title: 'Post 1', status: 'published', tag_names: 'JS', tag_slugs: 'js', tag_colors: '#F7DF1E' },
      { id: 2, slug: 'post-2', title: 'Post 2', status: 'published', tag_names: null, tag_slugs: null, tag_colors: null },
    ]);

    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.posts).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
  });

  it('should parse comma-separated tags', async () => {
    db._mockAllResults.set('FROM blog_posts', [
      { id: 1, slug: 'post-1', title: 'Post 1', tag_names: 'JS,TS', tag_slugs: 'js,ts', tag_colors: '#F7DF1E,#3178C6' },
    ]);

    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(body.posts[0].tags).toHaveLength(2);
    expect(body.posts[0].tags[0].name).toBe('JS');
    expect(body.posts[0].tags[1].name).toBe('TS');
    // Raw fields should be removed
    expect(body.posts[0].tag_names).toBeUndefined();
  });

  it('should handle posts with no tags', async () => {
    db._mockAllResults.set('FROM blog_posts', [
      { id: 1, slug: 'post-1', title: 'Post 1', tag_names: null },
    ]);

    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(body.posts[0].tags).toEqual([]);
  });

  it('should support page and limit params', async () => {
    db._mockAllResults.set('FROM blog_posts', []);

    const request = jsonRequest(`${BASE_URL}?page=2&limit=5`);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(body.pagination.page).toBe(2);
    expect(body.pagination.limit).toBe(5);
  });

  it('should clamp limit to max 50', async () => {
    db._mockAllResults.set('FROM blog_posts', []);

    const request = jsonRequest(`${BASE_URL}?limit=100`);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(body.pagination.limit).toBe(50);
  });

  it('should support tag filter', async () => {
    db._mockAllResults.set('FROM blog_posts', []);
    db._mockResults.set('SELECT COUNT', { total: 0 });

    const request = jsonRequest(`${BASE_URL}?tag=javascript`);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    expect(res.status).toBe(200);

    // Verify query was built with tag filter
    const tagQuery = db._queries.find(q => q.query.includes('t2.slug'));
    expect(tagQuery).toBeDefined();
  });

  it('should support search query', async () => {
    db._mockAllResults.set('FROM blog_posts', []);
    db._mockResults.set('SELECT COUNT', { total: 0 });

    const request = jsonRequest(`${BASE_URL}?q=astro`);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    expect(res.status).toBe(200);

    const searchQuery = db._queries.find(q => q.query.includes('LIKE'));
    expect(searchQuery).toBeDefined();
  });

  it('should not expose content in list view', async () => {
    db._mockAllResults.set('FROM blog_posts', [
      { id: 1, slug: 'post', title: 'Post', content: 'Full text', content_html: '<p>Full</p>', tag_names: null },
    ]);

    const request = jsonRequest(BASE_URL);
    const locals = createMockLocals(db);

    const res = await GET({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(body.posts[0].content).toBeUndefined();
  });
});

describe('Blog API — POST /api/blog', () => {
  let db: MockDB;
  let adminToken: string;

  beforeEach(async () => {
    db = createMockDB({ lastRowId: 42 });
    adminToken = await createToken(1, 'admin', TEST_SECRET);
    // Default: slug doesn't exist
    db._mockResults.set('SELECT id FROM blog_posts WHERE slug', null);
  });

  it('should reject unauthenticated requests', async () => {
    const request = jsonRequest(BASE_URL, {
      method: 'POST',
      body: { title: 'Test', content: 'Body', content_html: '<p>Body</p>' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(401);
  });

  it('should require title', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { content: 'Body', content_html: '<p>Body</p>' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
    expect((await parseResponse(res)).error).toContain('Title is required');
  });

  it('should require content', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { title: 'Test' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
    expect((await parseResponse(res)).error).toContain('Content is required');
  });

  it('should reject duplicate slug', async () => {
    db._mockResults.set('SELECT id FROM blog_posts WHERE slug', { id: 1 });

    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { title: 'Test', content: 'Body', content_html: '<p>Body</p>' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(400);
    expect((await parseResponse(res)).error).toContain('slug already exists');
  });

  it('should create a post as draft by default', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { title: 'My New Post', content: 'Content here', content_html: '<p>Content</p>' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.slug).toBe('my-new-post');
    expect(body.id).toBe(42);

    // Verify the INSERT query used 'draft' status
    const insertQuery = db._queries.find(q => q.query.includes('INSERT INTO blog_posts'));
    expect(insertQuery).toBeDefined();
  });

  it('should create a published post with publishedAt', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { title: 'Published Post', content: 'Body', content_html: '<p>Body</p>', status: 'published' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('should use custom slug if provided', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { title: 'Test', slug: 'custom-slug', content: 'Body', content_html: '<p>Body</p>' },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    const body = await parseResponse<any>(res);

    expect(res.status).toBe(201);
    expect(body.slug).toBe('custom-slug');
  });

  it('should handle tags during creation', async () => {
    // Tag lookup returns a tag ID
    db._mockResults.set('SELECT id FROM tags WHERE slug', { id: 10 });

    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { title: 'Tagged Post', content: 'Body', content_html: '<p>Body</p>', tags: ['JavaScript', 'TypeScript'] },
    });
    const locals = createMockLocals(db);

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(201);

    // Verify tag insert queries were made
    const tagQueries = db._queries.filter(q => q.query.includes('INSERT OR IGNORE INTO tags'));
    expect(tagQueries.length).toBe(2);
  });

  it('should return 500 if JWT_SECRET is missing', async () => {
    const request = authRequest(BASE_URL, adminToken, {
      method: 'POST',
      body: { title: 'Test', content: 'Body', content_html: '<p>Body</p>' },
    });
    const locals = createMockLocals(db, { JWT_SECRET: '' });

    const res = await POST({ request, locals } as any);
    expect(res.status).toBe(500);
  });
});
