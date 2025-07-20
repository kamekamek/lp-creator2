/**
 * Secure Content Security Policy implementation with nonce support
 * Removes unsafe-inline directives and implements proper nonce-based security
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * CSP nonce store for tracking active nonces
 */
class NonceStore {
  private nonces: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes TTL

  generateNonce(type: 'script' | 'style'): string {
    const nonce = generateNonce();
    const key = `${type}-${Date.now()}`;
    
    this.nonces.set(key, {
      value: nonce,
      timestamp: Date.now()
    });
    
    // Clean up expired nonces
    this.cleanup();
    
    return nonce;
  }

  isValidNonce(nonce: string): boolean {
    for (const [key, data] of this.nonces.entries()) {
      if (data.value === nonce && Date.now() - data.timestamp < this.TTL) {
        return true;
      }
    }
    return false;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.nonces.entries()) {
      if (now - data.timestamp > this.TTL) {
        this.nonces.delete(key);
      }
    }
  }
}

const nonceStore = new NonceStore();

/**
 * Secure CSP directives without unsafe-inline
 */
export interface SecureCSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'font-src': string[];
  'img-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'object-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

/**
 * Generate secure CSP directives with nonces
 */
export function generateSecureCSPDirectives(options: {
  scriptNonce?: string;
  styleNonce?: string;
  reportOnly?: boolean;
  reportUri?: string;
}): SecureCSPDirectives {
  const { scriptNonce, styleNonce, reportUri } = options;
  
  const directives: SecureCSPDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Remove 'unsafe-inline' and use nonce instead
      ...(scriptNonce ? [`'nonce-${scriptNonce}'`] : []),
      'https://cdn.tailwindcss.com',
      // Add hash for specific trusted scripts if needed
      "'sha256-xyz123...' // Replace with actual script hashes"
    ],
    'style-src': [
      "'self'",
      // Remove 'unsafe-inline' and use nonce instead
      ...(styleNonce ? [`'nonce-${styleNonce}'`] : []),
      'https://fonts.googleapis.com',
      // Allow specific style hashes
      "'sha256-abc456...' // Replace with actual style hashes"
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'connect-src': [
      "'self'",
      // Add API endpoints as needed
      'https://api.openai.com',
      'https://api.anthropic.com'
    ],
    'frame-src': [
      "'none'"
    ],
    'object-src': [
      "'none'"
    ],
    'base-uri': [
      "'self'"
    ],
    'form-action': [
      "'self'"
    ],
    'frame-ancestors': [
      "'none'"
    ],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true
  };

  // Add report URI if provided
  if (reportUri) {
    (directives as any)['report-uri'] = [reportUri];
  }

  return directives;
}

/**
 * Generate CSP header string from secure directives
 */
