/**
 * D1 database mock for testing API routes
 * Provides a lightweight in-memory mock that mimics D1Database interface
 */

export interface MockStatement {
  bind: (...args: unknown[]) => MockStatement;
  first: <T = unknown>(col?: string) => Promise<T | null>;
  all: () => Promise<{ results: unknown[]; success: boolean }>;
  run: () => Promise<{ success: boolean; meta: { last_row_id: number; changes: number } }>;
}

export interface MockDB {
  prepare: (query: string) => MockStatement;
  _queries: { query: string; bindings: unknown[] }[];
  _mockResults: Map<string, unknown>;
  _mockAllResults: Map<string, unknown[]>;
  _lastRowId: number;
  _changes: number;
}

/**
 * Create a mock D1Database that records queries and returns configured results
 */
export function createMockDB(overrides: Partial<{
  firstResult: unknown;
  allResults: unknown[];
  lastRowId: number;
  changes: number;
}> = {}): MockDB {
  const queries: { query: string; bindings: unknown[] }[] = [];
  const mockResults = new Map<string, unknown>();
  const mockAllResults = new Map<string, unknown[]>();
  let lastRowId = overrides.lastRowId ?? 1;
  let changes = overrides.changes ?? 1;
  let defaultFirstResult = overrides.firstResult ?? null;
  let defaultAllResults = overrides.allResults ?? [];

  const createStatement = (query: string): MockStatement => {
    let bindings: unknown[] = [];

    const statement: MockStatement = {
      bind: (...args: unknown[]) => {
        bindings = args;
        queries.push({ query, bindings });
        return statement;
      },
      first: async <T = unknown>() => {
        if (bindings.length === 0) queries.push({ query, bindings: [] });
        // Check for specific mock results by query pattern
        for (const [pattern, result] of mockResults) {
          if (query.includes(pattern)) return result as T;
        }
        return defaultFirstResult as T;
      },
      all: async () => {
        if (bindings.length === 0) queries.push({ query, bindings: [] });
        for (const [pattern, results] of mockAllResults) {
          if (query.includes(pattern)) return { results, success: true };
        }
        return { results: defaultAllResults, success: true };
      },
      run: async () => {
        if (bindings.length === 0) queries.push({ query, bindings: [] });
        return { success: true, meta: { last_row_id: lastRowId, changes } };
      },
    };

    return statement;
  };

  return {
    prepare: createStatement,
    _queries: queries,
    _mockResults: mockResults,
    _mockAllResults: mockAllResults,
    _lastRowId: lastRowId,
    _changes: changes,
  };
}

/**
 * Create a mock Astro APIContext locals object with a D1 database
 */
export function createMockLocals(db: MockDB, extraEnv: Record<string, unknown> = {}) {
  return {
    runtime: {
      env: {
        DB: db,
        JWT_SECRET: 'test-secret-key-for-jwt-signing',
        RESEND_API_KEY: '',
        ...extraEnv,
      },
    },
  };
}

/**
 * Create a Request object with JSON body
 */
export function jsonRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = 'GET', body, headers = {} } = options;
  const init: RequestInit = { method, headers: { ...headers } };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  return new Request(url, init);
}

/**
 * Create an authenticated request with a Bearer token
 */
export function authRequest(
  url: string,
  token: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Request {
  return jsonRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Parse a JSON response body
 */
export async function parseResponse<T = Record<string, unknown>>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}
