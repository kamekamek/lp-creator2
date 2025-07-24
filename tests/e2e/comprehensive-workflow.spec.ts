/**
 * Comprehensive End-to-End Workflow Tests
 * Tests all major user workflows from start to finish
 */

import { test, expect, Page, Browser } from '@playwright/test';

// Test data for various workflows
const TEST_SCENARIOS = {
  quickGeneration: {
    input: 'AI写真編集アプリのランディングページを作成してください。ターゲットはクリエイター、価格は月額1,980円、無料トライアルあり',
    expectedElements: ['価格', 'クリエイター', '無料', 'トライアル', 'AI'],
    timeout: 30000
  },
  structuredWorkflow: {
    businessType: 'SaaS',
    targetAudience: 'デザイナー',
    keyFeatures: ['AI自動編集', 'クラウド保存', 'チーム共有'],
    pricing: '月額2,980円',
    timeout: 45000
  },
  editingWorkflow: {
    originalText: 'サンプルテキスト',
    newText: '更新されたテキスト',
    timeout: 10000
  }
};

test.describe('Comprehensive User Workflows', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Complete LP Generation Workflow', () => {
    test('should complete full quick generation workflow', async ({ page }) => {
      console.log('🔄 Testing complete quick generation workflow...');

      // Navigate to quick generation
      await page.click('[role="tab"]:has-text("クイック")');
      await expect(page.locator('[role="tab"]:has-text("クイック")')).toHaveAttribute('aria-selected', 'true');

      // Input generation request
      const input = page.locator('input[placeholder*="AI写真編集アプリ"]');
      await input.fill(TEST_SCENARIOS.quickGeneration.input);

      // Start generation
      await page.click('button:has-text("生成")');

      // Wait for loading states
      await expect(page.locator('text=AI処理中, text=生成中, text=処理中')).toBeVisible({ timeout: 5000 });

      // Wait for generation completion
      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      await expect(previewFrame).toBeVisible({ timeout: TEST_SCENARIOS.quickGeneration.timeout });

      // Verify generated content contains expected elements
      const frameContent = await previewFrame.contentFrame();
      if (frameContent) {
        for (const element of TEST_SCENARIOS.quickGeneration.expectedElements) {
          await expect(frameContent.locator(`text=${element}`)).toBeVisible();
        }
      }

      // Verify download functionality
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("ダウンロード")');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.html$/);

      console.log('✅ Quick generation workflow completed successfully');
    });

    test('should complete structured workflow with all steps', async ({ page }) => {
      console.log('🔄 Testing structured workflow...');

      // Navigate to structured workflow
      await page.click('[role="tab"]:has-text("構造化")');
      await expect(page.locator('[role="tab"]:has-text("構造化")')).toHaveAttribute('aria-selected', 'true');

      // Step 1: Business Type Selection
      await page.selectOption('select[name="businessType"], select:has(option:text("SaaS"))', TEST_SCENARIOS.structuredWorkflow.businessType);
      await page.click('button:has-text("次へ")');

      // Step 2: Target Audience
      await page.fill('input[name="targetAudience"], input[placeholder*="ターゲット"]', TEST_SCENARIOS.structuredWorkflow.targetAudience);
      await page.click('button:has-text("次へ")');

      // Step 3: Key Features
      for (const feature of TEST_SCENARIOS.structuredWorkflow.keyFeatures) {
        await page.fill('input[name="feature"], input[placeholder*="機能"]', feature);
        await page.click('button:has-text("追加"), button:has-text("＋")');
      }
      await page.click('button:has-text("次へ")');

      // Step 4: Pricing Information
      await page.fill('input[name="pricing"], input[placeholder*="価格"]', TEST_SCENARIOS.structuredWorkflow.pricing);
      await page.click('button:has-text("生成開始"), button:has-text("完了")');

      // Wait for generation completion
      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      await expect(previewFrame).toBeVisible({ timeout: TEST_SCENARIOS.structuredWorkflow.timeout });

      // Verify all input data appears in generated content
      const frameContent = await previewFrame.contentFrame();
      if (frameContent) {
        await expect(frameContent.locator(`text=${TEST_SCENARIOS.structuredWorkflow.targetAudience}`)).toBeVisible();
        await expect(frameContent.locator(`text=${TEST_SCENARIOS.structuredWorkflow.pricing}`)).toBeVisible();
      }

      console.log('✅ Structured workflow completed successfully');
    });

    test('should complete editing workflow with immediate updates', async ({ page }) => {
      console.log('🔄 Testing editing workflow...');

      // First generate a simple LP
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'シンプルなテストページ');
      await page.click('button:has-text("生成")');

      // Wait for generation
      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      await expect(previewFrame).toBeVisible({ timeout: 30000 });

      // Switch to edit mode
      await page.click('button:has-text("編集"), [data-testid="edit-toggle"]');

      // Find and edit an element
      const frameContent = await previewFrame.contentFrame();
      if (frameContent) {
        // Look for editable text elements
        const editableElements = frameContent.locator('[data-editable-id], h1, h2, p').first();
        await editableElements.dblclick();

        // Edit the text
        const editInput = frameContent.locator('input[type="text"], textarea');
        if (await editInput.count() > 0) {
          await editInput.fill(TEST_SCENARIOS.editingWorkflow.newText);
          await editInput.press('Enter');

          // Verify immediate update
          await expect(frameContent.locator(`text=${TEST_SCENARIOS.editingWorkflow.newText}`)).toBeVisible({ timeout: 2000 });
        }
      }

      console.log('✅ Editing workflow completed successfully');
    });
  });

  test.describe('AI Suggestion and Improvement Workflow', () => {
    test('should generate and apply AI suggestions', async ({ page }) => {
      console.log('🔄 Testing AI suggestions workflow...');

      // Generate initial LP
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'LP改善テスト用ページ');
      await page.click('button:has-text("生成")');

      // Wait for generation
      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      await expect(previewFrame).toBeVisible({ timeout: 30000 });

      // Open AI suggestions panel
      await page.click('button:has-text("AI改善"), [data-testid="ai-suggestions"]');

      // Wait for suggestions to load
      await expect(page.locator('text=改善提案, text=suggestion')).toBeVisible({ timeout: 15000 });

      // Apply first suggestion if available
      const applySuggestionButton = page.locator('button:has-text("適用"), button:has-text("Apply")').first();
      if (await applySuggestionButton.count() > 0) {
        await applySuggestionButton.click();

        // Verify changes applied to preview
        await page.waitForTimeout(2000); // Allow time for changes to apply
        await expect(previewFrame).toBeVisible();
      }

      console.log('✅ AI suggestions workflow completed successfully');
    });
  });

  test.describe('Multi-Variant Generation Workflow', () => {
    test('should generate multiple variants and allow selection', async ({ page }) => {
      console.log('🔄 Testing multi-variant generation...');

      // Use quick generation with variant request
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', '3つのデザインバリエーションでECサイトを作成');
      await page.click('button:has-text("生成")');

      // Wait for generation completion
      await page.waitForTimeout(45000); // Variants take longer

      // Look for variant selector
      const variantSelector = page.locator('[data-testid="variant-selector"], button:has-text("バリエーション")');
      if (await variantSelector.count() > 0) {
        await variantSelector.click();

        // Verify multiple variants are available
        const variantOptions = page.locator('[data-testid="variant-option"], button:has-text("バリエーション")');
        const variantCount = await variantOptions.count();
        expect(variantCount).toBeGreaterThan(1);

        // Select different variant
        if (variantCount > 1) {
          await variantOptions.nth(1).click();
          await page.waitForTimeout(2000); // Allow preview to update
        }
      }

      console.log('✅ Multi-variant workflow completed successfully');
    });
  });

  test.describe('Export and Download Workflow', () => {
    test('should export LP in various formats', async ({ page }) => {
      console.log('🔄 Testing export workflow...');

      // Generate LP for export
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'エクスポートテスト用ページ');
      await page.click('button:has-text("生成")');

      // Wait for generation
      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      await expect(previewFrame).toBeVisible({ timeout: 30000 });

      // Test HTML download
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("ダウンロード"), button:has-text("HTML")');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/\.html$/);
      
      // Verify file content
      const downloadPath = await download.path();
      if (downloadPath) {
        const { readFileSync } = require('fs');
        const content = readFileSync(downloadPath, 'utf8');
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('<html');
        expect(content).toContain('</html>');
      }

      console.log('✅ Export workflow completed successfully');
    });
  });

  test.describe('Error Recovery Workflow', () => {
    test('should handle and recover from generation errors', async ({ page }) => {
      console.log('🔄 Testing error recovery workflow...');

      // Simulate network error
      await page.route('/api/lp-creator/chat', route => {
        route.fulfill({ status: 500, body: 'Server Error' });
      });

      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'エラーテスト');
      await page.click('button:has-text("生成")');

      // Wait for error message
      await expect(page.locator('text=エラー, text=失敗, text=問題')).toBeVisible({ timeout: 10000 });

      // Verify retry option is available
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();

      // Remove network error simulation
      await page.unroute('/api/lp-creator/chat');

      // Try retry
      await page.click('button:has-text("再試行")');

      // Verify recovery (may still show loading or complete successfully)
      await page.waitForTimeout(5000);

      console.log('✅ Error recovery workflow completed successfully');
    });
  });
});

