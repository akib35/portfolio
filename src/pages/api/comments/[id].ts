/**
 * Comment Moderation API (admin only)
 * PATCH  /api/comments/[id] - Approve/reject a comment
 * DELETE /api/comments/[id] - Delete a comment
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyToken, extractToken, jsonResponse, errorResponse } from '../../../lib/auth';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const env = locals.runtime.env;
  const { id } = params;

  const token = extractToken(request);
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) return errorResponse('Server misconfiguration', 500);
  const payload = token ? await verifyToken(token, jwtSecret) : null;

  if (!payload) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json() as { is_approved?: boolean; rejection_reason?: string; send_email?: boolean };

    if (body.is_approved === undefined) {
      return errorResponse('is_approved is required');
    }

    const numId = Number(id);
    if (isNaN(numId)) return errorResponse('Invalid comment ID', 400);

    const existing = await env.DB.prepare(
      'SELECT c.id, c.author_name, c.author_email, c.content, bp.title as post_title FROM comments c LEFT JOIN blog_posts bp ON c.blog_post_id = bp.id WHERE c.id = ?'
    ).bind(numId).first<{ id: number; author_name: string; author_email: string | null; content: string; post_title: string | null }>();
    if (!existing) {
      return errorResponse('Comment not found', 404);
    }

    await env.DB.prepare('UPDATE comments SET is_approved = ? WHERE id = ?')
      .bind(body.is_approved ? 1 : 0, numId)
      .run();

    // Optionally send rejection email
    let emailSent = false;
    if (!body.is_approved && body.send_email && existing.author_email) {
      emailSent = await sendRejectionEmail(env, existing.author_email, existing.author_name, existing.content, existing.post_title, body.rejection_reason);
    }

    return jsonResponse({
      success: true,
      message: body.is_approved ? 'Comment approved' : 'Comment rejected',
      email_sent: emailSent,
    });
  } catch (error) {
    console.error('Error moderating comment:', error);
    return errorResponse('Failed to moderate comment', 500);
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const env = locals.runtime.env;
  const { id } = params;

  const token = extractToken(request);
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) return errorResponse('Server misconfiguration', 500);
  const payload = token ? await verifyToken(token, jwtSecret) : null;

  if (!payload) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const numId = Number(id);
    if (isNaN(numId)) return errorResponse('Invalid comment ID', 400);

    const existing = await env.DB.prepare(
      'SELECT c.id, c.author_name, c.author_email, c.content, bp.title as post_title FROM comments c LEFT JOIN blog_posts bp ON c.blog_post_id = bp.id WHERE c.id = ?'
    ).bind(numId).first<{ id: number; author_name: string; author_email: string | null; content: string; post_title: string | null }>();
    if (!existing) {
      return errorResponse('Comment not found', 404);
    }

    // Check for optional rejection email before deleting
    let emailSent = false;
    try {
      const body = await request.json() as { send_email?: boolean; rejection_reason?: string };
      if (body.send_email && existing.author_email) {
        emailSent = await sendRejectionEmail(env, existing.author_email, existing.author_name, existing.content, existing.post_title, body.rejection_reason);
      }
    } catch {
      // No body or invalid JSON — proceed without email
    }

    await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(numId).run();

    return jsonResponse({ success: true, message: 'Comment deleted', email_sent: emailSent });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return errorResponse('Failed to delete comment', 500);
  }
};

// ── Send rejection notification email ───────────────────────────────
async function sendRejectionEmail(
  env: CloudflareEnv,
  toEmail: string,
  authorName: string,
  commentContent: string,
  postTitle: string | null,
  reason?: string,
): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return false;

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const reasonHtml = reason
    ? `<p style="color: #374151; font-size: 14px; margin-top: 12px;"><strong>Reason:</strong> ${esc(reason)}</p>`
    : '';

  const postInfo = postTitle
    ? ` on "<em>${esc(postTitle)}</em>"`
    : '';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Blog <noreply@akib35.me>',
        to: [toEmail],
        subject: 'Your comment was not approved',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1D4ED8; margin-bottom: 8px;">Comment Not Approved</h2>
            <p style="color: #6B7280; font-size: 14px;">Hi ${esc(authorName)},</p>
            <p style="color: #6B7280; font-size: 14px;">Your comment${postInfo} was not approved by the moderator.</p>
            <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #D1D5DB;">
              <p style="color: #4B5563; font-size: 13px; margin: 0; white-space: pre-wrap;">${esc(commentContent)}</p>
            </div>
            ${reasonHtml}
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">If you believe this was a mistake, feel free to resubmit your comment following the community guidelines.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error('[rejection email] Resend error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('[rejection email] Send failed:', e);
    return false;
  }
}
