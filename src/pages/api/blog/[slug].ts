/**
 * Single Blog Post API
 * GET    /api/blog/[slug] - Get a single post by slug
 * PUT    /api/blog/[slug] - Update a post (admin only)
 * DELETE /api/blog/[slug] - Delete a post (admin only)
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyToken, extractToken, generateSlug, jsonResponse, errorResponse } from '../../../lib/auth';

export const GET: APIRoute = async ({ params, request, locals }) => {
  const env = locals.runtime.env;
  const { slug } = params;

  if (!slug) {
    return errorResponse('Slug is required');
  }

  // Check if admin
  const token = extractToken(request);
  const jwtSecret = env.JWT_SECRET || '';
  const payload = token ? await verifyToken(token, jwtSecret) : null;
  const isAdmin = !!payload;

  try {
    const post = await env.DB.prepare(`
      SELECT bp.*, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.slug) as tag_slugs, GROUP_CONCAT(t.color) as tag_colors
      FROM blog_posts bp
      LEFT JOIN blog_post_tags bpt ON bp.id = bpt.blog_post_id
      LEFT JOIN tags t ON bpt.tag_id = t.id
      WHERE bp.slug = ?
      GROUP BY bp.id
    `).bind(slug).first<any>();

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    // Non-admin can only see published posts
    if (!isAdmin && post.status !== 'published') {
      return errorResponse('Post not found', 404);
    }

    // Parse tags
    const tags = post.tag_names
      ? post.tag_names.split(',').map((name: string, i: number) => ({
        name,
        slug: post.tag_slugs?.split(',')[i] || '',
        color: post.tag_colors?.split(',')[i] || '#3B82F6',
      }))
      : [];

    return jsonResponse({
      success: true,
      post: {
        ...post,
        tags,
        tag_names: undefined,
        tag_slugs: undefined,
        tag_colors: undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return errorResponse('Failed to fetch post', 500);
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const env = locals.runtime.env;
  const { slug } = params;

  // Auth check
  const token = extractToken(request);
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) return errorResponse('Server misconfiguration', 500);
  const payload = token ? await verifyToken(token, jwtSecret) : null;

  if (!payload) {
    return errorResponse('Unauthorized', 401);
  }

  if (!slug) {
    return errorResponse('Slug is required');
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
      comments_close_days?: number | null;
    };

    // Find existing post
    const existing = await env.DB.prepare('SELECT * FROM blog_posts WHERE slug = ?').bind(slug).first<any>();
    if (!existing) {
      return errorResponse('Post not found', 404);
    }

    // Build update
    const newSlug = body.slug?.trim() || existing.slug;
    const newStatus = body.status || existing.status;
    const publishedAt = newStatus === 'published' && existing.status !== 'published'
      ? new Date().toISOString()
      : existing.published_at;

    let commentsCloseAt = existing.comments_close_at;
    if (body.comments_close_days !== undefined) {
      commentsCloseAt = body.comments_close_days
        ? new Date(Date.now() + body.comments_close_days * 24 * 60 * 60 * 1000).toISOString()
        : null;
    }

    // Check slug uniqueness if changed
    if (newSlug !== existing.slug) {
      const slugExists = await env.DB.prepare('SELECT id FROM blog_posts WHERE slug = ?').bind(newSlug).first();
      if (slugExists) {
        return errorResponse('A post with this slug already exists');
      }
    }

    await env.DB.prepare(`
      UPDATE blog_posts SET
        slug = ?, title = ?, excerpt = ?, content = ?, content_html = ?,
        cover_image = ?, status = ?, allow_comments = ?, comments_close_at = ?,
        published_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      newSlug,
      body.title?.trim() || existing.title,
      body.excerpt?.trim() ?? existing.excerpt,
      body.content?.trim() || existing.content,
      body.content_html?.trim() || existing.content_html,
      body.cover_image ?? existing.cover_image,
      newStatus,
      body.allow_comments !== undefined ? (body.allow_comments ? 1 : 0) : existing.allow_comments,
      commentsCloseAt,
      publishedAt,
      existing.id
    ).run();

    // Update tags if provided
    if (body.tags !== undefined) {
      // Remove existing tags
      await env.DB.prepare('DELETE FROM blog_post_tags WHERE blog_post_id = ?').bind(existing.id).run();

      // Add new tags
      for (const tagName of body.tags) {
        const tagSlug = generateSlug(tagName);
        await env.DB.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)').bind(tagName.trim(), tagSlug).run();
        const tag = await env.DB.prepare('SELECT id FROM tags WHERE slug = ?').bind(tagSlug).first<{ id: number }>();
        if (tag) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO blog_post_tags (blog_post_id, tag_id) VALUES (?, ?)'
          ).bind(existing.id, tag.id).run();
        }
      }
    }

    return jsonResponse({
      success: true,
      message: 'Post updated successfully',
      slug: newSlug,
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return errorResponse('Failed to update post', 500);
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const env = locals.runtime.env;
  const { slug } = params;

  // Auth check
  const token = extractToken(request);
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) return errorResponse('Server misconfiguration', 500);
  const payload = token ? await verifyToken(token, jwtSecret) : null;

  if (!payload) {
    return errorResponse('Unauthorized', 401);
  }

  if (!slug) {
    return errorResponse('Slug is required');
  }

  try {
    const existing = await env.DB.prepare('SELECT id FROM blog_posts WHERE slug = ?').bind(slug).first();
    if (!existing) {
      return errorResponse('Post not found', 404);
    }

    await env.DB.prepare('DELETE FROM blog_posts WHERE slug = ?').bind(slug).run();

    return jsonResponse({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return errorResponse('Failed to delete post', 500);
  }
};