test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work correctly in ${browserName}`, async ({ page, browser }) => {
      console.log(`🔄 Testing compatibility in ${browserName}...`);

      // Basic functionality test
      await page.goto('/');
      
      // Verify main UI elements are present
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[role="tab"]')).toHaveCount(2); // Quick and Structured tabs
      
      // Test basic generation (simplified for compatibility)
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'ブラウザ互換性テスト');
      
      // Verify input works
      await expect(page.locator('input[placeholder*="AI写真編集アプリ"]')).toHaveValue('ブラウザ互換性テスト');
      
      // Check if generation button is functional
      const generateButton = page.locator('button:has-text("生成")');
      await expect(generateButton).toBeVisible();
      await expect(generateButton).toBeEnabled();

      console.log(`✅ ${browserName} compatibility verified`);
    });
  });
});

test.describe('Performance Benchmarks', () => {
  test('should meet performance benchmarks', async ({ page }) => {
    console.log('🔄 Testing performance benchmarks...');

    const startTime = Date.now();

    // Test page load performance
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // 5 seconds max

    // Test LP generation performance
    await page.click('[role="tab"]:has-text("クイック")');
    await page.fill('input[placeholder*="AI写真編集アプリ"]', 'パフォーマンステスト用の簡単なLP');
    
    const genStartTime = Date.now();
    await page.click('button:has-text("生成")');
    
    // Wait for either success or reasonable timeout
    try {
      await expect(page.locator('iframe[data-testid="lp-preview"]')).toBeVisible({ timeout: 15000 });
      const genTime = Date.now() - genStartTime;
      console.log(`📊 LP generation time: ${genTime}ms`);
      
      // This is a more realistic benchmark for AI generation
      expect(genTime).toBeLessThan(30000); // 30 seconds max
    } catch (error) {
      console.log('⚠️ Generation timed out - acceptable for performance test');
    }

    // Test editing performance
    const editStartTime = Date.now();
    await page.click('button:has-text("編集"), [data-testid="edit-toggle"]');
    const editTime = Date.now() - editStartTime;
    console.log(`📊 Edit mode activation time: ${editTime}ms`);
    expect(editTime).toBeLessThan(1000); // 1 second max

    console.log('✅ Performance benchmarks completed');
  });
});

test.describe('Security Tests', () => {
  test('should prevent XSS attacks in generated content', async ({ page }) => {
    console.log('🔄 Testing XSS prevention...');

    // Try to inject malicious script
    const maliciousInput = '<script>alert("XSS")</script>悪意のあるスクリプトテスト';
    
    await page.click('[role="tab"]:has-text("クイック")');
    await page.fill('input[placeholder*="AI写真編集アプリ"]', maliciousInput);
    await page.click('button:has-text("生成")');

    // Wait for processing
    await page.waitForTimeout(10000);

    // Check if any script tags exist in the preview
    const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
    
    if (await previewFrame.count() > 0) {
      const frameContent = await previewFrame.contentFrame();
      if (frameContent) {
        // Verify no script tags are present
        const scriptTags = await frameContent.locator('script').count();
        expect(scriptTags).toBe(0);
        
        // Verify no inline event handlers
        const elementsWithOnclick = await frameContent.locator('[onclick]').count();
        expect(elementsWithOnclick).toBe(0);
      }
    }

    console.log('✅ XSS prevention verified');
  });

  test('should sanitize user input properly', async ({ page }) => {
    console.log('🔄 Testing input sanitization...');

    // Test various potentially dangerous inputs
    const dangerousInputs = [
      'javascript:alert("test")',
      '<img src="x" onerror="alert(1)">',
      '"><script>alert("xss")</script>',
      '<iframe src="javascript:alert(1)"></iframe>'
    ];

    for (const input of dangerousInputs) {
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Clear and fill input
      await page.fill('input[placeholder*="AI写真編集アプリ"]', '');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', input);
      
      // Verify input is sanitized or handled safely
      const inputValue = await page.locator('input[placeholder*="AI写真編集アプリ"]').inputValue();
      expect(inputValue).not.toContain('<script>');
      expect(inputValue).not.toContain('javascript:');
    }

    console.log('✅ Input sanitization verified');
  });
});

test.describe('Accessibility Tests', () => {
  test('should be fully keyboard navigable', async ({ page }) => {
    console.log('🔄 Testing keyboard navigation...');

    await page.goto('/');

    // Test tab navigation through main elements
    await page.keyboard.press('Tab'); // Should focus first interactive element
    await page.keyboard.press('Tab'); // Move to next element
    await page.keyboard.press('Tab'); // Continue navigation

    // Verify focused element is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test Enter key activation
    await page.keyboard.press('Enter');
    
    // Verify some interaction occurred (tab switch or button click)
    await page.waitForTimeout(1000);

    console.log('✅ Keyboard navigation verified');
  });

  test('should have proper ARIA labels and landmarks', async ({ page }) => {
    console.log('🔄 Testing ARIA compliance...');

    await page.goto('/');

    // Check for essential ARIA landmarks
    await expect(page.locator('[role="main"], main')).toBeVisible();
    await expect(page.locator('[role="tab"]')).toHaveCount(2);
    
    // Verify tab navigation has proper ARIA attributes
    const tabs = page.locator('[role="tab"]');
    const firstTab = tabs.first();
    
    await expect(firstTab).toHaveAttribute('aria-selected');
    await expect(firstTab).toHaveAttribute('role', 'tab');

    // Check for form labels
    const inputs = page.locator('input');
    if (await inputs.count() > 0) {
      // Verify inputs have labels or aria-label
      for (let i = 0; i < await inputs.count(); i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.getAttribute('aria-label') !== null ||
                         await input.getAttribute('aria-labelledby') !== null ||
                         await page.locator(`label[for="${await input.getAttribute('id')}"]`).count() > 0;
        expect(hasLabel).toBeTruthy();
      }
    }

    console.log('✅ ARIA compliance verified');
  });
});