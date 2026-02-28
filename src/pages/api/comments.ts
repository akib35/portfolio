/**
 * Comments API
 * GET  /api/comments?post_id=X - List approved comments for a post
 * POST /api/comments - Submit a new comment
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyToken, extractToken, jsonResponse, errorResponse } from '../../lib/auth';

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const url = new URL(request.url);
  const postId = url.searchParams.get('post_id');
  const postSlug = url.searchParams.get('post_slug');
  const all = url.searchParams.get('all');

  // Check if admin (to see unapproved comments)
  const token = extractToken(request);
  const jwtSecret = env.JWT_SECRET || '';
  const payload = token ? await verifyToken(token, jwtSecret) : null;
  const isAdmin = !!payload;

  // Admin: list ALL comments across all posts
  if (all && isAdmin) {
    try {
      const result = await env.DB.prepare(`
        SELECT c.*, bp.title as post_title, bp.slug as post_slug
        FROM comments c
        LEFT JOIN blog_posts bp ON c.blog_post_id = bp.id
        ORDER BY c.created_at DESC
        LIMIT 200
      `).all();

      return jsonResponse({
        success: true,
        comments: result.results,
      });
    } catch (error) {
      console.error('Error fetching all comments:', error);
      return errorResponse('Failed to fetch comments', 500);
    }
  }

  if (!postId && !postSlug) {
    return errorResponse('post_id or post_slug is required');
  }

  try {
    let blogPostId: number | null = null;

    if (postSlug) {
      const post = await env.DB.prepare('SELECT id FROM blog_posts WHERE slug = ?').bind(postSlug).first<{ id: number }>();
      if (!post) return errorResponse('Post not found', 404);
      blogPostId = post.id;
    } else {
      blogPostId = Number(postId);
    }

    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id${isAdmin ? '' : ' AND r.is_approved = 1'}) as reply_count
      FROM comments c 
      WHERE c.blog_post_id = ?
    `;
    const bindings: (string | number)[] = [blogPostId!];

    if (!isAdmin) {
      query += ` AND c.is_approved = 1`;
    }

    // Optionally filter by parent_id, or return all comments for tree building
    const parentFilter = url.searchParams.get('parent_id');
    if (parentFilter) {
      query += ` AND c.parent_id = ?`;
      bindings.push(Number(parentFilter));
    }

    query += ` ORDER BY c.created_at ASC`;

    const result = await env.DB.prepare(query).bind(...bindings).all();

    return jsonResponse({
      success: true,
      comments: result.results.map((c: any) => ({
        ...c,
        // Don't expose sensitive info to non-admin
        ip_address: isAdmin ? c.ip_address : undefined,
        user_agent: isAdmin ? c.user_agent : undefined,
        author_email: isAdmin ? c.author_email : undefined,
      })),
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return errorResponse('Failed to fetch comments', 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  try {
    const body = await request.json() as {
      blog_post_id?: number;
      post_slug?: string;
      parent_id?: number;
      author_name?: string;
      author_email?: string;
      content?: string;
    };

    if (!body.author_name?.trim()) {
      return errorResponse('Name is required');
    }
    if (!body.author_email?.trim()) {
      return errorResponse('Email is required');
    }
    if (!body.content?.trim()) {
      return errorResponse('Comment content is required');
    }

    // Input length & format validation
    if (body.author_name.trim().length > 100) {
      return errorResponse('Name is too long (max 100 characters)');
    }
    if (body.author_email.trim().length > 254) {
      return errorResponse('Email is too long');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.author_email.trim())) {
      return errorResponse('Invalid email format');
    }
    if (body.content.trim().length > 5000) {
      return errorResponse('Comment is too long (max 5000 characters)');
    }

    // Resolve post ID
    let blogPostId = body.blog_post_id;
    if (!blogPostId && body.post_slug) {
      const post = await env.DB.prepare('SELECT id, allow_comments, comments_close_at FROM blog_posts WHERE slug = ? AND status = ?')
        .bind(body.post_slug, 'published')
        .first<{ id: number; allow_comments: number; comments_close_at: string | null }>();

      if (!post) return errorResponse('Post not found', 404);
      blogPostId = post.id;

      // Check if comments are enabled
      if (!post.allow_comments) {
        return errorResponse('Comments are disabled for this post', 403);
      }

      // Check if comments window has closed
      if (post.comments_close_at && new Date(post.comments_close_at) < new Date()) {
        return errorResponse('The comment period for this post has ended', 403);
      }
    }

    if (!blogPostId) {
      return errorResponse('blog_post_id or post_slug is required');
    }

    // Verify post exists and allows comments
    const post = await env.DB.prepare(
      'SELECT id, allow_comments, comments_close_at FROM blog_posts WHERE id = ? AND status = ?'
    ).bind(blogPostId, 'published').first<{ id: number; allow_comments: number; comments_close_at: string | null }>();

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    if (!post.allow_comments) {
      return errorResponse('Comments are disabled for this post', 403);
    }

    if (post.comments_close_at && new Date(post.comments_close_at) < new Date()) {
      return errorResponse('The comment period for this post has ended', 403);
    }

    // Validate parent comment exists if replying
    if (body.parent_id) {
      const parent = await env.DB.prepare(
        'SELECT id FROM comments WHERE id = ? AND blog_post_id = ?'
      ).bind(body.parent_id, blogPostId).first();

      if (!parent) {
        return errorResponse('Parent comment not found', 404);
      }
    }

    // Sanitize content (basic XSS prevention)
    const sanitizedContent = body.content.trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    // All public comments start as pending (require admin approval)
    const isApproved = 0;

    await env.DB.prepare(`
      INSERT INTO comments (blog_post_id, parent_id, author_name, author_email, content, is_approved, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      blogPostId,
      body.parent_id || null,
      body.author_name.trim(),
      body.author_email.trim().toLowerCase(),
      sanitizedContent,
      isApproved,
      ipAddress,
      userAgent
    ).run();

    return jsonResponse({
      success: true,
      message: isApproved ? 'Comment posted successfully' : 'Comment submitted for moderation',
    }, 201);
  } catch (error) {
    console.error('Error creating comment:', error);
    return errorResponse('Failed to submit comment', 500);
  }
};
