import { test, expect } from '@playwright/test';

test.describe('LP Creator - MVP Core Functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display initial landing page with input form', async ({ page }) => {
    // Check if the main title is visible
    await expect(page.getByRole('heading', { name: '今日は何をデザインしますか？' })).toBeVisible();
    
    // Check if the description text is present
    await expect(page.getByText('作成したいページについて、スタイル、機能、目的などを詳しく教えてください。')).toBeVisible();
    
    // Check if the input field is present and focused
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    
    // Check if submit button is disabled when input is empty
    const submitButton = page.getByRole('button', { name: '生成' });
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit button when input has content', async ({ page }) => {
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    // Initially disabled
    await expect(submitButton).toBeDisabled();
    
    // Type some content
    await input.fill('テスト用AI写真編集アプリのLP');
    
    // Should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('should transition to chat interface after submitting input', async ({ page }) => {
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    // Fill input and submit
    await input.fill('AI写真編集ツールのランディングページ');
    await submitButton.click();
    
    // Should transition away from initial view
    await expect(page.getByRole('heading', { name: '今日は何をデザインしますか？' })).not.toBeVisible();
    
    // Should show chat interface elements
    await expect(page.getByText('AI写真編集ツールのランディングページ')).toBeVisible();
    
    // Should show loading or processing state
    await expect(page.locator('.animate-pulse, .loading, [data-testid="loading"]')).toBeVisible({
      timeout: 5000
    });
  });

  test('should show split-pane layout after initial submission', async ({ page }) => {
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    await input.fill('シンプルなポートフォリオサイト');
    await submitButton.click();
    
    // Wait for layout transition
    await page.waitForTimeout(2000);
    
    // Check for split-pane layout elements
    const leftPane = page.locator('.w-1\\/2, .flex-1').first();
    const rightPane = page.locator('.w-1\\/2, .flex-1').last();
    
    await expect(leftPane).toBeVisible();
    await expect(rightPane).toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    // Try to submit empty form
    await expect(submitButton).toBeDisabled();
    
    // Add only whitespace
    await input.fill('   ');
    await expect(submitButton).toBeDisabled();
    
    // Add actual content
    await input.fill('有効なコンテンツ');
    await expect(submitButton).toBeEnabled();
  });

  test('should maintain input focus and allow keyboard interaction', async ({ page }) => {
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    
    // Input should be focused on load
    await expect(input).toBeFocused();
    
    // Should allow typing
    await input.type('キーボードテスト');
    await expect(input).toHaveValue('キーボードテスト');
    
    // Should allow clearing with keyboard
    await input.press('Control+a');
    await input.press('Delete');
    await expect(input).toHaveValue('');
  });
});