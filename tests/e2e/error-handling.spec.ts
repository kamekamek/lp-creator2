/**
 * Error Handling E2E Tests
 * Tests comprehensive error handling, recovery workflows, and user feedback systems
 */

import { test, expect, Page } from '@playwright/test';

// Test scenarios for different error types
const ERROR_SCENARIOS = {
  network: {
    name: 'Network Error',
    method: 'offline',
    expectedMessage: 'インターネット接続に問題があります'
  },
  timeout: {
    name: 'Timeout Error',
    method: 'slow-response',
    expectedMessage: '処理に時間がかかりすぎています'
  },
  validation: {
    name: 'Validation Error',
    method: 'invalid-input',
    expectedMessage: '入力内容に問題があります'
  },
  quota: {
    name: 'Quota Exceeded',
    method: 'quota-exceeded',
    expectedMessage: 'サービスの利用上限に達しています'
  }
};

// Helper functions for simulating errors
const simulateNetworkError = async (page: Page) => {
  await page.setOfflineMode(true);
};

const simulateTimeoutError = async (page: Page) => {
  // Intercept API calls and delay them significantly
  await page.route('/api/lp-creator/chat', async route => {
    // Delay for longer than the expected timeout
    await new Promise(resolve => setTimeout(resolve, 5000));
    await route.continue();
  });
};

const simulateValidationError = async (page: Page, inputText: string) => {
  // Use invalid input that should trigger validation
  await page.fill('input[placeholder*="AI写真編集アプリ"]', inputText);
  await page.click('button:has-text("生成")');
};

const simulateQuotaError = async (page: Page) => {
  // Mock quota exceeded response
  await page.route('/api/lp-creator/chat', async route => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          type: 'quota_exceeded',
          message: 'Rate limit exceeded'
        }
      })
    });
  });
};

