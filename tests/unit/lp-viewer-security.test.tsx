import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LPViewer } from '../../app/components/LPViewer';
import { EditModeProvider } from '../../app/contexts/EditModeContext';
import { 
  sanitizeHTMLClient, 
  performSecurityChecks, 
  fixCommonSecurityIssues 
} from '../../src/utils/htmlSanitizer';

// Mock the EditModeContext
const MockEditModeProvider = ({ children }: { children: React.ReactNode }) => (
  <EditModeProvider>
    {children}
  </EditModeProvider>
);

describe('LPViewer Security Tests', () => {
  const renderLPViewer = (htmlContent: string, props = {}) => {
    return render(
      <MockEditModeProvider>
        <LPViewer 
          htmlContent={htmlContent} 
          enableSecurityChecks={true}
          {...props} 
        />
      </MockEditModeProvider>
    );
  };

  describe('XSS Prevention', () => {
    test('should sanitize script tags', async () => {
      const maliciousHTML = `
        <div>
          <h1>Safe Content</h1>
          <script>alert('XSS Attack!');</script>
          <p>More safe content</p>
        </div>
      `;

      renderLPViewer(maliciousHTML);
      
      // Wait for security processing
      await waitFor(() => {
        const iframe = screen.getByTitle('LP Preview - Secure Sandbox');
        expect(iframe).toBeInTheDocument();
      });

      // Check that security warning is shown
      expect(screen.getByText(/Security Notice/)).toBeInTheDocument();
      expect(screen.getByText(/potential security issue/)).toBeInTheDocument();
    });

    test('should remove event handlers', async () => {
      const maliciousHTML = `
        <div onclick="alert('XSS')" onmouseover="steal_data()">
          <button onclick="malicious_function()">Click me</button>
          <img src="x" onerror="alert('XSS')" />
        </div>
      `;

      renderLPViewer(maliciousHTML);
      
      await waitFor(() => {
        expect(screen.getByText(/Security Notice/)).toBeInTheDocument();
      });
    });

    test('should block javascript: URLs', async () => {
      const maliciousHTML = `
        <a href="javascript:alert('XSS')">Malicious Link</a>
        <img src="javascript:alert('XSS')" />
      `;

      renderLPViewer(maliciousHTML);
      
      await waitFor(() => {
        expect(screen.getByText(/Security Notice/)).toBeInTheDocument();
      });
    });

    test('should remove iframe injections', async () => {
      const maliciousHTML = `
        <div>
          <iframe src="data:text/html,<script>alert('XSS')</script>"></iframe>
          <iframe src="javascript:alert('XSS')"></iframe>
        </div>
      `;

      renderLPViewer(maliciousHTML);
      
      await waitFor(() => {
        expect(screen.getByText(/Security Notice/)).toBeInTheDocument();
      });
    });
  });

  describe('Content Injection Prevention', () => {
    test('should block object and embed tags', async () => {
      const maliciousHTML = `
        <object data="malicious.swf" type="application/x-shockwave-flash"></object>
        <embed src="malicious.swf" type="application/x-shockwave-flash" />
        <applet code="MaliciousApplet.class"></applet>
      `;

      renderLPViewer(maliciousHTML);
      
      await waitFor(() => {
        expect(screen.getByText(/Security Notice/)).toBeInTheDocument();
      });
    });

    test('should sanitize data URLs with HTML content', async () => {
      const maliciousHTML = `
        <img src="data:text/html,<script>alert('XSS')</script>" />
        <a href="data:text/html,<script>alert('XSS')</script>">Click</a>
      `;

      renderLPViewer(maliciousHTML);
      
      await waitFor(() => {
        expect(screen.getByText(/Security Notice/)).toBeInTheDocument();
      });
    });
  });

  describe('Sandbox Security', () => {
    test('should apply correct sandbox attributes', () => {
      renderLPViewer('<div>Safe content</div>');
      
      const iframe = screen.getByTitle('LP Preview - Secure Sandbox');
      expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    });

    test('should set proper referrer policy', () => {
      renderLPViewer('<div>Safe content</div>');
      
      const iframe = screen.getByTitle('LP Preview - Secure Sandbox');
      expect(iframe).toHaveAttribute('referrerPolicy', 'strict-origin-when-cross-origin');
    });

    test('should have allow attribute for same-origin', () => {
      renderLPViewer('<div>Safe content</div>');
      
      const iframe = screen.getByTitle('LP Preview - Secure Sandbox');
      expect(iframe).toHaveAttribute('allow', 'same-origin');
    });
  });

  describe('Security Status Indicators', () => {
    test('should show secure status for safe content', async () => {
      const safeHTML = '<div><h1>Safe Content</h1><p>This is safe</p></div>';
      
      renderLPViewer(safeHTML);
      
      await waitFor(() => {
        expect(screen.getByText('Secure')).toBeInTheDocument();
      });
    });

    test('should show sanitized status for unsafe content', async () => {
      const unsafeHTML = '<div><script>alert("xss")</script><h1>Content</h1></div>';
      
      renderLPViewer(unsafeHTML);
      
      await waitFor(() => {
        expect(screen.getByText('Sanitized')).toBeInTheDocument();
      });
    });

    test('should allow dismissing security warnings', async () => {
      const unsafeHTML = '<div><script>alert("xss")</script><h1>Content</h1></div>';
      
      renderLPViewer(unsafeHTML);
      
      await waitFor(() => {
        expect(screen.getByText(/Security Notice/)).toBeInTheDocument();
      });

      // Click dismiss button
      const dismissButton = screen.getByText('×');
      dismissButton.click();

      await waitFor(() => {
        expect(screen.queryByText(/Security Notice/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Security Utility Functions', () => {
    test('sanitizeHTMLClient should remove dangerous content', () => {
      const maliciousHTML = `
        <div>
          <script>alert('xss')</script>
          <img src="x" onerror="alert('xss')" />
          <a href="javascript:alert('xss')">Link</a>
          <p onclick="alert('xss')">Text</p>
        </div>
      `;

      const sanitized = sanitizeHTMLClient(maliciousHTML);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onclick');
    });

    test('performSecurityChecks should detect violations', () => {
      const maliciousHTML = `
        <script>alert('xss')</script>
        <div onclick="malicious()">Content</div>
        <a href="javascript:alert('xss')">Link</a>
        <iframe src="evil.html"></iframe>
      `;

      const result = performSecurityChecks(maliciousHTML);
      
      expect(result.isSecure).toBe(false);
      expect(result.violations).toContain('Script tags detected');
      expect(result.violations).toContain('Event handlers detected');
      expect(result.violations).toContain('JavaScript URLs detected');
      expect(result.violations).toContain('Iframe tags detected');
    });

    test('fixCommonSecurityIssues should fix broken attributes', () => {
      const brokenHTML = `
        <img src="\\"image.jpg\\"" />
        <a href="\\"link.html\\"">Link</a>
        <img src="" />
        <a href="">Empty Link</a>
      `;

      const fixed = fixCommonSecurityIssues(brokenHTML);
      
      expect(fixed).toContain('src="image.jpg"');
      expect(fixed).toContain('href="link.html"');
      expect(fixed).toContain('src="#"');
      expect(fixed).toContain('href="#"');
    });

    test('should add security attributes to external links', () => {
      const htmlWithExternalLinks = `
        <a href="https://example.com">External Link</a>
        <a href="https://evil.com" rel="nofollow">Already has rel</a>
      `;

      const fixed = fixCommonSecurityIssues(htmlWithExternalLinks);
      
      expect(fixed).toContain('rel="noopener noreferrer"');
      expect(fixed).toContain('rel="nofollow"'); // Should preserve existing rel
    });
  });

  describe('Error Handling', () => {
    test('should handle sanitization errors gracefully', () => {
      // Mock sanitizeHTMLClient to throw an error
      const originalSanitize = sanitizeHTMLClient;
      (global as any).sanitizeHTMLClient = jest.fn(() => {
        throw new Error('Sanitization failed');
      });

      renderLPViewer('<div>Content</div>');
      
      // Should not crash and should show error status
      expect(screen.getByTitle('LP Preview - Secure Sandbox')).toBeInTheDocument();
      
      // Restore original function
      (global as any).sanitizeHTMLClient = originalSanitize;
    });

    test('should disable security checks when enableSecurityChecks is false', async () => {
      const maliciousHTML = '<script>alert("xss")</script><div>Content</div>';
      
      renderLPViewer(maliciousHTML, { enableSecurityChecks: false });
      
      // Should not show security warnings
      await waitFor(() => {
        expect(screen.queryByText(/Security Notice/)).not.toBeInTheDocument();
      });
    });
  });
});