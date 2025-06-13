import { test, expect } from '@playwright/test';

test.describe('LP Creator - AI Response & Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle AI response and show preview', async ({ page }) => {
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    // Submit a request
    await input.fill('テスト用ランディングページ');
    await submitButton.click();
    
    // Wait for AI response (increased timeout for AI processing)
    await page.waitForTimeout(3000);
    
    // Should show some response or loading state
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toContain('テスト用ランディングページ');
    
    // Look for preview elements (iframe or preview content)
    const previewElements = page.locator('iframe, [data-testid="preview"], .preview-container');
    
    // At least one preview element should be present
    const previewCount = await previewElements.count();
    expect(previewCount).toBeGreaterThan(0);
  });

  test('should display error handling for failed requests', async ({ page }) => {
    // Mock network to simulate API failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    await input.fill('テスト');
    await submitButton.click();
    
    // Should handle error gracefully
    await page.waitForTimeout(2000);
    
    // Look for error indicators
    const errorElements = await page.locator('.error, .alert, [role="alert"]').count();
    const bodyText = await page.locator('body').textContent();
    
    // Should show some indication of error or fallback content
    expect(errorElements > 0 || bodyText?.includes('エラー') || bodyText?.includes('失敗')).toBeTruthy();
  });

  test('should handle long AI processing time', async ({ page }) => {
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    await input.fill('複雑なマルチセクションLP');
    await submitButton.click();
    
    // Should show loading state during processing
    await expect(page.locator('.animate-pulse, .loading, .spinner')).toBeVisible({
      timeout: 5000
    });
    
    // Should eventually complete or show progress
    await page.waitForTimeout(10000);
    
    // Should not be stuck in infinite loading
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100); // Should have substantial content
  });

  test('should handle tool result detection', async ({ page }) => {
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    await input.fill('シンプルなビジネスLP');
    await submitButton.click();
    
    // Wait for tool execution
    await page.waitForTimeout(5000);
    
    // Check for iframe or preview panel activation
    const previewFrame = page.locator('iframe[srcdoc]');
    const previewPanel = page.locator('[data-testid="preview-panel"], .preview-panel');
    
    // Should show preview content in some form
    const hasPreviewFrame = await previewFrame.count() > 0;
    const hasPreviewPanel = await previewPanel.count() > 0;
    
    expect(hasPreviewFrame || hasPreviewPanel).toBeTruthy();
  });

  test('should validate iframe sandbox security', async ({ page }) => {
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    await input.fill('セキュリティテスト用LP');
    await submitButton.click();
    
    // Wait for potential iframe creation
    await page.waitForTimeout(5000);
    
    // Check for iframe with proper sandbox attributes
    const iframes = page.locator('iframe');
    const iframeCount = await iframes.count();
    
    if (iframeCount > 0) {
      const firstIframe = iframes.first();
      const sandboxAttr = await firstIframe.getAttribute('sandbox');
      
      // Should have sandbox attribute for security
      expect(sandboxAttr).toBeTruthy();
      
      // Should include safe sandbox values
      if (sandboxAttr) {
        expect(sandboxAttr).toContain('allow-same-origin');
      }
    }
  });
});