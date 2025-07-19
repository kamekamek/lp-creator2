import { 
  sanitizeHTMLServer, 
  sanitizeHTMLClient, 
  performSecurityChecks, 
  fixCommonSecurityIssues,
  generateCSPHeader,
  CSP_DIRECTIVES,
  SANDBOX_ATTRIBUTES
} from '../../src/utils/htmlSanitizer';

describe('HTML Sanitizer Security Tests', () => {
  describe('Server-side Sanitization', () => {
    test('should remove script tags', () => {
      const maliciousHTML = `
        <div>
          <h1>Title</h1>
          <script>alert('XSS');</script>
          <p>Content</p>
        </div>
      `;

      const sanitized = sanitizeHTMLServer(maliciousHTML);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert(');
      expect(sanitized).toContain('<h1>Title</h1>');
      expect(sanitized).toContain('<p>Content</p>');
    });

    test('should remove dangerous event handlers', () => {
      const maliciousHTML = `
        <div onclick="malicious()" onmouseover="steal()">
          <button onclick="hack()" onload="evil()">Button</button>
          <img src="x" onerror="alert('xss')" onload="bad()" />
        </div>
      `;

      const sanitized = sanitizeHTMLServer(maliciousHTML);
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('onmouseover');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).toContain('<button>Button</button>');
    });

    test('should remove iframe and object tags', () => {
      const maliciousHTML = `
        <div>
          <iframe src="evil.html"></iframe>
          <object data="malicious.swf"></object>
          <embed src="bad.swf" />
          <applet code="Evil.class"></applet>
        </div>
      `;

      const sanitized = sanitizeHTMLServer(maliciousHTML);
      
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('<object');
      expect(sanitized).not.toContain('<embed');
      expect(sanitized).not.toContain('<applet');
    });

    test('should preserve safe HTML elements and attributes', () => {
      const safeHTML = `
        <div class="container" id="main">
          <h1>Title</h1>
          <p class="text">Content with <strong>bold</strong> and <em>italic</em></p>
          <a href="https://example.com" target="_blank" rel="noopener">Link</a>
          <img src="image.jpg" alt="Description" width="100" height="100" />
          <button type="button" disabled>Button</button>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;

      const sanitized = sanitizeHTMLServer(safeHTML);
      
      expect(sanitized).toContain('class="container"');
      expect(sanitized).toContain('id="main"');
      expect(sanitized).toContain('<h1>Title</h1>');
      expect(sanitized).toContain('<strong>bold</strong>');
      expect(sanitized).toContain('<em>italic</em>');
      expect(sanitized).toContain('href="https://example.com"');
      expect(sanitized).toContain('alt="Description"');
      expect(sanitized).toContain('type="button"');
    });

    test('should handle malformed HTML gracefully', () => {
      const malformedHTML = `
        <div><p>Unclosed paragraph
        <script>alert('xss')</script>
        <img src="x" onerror="alert('xss')"
        <div>Another div</div>
      `;

      const sanitized = sanitizeHTMLServer(malformedHTML);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('<div>Another div</div>');
    });

    test('should return safe fallback on error', () => {
      // Test with extremely malformed content that might cause parsing errors
      const extremelyBadHTML = '\x00\x01\x02<script>alert("xss")</script>';
      
      const sanitized = sanitizeHTMLServer(extremelyBadHTML);
      
      // Should either sanitize properly or return safe fallback
      expect(sanitized).toBeDefined();
      expect(typeof sanitized).toBe('string');
      expect(sanitized).not.toContain('alert(');
    });
  });

  describe('Client-side Sanitization', () => {
    test('should remove dangerous content in browser environment', () => {
      const maliciousHTML = `
        <div>
          <script>alert('XSS');</script>
          <img src="x" onerror="alert('xss')" />
          <a href="javascript:alert('xss')">Link</a>
        </div>
      `;

      const sanitized = sanitizeHTMLClient(maliciousHTML);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('javascript:');
    });

    test('should preserve data-editable-id attributes', () => {
      const htmlWithEditableIds = `
        <div data-editable-id="title">
          <h1 data-editable-id="main-title">Title</h1>
          <p data-editable-id="description">Description</p>
        </div>
      `;

      const sanitized = sanitizeHTMLClient(htmlWithEditableIds);
      
      expect(sanitized).toContain('data-editable-id="title"');
      expect(sanitized).toContain('data-editable-id="main-title"');
      expect(sanitized).toContain('data-editable-id="description"');
    });

    test('should allow ARIA attributes', () => {
      const htmlWithAria = `
        <div aria-label="Main content" role="main">
          <button aria-expanded="false" aria-controls="menu">Menu</button>
          <ul id="menu" aria-hidden="true">
            <li role="menuitem">Item 1</li>
          </ul>
        </div>
      `;

      const sanitized = sanitizeHTMLClient(htmlWithAria);
      
      expect(sanitized).toContain('aria-label="Main content"');
      expect(sanitized).toContain('role="main"');
      expect(sanitized).toContain('aria-expanded="false"');
      expect(sanitized).toContain('aria-controls="menu"');
    });
  });

  describe('Security Checks', () => {
    test('should detect script injections', () => {
      const htmlWithScripts = `
        <div>
          <script>alert('xss')</script>
          <script src="evil.js"></script>
        </div>
      `;

      const result = performSecurityChecks(htmlWithScripts);
      
      expect(result.isSecure).toBe(false);
      expect(result.violations).toContain('Script tags detected');
    });

    test('should detect event handlers', () => {
      const htmlWithEvents = `
        <div onclick="bad()" onmouseover="evil()">
          <img onerror="alert('xss')" />
        </div>
      `;

      const result = performSecurityChecks(htmlWithEvents);
      
      expect(result.isSecure).toBe(false);
      expect(result.violations).toContain('Event handlers detected');
    });

    test('should detect javascript URLs', () => {
      const htmlWithJsUrls = `
        <a href="javascript:alert('xss')">Link</a>
        <img src="javascript:alert('xss')" />
      `;

      const result = performSecurityChecks(htmlWithJsUrls);
      
      expect(result.isSecure).toBe(false);
      expect(result.violations).toContain('JavaScript URLs detected');
    });

    test('should detect HTML data URLs', () => {
      const htmlWithDataUrls = `
        <iframe src="data:text/html,<script>alert('xss')</script>"></iframe>
        <img src="data:text/html,<h1>Test</h1>" />
      `;

      const result = performSecurityChecks(htmlWithDataUrls);
      
      expect(result.isSecure).toBe(false);
      expect(result.violations).toContain('HTML data URLs detected');
    });

    test('should detect iframe injections', () => {
      const htmlWithIframes = `
        <div>
          <iframe src="evil.html"></iframe>
          <iframe src="data:text/html,<script>alert('xss')</script>"></iframe>
        </div>
      `;

      const result = performSecurityChecks(htmlWithIframes);
      
      expect(result.isSecure).toBe(false);
      expect(result.violations).toContain('Iframe tags detected');
    });

    test('should detect object/embed tags', () => {
      const htmlWithObjects = `
        <object data="malicious.swf"></object>
        <embed src="evil.swf" />
        <applet code="Bad.class"></applet>
      `;

      const result = performSecurityChecks(htmlWithObjects);
      
      expect(result.isSecure).toBe(false);
      expect(result.violations).toContain('Object/embed tags detected');
    });

    test('should pass safe content', () => {
      const safeHTML = `
        <div class="container">
          <h1>Safe Title</h1>
          <p>Safe content with <strong>formatting</strong></p>
          <a href="https://example.com" rel="noopener">Safe link</a>
          <img src="image.jpg" alt="Safe image" />
        </div>
      `;

      const result = performSecurityChecks(safeHTML);
      
      expect(result.isSecure).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Common Security Issue Fixes', () => {
    test('should fix broken src attributes', () => {
      const brokenHTML = `
        <img src="\\"image.jpg\\"" />
        <img src="" />
      `;

      const fixed = fixCommonSecurityIssues(brokenHTML);
      
      expect(fixed).toContain('src="image.jpg"');
      expect(fixed).toContain('src="#"');
    });

    test('should fix broken href attributes', () => {
      const brokenHTML = `
        <a href="\\"link.html\\"">Link</a>
        <a href="">Empty Link</a>
      `;

      const fixed = fixCommonSecurityIssues(brokenHTML);
      
      expect(fixed).toContain('href="link.html"');
      expect(fixed).toContain('href="#"');
    });

    test('should fix broken SVG paths', () => {
      const brokenSVG = `
        <svg>
          <path d="\\*" />
          <path d="\\+"M10,10 L20,20"\\*" />
        </svg>
      `;

      const fixed = fixCommonSecurityIssues(brokenSVG);
      
      expect(fixed).toContain('d=""');
      expect(fixed).toContain('d="M10,10 L20,20"');
    });

    test('should add security attributes to external links', () => {
      const htmlWithExternalLinks = `
        <a href="https://example.com">External</a>
        <a href="https://test.com" rel="nofollow">Has rel</a>
        <a href="/internal">Internal</a>
      `;

      const fixed = fixCommonSecurityIssues(htmlWithExternalLinks);
      
      expect(fixed).toContain('href="https://example.com" rel="noopener noreferrer"');
      expect(fixed).toContain('rel="nofollow"'); // Should preserve existing
      expect(fixed).toContain('href="/internal"'); // Internal links unchanged
    });
  });

  describe('CSP Configuration', () => {
    test('should generate proper CSP header', () => {
      const cspHeader = generateCSPHeader();
      
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self' 'unsafe-inline'");
      expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
      expect(cspHeader).toContain("object-src 'none'");
      expect(cspHeader).toContain("frame-src 'none'");
    });

    test('should have correct CSP directives structure', () => {
      expect(CSP_DIRECTIVES['default-src']).toEqual(["'self'"]);
      expect(CSP_DIRECTIVES['object-src']).toEqual(["'none'"]);
      expect(CSP_DIRECTIVES['frame-src']).toEqual(["'none'"]);
      expect(CSP_DIRECTIVES['script-src']).toContain("'self'");
      expect(CSP_DIRECTIVES['script-src']).toContain("'unsafe-inline'");
    });
  });

  describe('Sandbox Configuration', () => {
    test('should have correct sandbox attributes', () => {
      expect(SANDBOX_ATTRIBUTES).toContain('allow-scripts');
      expect(SANDBOX_ATTRIBUTES).toContain('allow-same-origin');
      expect(SANDBOX_ATTRIBUTES).toContain('allow-forms');
      
      // Should not contain dangerous permissions
      expect(SANDBOX_ATTRIBUTES).not.toContain('allow-top-navigation');
      expect(SANDBOX_ATTRIBUTES).not.toContain('allow-popups');
      expect(SANDBOX_ATTRIBUTES).not.toContain('allow-downloads');
    });

    test('should have minimal required permissions only', () => {
      // Should have exactly 3 permissions for security
      expect(SANDBOX_ATTRIBUTES).toHaveLength(3);
    });
  });
});