import { describe, it, expect, beforeEach } from 'vitest';
import { onRequestGet, onRequestPatch } from '../functions/api/submissions';

// Helper to create a mock D1 statement
function createMockStatement(result: { results?: unknown[]; first?: unknown } = {}) {
  const stmt = {
    bind: (..._args: unknown[]) => stmt,
    first: async () => result.first ?? null,
    all: async () => ({ results: result.results ?? [], success: true }),
    run: async () => ({ success: true, meta: { last_row_id: 1, changes: 1 } }),
  };
  return stmt;
}

function createMockDB(defaults: { results?: unknown[]; first?: unknown } = {}) {
  return {
    prepare: (_query: string) => createMockStatement(defaults),
  };
}

function createContext(overrides: {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  env?: Record<string, unknown>;
} = {}) {
  const { method = 'GET', headers = {}, body, env = {} } = overrides;

  const requestInit: RequestInit = { method, headers };
  if (body) {
    requestInit.body = JSON.stringify(body);
    (requestInit.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  return {
    request: new Request('https://example.com/api/submissions', requestInit),
    env: {
      DB: createMockDB(env._dbResults as any || {}),
      ADMIN_TOKEN: env.ADMIN_TOKEN ?? 'test-admin-token',
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

describe('Submissions API — GET /api/submissions', () => {
  it('should reject requests without auth token', async () => {
    const ctx = createContext();
    const res = await onRequestGet(ctx as any);
    expect(res.status).toBe(401);
  });

  it('should reject requests with wrong token', async () => {
    const ctx = createContext({
      headers: { Authorization: 'Bearer wrong-token' },
    });
    const res = await onRequestGet(ctx as any);
    expect(res.status).toBe(401);
  });

  it('should return submissions with correct token', async () => {
    const mockSubmissions = [
      { id: 1, name: 'John', email: 'john@test.com', message: 'Hello', created_at: '2025-01-01' },
    ];

    const ctx = createContext({
      headers: { Authorization: 'Bearer test-admin-token' },
      env: {
        ADMIN_TOKEN: 'test-admin-token',
        _dbResults: { results: mockSubmissions },
      },
    });

    // Override DB for this test to return proper results
    ctx.env.DB = createMockDB({ results: mockSubmissions }) as any;

    const res = await onRequestGet(ctx as any);
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.submissions).toBeDefined();
  });

  it('should return empty array when no submissions', async () => {
    const ctx = createContext({
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    ctx.env.DB = createMockDB({ results: [] }) as any;

    const res = await onRequestGet(ctx as any);
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.submissions).toEqual([]);
  });

  it('should reject if ADMIN_TOKEN env is not set', async () => {
    const ctx = createContext({
      headers: { Authorization: 'Bearer some-token' },
      env: { ADMIN_TOKEN: undefined },
    });

    const res = await onRequestGet(ctx as any);
    expect(res.status).toBe(401);
  });
});

describe('Submissions API — PATCH /api/submissions', () => {
  it('should reject unauthenticated requests', async () => {
    const ctx = createContext({ method: 'PATCH', body: { id: 1, read: true } });
    const res = await onRequestPatch(ctx as any);
    expect(res.status).toBe(401);
  });

  it('should require submission id', async () => {
    const ctx = createContext({
      method: 'PATCH',
      headers: { Authorization: 'Bearer test-admin-token' },
      body: { read: true },
    });

    const res = await onRequestPatch(ctx as any);
    expect(res.status).toBe(400);
    expect((await res.json() as any).error).toContain('Missing submission id');
  });

  it('should mark submission as read', async () => {
    const ctx = createContext({
      method: 'PATCH',
      headers: { Authorization: 'Bearer test-admin-token' },
      body: { id: 1, read: true },
    });

    const res = await onRequestPatch(ctx as any);
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('should mark submission as unread', async () => {
    const ctx = createContext({
      method: 'PATCH',
      headers: { Authorization: 'Bearer test-admin-token' },
      body: { id: 1, read: false },
    });

    const res = await onRequestPatch(ctx as any);
    expect(res.status).toBe(200);
  });
});