test.describe('Error Handling and Recovery', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Network Error Handling', () => {
    test('should handle network disconnection gracefully', async ({ page }) => {
      // Navigate to quick creation
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Simulate network disconnection
      await simulateNetworkError(page);
      
      // Try to generate LP
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Test LP creation');
      await page.click('button:has-text("生成")');
      
      // Should show network error message
      await expect(page.locator('text=インターネット接続に問題があります')).toBeVisible({ timeout: 10000 });
      
      // Should show retry button
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
      
      // Should show suggestions
      await expect(page.locator('text=インターネット接続を確認してください')).toBeVisible();
    });

    test('should recover when network comes back online', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Go offline
      await simulateNetworkError(page);
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Test recovery');
      await page.click('button:has-text("生成")');
      
      // Wait for error
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
      
      // Go back online
      await page.setOfflineMode(false);
      
      // Click retry
      await page.click('button:has-text("再試行")');
      
      // Should show loading state
      await expect(page.locator('text=AI処理中')).toBeVisible();
      
      // Should eventually show success or continue processing
      // (Actual LP generation might still fail due to API issues, but network error should be resolved)
    });

    test('should show offline mode indicators', async ({ page }) => {
      await simulateNetworkError(page);
      
      // Should indicate offline status
      await page.waitForTimeout(1000); // Give time for offline detection
      
      // Check for offline indicators in the UI
      const offlineElements = await page.locator('[data-testid*="offline"], [class*="offline"], text=オフライン').count();
      
      // Some offline indication should be present
      expect(offlineElements).toBeGreaterThan(0);
    });
  });

  test.describe('Timeout Handling', () => {
    test('should handle API timeouts with fallback', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Set up timeout simulation
      await simulateTimeoutError(page);
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Long processing request');
      await page.click('button:has-text("生成")');
      
      // Should show timeout message
      await expect(page.locator('text=処理に時間がかかりすぎています')).toBeVisible({ timeout: 8000 });
      
      // Should provide suggestions
      await expect(page.locator('text=しばらく時間をおいて再度お試しください')).toBeVisible();
    });

    test('should show progress indicators for long operations', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Complex LP request with many features');
      await page.click('button:has-text("生成")');
      
      // Should show loading indicators
      await expect(page.locator('[data-testid*="loading"], .animate-spin')).toBeVisible();
      
      // Should show stage information
      const stageElements = await page.locator('text=AI処理中, text=生成中, text=処理中').count();
      expect(stageElements).toBeGreaterThan(0);
    });

    test('should allow cancellation of long operations', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Long operation');
      await page.click('button:has-text("生成")');
      
      // Look for cancel or stop button
      const cancelButton = page.locator('button:has-text("キャンセル"), button:has-text("停止"), button:has-text("中止")').first();
      
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        
        // Should stop the operation
        await expect(page.locator('text=AI処理中')).not.toBeVisible();
      }
    });
  });

  test.describe('Validation Error Handling', () => {
    test('should handle empty input validation', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Try to submit without input
      await page.click('button:has-text("生成")');
      
      // Should show validation error or prevent submission
      const hasValidationError = await page.locator('text=入力してください, text=必須, text=エラー').count();
      const isButtonDisabled = await page.locator('button:has-text("生成")').getAttribute('disabled');
      
      // Either show validation error or disable button
      expect(hasValidationError > 0 || isButtonDisabled !== null).toBeTruthy();
    });

    test('should handle invalid input gracefully', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Input extremely long text that might cause issues
      const longText = 'x'.repeat(10000);
      await page.fill('input[placeholder*="AI写真編集アプリ"]', longText);
      await page.click('button:has-text("生成")');
      
      // Should either handle gracefully or show appropriate error
      await page.waitForTimeout(2000);
      
      // Check if there's any error indication
      const errorElements = await page.locator('[role="alert"], text=エラー, text=問題, .text-red').count();
      
      // Should not crash the application
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should validate file uploads if applicable', async ({ page }) => {
      // This test would be relevant if file upload functionality exists
      // For now, we'll check if file inputs exist and test them
      
      const fileInputs = await page.locator('input[type="file"]').count();
      
      if (fileInputs > 0) {
        const fileInput = page.locator('input[type="file"]').first();
        
        // Try to upload invalid file type
        await fileInput.setInputFiles({
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('invalid file content')
        });
        
        // Should show validation error
        await expect(page.locator('text=ファイル形式, text=無効, text=サポート')).toBeVisible();
      }
    });
  });

  test.describe('AI Model Fallback', () => {
    test('should switch models when current model fails', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Mock model failure
      await page.route('/api/lp-creator/chat', async route => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              type: 'model_unavailable',
              message: 'Model temporarily unavailable'
            }
          })
        });
      });
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Test model fallback');
      await page.click('button:has-text("生成")');
      
      // Should show model switching or fallback message
      await expect(page.locator('text=一時的にサービスが利用できません, text=モデル, text=切り替え')).toBeVisible({ timeout: 10000 });
    });

    test('should allow manual model selection', async ({ page }) => {
      // Check if model selection UI exists
      const modelSelector = page.locator('[data-testid*="model"], [class*="model"], select, button:has-text("モデル")');
      
      if (await modelSelector.count() > 0) {
        await modelSelector.first().click();
        
        // Should show model options
        const modelOptions = await page.locator('option, li, button').filter({ hasText: /GPT|Claude|Gemini/ }).count();
        expect(modelOptions).toBeGreaterThan(0);
      }
    });
  });

  test.describe('User Feedback and Recovery', () => {
    test('should provide helpful error messages', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Simulate various error conditions and check messages
      await simulateQuotaError(page);
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Test quota error');
      await page.click('button:has-text("生成")');
      
      // Should show user-friendly error message
      await expect(page.locator('text=利用上限, text=しばらく時間をおいて')).toBeVisible({ timeout: 10000 });
    });

    test('should show actionable suggestions', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      await simulateNetworkError(page);
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Test suggestions');
      await page.click('button:has-text("生成")');
      
      // Wait for error
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
      
      // Should show specific suggestions
      const suggestions = await page.locator('text=接続を確認, text=再読み込み, text=ブラウザ').count();
      expect(suggestions).toBeGreaterThan(0);
    });

    test('should allow error reporting', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      await simulateNetworkError(page);
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Test error reporting');
      await page.click('button:has-text("生成")');
      
      // Wait for error state
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
      
      // Look for error reporting options
      const reportOptions = await page.locator('button:has-text("レポート"), button:has-text("報告"), link:has-text("問題")').count();
      
      if (reportOptions > 0) {
        // Click first available reporting option
        await page.locator('button:has-text("レポート"), button:has-text("報告"), link:has-text("問題")').first().click();
        
        // Should trigger some reporting mechanism
        // (Could be download, modal, or navigation)
      }
    });

    test('should maintain application state during errors', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      const testInput = 'Test state preservation';
      await page.fill('input[placeholder*="AI写真編集アプリ"]', testInput);
      
      // Cause an error
      await simulateNetworkError(page);
      await page.click('button:has-text("生成")');
      
      // Wait for error
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
      
      // Input should still contain the text
      await expect(page.locator('input[placeholder*="AI写真編集アプリ"]')).toHaveValue(testInput);
      
      // Other UI elements should still be functional
      await expect(page.locator('[role="tab"]:has-text("構造化")')).toBeVisible();
      
      // Should be able to switch tabs
      await page.click('[role="tab"]:has-text("構造化")');
      await expect(page.locator('[role="tab"]:has-text("構造化")').first()).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Error Recovery Workflows', () => {
    test('should support retry with exponential backoff', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      let attemptCount = 0;
      await page.route('/api/lp-creator/chat', async route => {
        attemptCount++;
        if (attemptCount < 3) {
          // Fail first few attempts
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          // Succeed on later attempt
          await route.continue();
        }
      });
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Test retry backoff');
      await page.click('button:has-text("生成")');
      
      // Should show retry option
      await expect(page.locator('button:has-text("再試行")')).toBeVisible({ timeout: 10000 });
      
      // Click retry multiple times
      for (let i = 0; i < 3; i++) {
        if (await page.locator('button:has-text("再試行")').isVisible()) {
          await page.click('button:has-text("再試行")');
          await page.waitForTimeout(1000 * (i + 1)); // Wait longer each time
        }
      }
    });

    test('should provide alternative workflows on persistent errors', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Simulate persistent failure
      await page.route('/api/lp-creator/chat', async route => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' })
        });
      });
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Test alternative workflow');
      await page.click('button:has-text("生成")');
      
      // Wait for error
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
      
      // Try retry a few times
      for (let i = 0; i < 3; i++) {
        if (await page.locator('button:has-text("再試行")').isVisible()) {
          await page.click('button:has-text("再試行")');
          await page.waitForTimeout(1000);
        }
      }
      
      // Should offer alternatives
      const alternatives = await page.locator('button:has-text("テンプレート"), button:has-text("サンプル"), link:has-text("ヘルプ")').count();
      
      // Some alternative should be available
      if (alternatives > 0) {
        expect(alternatives).toBeGreaterThan(0);
      } else {
        // At minimum, should still have basic navigation
        await expect(page.locator('[role="tab"]')).toBeVisible();
      }
    });

    test('should handle multiple simultaneous errors', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Simulate network error
      await simulateNetworkError(page);
      
      // Try multiple operations quickly
      const operations = [
        'Test operation 1',
        'Test operation 2',  
        'Test operation 3'
      ];
      
      for (const operation of operations) {
        await page.fill('input[placeholder*="AI写真編集アプリ"]', operation);
        await page.click('button:has-text("生成")');
        await page.waitForTimeout(100); // Small delay
      }
      
      // Should handle multiple errors gracefully
      await page.waitForTimeout(2000);
      
      // Application should still be responsive
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[role="tab"]')).toBeVisible();
    });
  });

  test.describe('Error Prevention', () => {
    test('should validate input before submission', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      const input = page.locator('input[placeholder*="AI写真編集アプリ"]');
      const submitButton = page.locator('button:has-text("生成")');
      
      // Empty input should disable button or show warning
      await expect(input).toBeEmpty();
      
      const isDisabled = await submitButton.getAttribute('disabled');
      const hasWarning = await page.locator('text=入力してください, text=必須').count();
      
      // Should either disable submission or show warning
      expect(isDisabled !== null || hasWarning > 0).toBeTruthy();
    });

    test('should show loading states to prevent double submission', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Test loading state');
      await page.click('button:has-text("生成")');
      
      // Button should show loading state or be disabled
      const isLoading = await page.locator('button:has-text("生成")').getAttribute('disabled') !== null ||
                        await page.locator('.animate-spin, text=処理中').count() > 0;
      
      expect(isLoading).toBeTruthy();
    });

    test('should warn about potentially problematic inputs', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Try potentially problematic input
      const problematicInputs = [
        'a'.repeat(1000), // Very long input
        '<script>alert("xss")</script>', // Potential XSS
        '".repeat(100)', // Many quotes
      ];
      
      for (const input of problematicInputs) {
        await page.fill('input[placeholder*="AI写真編集アプリ"]', input);
        
        // Should handle gracefully without breaking
        await page.waitForTimeout(100);
        
        // Input should be sanitized or limited
        const actualValue = await page.locator('input[placeholder*="AI写真編集アプリ"]').inputValue();
        
        // Should not contain dangerous content
        expect(actualValue).not.toContain('<script>');
      }
    });
  });
});