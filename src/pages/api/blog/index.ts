/**
 * Blog Posts API
 * GET    /api/blog - List published posts (public) or all posts (admin)
 * POST   /api/blog - Create a new post (admin only)
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyToken, extractToken, generateSlug, jsonResponse, errorResponse } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const url = new URL(request.url);

  // Check if admin request
  const token = extractToken(request);
  const jwtSecret = env.JWT_SECRET || '';
  const payload = token ? await verifyToken(token, jwtSecret) : null;
  const isAdmin = !!payload;

  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;
  const tag = url.searchParams.get('tag');
  const search = url.searchParams.get('q');
  const status = url.searchParams.get('status');

  try {
    let query: string;
    const bindings: (string | number)[] = [];

    if (tag) {
      // Filter by tag
      query = `
        SELECT bp.*, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.slug) as tag_slugs, GROUP_CONCAT(t.color) as tag_colors
        FROM blog_posts bp
        LEFT JOIN blog_post_tags bpt ON bp.id = bpt.blog_post_id
        LEFT JOIN tags t ON bpt.tag_id = t.id
        WHERE bp.id IN (
          SELECT bpt2.blog_post_id FROM blog_post_tags bpt2
          JOIN tags t2 ON bpt2.tag_id = t2.id
          WHERE t2.slug = ?
        )
      `;
      bindings.push(tag);

      if (!isAdmin) {
        query += ` AND bp.status = 'published'`;
      } else if (status) {
        query += ` AND bp.status = ?`;
        bindings.push(status);
      }

      query += ` GROUP BY bp.id ORDER BY bp.published_at DESC, bp.created_at DESC LIMIT ? OFFSET ?`;
      bindings.push(limit, offset);
    } else if (search) {
      // Full-text search
      query = `
        SELECT bp.*, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.slug) as tag_slugs, GROUP_CONCAT(t.color) as tag_colors
        FROM blog_posts bp
        LEFT JOIN blog_post_tags bpt ON bp.id = bpt.blog_post_id
        LEFT JOIN tags t ON bpt.tag_id = t.id
        WHERE (bp.title LIKE ? OR bp.excerpt LIKE ? OR bp.content LIKE ?)
      `;
      const searchTerm = `%${search}%`;
      bindings.push(searchTerm, searchTerm, searchTerm);

      if (!isAdmin) {
        query += ` AND bp.status = 'published'`;
      } else if (status) {
        query += ` AND bp.status = ?`;
        bindings.push(status);
      }

      query += ` GROUP BY bp.id ORDER BY bp.published_at DESC, bp.created_at DESC LIMIT ? OFFSET ?`;
      bindings.push(limit, offset);
    } else {
      // All posts
      query = `
        SELECT bp.*, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.slug) as tag_slugs, GROUP_CONCAT(t.color) as tag_colors
        FROM blog_posts bp
        LEFT JOIN blog_post_tags bpt ON bp.id = bpt.blog_post_id
        LEFT JOIN tags t ON bpt.tag_id = t.id
      `;

      if (!isAdmin) {
        query += ` WHERE bp.status = 'published'`;
      } else if (status) {
        query += ` WHERE bp.status = ?`;
        bindings.push(status);
      }

      query += ` GROUP BY bp.id ORDER BY bp.published_at DESC, bp.created_at DESC LIMIT ? OFFSET ?`;
      bindings.push(limit, offset);
    }

    let stmt = env.DB.prepare(query);
    if (bindings.length > 0) {
      stmt = stmt.bind(...bindings);
    }
    const result = await stmt.all();

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM blog_posts`;
    const countBindings: (string | number)[] = [];

    if (!isAdmin) {
      countQuery += ` WHERE status = 'published'`;
    } else if (status) {
      countQuery += ` WHERE status = ?`;
      countBindings.push(status);
    }

    let countStmt = env.DB.prepare(countQuery);
    if (countBindings.length > 0) {
      countStmt = countStmt.bind(...countBindings);
    }
    const total = await countStmt.first<{ total: number }>();

    // Parse tags from comma-separated strings
    const posts = result.results.map((post: any) => ({
      ...post,
      tags: post.tag_names
        ? post.tag_names.split(',').map((name: string, i: number) => ({
          name,
          slug: post.tag_slugs?.split(',')[i] || '',
          color: post.tag_colors?.split(',')[i] || '#3B82F6',
        }))
        : [],
      // Remove raw tag fields
      tag_names: undefined,
      tag_slugs: undefined,
      tag_colors: undefined,
      // Don't expose full content in list view
      content: undefined,
      content_html: isAdmin ? post.content_html : undefined,
    }));

    return jsonResponse({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total: total?.total || 0,
        totalPages: Math.ceil((total?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return errorResponse('Failed to fetch posts', 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  // Auth check
  const token = extractToken(request);
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) return errorResponse('Server misconfiguration', 500);
  const payload = token ? await verifyToken(token, jwtSecret) : null;

  if (!payload) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json() as {
      title?: string;
      excerpt?: string;
      content?: string;
      content_html?: string;
      cover_image?: string;
      status?: string;
      slug?: string;
      tags?: string[];
      allow_comments?: boolean;
      comments_close_days?: number;
    };

    if (!body.title?.trim()) {
      return errorResponse('Title is required');
    }
    if (!body.content?.trim() || !body.content_html?.trim()) {
      return errorResponse('Content is required');
    }

    const slug = body.slug?.trim() || generateSlug(body.title);
    const status = body.status || 'draft';
    const publishedAt = status === 'published' ? new Date().toISOString() : null;
    const commentsCloseAt = body.comments_close_days
      ? new Date(Date.now() + body.comments_close_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Check slug uniqueness
    const existing = await env.DB.prepare('SELECT id FROM blog_posts WHERE slug = ?').bind(slug).first();
    if (existing) {
      return errorResponse('A post with this slug already exists');
    }

    // Insert post
    const result = await env.DB.prepare(`
      INSERT INTO blog_posts (slug, title, excerpt, content, content_html, cover_image, status, author_id, allow_comments, comments_close_at, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      slug,
      body.title.trim(),
      body.excerpt?.trim() || null,
      body.content.trim(),
      body.content_html.trim(),
      body.cover_image || null,
      status,
      Number(payload.sub),
      body.allow_comments !== false ? 1 : 0,
      commentsCloseAt,
      publishedAt
    ).run();

    // Handle tags
    if (body.tags && body.tags.length > 0) {
      const postId = result.meta.last_row_id;
      for (const tagName of body.tags) {
        const tagSlug = generateSlug(tagName);
        // Upsert tag
        await env.DB.prepare(
          'INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)'
        ).bind(tagName.trim(), tagSlug).run();

        const tag = await env.DB.prepare('SELECT id FROM tags WHERE slug = ?').bind(tagSlug).first<{ id: number }>();
        if (tag) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO blog_post_tags (blog_post_id, tag_id) VALUES (?, ?)'
          ).bind(postId, tag.id).run();
        }
      }
    }

    return jsonResponse({
      success: true,
      message: 'Post created successfully',
      slug,
      id: result.meta.last_row_id,
    }, 201);
  } catch (error) {
    console.error('Error creating blog post:', error);
    return errorResponse('Failed to create post', 500);
  }
};
