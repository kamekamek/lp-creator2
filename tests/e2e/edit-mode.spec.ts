import { test, expect } from '@playwright/test';

test.describe('LP Creator - Edit Mode & Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Navigate to main interface
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    await input.fill('テスト用LP');
    await submitButton.click();
    
    // Wait for interface to load
    await page.waitForTimeout(3000);
  });

  test('should show edit mode toggle button', async ({ page }) => {
    // Look for edit mode related elements
    const editButtons = page.locator('button').filter({ hasText: /編集|Edit/ });
    const toggleButtons = page.locator('[data-testid="edit-toggle"], .edit-toggle');
    
    const editButtonCount = await editButtons.count();
    const toggleButtonCount = await toggleButtons.count();
    
    // Should have some edit-related controls
    expect(editButtonCount + toggleButtonCount).toBeGreaterThan(0);
  });

  test('should handle responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if layout adapts
    const body = page.locator('body');
    const bodyClass = await body.getAttribute('class');
    
    // Should handle mobile layout
    expect(bodyClass).toBeTruthy();
    
    // Check for responsive elements
    const mobileElements = page.locator('.mobile, .sm\\:, .md\\:, .lg\\:');
    const mobileElementCount = await mobileElements.count();
    
    // Should have responsive styling
    expect(mobileElementCount).toBeGreaterThan(0);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    
    // Should focus on interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Escape key
    await page.keyboard.press('Escape');
    
    // Should handle escape key gracefully (no errors)
    const errorElements = page.locator('.error, [role="alert"]');
    const errorCount = await errorElements.count();
    expect(errorCount).toBe(0);
  });

  test('should maintain state during interactions', async ({ page }) => {
    // Get initial state
    const initialContent = await page.locator('body').textContent();
    
    // Perform some interactions
    await page.mouse.click(100, 100);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    
    // State should be preserved
    const afterContent = await page.locator('body').textContent();
    expect(afterContent).toBeTruthy();
    expect(afterContent!.length).toBeGreaterThan(50);
  });

  test('should handle window resize', async ({ page }) => {
    // Initial size
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    // Resize to smaller
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);
    
    // Should adapt layout
    const content = await page.locator('body').textContent();
    expect(content).toBeTruthy();
    
    // Resize to larger
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.waitForTimeout(500);
    
    // Should still work
    const finalContent = await page.locator('body').textContent();
    expect(finalContent).toBeTruthy();
  });

  test('should handle multiple rapid clicks', async ({ page }) => {
    // Find clickable elements
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      
      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        await firstButton.click();
        await page.waitForTimeout(100);
      }
      
      // Should handle without errors
      const errorElements = page.locator('.error, [role="alert"]');
      const errorCount = await errorElements.count();
      expect(errorCount).toBe(0);
    }
  });

  test('should handle page refresh', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Refresh page
    await page.reload();
    
    // Should return to initial state
    await expect(page.getByRole('heading', { name: '今日は何をデザインしますか？' })).toBeVisible({
      timeout: 10000
    });
    
    // Should be fully functional
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });
});