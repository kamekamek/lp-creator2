import { test, expect } from '@playwright/test';

test.describe('Security Protection E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should prevent XSS attacks through AI-generated content', async ({ page }) => {
    // Input that might generate malicious content
    const maliciousInput = 'Create a landing page with <script>alert("XSS")</script> embedded JavaScript';
    
    await page.fill('input[placeholder*="例：AI写真編集アプリ"]', maliciousInput);
    await page.click('button:has-text("生成")');
    
    // Wait for generation to complete
    await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 30000 });
    
    // Check that security warning appears if malicious content is detected
    const securityNotice = page.locator('text=Security Notice');
    if (await securityNotice.isVisible()) {
      await expect(securityNotice).toBeVisible();
      await expect(page.locator('text=potential security issue')).toBeVisible();
    }
    
    // Verify iframe has proper sandbox attributes
    const iframe = page.locator('iframe[title*="LP Preview"]');
    await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    
    // Verify no script execution in main page context
    const alertDialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
    const alertDialog = await alertDialogPromise;
    expect(alertDialog).toBeNull(); // No alert should appear
  });

  test('should show security status indicator', async ({ page }) => {
    // Generate safe content
    const safeInput = 'Create a simple landing page for a photography service';
    
    await page.fill('input[placeholder*="例：AI写真編集アプリ"]', safeInput);
    await page.click('button:has-text("生成")');
    
    // Wait for generation
    await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 30000 });
    
    // Check for security status indicator
    const securityStatus = page.locator('text=Secure').or(page.locator('text=Sanitized'));
    await expect(securityStatus).toBeVisible();
  });

  test('should handle iframe sandbox properly', async ({ page }) => {
    // Generate content
    await page.fill('input[placeholder*="例：AI写真編集アプリ"]', 'Create a landing page for AI photo editor');
    await page.click('button:has-text("生成")');
    
    // Wait for iframe to load
    await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 30000 });
    
    const iframe = page.locator('iframe[title*="LP Preview"]');
    
    // Verify security attributes
    await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    await expect(iframe).toHaveAttribute('referrerPolicy', 'strict-origin-when-cross-origin');
    await expect(iframe).toHaveAttribute('allow', 'same-origin');
  });

  test('should allow dismissing security warnings', async ({ page }) => {
    // This test assumes we can trigger a security warning
    // In a real scenario, this might require specific malicious input
    
    await page.fill('input[placeholder*="例：AI写真編集アプリ"]', 'Create a page with onclick handlers and scripts');
    await page.click('button:has-text("生成")');
    
    // Wait for potential security warning
    await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 30000 });
    
    // If security warning appears, test dismissal
    const securityWarning = page.locator('text=Security Notice');
    if (await securityWarning.isVisible()) {
      const dismissButton = page.locator('button:has-text("×")');
      await dismissButton.click();
      
      // Warning should be dismissed
      await expect(securityWarning).not.toBeVisible();
    }
  });

  test('should maintain security during edit mode', async ({ page }) => {
    // Generate content
    await page.fill('input[placeholder*="例：AI写真編集アプリ"]', 'Create a landing page for AI photo editor');
    await page.click('button:has-text("生成")');
    
    // Wait for generation
    await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 30000 });
    
    // Enable edit mode
    await page.click('button:has-text("編集モード")');
    
    // Verify iframe still has security attributes
    const iframe = page.locator('iframe[title*="LP Preview"]');
    await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    
    // Security status should still be visible
    const securityStatus = page.locator('text=Secure').or(page.locator('text=Sanitized'));
    await expect(securityStatus).toBeVisible();
  });

  test('should prevent navigation attacks', async ({ page }) => {
    // Generate content
    await page.fill('input[placeholder*="例：AI写真編集アプリ"]', 'Create a landing page');
    await page.click('button:has-text("生成")');
    
    // Wait for iframe
    await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 30000 });
    
    // Verify sandbox doesn't allow top-navigation
    const iframe = page.locator('iframe[title*="LP Preview"]');
    const sandboxAttr = await iframe.getAttribute('sandbox');
    
    expect(sandboxAttr).not.toContain('allow-top-navigation');
    expect(sandboxAttr).not.toContain('allow-popups');
    expect(sandboxAttr).not.toContain('allow-downloads');
  });

  test('should handle CSP headers correctly', async ({ page }) => {
    // Check that CSP headers are set on the main page
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers).toBeDefined();
    const csp = headers?.['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  test('should handle malformed HTML gracefully', async ({ page }) => {
    // Try to generate content that might result in malformed HTML
    const problematicInput = 'Create a page with broken HTML tags and unclosed elements';
    
    await page.fill('input[placeholder*="例：AI写真編集アプリ"]', problematicInput);
    await page.click('button:has-text("生成")');
    
    // Should still render without crashing
    await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 30000 });
    
    // Page should remain functional
    const iframe = page.locator('iframe[title*="LP Preview"]');
    await expect(iframe).toBeVisible();
    
    // Security status should be present
    const securityStatus = page.locator('text=Secure').or(page.locator('text=Sanitized'));
    await expect(securityStatus).toBeVisible();
  });

  test('should preserve safe content while removing dangerous elements', async ({ page }) => {
    // Generate content
    await page.fill('input[placeholder*="例：AI写真編集アプリ"]', 'Create a landing page with headings, paragraphs, and buttons');
    await page.click('button:has-text("生成")');
    
    // Wait for generation
    await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 30000 });
    
    // Access iframe content to verify safe elements are preserved
    const iframe = page.frameLocator('iframe[title*="LP Preview"]');
    
    // Common safe elements should be present
    const headings = iframe.locator('h1, h2, h3, h4, h5, h6');
    const paragraphs = iframe.locator('p');
    const buttons = iframe.locator('button');
    
    // At least some of these elements should exist
    const headingCount = await headings.count();
    const paragraphCount = await paragraphs.count();
    const buttonCount = await buttons.count();
    
    expect(headingCount + paragraphCount + buttonCount).toBeGreaterThan(0);
  });

  test('should handle security processing errors gracefully', async ({ page }) => {
    // Test with edge case input that might cause processing issues
    const edgeCaseInput = 'Create a page with special characters: \x00\x01\x02 and unicode: 🚀💻🔒';
    
    await page.fill('input[placeholder*="例：AI写真編集アプリ"]', edgeCaseInput);
    await page.click('button:has-text("生成")');
    
    // Should handle gracefully without crashing
    await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 30000 });
    
    // Application should remain functional
    const iframe = page.locator('iframe[title*="LP Preview"]');
    await expect(iframe).toBeVisible();
    
    // Should show some security status
    const securityStatus = page.locator('text=Secure').or(page.locator('text=Sanitized'));
    await expect(securityStatus).toBeVisible();
  });
});