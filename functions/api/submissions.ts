interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
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

// Initialize database schema
async function initializeDatabase(db: D1Database): Promise<void> {
  try {
    const statements = SCHEMA_SQL.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await db.prepare(statement.trim()).run();
      }
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// GET /api/submissions - List all submissions (protected)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Initialize database schema
    await initializeDatabase(context.env.DB);

    // Simple token-based authentication
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!context.env.ADMIN_TOKEN || token !== context.env.ADMIN_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all submissions
    const result = await context.env.DB.prepare(
      `SELECT id, name, email, subject, message, created_at, read, ip_address
       FROM submissions 
       ORDER BY created_at DESC 
       LIMIT 100`
    ).all();

    return new Response(
      JSON.stringify({
        success: true,
        submissions: result.results,
        count: result.results.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching submissions:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch submissions'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// PATCH /api/submissions - Mark submission as read
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    // Simple token-based authentication
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!context.env.ADMIN_TOKEN || token !== context.env.ADMIN_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json() as { id: number; read: boolean };

    if (!body.id) {
      return new Response(
        JSON.stringify({ error: 'Missing submission id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await context.env.DB.prepare(
      'UPDATE submissions SET read = ? WHERE id = ?'
    )
      .bind(body.read ? 1 : 0, body.id)
      .run();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating submission:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to update submission' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
