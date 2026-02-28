import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost, onRequestOptions } from '../functions/api/submit';

// Helper to create mock DB
function createMockDB() {
  const stmt = {
    bind: (..._args: unknown[]) => stmt,
    first: async () => null,
    all: async () => ({ results: [], success: true }),
    run: async () => ({ success: true, meta: { last_row_id: 1, changes: 1 } }),
  };
  return { prepare: (_q: string) => stmt };
}

function createContext(overrides: {
  body?: unknown;
  headers?: Record<string, string>;
  env?: Record<string, unknown>;
} = {}) {
  const { body, headers = {}, env = {} } = overrides;

  const requestInit: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  };

  return {
    request: new Request('https://example.com/api/submit', requestInit),
    env: {
      DB: createMockDB(),
      CONTACT_EMAIL: 'test@example.com',
      SITE_URL: 'https://example.com',
      ...env,
    },
    next: async () => new Response(''),
    params: {},
    data: {},
    functionPath: '',
    waitUntil: () => { },
    passThroughOnException: () => { },
  };
}

describe('Submit API — POST /api/submit', () => {
  beforeEach(() => {
    // Mock global fetch for MailChannels call
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 202 })));
  });

  it('should reject missing required fields', async () => {
    const ctx = createContext({ body: {} });
    const res = await onRequestPost(ctx as any);
    const body = await res.json() as any;

    expect(res.status).toBe(400);
    expect(body.error).toContain('Missing required fields');
  });

  it('should reject missing name', async () => {
    const ctx = createContext({
      body: { email: 'test@test.com', message: 'Hello' },
    });
    const res = await onRequestPost(ctx as any);
    expect(res.status).toBe(400);
  });

  it('should reject missing email', async () => {
    const ctx = createContext({
      body: { name: 'John', message: 'Hello' },
    });
    const res = await onRequestPost(ctx as any);
    expect(res.status).toBe(400);
  });

  it('should reject missing message', async () => {
    const ctx = createContext({
      body: { name: 'John', email: 'test@test.com' },
    });
    const res = await onRequestPost(ctx as any);
    expect(res.status).toBe(400);
  });

  it('should reject name longer than 100 characters', async () => {
    const ctx = createContext({
      body: { name: 'A'.repeat(101), email: 'test@test.com', message: 'Hello' },
    });
    const res = await onRequestPost(ctx as any);
    expect(res.status).toBe(400);
    expect((await res.json() as any).error).toContain('less than 100');
  });

  it('should reject email longer than 100 characters', async () => {
    const ctx = createContext({
      body: { name: 'John', email: 'a'.repeat(92) + '@test.com', message: 'Hello' },
    });
    const res = await onRequestPost(ctx as any);
    expect(res.status).toBe(400);
  });

  it('should reject message longer than 5000 characters', async () => {
    const ctx = createContext({
      body: { name: 'John', email: 'test@test.com', message: 'A'.repeat(5001) },
    });
    const res = await onRequestPost(ctx as any);
    expect(res.status).toBe(400);
    expect((await res.json() as any).error).toContain('less than 5000');
  });

  it('should reject invalid email format', async () => {
    const ctx = createContext({
      body: { name: 'John', email: 'not-an-email', message: 'Hello' },
    });
    const res = await onRequestPost(ctx as any);
    expect(res.status).toBe(400);
    expect((await res.json() as any).error).toContain('Invalid email');
  });

  it('should submit form successfully with valid data', async () => {
    const ctx = createContext({
      body: { name: 'John Doe', email: 'john@test.com', message: 'Hello there!' },
    });
    const res = await onRequestPost(ctx as any);
    const body = await res.json() as any;

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Thank you');
  });

  it('should submit with optional subject', async () => {
    const ctx = createContext({
      body: { name: 'Jane', email: 'jane@test.com', subject: 'Question', message: 'Hi' },
    });
    const res = await onRequestPost(ctx as any);
    expect(res.status).toBe(201);
  });

  it('should still succeed if email notification fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const ctx = createContext({
      body: { name: 'John', email: 'john@test.com', message: 'Hello' },
    });
    const res = await onRequestPost(ctx as any);

    // Should still return 201 since DB insert succeeded
    expect(res.status).toBe(201);
  });
});

describe('Submit API — OPTIONS /api/submit', () => {
  it('should return CORS preflight response', async () => {
    const ctx = {
      request: new Request('https://example.com/api/submit', { method: 'OPTIONS' }),
    };

    const res = await onRequestOptions(ctx as any);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  });
});
