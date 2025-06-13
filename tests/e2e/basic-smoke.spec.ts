import { test, expect } from '@playwright/test';

test.describe('LP Creator - Basic Smoke Tests', () => {
  test('should load homepage without errors', async ({ page }) => {
    await page.goto('/');
    
    // Basic page load check
    await expect(page).toHaveTitle(/LP Creator/);
    
    // Check if main elements are present
    await expect(page.getByRole('heading', { name: '今日は何をデザインしますか？' })).toBeVisible();
    
    // Check for no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('_next/static') && 
      !error.includes('favicon') &&
      !error.includes('ResizeObserver')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have functional input field', async ({ page }) => {
    await page.goto('/');
    
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    
    // Input should be visible and focused
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    
    // Should be able to type
    await input.fill('テスト入力');
    await expect(input).toHaveValue('テスト入力');
    
    // Button should be enabled
    const submitButton = page.getByRole('button', { name: '生成' });
    await expect(submitButton).toBeEnabled();
  });

  test('should handle form validation correctly', async ({ page }) => {
    await page.goto('/');
    
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    // Empty input should disable button
    await expect(submitButton).toBeDisabled();
    
    // Whitespace only should disable button
    await input.fill('   ');
    await expect(submitButton).toBeDisabled();
    
    // Valid input should enable button
    await input.fill('有効な入力');
    await expect(submitButton).toBeEnabled();
    
    // Clear should disable again
    await input.clear();
    await expect(submitButton).toBeDisabled();
  });

  test('should have proper responsive layout', async ({ page }) => {
    await page.goto('/');
    
    // Desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByRole('heading', { name: '今日は何をデザインしますか？' })).toBeVisible();
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: '今日は何をデザインしますか？' })).toBeVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: '今日は何をデザインしますか？' })).toBeVisible();
  });

  test('should have accessible elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check for proper form labels and structure
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    await expect(input).toBeVisible();
    
    const button = page.getByRole('button', { name: '生成' });
    await expect(button).toBeVisible();
    
    // Check button has proper disabled state
    await expect(button).toHaveAttribute('disabled');
  });
});