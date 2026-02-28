/**
 * Tags API
 * GET  /api/tags - List all tags with post counts
 * POST /api/tags - Create a new tag (admin only)
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyToken, extractToken, generateSlug, jsonResponse, errorResponse } from '../../lib/auth';

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime.env;

  try {
    const result = await env.DB.prepare(`
      SELECT t.*, COUNT(bpt.blog_post_id) as post_count
      FROM tags t
      LEFT JOIN blog_post_tags bpt ON t.id = bpt.tag_id
      LEFT JOIN blog_posts bp ON bpt.blog_post_id = bp.id AND bp.status = 'published'
      GROUP BY t.id
      ORDER BY post_count DESC, t.name ASC
    `).all();

    return jsonResponse({ success: true, tags: result.results });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return errorResponse('Failed to fetch tags', 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  const token = extractToken(request);
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) return errorResponse('Server misconfiguration', 500);
  const payload = token ? await verifyToken(token, jwtSecret) : null;

  if (!payload) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json() as { name?: string; color?: string };

    if (!body.name?.trim()) {
      return errorResponse('Tag name is required');
    }

    const name = body.name.trim();
    const slug = generateSlug(name);
    const color = body.color || '#3B82F6';

    const existing = await env.DB.prepare('SELECT id FROM tags WHERE slug = ?').bind(slug).first();
    if (existing) {
      return errorResponse('Tag already exists');
    }

    await env.DB.prepare('INSERT INTO tags (name, slug, color) VALUES (?, ?, ?)').bind(name, slug, color).run();

    return jsonResponse({ success: true, message: 'Tag created', slug }, 201);
  } catch (error) {
    console.error('Error creating tag:', error);
    return errorResponse('Failed to create tag', 500);
  }
};