export function generateSecureCSPHeader(directives: SecureCSPDirectives): string {
  return Object.entries(directives)
    .filter(([key, value]) => {
      // Skip boolean directives that are false
      if (typeof value === 'boolean') {
        return value;
      }
      return Array.isArray(value) && value.length > 0;
    })
    .map(([directive, sources]) => {
      if (typeof sources === 'boolean') {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Generate CSP header with nonces for a request
 */
export function generateCSPWithNonces(options: {
  reportOnly?: boolean;
  reportUri?: string;
} = {}): {
  header: string;
  scriptNonce: string;
  styleNonce: string;
  headerName: string;
} {
  const scriptNonce = nonceStore.generateNonce('script');
  const styleNonce = nonceStore.generateNonce('style');
  
  const directives = generateSecureCSPDirectives({
    scriptNonce,
    styleNonce,
    ...options
  });
  
  const header = generateSecureCSPHeader(directives);
  const headerName = options.reportOnly 
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
  
  return {
    header,
    scriptNonce,
    styleNonce,
    headerName
  };
}

/**
 * Validate nonce in incoming requests
 */
export function validateNonce(nonce: string): boolean {
  return nonceStore.isValidNonce(nonce);
}

/**
 * Extract and validate inline scripts/styles for hash generation
 */
export function generateContentHashes(html: string): {
  scriptHashes: string[];
  styleHashes: string[];
} {
  const scriptHashes: string[] = [];
  const styleHashes: string[] = [];
  
  // Extract inline scripts
  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  if (scriptMatches) {
    scriptMatches.forEach(match => {
      const content = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
      if (content) {
        const hash = crypto.createHash('sha256').update(content).digest('base64');
        scriptHashes.push(`'sha256-${hash}'`);
      }
    });
  }
  
  // Extract inline styles
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    styleMatches.forEach(match => {
      const content = match.replace(/<style[^>]*>|<\/style>/gi, '').trim();
      if (content) {
        const hash = crypto.createHash('sha256').update(content).digest('base64');
        styleHashes.push(`'sha256-${hash}'`);
      }
    });
  }
  
  return { scriptHashes, styleHashes };
}

/**
 * Process HTML content to add nonces to inline scripts and styles
 */
export function addNoncesToHTML(html: string, scriptNonce: string, styleNonce: string): string {
  let processedHTML = html;
  
  // Add nonce to inline scripts
  processedHTML = processedHTML.replace(
    /<script(?![^>]*src=)([^>]*)>/gi,
    `<script nonce="${scriptNonce}"$1>`
  );
  
  // Add nonce to inline styles
  processedHTML = processedHTML.replace(
    /<style([^>]*)>/gi,
    `<style nonce="${styleNonce}"$1>`
  );
  
  return processedHTML;
}

/**
 * Move inline scripts to external files (for production)
 */
export function extractInlineScripts(html: string): {
  html: string;
  scripts: Array<{ content: string; filename: string }>;
} {
  const scripts: Array<{ content: string; filename: string }> = [];
  let processedHTML = html;
  let scriptCounter = 0;
  
  // Extract inline scripts
  processedHTML = processedHTML.replace(
    /<script(?![^>]*src=)([^>]*?)>([\s\S]*?)<\/script>/gi,
    (match, attributes, content) => {
      if (content.trim()) {
        const filename = `inline-script-${++scriptCounter}.js`;
        scripts.push({ content: content.trim(), filename });
        return `<script${attributes} src="/generated/${filename}"></script>`;
      }
      return match;
    }
  );
  
  return { html: processedHTML, scripts };
}

/**
 * Move inline styles to external files (for production)
 */
export function extractInlineStyles(html: string): {
  html: string;
  styles: Array<{ content: string; filename: string }>;
} {
  const styles: Array<{ content: string; filename: string }> = [];
  let processedHTML = html;
  let styleCounter = 0;
  
  // Extract inline styles
  processedHTML = processedHTML.replace(
    /<style([^>]*?)>([\s\S]*?)<\/style>/gi,
    (match, attributes, content) => {
      if (content.trim()) {
        const filename = `inline-style-${++styleCounter}.css`;
        styles.push({ content: content.trim(), filename });
        return `<link${attributes} rel="stylesheet" href="/generated/${filename}">`;
      }
      return match;
    }
  );
  
  return { html: processedHTML, styles };
}

/**
 * CSP violation reporting handler
 */
export function handleCSPViolation(report: any): void {
  console.error('CSP Violation Report:', {
    documentUri: report['document-uri'],
    referrer: report.referrer,
    violatedDirective: report['violated-directive'],
    effectiveDirective: report['effective-directive'],
    originalPolicy: report['original-policy'],
    blockedUri: report['blocked-uri'],
    statusCode: report['status-code'],
    timestamp: new Date().toISOString()
  });
  
  // In production, you might want to send this to a logging service
  // logToService('csp-violation', report);
}

/**
 * Middleware for Next.js API routes to set secure CSP headers
 */
export function withSecureCSP(handler: any, options: {
  reportOnly?: boolean;
  reportUri?: string;
} = {}) {
  return async (req: any, res: any) => {
    const { header, headerName } = generateCSPWithNonces(options);
    
    res.setHeader(headerName, header);
    
    // Also set other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    return handler(req, res);
  };
}

/**
 * React hook for using CSP nonces in components
 */
export function useCSPNonces(): {
  scriptNonce: string;
  styleNonce: string;
} {
  // In a real implementation, this would get nonces from context or props
  // For now, return empty strings as fallback
  return {
    scriptNonce: '',
    styleNonce: ''
  };
}

/**
 * Development mode CSP (more permissive for development)
 */
export function generateDevelopmentCSP(): SecureCSPDirectives {
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Allow eval for development tools
      'https://cdn.tailwindcss.com',
      'localhost:*',
      '127.0.0.1:*'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Allow inline styles in development
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'connect-src': [
      "'self'",
      'ws://localhost:*',
      'wss://localhost:*',
      'https://api.openai.com',
      'https://api.anthropic.com'
    ],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"]
  };
}

export default {
  generateNonce,
  generateSecureCSPDirectives,
  generateSecureCSPHeader,
  generateCSPWithNonces,
  validateNonce,
  generateContentHashes,
  addNoncesToHTML,
  extractInlineScripts,
  extractInlineStyles,
  handleCSPViolation,
  withSecureCSP,
  useCSPNonces,
  generateDevelopmentCSP
};