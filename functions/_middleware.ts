// Global middleware for all Pages Functions
export const onRequest: PagesFunction = async (context) => {
  // Add security headers
  const response = await context.next();

  // Clone the response to add headers
  const newResponse = new Response(response.body, response);

  // Security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('X-XSS-Protection', '0'); // Deprecated; rely on CSP instead
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newResponse.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  newResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  newResponse.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com"
  );

  return newResponse;
};
