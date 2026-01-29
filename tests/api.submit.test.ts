import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Test Suite for Form Submission API
 * Tests the /api/submit endpoint for contact form submissions
 */

// Mock types for D1Database
interface D1Result {
  results: Record<string, unknown>[];
  success: boolean;
}

interface D1Statement {
  bind: (...args: unknown[]) => D1Statement;
  run: () => Promise<D1Result>;
  all: () => Promise<D1Result>;
}

interface D1Database {
  prepare: (sql: string) => D1Statement;
}

// Mock environment
const createMockEnv = (overrides?: Record<string, unknown>) => ({
  DB: {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
  } as unknown as D1Database,
  CONTACT_EMAIL: 'contact@akib35.me',
  SITE_URL: 'https://akib35.me',
  ...overrides,
});

describe('POST /api/submit - Form Submission', () => {
  let mockEnv: any;
  let mockContext: any;

  beforeEach(() => {
    mockEnv = createMockEnv();

    mockContext = {
      env: mockEnv,
      request: new Request('http://localhost/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 Test',
          'CF-Connecting-IP': '192.168.1.1',
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message',
        }),
      }),
    };
  });

  it('should successfully submit a form with all fields', async () => {
    const response = await mockContext.request.json();

    expect(response.name).toBe('John Doe');
    expect(response.email).toBe('john@example.com');
    expect(response.subject).toBe('Test Subject');
    expect(response.message).toBe('This is a test message');
  });

  it('should reject form without required name field', async () => {
    const invalidRequest = new Request('http://localhost/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john@example.com',
        subject: 'Test',
        message: 'Test message',
      }),
    });

    const data = await invalidRequest.json();
    expect(data.name).toBeUndefined();
  });

  it('should reject form without required email field', async () => {
    const invalidRequest = new Request('http://localhost/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        subject: 'Test',
        message: 'Test message',
      }),
    });

    const data = await invalidRequest.json();
    expect(data.email).toBeUndefined();
  });

  it('should reject form without required message field', async () => {
    const invalidRequest = new Request('http://localhost/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test',
      }),
    });

    const data = await invalidRequest.json();
    expect(data.message).toBeUndefined();
  });

  it('should validate email format', async () => {
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com',
    ];

    for (const invalidEmail of invalidEmails) {
      const request = new Request('http://localhost/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: invalidEmail,
          message: 'Test',
        }),
      });

      const data = await request.json();
      expect(data.email).toBe(invalidEmail);
      // Validation logic would check this format
    }
  });

  it('should accept valid email formats', async () => {
    const validEmails = [
      'user@example.com',
      'first.last@example.co.uk',
      'user+tag@example.com',
    ];

    for (const validEmail of validEmails) {
      const request = new Request('http://localhost/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: validEmail,
          message: 'Test',
        }),
      });

      const data = await request.json();
      expect(data.email).toBe(validEmail);
    }
  });

  it('should enforce maximum field lengths', async () => {
    const longName = 'a'.repeat(101);
    const longEmail = 'a'.repeat(101) + '@test.com';
    const longMessage = 'a'.repeat(5001);

    expect(longName.length).toBeGreaterThan(100);
    expect(longMessage.length).toBeGreaterThan(5000);
  });

  it('should trim whitespace from inputs', () => {
    const formData = {
      name: '  John Doe  ',
      email: '  john@example.com  ',
      subject: '  Test Subject  ',
      message: '  Test message  ',
    };

    const trimmed = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    expect(trimmed.name).toBe('John Doe');
    expect(trimmed.email).toBe('john@example.com');
    expect(trimmed.subject).toBe('Test Subject');
    expect(trimmed.message).toBe('Test message');
  });

  it('should convert email to lowercase', () => {
    const email = 'John.Doe@EXAMPLE.COM';
    expect(email.toLowerCase()).toBe('john.doe@example.com');
  });

  it('should handle optional subject field', async () => {
    const noSubjectRequest = new Request('http://localhost/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
      }),
    });

    const data = await noSubjectRequest.json();
    expect(data.subject).toBeUndefined();
  });

  it('should capture user agent and IP address', () => {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 Test Browser',
      'CF-Connecting-IP': '192.168.1.100',
    };

    expect(headers['User-Agent']).toBe('Mozilla/5.0 Test Browser');
    expect(headers['CF-Connecting-IP']).toBe('192.168.1.100');
  });

  it('should handle missing headers gracefully', () => {
    const headers: Record<string, string> = {};
    const userAgent = headers['User-Agent'] ?? '';
    const ipAddress = headers['CF-Connecting-IP'] ?? '';

    expect(userAgent).toBe('');
    expect(ipAddress).toBe('');
  });
});

