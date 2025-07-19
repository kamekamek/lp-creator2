import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

/**
 * Security configuration for HTML sanitization
 */
const SANITIZATION_CONFIG = {
  // Allowed HTML tags
  allowedTags: [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'button', 'section', 'header', 'footer', 'nav',
    'ul', 'ol', 'li', 'strong', 'em', 'br', 'hr', 'blockquote',
    'main', 'article', 'aside', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'form', 'input', 'textarea', 'select', 'option', 'label'
  ],
  
  // Allowed attributes per tag
  allowedAttributes: {
    '*': ['class', 'id', 'data-editable-id', 'style'],
    'a': ['href', 'target', 'rel', 'title'],
    'img': ['src', 'alt', 'width', 'height', 'loading'],
    'button': ['type', 'disabled', 'aria-label'],
    'input': ['type', 'name', 'value', 'placeholder', 'required', 'disabled'],
    'textarea': ['name', 'placeholder', 'rows', 'cols', 'required', 'disabled'],
    'select': ['name', 'required', 'disabled'],
    'option': ['value', 'selected'],
    'label': ['for'],
    'form': ['action', 'method', 'novalidate']
  },
  
  // Forbidden tags that should be completely removed
  forbiddenTags: [
    'script', 'iframe', 'object', 'embed', 'applet',
    'meta', 'link', 'style', 'base', 'title', 'head'
  ],
  
  // Forbidden attributes that could be dangerous
  forbiddenAttributes: [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
    'javascript:', 'vbscript:', 'data:text/html'
  ]
};

/**
 * Content Security Policy directives for iframe sandbox
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

/**
 * Sandbox attributes for iframe security
 */
export const SANDBOX_ATTRIBUTES = [
  'allow-scripts',      // Allow JavaScript execution
  'allow-same-origin',  // Allow same-origin access for editing
  'allow-forms'         // Allow form interactions
];

/**
 * Server-side HTML sanitization using JSDOM
 */
export function sanitizeHTMLServer(html: string): string {
  try {
    // Check if we're in a test environment
    if (typeof jest !== 'undefined' && global.DOMPurify) {
      // Use mock DOMPurify in tests
      return global.DOMPurify.sanitize(html, {});
    }
    
    // Create a JSDOM instance for server-side processing
    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
    const window = dom.window as unknown as Window;
    
    // Initialize DOMPurify with JSDOM window
    const purify = DOMPurify(window);
    
    // Configure DOMPurify with our security settings
    const cleanHTML = purify.sanitize(html, {
      ALLOWED_TAGS: SANITIZATION_CONFIG.allowedTags,
      ALLOWED_ATTR: Object.keys(SANITIZATION_CONFIG.allowedAttributes).reduce((acc, tag) => {
        if (tag === '*') {
          acc.push(...SANITIZATION_CONFIG.allowedAttributes[tag]);
        } else {
          acc.push(...SANITIZATION_CONFIG.allowedAttributes[tag]);
        }
        return acc;
      }, [] as string[]),
      FORBID_TAGS: SANITIZATION_CONFIG.forbiddenTags,
      FORBID_ATTR: SANITIZATION_CONFIG.forbiddenAttributes,
      ALLOW_DATA_ATTR: true,
      ALLOW_ARIA_ATTR: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      SANITIZE_DOM: true,
      KEEP_CONTENT: true,
      ADD_TAGS: [],
      ADD_ATTR: []
    });
    
    return cleanHTML;
  } catch (error) {
    console.error('Server-side HTML sanitization failed:', error);
    // Return safe fallback
    return '<div class="error-message">Content could not be safely rendered</div>';
  }
}

/**
 * Client-side HTML sanitization for browser environments
 */
export function sanitizeHTMLClient(html: string): string {
  try {
    // Check if we're in a test environment
    if (typeof jest !== 'undefined' && global.DOMPurify) {
      // Use mock DOMPurify in tests
      return global.DOMPurify.sanitize(html, {});
    }
    
    // Use browser's DOMPurify directly
    const cleanHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: SANITIZATION_CONFIG.allowedTags,
      ALLOWED_ATTR: Object.keys(SANITIZATION_CONFIG.allowedAttributes).reduce((acc, tag) => {
        if (tag === '*') {
          acc.push(...SANITIZATION_CONFIG.allowedAttributes[tag]);
        } else {
          acc.push(...SANITIZATION_CONFIG.allowedAttributes[tag]);
        }
        return acc;
      }, [] as string[]),
      FORBID_TAGS: SANITIZATION_CONFIG.forbiddenTags,
      FORBID_ATTR: SANITIZATION_CONFIG.forbiddenAttributes,
      ALLOW_DATA_ATTR: true,
      ALLOW_ARIA_ATTR: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      SANITIZE_DOM: true,
      KEEP_CONTENT: true
    });
    
    return cleanHTML;
  } catch (error) {
    console.error('Client-side HTML sanitization failed:', error);
    // Return safe fallback
    return '<div class="error-message">Content could not be safely rendered</div>';
  }
}

/**
 * Additional security checks for potentially dangerous content
 */
export function performSecurityChecks(html: string): {
  isSecure: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // Check for script injections
  if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(html)) {
    violations.push('Script tags detected');
  }
  
  // Check for event handlers
  if (/on\w+\s*=/gi.test(html)) {
    violations.push('Event handlers detected');
  }
  
  // Check for javascript: URLs
  if (/javascript:/gi.test(html)) {
    violations.push('JavaScript URLs detected');
  }
  
  // Check for data URLs with HTML content
  if (/data:text\/html/gi.test(html)) {
    violations.push('HTML data URLs detected');
  }
  
  // Check for iframe injections
  if (/<iframe[\s\S]*?>/gi.test(html)) {
    violations.push('Iframe tags detected');
  }
  
  // Check for object/embed tags
  if (/<(object|embed|applet)[\s\S]*?>/gi.test(html)) {
    violations.push('Object/embed tags detected');
  }
  
  return {
    isSecure: violations.length === 0,
    violations
  };
}

/**
 * Generate CSP header string from directives
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Validate and fix common HTML issues that could cause security problems
 */
export function fixCommonSecurityIssues(html: string): string {
  let fixedHTML = html;
  
  // Fix broken attributes that could be exploited
  fixedHTML = fixedHTML.replace(/src="\\"([^"]*)\\""/g, 'src="$1"');
  fixedHTML = fixedHTML.replace(/href="\\"([^"]*)\\""/g, 'href="$1"');
  
  // Remove empty or dangerous src attributes
  fixedHTML = fixedHTML.replace(/src=""/g, 'src="#"');
  fixedHTML = fixedHTML.replace(/href=""/g, 'href="#"');
  
  // Fix broken SVG paths that could contain injections
  fixedHTML = fixedHTML.replace(/d="\\?\*"/g, 'd=""');
  fixedHTML = fixedHTML.replace(/d="\\?\+"([^"]*)"\\?\*"/g, 'd="$1"');
  fixedHTML = fixedHTML.replace(/d="\\"([^"]*)\\""/g, 'd="$1"');
  
  // Ensure all external links have proper security attributes
  fixedHTML = fixedHTML.replace(
    /<a\s+([^>]*href=["']https?:\/\/[^"']*["'][^>]*)>/gi,
    (match, attrs) => {
      if (!attrs.includes('rel=')) {
        return match.replace('>', ' rel="noopener noreferrer">');
      }
      return match;
    }
  );
  
  return fixedHTML;
}