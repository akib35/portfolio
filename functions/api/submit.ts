interface Env {
  DB: D1Database;
  CONTACT_EMAIL?: string; // Your email for notifications
  SITE_URL?: string; // Your website URL
}

interface FormSubmission {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

// Schema SQL for submissions table
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_read ON submissions(read);
`;

// Initialize database schema on first request
async function initializeDatabase(db: D1Database): Promise<void> {
  try {
    // Split SQL into individual statements and execute them
    const statements = SCHEMA_SQL.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await db.prepare(statement.trim()).run();
      }
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    // Continue - table might already exist
  }
}

// Send email notification using MailChannels
async function sendEmailNotification(
  submission: FormSubmission,
  env: Env
): Promise<void> {
  const recipientEmail = env.CONTACT_EMAIL || 'contact@akib35.me';
  const siteUrl = env.SITE_URL || 'https://akib35.me';

  const emailContent = {
    personalizations: [
      {
        to: [{ email: recipientEmail }],
        dkim_domain: 'akib35.me',
        dkim_selector: 'mailchannels',
      },
    ],
    from: {
      email: 'noreply@akib35.me',
      name: 'Portfolio Contact Form',
    },
    reply_to: {
      email: submission.email,
      name: submission.name,
    },
    subject: submission.subject
      ? `[Portfolio] ${submission.subject}`
      : `[Portfolio] New message from ${submission.name}`,
    content: [
      {
        type: 'text/html',
        value: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .field { margin-bottom: 20px; }
    .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { margin-top: 5px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; }
    .message { white-space: pre-wrap; word-wrap: break-word; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">📬 New Contact Form Submission</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone just reached out through your portfolio</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">From</div>
        <div class="value"><strong>${submission.name}</strong></div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${submission.email}" style="color: #2563eb;">${submission.email}</a></div>
      </div>
      ${submission.subject ? `
      <div class="field">
        <div class="label">Subject</div>
        <div class="value">${submission.subject}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">Message</div>
        <div class="value class="message">${submission.message.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">Sent from <a href="${siteUrl}">${siteUrl}</a></p>
      <p style="margin: 10px 0 0 0;">Reply directly to this email to respond to ${submission.name}</p>
    </div>
  </div>
</body>
</html>
        `,
      },
    ],
  };

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailContent),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('MailChannels error:', errorText);
    throw new Error(`Failed to send email: ${response.status}`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Initialize database schema on first request
    await initializeDatabase(context.env.DB);

    const body: FormSubmission = await context.request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: name, email, and message are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate field lengths
    if (body.name.length > 100 || body.email.length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Name and email must be less than 100 characters'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.message.length > 5000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message must be less than 5000 characters'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email format'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user agent and IP for basic tracking
    const userAgent = context.request.headers.get('User-Agent') || '';
    const ipAddress = context.request.headers.get('CF-Connecting-IP') || '';

    // Insert into D1 database
    await context.env.DB.prepare(
      `INSERT INTO submissions (name, email, subject, message, user_agent, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.name.trim(),
        body.email.trim().toLowerCase(),
        body.subject?.trim() || null,
        body.message.trim(),
        userAgent,
        ipAddress
      )
      .run();

    // Send email notification
    try {
      await sendEmailNotification(
        {
          name: body.name.trim(),
          email: body.email.trim(),
          subject: body.subject?.trim(),
          message: body.message.trim(),
        },
        context.env
      );
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send email notification:', emailError);
      // Still return success since the form was saved to database
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you! Your message has been received.'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Form submission error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to submit form. Please try again later.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Handle OPTIONS for CORS preflight (if needed)
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
