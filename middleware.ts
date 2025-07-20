/**
 * Next.js Middleware for Security Headers
 * Sets Content Security Policy and other security headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple nonce generation for middleware (crypto not available in edge runtime)
function generateSimpleNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Generate nonces for this request
  const scriptNonce = generateSimpleNonce();
  const styleNonce = generateSimpleNonce();
  
  // Determine if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Set CSP header based on environment
  if (isDevelopment) {
    // More permissive CSP for development
    const developmentCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' https://cdn.tailwindcss.com localhost:* 127.0.0.1:*",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' ws://localhost:* wss://localhost:* https://api.openai.com https://api.anthropic.com",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy-Report-Only', developmentCSP);
  } else {
    // Strict CSP for production
    const productionCSP = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${scriptNonce}' https://cdn.tailwindcss.com`,
      `style-src 'self' 'nonce-${styleNonce}' https://fonts.googleapis.com`,
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.openai.com https://api.anthropic.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content",
      "report-uri /api/csp-report"
    ].join('; ');
    
    // Start with report-only mode, then switch to enforcing
    const headerName = process.env.CSP_ENFORCE === 'true' 
      ? 'Content-Security-Policy'
      : 'Content-Security-Policy-Report-Only';
    
    response.headers.set(headerName, productionCSP);
  }
  
  // Set additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add nonces to response headers for use in components
  response.headers.set('X-Script-Nonce', scriptNonce);
  response.headers.set('X-Style-Nonce', styleNonce);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/csp-report (CSP reporting endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/csp-report|_next/static|_next/image|favicon.ico).*)',
  ],
};