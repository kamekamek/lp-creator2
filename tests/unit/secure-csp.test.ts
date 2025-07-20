/**
 * Unit tests for Secure CSP Implementation
 * Tests the enhanced Content Security Policy system without unsafe-inline
 */

import {
  generateNonce,
  generateSecureCSPDirectives,
  generateSecureCSPHeader,
  generateCSPWithNonces,
  generateContentHashes,
  addNoncesToHTML,
  extractInlineScripts,
  extractInlineStyles,
  generateDevelopmentCSP
} from '../../src/utils/secureCSP';

describe('Secure CSP Implementation', () => {
  describe('generateNonce', () => {
    test('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      
      expect(nonce1).toBeTruthy();
      expect(nonce2).toBeTruthy();
      expect(nonce1).not.toBe(nonce2);
      expect(nonce1.length).toBeGreaterThan(10);
    });

    test('should generate base64 encoded nonces', () => {
      const nonce = generateNonce();
      
      // Base64 pattern check
      expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('generateSecureCSPDirectives', () => {
    test('should generate secure directives without unsafe-inline', () => {
      const directives = generateSecureCSPDirectives({});
      
      expect(directives['script-src']).not.toContain("'unsafe-inline'");
      expect(directives['style-src']).not.toContain("'unsafe-inline'");
      expect(directives['default-src']).toContain("'self'");
    });

    test('should include nonces when provided', () => {
      const scriptNonce = 'test-script-nonce';
      const styleNonce = 'test-style-nonce';
      
      const directives = generateSecureCSPDirectives({
        scriptNonce,
        styleNonce
      });
      
      expect(directives['script-src']).toContain(`'nonce-${scriptNonce}'`);
      expect(directives['style-src']).toContain(`'nonce-${styleNonce}'`);
    });

    test('should include security-focused directives', () => {
      const directives = generateSecureCSPDirectives({});
      
      expect(directives['object-src']).toContain("'none'");
      expect(directives['frame-src']).toContain("'none'");
      expect(directives['frame-ancestors']).toContain("'none'");
      expect(directives['upgrade-insecure-requests']).toBe(true);
      expect(directives['block-all-mixed-content']).toBe(true);
    });
  });

  describe('generateSecureCSPHeader', () => {
    test('should generate valid CSP header string', () => {
      const directives = generateSecureCSPDirectives({
        scriptNonce: 'test-nonce',
        styleNonce: 'test-nonce'
      });
      
      const header = generateSecureCSPHeader(directives);
      
      expect(header).toContain("default-src 'self'");
      expect(header).toContain("script-src 'self' 'nonce-test-nonce'");
      expect(header).toContain("style-src 'self' 'nonce-test-nonce'");
      expect(header).toContain("object-src 'none'");
      expect(header).toContain('upgrade-insecure-requests');
    });

    test('should handle boolean directives correctly', () => {
      const directives = generateSecureCSPDirectives({});
      const header = generateSecureCSPHeader(directives);
      
      expect(header).toContain('upgrade-insecure-requests');
      expect(header).toContain('block-all-mixed-content');
    });
  });

  describe('generateCSPWithNonces', () => {
    test('should generate complete CSP configuration', () => {
      const config = generateCSPWithNonces();
      
      expect(config.header).toBeTruthy();
      expect(config.scriptNonce).toBeTruthy();
      expect(config.styleNonce).toBeTruthy();
      expect(config.headerName).toBe('Content-Security-Policy');
    });

    test('should use report-only header when specified', () => {
      const config = generateCSPWithNonces({ reportOnly: true });
      
      expect(config.headerName).toBe('Content-Security-Policy-Report-Only');
    });

    test('should include report URI when provided', () => {
      const reportUri = '/api/csp-report';
      const config = generateCSPWithNonces({ reportUri });
      
      expect(config.header).toContain(reportUri);
    });
  });

  describe('generateContentHashes', () => {
    test('should generate hashes for inline scripts', () => {
      const html = `
        <html>
          <body>
            <script>console.log('test');</script>
            <script>alert('hello');</script>
          </body>
        </html>
      `;
      
      const { scriptHashes, styleHashes } = generateContentHashes(html);
      
      expect(scriptHashes.length).toBe(2);
      expect(scriptHashes[0]).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
      expect(styleHashes.length).toBe(0);
    });

    test('should generate hashes for inline styles', () => {
      const html = `
        <html>
          <head>
            <style>body { color: red; }</style>
            <style>.test { font-size: 14px; }</style>
          </head>
        </html>
      `;
      
      const { scriptHashes, styleHashes } = generateContentHashes(html);
      
      expect(styleHashes.length).toBe(2);
      expect(styleHashes[0]).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
      expect(scriptHashes.length).toBe(0);
    });

    test('should handle mixed content', () => {
      const html = `
        <html>
          <head>
            <style>body { margin: 0; }</style>
          </head>
          <body>
            <script>console.log('mixed');</script>
          </body>
        </html>
      `;
      
      const { scriptHashes, styleHashes } = generateContentHashes(html);
      
      expect(scriptHashes.length).toBe(1);
      expect(styleHashes.length).toBe(1);
    });
  });

  describe('addNoncesToHTML', () => {
    test('should add nonces to inline scripts', () => {
      const html = '<script>console.log("test");</script>';
      const scriptNonce = 'test-script-nonce';
      const styleNonce = 'test-style-nonce';
      
      const result = addNoncesToHTML(html, scriptNonce, styleNonce);
      
      expect(result).toContain(`nonce="${scriptNonce}"`);
    });

    test('should add nonces to inline styles', () => {
      const html = '<style>body { color: red; }</style>';
      const scriptNonce = 'test-script-nonce';
      const styleNonce = 'test-style-nonce';
      
      const result = addNoncesToHTML(html, scriptNonce, styleNonce);
      
      expect(result).toContain(`nonce="${styleNonce}"`);
    });

    test('should not add nonces to external scripts/styles', () => {
      const html = `
        <script src="external.js"></script>
        <link rel="stylesheet" href="external.css">
      `;
      const scriptNonce = 'test-script-nonce';
      const styleNonce = 'test-style-nonce';
      
      const result = addNoncesToHTML(html, scriptNonce, styleNonce);
      
      expect(result).not.toContain(`nonce="${scriptNonce}"`);
      expect(result).not.toContain(`nonce="${styleNonce}"`);
    });

    test('should handle complex HTML structures', () => {
      const html = `
        <html>
          <head>
            <style>body { margin: 0; }</style>
            <script src="external.js"></script>
          </head>
          <body>
            <script>console.log('inline');</script>
            <div style="color: blue;">Content</div>
          </body>
        </html>
      `;
      const scriptNonce = 'script123';
      const styleNonce = 'style456';
      
      const result = addNoncesToHTML(html, scriptNonce, styleNonce);
      
      expect(result).toContain(`<style nonce="${styleNonce}">body { margin: 0; }</style>`);
      expect(result).toContain(`<script nonce="${scriptNonce}">console.log('inline');</script>`);
      expect(result).toContain('<script src="external.js"></script>'); // No nonce for external
    });
  });

  describe('extractInlineScripts', () => {
    test('should extract inline scripts to external files', () => {
      const html = `
        <html>
          <body>
            <script>console.log('test1');</script>
            <script>console.log('test2');</script>
          </body>
        </html>
      `;
      
      const { html: processedHTML, scripts } = extractInlineScripts(html);
      
      expect(scripts.length).toBe(2);
      expect(scripts[0].content).toBe("console.log('test1');");
      expect(scripts[0].filename).toMatch(/inline-script-\d+\.js/);
      expect(processedHTML).toContain('src="/generated/');
      expect(processedHTML).not.toContain("console.log('test1');");
    });

    test('should preserve external scripts', () => {
      const html = '<script src="external.js"></script>';
      
      const { html: processedHTML, scripts } = extractInlineScripts(html);
      
      expect(scripts.length).toBe(0);
      expect(processedHTML).toBe(html);
    });
  });

  describe('extractInlineStyles', () => {
    test('should extract inline styles to external files', () => {
      const html = `
        <html>
          <head>
            <style>body { margin: 0; }</style>
            <style>.test { color: red; }</style>
          </head>
        </html>
      `;
      
      const { html: processedHTML, styles } = extractInlineStyles(html);
      
      expect(styles.length).toBe(2);
      expect(styles[0].content).toBe('body { margin: 0; }');
      expect(styles[0].filename).toMatch(/inline-style-\d+\.css/);
      expect(processedHTML).toContain('href="/generated/');
      expect(processedHTML).not.toContain('body { margin: 0; }');
    });

    test('should preserve external stylesheets', () => {
      const html = '<link rel="stylesheet" href="external.css">';
      
      const { html: processedHTML, styles } = extractInlineStyles(html);
      
      expect(styles.length).toBe(0);
      expect(processedHTML).toBe(html);
    });
  });

  describe('generateDevelopmentCSP', () => {
    test('should generate permissive CSP for development', () => {
      const directives = generateDevelopmentCSP();
      
      expect(directives['script-src']).toContain("'unsafe-eval'");
      expect(directives['style-src']).toContain("'unsafe-inline'");
      expect(directives['connect-src']).toContain('ws://localhost:*');
      expect(directives['frame-src']).toContain("'self'");
    });

    test('should include development-specific sources', () => {
      const directives = generateDevelopmentCSP();
      
      expect(directives['script-src']).toContain('localhost:*');
      expect(directives['script-src']).toContain('127.0.0.1:*');
      expect(directives['connect-src']).toContain('wss://localhost:*');
    });
  });

  describe('Security Validation', () => {
    test('should not include unsafe-inline in production CSP', () => {
      const directives = generateSecureCSPDirectives({});
      const header = generateSecureCSPHeader(directives);
      
      expect(header).not.toContain("'unsafe-inline'");
      expect(header).not.toContain("'unsafe-eval'");
    });

    test('should include all required security directives', () => {
      const directives = generateSecureCSPDirectives({});
      
      const requiredDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'object-src',
        'frame-src',
        'base-uri',
        'form-action',
        'frame-ancestors'
      ];
      
      requiredDirectives.forEach(directive => {
        expect(directives[directive as keyof typeof directives]).toBeDefined();
      });
    });

    test('should enforce strict object and frame policies', () => {
      const directives = generateSecureCSPDirectives({});
      
      expect(directives['object-src']).toEqual(["'none'"]);
      expect(directives['frame-src']).toEqual(["'none'"]);
      expect(directives['frame-ancestors']).toEqual(["'none'"]);
    });
  });
});