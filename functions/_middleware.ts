// Global middleware for all Pages Functions
export const onRequest: PagesFunction = async (context) => {
  // Add security headers
  const response = await context.next();

  // Clone the response to add headers
  const newResponse = new Response(response.body, response);

  // Security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('X-XSS-Protection', '1; mode=block');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return newResponse;
};