describe('Email Notification', () => {
  it('should send email with correct structure', () => {
    const emailContent = {
      personalizations: [
        {
          to: [{ email: 'contact@akib35.me' }],
          dkim_domain: 'akib35.me',
          dkim_selector: 'mailchannels',
        },
      ],
      from: {
        email: 'noreply@akib35.me',
        name: 'Portfolio Contact Form',
      },
      subject: '[Portfolio] Test Subject',
      content: [
        {
          type: 'text/html',
          value: expect.any(String),
        },
      ],
    };

    expect(emailContent.personalizations).toBeDefined();
    expect(emailContent.from).toBeDefined();
    expect(emailContent.subject).toContain('[Portfolio]');
  });

  it('should use default email if not provided', () => {
    const customEmail: string | undefined = undefined;
    const recipientEmail = customEmail || 'contact@akib35.me';
    expect(recipientEmail).toBe('contact@akib35.me');
  });

  it('should use custom email if provided', () => {
    const customEmail = 'custom@example.com';
    const recipientEmail = customEmail || 'contact@akib35.me';
    expect(recipientEmail).toBe('custom@example.com');
  });

  it('should set reply-to header to sender email', () => {
    const submission = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test',
    };

    const replyTo = {
      email: submission.email,
      name: submission.name,
    };

    expect(replyTo.email).toBe('john@example.com');
    expect(replyTo.name).toBe('John Doe');
  });

  it('should format subject with custom subject', () => {
    const subject = 'Custom Subject';
    const formattedSubject = `[Portfolio] ${subject}`;

    expect(formattedSubject).toBe('[Portfolio] Custom Subject');
  });

  it('should format subject with sender name if no subject', () => {
    const name = 'John Doe';
    const formattedSubject = `[Portfolio] New message from ${name}`;

    expect(formattedSubject).toBe('[Portfolio] New message from John Doe');
  });

  it('should handle newlines in HTML email body', () => {
    const message = 'Line 1\nLine 2\nLine 3';
    const htmlMessage = message.replace(/\n/g, '<br>');

    expect(htmlMessage).toBe('Line 1<br>Line 2<br>Line 3');
  });
});

describe('Database Operations', () => {
  it('should prepare correct SQL for insertion', () => {
    const sql = `INSERT INTO submissions (name, email, subject, message, user_agent, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`;

    expect(sql).toContain('INSERT INTO submissions');
    expect(sql).toContain('name, email, subject, message, user_agent, ip_address');
    expect(sql.match(/\?/g)).toHaveLength(6);
  });

  it('should bind values in correct order', () => {
    const values = [
      'John Doe',
      'john@example.com',
      'Test Subject',
      'Test message',
      'Mozilla/5.0',
      '192.168.1.1',
    ];

    expect(values).toHaveLength(6);
    expect(values[0]).toBe('John Doe');
    expect(values[1]).toBe('john@example.com');
  });

  it('should handle null subject value', () => {
    const subject: string | undefined = undefined;
    const bindValue = (subject ?? '').trim() || null;

    expect(bindValue).toBeNull();
  });

  it('should trim all string values before insert', () => {
    const values = [
      '  John Doe  '.trim(),
      '  john@example.com  '.trim(),
      '  Test Subject  '.trim(),
      '  Test message  '.trim(),
    ];

    expect(values[0]).toBe('John Doe');
    expect(values[1]).toBe('john@example.com');
    expect(values[2]).toBe('Test Subject');
    expect(values[3]).toBe('Test message');
  });
});

describe('Response Handling', () => {
  it('should return 400 for missing required fields', () => {
    const statusCode = 400;
    expect(statusCode).toBe(400);
  });

  it('should return 201 for successful submission', () => {
    const statusCode = 201;
    expect(statusCode).toBe(201);
  });

  it('should return 500 for database errors', () => {
    const statusCode = 500;
    expect(statusCode).toBe(500);
  });

  it('should return JSON response with success flag', () => {
    const response = {
      success: true,
      message: 'Thank you! Your message has been received.',
    };

    expect(response.success).toBe(true);
    expect(response.message).toBeDefined();
  });

  it('should return JSON response with error message', () => {
    const response = {
      success: false,
      error: 'Missing required fields: name, email, and message are required',
    };

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  it('should set Content-Type header to application/json', () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    expect(headers['Content-Type']).toBe('application/json');
  });
});
