import { describe, it, expect } from 'vitest';
import {
  createToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  extractToken,
  generateSlug,
  jsonResponse,
  errorResponse,
} from '../src/lib/auth';

describe('auth utilities', () => {
  const TEST_SECRET = 'test-secret-key-for-jwt-signing';

  describe('createToken / verifyToken', () => {
    it('should create and verify a valid JWT token', async () => {
      const token = await createToken(1, 'admin', TEST_SECRET);
      expect(token).toBeTruthy();
      expect(token.split('.')).toHaveLength(3);

      const payload = await verifyToken(token, TEST_SECRET);
      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe('1');
      expect(payload!.username).toBe('admin');
    });

    it('should reject token with wrong secret', async () => {
      const token = await createToken(1, 'admin', TEST_SECRET);
      const payload = await verifyToken(token, 'wrong-secret');
      expect(payload).toBeNull();
    });

    it('should reject malformed tokens', async () => {
      expect(await verifyToken('not-a-token', TEST_SECRET)).toBeNull();
      expect(await verifyToken('a.b', TEST_SECRET)).toBeNull();
      expect(await verifyToken('', TEST_SECRET)).toBeNull();
    });

    it('should include expiry in the future', async () => {
      const token = await createToken(1, 'admin', TEST_SECRET);
      const payload = await verifyToken(token, TEST_SECRET);
      expect(payload).not.toBeNull();
      const now = Math.floor(Date.now() / 1000);
      expect(payload!.exp).toBeGreaterThan(now);
      expect(payload!.iat).toBeLessThanOrEqual(now);
    });
  });

  describe('hashPassword / verifyPassword', () => {
    it('should hash and verify a password', async () => {
      const hash = await hashPassword('myPassword123');
      expect(hash).toBeTruthy();
      expect(hash).toContain(':');

      const isValid = await verifyPassword('myPassword123', hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const hash = await hashPassword('correctPassword');
      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password (random salt)', async () => {
      const hash1 = await hashPassword('samePassword');
      const hash2 = await hashPassword('samePassword');
      expect(hash1).not.toBe(hash2);

      // But both should verify
      expect(await verifyPassword('samePassword', hash1)).toBe(true);
      expect(await verifyPassword('samePassword', hash2)).toBe(true);
    });

    it('should handle invalid stored hash gracefully', async () => {
      expect(await verifyPassword('test', '')).toBe(false);
      expect(await verifyPassword('test', 'invalid')).toBe(false);
      expect(await verifyPassword('test', 'no-colon-here')).toBe(false);
    });
  });

  describe('extractToken', () => {
    it('should extract token from Authorization header', () => {
      const req = new Request('https://example.com', {
        headers: { Authorization: 'Bearer my-token-123' },
      });
      expect(extractToken(req)).toBe('my-token-123');
    });

    it('should extract token from cookie', () => {
      const req = new Request('https://example.com', {
        headers: { Cookie: 'admin_token=cookie-token-456; other=val' },
      });
      expect(extractToken(req)).toBe('cookie-token-456');
    });

    it('should prefer Authorization header over cookie', () => {
      const req = new Request('https://example.com', {
        headers: {
          Authorization: 'Bearer header-token',
          Cookie: 'admin_token=cookie-token',
        },
      });
      expect(extractToken(req)).toBe('header-token');
    });

    it('should return null when no token present', () => {
      const req = new Request('https://example.com');
      expect(extractToken(req)).toBeNull();
    });

    it('should return null when Authorization header is not Bearer', () => {
      const req = new Request('https://example.com', {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });
      expect(extractToken(req)).toBeNull();
    });
  });

  describe('generateSlug', () => {
    it('should convert title to slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('My Post: A Great Title!')).toBe('my-post-a-great-title');
    });

    it('should handle multiple spaces and dashes', () => {
      expect(generateSlug('  hello   world  ')).toBe('hello-world');
    });

    it('should handle unicode characters', () => {
      expect(generateSlug('Café & Résumé')).toBe('caf-rsum');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });
  });

  describe('jsonResponse', () => {
    it('should return JSON response with correct content type', async () => {
      const res = jsonResponse({ success: true, data: 'test' });
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBe('test');
    });

    it('should allow custom status code', async () => {
      const res = jsonResponse({ created: true }, 201);
      expect(res.status).toBe(201);
    });

    it('should allow custom headers', async () => {
      const res = jsonResponse({}, 200, { 'X-Custom': 'value' });
      expect(res.headers.get('X-Custom')).toBe('value');
    });
  });

  describe('errorResponse', () => {
    it('should return error JSON with correct status', async () => {
      const res = errorResponse('Not found', 404);
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe('Not found');
      expect(body.success).toBe(false);
    });

    it('should default to 400 status', async () => {
      const res = errorResponse('Bad request');
      expect(res.status).toBe(400);
    });
  });
});
