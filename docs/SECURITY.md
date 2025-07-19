# Security Guide

LP Creator Platform implements comprehensive security measures to protect against XSS attacks, code injection, and other security vulnerabilities when handling AI-generated HTML content.

## Security Architecture

### Multi-Layer Security Approach

1. **Input Sanitization**: Server-side and client-side HTML sanitization
2. **Content Security Policy**: Strict CSP headers for iframe protection
3. **Iframe Sandboxing**: Complete isolation of AI-generated content
4. **Security Validation**: Real-time threat detection and prevention

## HTML Sanitization

### DOMPurify Integration

The platform uses DOMPurify with JSDOM for comprehensive HTML sanitization:

```typescript
import { sanitizeHTMLServer, sanitizeHTMLClient } from '@/utils/htmlSanitizer';

// Server-side sanitization
const cleanHTML = sanitizeHTMLServer(aiGeneratedHTML);

// Client-side sanitization
const cleanHTML = sanitizeHTMLClient(userHTML);
```

### Allowed Content

**Permitted HTML Tags:**
- Semantic elements: `div`, `span`, `p`, `h1-h6`, `section`, `header`, `footer`, `nav`
- Content elements: `ul`, `ol`, `li`, `strong`, `em`, `br`, `hr`, `blockquote`
- Interactive elements: `a`, `button`, `form`, `input`, `textarea`, `select`
- Media elements: `img` (with strict attribute filtering)

**Permitted Attributes:**
- Universal: `class`, `id`, `data-editable-id`, `style`
- Links: `href`, `target`, `rel`, `title`
- Images: `src`, `alt`, `width`, `height`, `loading`
- Forms: `type`, `name`, `value`, `placeholder`, `required`, `disabled`

### Forbidden Content

**Blocked HTML Tags:**
- `script`, `iframe`, `object`, `embed`, `applet`
- `meta`, `link`, `style`, `base`, `title`, `head`

**Blocked Attributes:**
- Event handlers: `onclick`, `onload`, `onerror`, etc.
- JavaScript URLs: `javascript:`, `vbscript:`
- Data URLs with HTML: `data:text/html`

## Content Security Policy (CSP)

### CSP Directives

```typescript
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
```

### Implementation

CSP headers are automatically generated and applied to iframe content:

```typescript
import { generateCSPHeader } from '@/utils/htmlSanitizer';

const cspHeader = generateCSPHeader();
// Result: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; ..."
```

## Iframe Sandboxing

### Sandbox Attributes

AI-generated content is rendered in sandboxed iframes with restricted permissions:

```typescript
export const SANDBOX_ATTRIBUTES = [
  'allow-scripts',      // Allow JavaScript execution
  'allow-same-origin',  // Allow same-origin access for editing
  'allow-forms'         // Allow form interactions
];
```

### Prohibited Actions

The sandbox prevents:
- Top-level navigation
- Popup windows
- Downloads
- Pointer lock
- Camera/microphone access

## Security Validation

### Real-time Threat Detection

The platform performs additional security checks beyond sanitization:

```typescript
import { performSecurityChecks } from '@/utils/htmlSanitizer';

const { isSecure, violations } = performSecurityChecks(html);

if (!isSecure) {
  console.warn('Security violations detected:', violations);
  // Handle security violations appropriately
}
```

### Detected Threats

- Script tag injections
- Event handler attributes
- JavaScript URLs
- HTML data URLs
- Iframe injections
- Object/embed tags

## Security Best Practices

### For Developers

1. **Always Sanitize**: Never render AI-generated HTML without sanitization
2. **Use Sandboxed Iframes**: Isolate all user-generated content
3. **Validate Input**: Perform security checks before processing
4. **Handle Errors Gracefully**: Provide safe fallbacks for security failures

### Code Examples

```typescript
// ✅ Correct: Sanitize before rendering
const safeHTML = sanitizeHTMLServer(aiGeneratedHTML);
const { isSecure } = performSecurityChecks(safeHTML);

if (isSecure) {
  renderInSandboxedIframe(safeHTML);
} else {
  renderSecureFallback();
}

// ❌ Incorrect: Direct rendering without sanitization
dangerouslySetInnerHTML={{ __html: aiGeneratedHTML }}
```

### Security Headers

Implement these security headers in production:

```typescript
// Next.js middleware or API routes
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
```

## Testing Security

### Security Test Suite

The platform includes comprehensive security tests:

```bash
# Run security-specific tests
npm run test -- --testNamePattern="security"

# Run E2E security tests
npm run test:e2e -- tests/e2e/security-protection.spec.ts
```

### Test Coverage

- XSS injection attempts
- Script tag filtering
- Event handler removal
- Iframe sandbox validation
- CSP header generation
- Security violation detection

## Incident Response

### Security Violation Handling

1. **Detection**: Automated security checks identify threats
2. **Logging**: All violations are logged with details
3. **Mitigation**: Content is sanitized or blocked
4. **Fallback**: Safe alternative content is displayed
5. **Monitoring**: Security metrics are tracked

### Error Handling

```typescript
try {
  const cleanHTML = sanitizeHTMLServer(html);
  return cleanHTML;
} catch (error) {
  console.error('Sanitization failed:', error);
  return '<div class="error-message">Content could not be safely rendered</div>';
}
```

## Security Updates

### Dependency Management

- DOMPurify: Regularly updated for latest security patches
- JSDOM: Server-side DOM processing with security fixes
- Next.js: Framework security updates applied promptly

### Monitoring

- Security vulnerability scanning
- Dependency audit checks
- Automated security testing in CI/CD

## Compliance

### Standards Adherence

- OWASP Top 10 protection
- Content Security Policy Level 3
- HTML5 security best practices
- Modern browser security features

### Audit Trail

All security-related actions are logged:
- Sanitization operations
- Security violations detected
- Fallback content served
- CSP policy violations