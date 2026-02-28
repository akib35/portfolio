import { describe, it, expect } from 'vitest';
import { onRequest } from '../functions/_middleware';

// Helper to create a mock PagesFunction context
function createMockContext(overrides: { responseBody?: string; responseHeaders?: Record<string, string> } = {}) {
  const { responseBody = '{"ok":true}', responseHeaders = {} } = overrides;

  const upstreamResponse = new Response(responseBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...responseHeaders,
    },
  });

  return {
    next: async () => upstreamResponse,
    request: new Request('https://example.com/some-path'),
    env: {},
    params: {},
    data: {},
    functionPath: '',
    waitUntil: () => { },
    passThroughOnException: () => { },
  };
}

describe('Security Middleware — onRequest', () => {
  it('should set X-Content-Type-Options header', async () => {
    const ctx = createMockContext();
    const res = await onRequest(ctx as any);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('should set X-Frame-Options to DENY', async () => {
    const ctx = createMockContext();
    const res = await onRequest(ctx as any);
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('should set X-XSS-Protection to 0 (rely on CSP)', async () => {
    const ctx = createMockContext();
    const res = await onRequest(ctx as any);
    expect(res.headers.get('X-XSS-Protection')).toBe('0');
  });

  it('should set Referrer-Policy', async () => {
    const ctx = createMockContext();
    const res = await onRequest(ctx as any);
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('should set Strict-Transport-Security with HSTS', async () => {
    const ctx = createMockContext();
    const res = await onRequest(ctx as any);
    const hsts = res.headers.get('Strict-Transport-Security');
    expect(hsts).toContain('max-age=63072000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });

  it('should set Permissions-Policy', async () => {
    const ctx = createMockContext();
    const res = await onRequest(ctx as any);
    const pp = res.headers.get('Permissions-Policy');
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('geolocation=()');
    expect(pp).toContain('payment=()');
  });

  it('should set Content-Security-Policy', async () => {
    const ctx = createMockContext();
    const res = await onRequest(ctx as any);
    const csp = res.headers.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('challenges.cloudflare.com');
  });

  it('should preserve the upstream response body', async () => {
    const ctx = createMockContext({ responseBody: '{"data":"test"}' });
    const res = await onRequest(ctx as any);
    const body = await res.json();
    expect(body).toEqual({ data: 'test' });
  });

  it('should preserve upstream response headers', async () => {
    const ctx = createMockContext({
      responseHeaders: { 'X-Custom': 'preserved' },
    });
    const res = await onRequest(ctx as any);
    expect(res.headers.get('X-Custom')).toBe('preserved');
    // Also has security headers
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('should set all 7 security headers', async () => {
    const ctx = createMockContext();
    const res = await onRequest(ctx as any);

    const expectedHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Strict-Transport-Security',
      'Permissions-Policy',
      'Content-Security-Policy',
    ];

    for (const header of expectedHeaders) {
      expect(res.headers.has(header)).toBe(true);
    }
  });
});
