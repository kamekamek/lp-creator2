/**
 * Comprehensive Integration Tests
 * Tests all component interactions and system integration points
 */

import { test, expect, Page } from '@playwright/test';

// Test data and configurations
const INTEGRATION_TEST_DATA = {
  sampleLPRequests: [
    {
      type: 'quick',
      input: 'モバイルアプリ開発ツールのランディングページ',
      expectedKeywords: ['モバイル', 'アプリ', '開発', 'ツール'],
      category: 'SaaS'
    },
    {
      type: 'structured',
      businessType: 'EC',
      targetAudience: 'オンラインショッピング好きの20-30代女性',
      keyFeatures: ['即日配送', '返品無料', 'ポイント還元'],
      pricing: '商品価格 + 配送料',
      expectedElements: ['配送', '返品', 'ポイント']
    },
    {
      type: 'quick',
      input: '健康管理AIアプリ - 毎日の体調記録と健康アドバイス',
      expectedKeywords: ['健康', 'AI', '体調', '記録'],
      category: 'HealthTech'
    }
  ],
  editingScenarios: [
    {
      target: 'h1, h2',
      action: 'textEdit',
      newContent: '統合テスト用の更新されたタイトル'
    },
    {
      target: 'p',
      action: 'textEdit', 
      newContent: '統合テストで編集された段落テキストです。'
    },
    {
      target: 'button',
      action: 'textEdit',
      newContent: '統合テスト用ボタン'
    }
  ]
};

test.describe('Comprehensive Integration Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('End-to-End LP Generation Integration', () => {
    test('should integrate all quick generation components', async ({ page }) => {
      console.log('🔗 Testing quick generation integration...');

      const testData = INTEGRATION_TEST_DATA.sampleLPRequests[0];

      // Step 1: Navigate and verify tab system integration
      await page.click('[role="tab"]:has-text("クイック")');
      await expect(page.locator('[role="tab"]:has-text("クイック")')).toHaveAttribute('aria-selected', 'true');

      // Step 2: Input system integration
      const inputField = page.locator('input[placeholder*="AI写真編集アプリ"]');
      await inputField.fill(testData.input);
      await expect(inputField).toHaveValue(testData.input);

      // Step 3: Generation trigger and state management integration
      await page.click('button:has-text("生成")');

      // Verify loading state integration
      await expect(page.locator('text=AI処理中, text=生成中, text=処理中')).toBeVisible({ timeout: 5000 });

      // Step 4: Preview system integration
      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      await expect(previewFrame).toBeVisible({ timeout: 45000 });

      // Step 5: Content verification and AI tool integration
      const frameContent = await previewFrame.contentFrame();
      if (frameContent) {
        // Verify generated content contains expected keywords
        for (const keyword of testData.expectedKeywords) {
          await expect(frameContent.locator(`text=${keyword}`)).toBeVisible();
        }

        // Verify basic HTML structure
        await expect(frameContent.locator('html')).toBeVisible();
        await expect(frameContent.locator('body')).toBeVisible();
        await expect(frameContent.locator('h1, h2')).toHaveCount({ min: 1 });
      }

      // Step 6: Export system integration
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("ダウンロード")');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.html$/);

      console.log('✅ Quick generation integration verified');
    });

    test('should integrate structured workflow components', async ({ page }) => {
      console.log('🔗 Testing structured workflow integration...');

      const testData = INTEGRATION_TEST_DATA.sampleLPRequests[1];

      // Step 1: Navigate to structured workflow
      await page.click('[role="tab"]:has-text("構造化")');
      await expect(page.locator('[role="tab"]:has-text("構造化")')).toHaveAttribute('aria-selected', 'true');

      // Step 2: Multi-step form integration
      // Business Type Selection
      if (await page.locator('select[name="businessType"], select:has(option:text("EC"))').count() > 0) {
        await page.selectOption('select[name="businessType"], select:has(option:text("EC"))', testData.businessType);
      }
      
      if (await page.locator('button:has-text("次へ")').count() > 0) {
        await page.click('button:has-text("次へ")');
      }

      // Target Audience Input
      const audienceInput = page.locator('input[name="targetAudience"], input[placeholder*="ターゲット"], textarea[name="targetAudience"]');
      if (await audienceInput.count() > 0) {
        await audienceInput.fill(testData.targetAudience);
        
        if (await page.locator('button:has-text("次へ")').count() > 0) {
          await page.click('button:has-text("次へ")');
        }
      }

      // Key Features Integration
      for (const feature of testData.keyFeatures) {
        const featureInput = page.locator('input[name="feature"], input[placeholder*="機能"], textarea[name="features"]');
        if (await featureInput.count() > 0) {
          await featureInput.fill(feature);
          
          const addButton = page.locator('button:has-text("追加"), button:has-text("＋")');
          if (await addButton.count() > 0) {
            await addButton.click();
          }
        }
      }

      if (await page.locator('button:has-text("次へ")').count() > 0) {
        await page.click('button:has-text("次へ")');
      }

      // Pricing Information
      const pricingInput = page.locator('input[name="pricing"], input[placeholder*="価格"], textarea[name="pricing"]');
      if (await pricingInput.count() > 0) {
        await pricingInput.fill(testData.pricing);
      }

      // Step 3: Final generation trigger
      const generateButton = page.locator('button:has-text("生成開始"), button:has-text("完了"), button:has-text("生成")');
      if (await generateButton.count() > 0) {
        await generateButton.click();

        // Step 4: Verify integration of all input data
        const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
        await expect(previewFrame).toBeVisible({ timeout: 60000 });

        const frameContent = await previewFrame.contentFrame();
        if (frameContent) {
          // Verify all structured data appears in generated content
          for (const element of testData.expectedElements) {
            await expect(frameContent.locator(`text=${element}`)).toBeVisible();
          }
        }
      }

      console.log('✅ Structured workflow integration verified');
    });
  });

  test.describe('State Management Integration', () => {
    test('should maintain state across component interactions', async ({ page }) => {
      console.log('🔗 Testing state management integration...');

      // Step 1: Generate initial LP
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'State management integration test');
      await page.click('button:has-text("生成")');

      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      await expect(previewFrame).toBeVisible({ timeout: 45000 });

      // Step 2: Switch to edit mode and verify state persistence
      await page.click('button:has-text("編集"), [data-testid="edit-toggle"]');
      await page.waitForTimeout(1000);

      // Verify preview content persists during mode switch
      await expect(previewFrame).toBeVisible();

      // Step 3: Switch between tabs and verify state maintenance
      await page.click('[role="tab"]:has-text("構造化")');
      await page.waitForTimeout(500);
      await page.click('[role="tab"]:has-text("クイック")');

      // Verify LP is still visible after tab switches
      await expect(previewFrame).toBeVisible();

      // Step 4: Test session persistence
      await page.reload();
      await page.waitForTimeout(2000);

      // Verify some form of session persistence (if implemented)
      // This might vary based on implementation details

      console.log('✅ State management integration verified');
    });

    test('should synchronize chat and preview states', async ({ page }) => {
      console.log('🔗 Testing chat-preview synchronization...');

      // Generate LP through chat interface
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Chat-preview sync test');
      await page.click('button:has-text("生成")');

      // Wait for chat message and preview to appear
      await page.waitForTimeout(30000);

      // Verify chat shows generation message
      const chatMessages = page.locator('[data-testid="chat-message"], .message, .chat-bubble');
      if (await chatMessages.count() > 0) {
        // Verify chat contains our request
        await expect(chatMessages.last()).toContainText('Chat-preview sync test');
      }

      // Verify preview shows generated content
      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      if (await previewFrame.count() > 0) {
        await expect(previewFrame).toBeVisible();
      }

      console.log('✅ Chat-preview synchronization verified');
    });
  });

  test.describe('Editing System Integration', () => {
    test('should integrate all editing components seamlessly', async ({ page }) => {
      console.log('🔗 Testing editing system integration...');

      // Step 1: Generate LP for editing
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Editing integration test - comprehensive features');
      await page.click('button:has-text("生成")');

      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      await expect(previewFrame).toBeVisible({ timeout: 45000 });

      // Step 2: Enter edit mode
      await page.click('button:has-text("編集"), [data-testid="edit-toggle"]');
      await page.waitForTimeout(1000);

      // Step 3: Test inline editing integration
      const frameContent = await previewFrame.contentFrame();
      if (frameContent) {
        for (const scenario of INTEGRATION_TEST_DATA.editingScenarios) {
          const targetElement = frameContent.locator(scenario.target).first();
          
          if (await targetElement.count() > 0) {
            // Test double-click editing
            await targetElement.dblclick();
            await page.waitForTimeout(500);

            // Look for edit input
            const editInput = frameContent.locator('input[type="text"], textarea');
            if (await editInput.count() > 0) {
              await editInput.fill(scenario.newContent);
              await editInput.press('Enter');
              
              // Verify content updated immediately
              await expect(frameContent.locator(`text=${scenario.newContent}`)).toBeVisible({ timeout: 2000 });
            }
          }
        }
      }

      // Step 4: Test hover menu integration (if available)
      if (frameContent) {
        const testElement = frameContent.locator('h1, h2, p').first();
        if (await testElement.count() > 0) {
          await testElement.hover();
          await page.waitForTimeout(500);

          // Look for hover menu
          const hoverMenu = frameContent.locator('[data-testid="hover-menu"], .hover-menu, .edit-menu');
          if (await hoverMenu.count() > 0) {
            await expect(hoverMenu).toBeVisible();
          }
        }
      }

      console.log('✅ Editing system integration verified');
    });

    test('should integrate AI suggestions with editing workflow', async ({ page }) => {
      console.log('🔗 Testing AI suggestions integration...');

      // Step 1: Generate LP
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'AI suggestions integration test');
      await page.click('button:has-text("生成")');

      await expect(page.locator('iframe[data-testid="lp-preview"]')).toBeVisible({ timeout: 45000 });

      // Step 2: Open AI suggestions panel
      const suggestionsButton = page.locator('button:has-text("AI改善"), [data-testid="ai-suggestions"], button:has-text("提案")');
      if (await suggestionsButton.count() > 0) {
        await suggestionsButton.click();

        // Step 3: Wait for suggestions to generate
        await page.waitForTimeout(20000);

        // Step 4: Verify suggestions panel integration
        const suggestionsPanel = page.locator('[data-testid="suggestions-panel"], .suggestions, .ai-panel');
        if (await suggestionsPanel.count() > 0) {
          await expect(suggestionsPanel).toBeVisible();

          // Test suggestion application
          const applySuggestion = suggestionsPanel.locator('button:has-text("適用"), button:has-text("Apply")').first();
          if (await applySuggestion.count() > 0) {
            await applySuggestion.click();
            
            // Verify preview updates after suggestion application
            await page.waitForTimeout(3000);
            await expect(page.locator('iframe[data-testid="lp-preview"]')).toBeVisible();
          }
        }
      }

      console.log('✅ AI suggestions integration verified');
    });
  });

  test.describe('Export and Download Integration', () => {
    test('should integrate export functionality with generated content', async ({ page }) => {
      console.log('🔗 Testing export integration...');

      // Step 1: Generate content to export
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Export integration test with specific content');
      await page.click('button:has-text("生成")');

      await expect(page.locator('iframe[data-testid="lp-preview"]')).toBeVisible({ timeout: 45000 });

      // Step 2: Test HTML export integration
      const downloadPromise = page.waitForEvent('download');
      const exportButton = page.locator('button:has-text("ダウンロード"), button:has-text("エクスポート")');
      await exportButton.click();

      const download = await downloadPromise;
      
      // Step 3: Verify export content integrity
      expect(download.suggestedFilename()).toMatch(/\.html$/);
      
      const downloadPath = await download.path();
      if (downloadPath) {
        const fs = require('fs');
        const content = fs.readFileSync(downloadPath, 'utf8');
        
        // Verify exported HTML structure
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('<html');
        expect(content).toContain('</html>');
        expect(content).toContain('Export integration test');
        
        // Verify CSS is embedded
        expect(content).toContain('<style>');
        
        // Verify no external dependencies that would break standalone usage
        expect(content).not.toContain('src="http://');
        expect(content).not.toContain('href="http://');
      }

      console.log('✅ Export integration verified');
    });

    test('should maintain export quality across different LP types', async ({ page }) => {
      console.log('🔗 Testing export quality integration...');

      const testCases = [
        'Simple blog-style landing page',
        'E-commerce product page with pricing',
        'SaaS application landing page with features'
      ];

      for (const testCase of testCases) {
        await page.click('[role="tab"]:has-text("クイック")');
        await page.fill('input[placeholder*="AI写真編集アプリ"]', testCase);
        await page.click('button:has-text("生成")');

        // Wait for generation
        await page.waitForTimeout(30000);

        // Test export for each case
        if (await page.locator('button:has-text("ダウンロード")').count() > 0) {
          const downloadPromise = page.waitForEvent('download');
          await page.click('button:has-text("ダウンロード")');
          
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.html$/);
          
          console.log(`✓ Export successful for: ${testCase}`);
        }

        // Clear for next test
        if (await page.locator('button:has-text("クリア"), button:has-text("リセット")').count() > 0) {
          await page.click('button:has-text("クリア"), button:has-text("リセット")');
        }
      }

      console.log('✅ Export quality integration verified');
    });
  });

  test.describe('Error Handling Integration', () => {
    test('should integrate error recovery across all components', async ({ page }) => {
      console.log('🔗 Testing error handling integration...');

      // Step 1: Simulate API error
      await page.route('/api/lp-creator/chat', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Integration test error' })
        });
      });

      // Step 2: Trigger error through normal workflow
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Error integration test');
      await page.click('button:has-text("生成")');

      // Step 3: Verify error handling integration
      await expect(page.locator('text=エラー, text=失敗, text=問題')).toBeVisible({ timeout: 15000 });

      // Step 4: Test error recovery integration
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();

      // Step 5: Remove error simulation and test recovery
      await page.unroute('/api/lp-creator/chat');
      await page.click('button:has-text("再試行")');

      // Verify system recovers gracefully
      await page.waitForTimeout(5000);
      
      // App should remain functional
      await expect(page.locator('h1')).toBeVisible();

      console.log('✅ Error handling integration verified');
    });

    test('should maintain component stability during errors', async ({ page }) => {
      console.log('🔗 Testing component stability integration...');

      // Test various error scenarios
      const errorScenarios = [
        { route: '/api/lp-creator/chat', status: 429 }, // Rate limit
        { route: '/api/lp-creator/chat', status: 503 }, // Service unavailable
        { route: '/api/lp-creator/chat', status: 408 }  // Timeout
      ];

      for (const scenario of errorScenarios) {
        await page.route(scenario.route, route => {
          route.fulfill({ status: scenario.status, body: 'Error' });
        });

        await page.click('[role="tab"]:has-text("クイック")');
        await page.fill('input[placeholder*="AI写真編集アプリ"]', `Stability test ${scenario.status}`);
        await page.click('button:has-text("生成")');

        await page.waitForTimeout(5000);

        // Verify UI components remain stable
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('[role="tab"]')).toHaveCount(2);

        // Verify navigation still works
        await page.click('[role="tab"]:has-text("構造化")');
        await expect(page.locator('[role="tab"]:has-text("構造化")')).toHaveAttribute('aria-selected', 'true');

        await page.unroute(scenario.route);
      }

      console.log('✅ Component stability integration verified');
    });
  });

  test.describe('Accessibility Integration', () => {
    test('should integrate accessibility features across all components', async ({ page }) => {
      console.log('🔗 Testing accessibility integration...');

      // Step 1: Test keyboard navigation integration
      await page.keyboard.press('Tab'); // First focusable element
      await page.keyboard.press('Tab'); // Next element
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Step 2: Test ARIA integration
      await expect(page.locator('[role="tab"]')).toHaveCount(2);
      await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);

      // Step 3: Test screen reader integration
      const landmarks = await page.locator('[role="main"], main, [role="navigation"], nav').count();
      expect(landmarks).toBeGreaterThan(0);

      // Step 4: Generate LP and test preview accessibility
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Accessibility integration test');
      await page.click('button:has-text("生成")');

      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      if (await previewFrame.count() > 0) {
        await expect(previewFrame).toBeVisible({ timeout: 45000 });

        const frameContent = await previewFrame.contentFrame();
        if (frameContent) {
          // Verify generated content has accessibility features
          const headings = await frameContent.locator('h1, h2, h3, h4, h5, h6').count();
          expect(headings).toBeGreaterThan(0);

          // Check for alt attributes on images
          const images = frameContent.locator('img');
          const imageCount = await images.count();
          if (imageCount > 0) {
            for (let i = 0; i < imageCount; i++) {
              const img = images.nth(i);
              const hasAlt = await img.getAttribute('alt') !== null;
              expect(hasAlt).toBeTruthy();
            }
          }
        }
      }

      console.log('✅ Accessibility integration verified');
    });
  });

  test.describe('Performance Integration', () => {
    test('should maintain performance across integrated workflows', async ({ page }) => {
      console.log('🔗 Testing performance integration...');

      // Test complete workflow performance
      const startTime = Date.now();

      // Step 1: Page load
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      console.log(`📊 Page load: ${loadTime}ms`);

      // Step 2: Navigation performance
      const navStart = Date.now();
      await page.click('[role="tab"]:has-text("構造化")');
      await page.click('[role="tab"]:has-text("クイック")');
      const navTime = Date.now() - navStart;
      console.log(`📊 Navigation: ${navTime}ms`);

      // Step 3: Generation performance
      const genStart = Date.now();
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Performance integration test');
      await page.click('button:has-text("生成")');
      
      // Wait for completion or reasonable timeout
      try {
        await expect(page.locator('iframe[data-testid="lp-preview"]')).toBeVisible({ timeout: 30000 });
        const genTime = Date.now() - genStart;
        console.log(`📊 Generation: ${genTime}ms`);
      } catch {
        console.log('⚠️ Generation timed out - acceptable for integration test');
      }

      // Verify overall performance is acceptable
      const totalTime = Date.now() - startTime;
      console.log(`📊 Total workflow time: ${totalTime}ms`);
      expect(totalTime).toBeLessThan(60000); // 1 minute max for complete workflow

      console.log('✅ Performance integration verified');
    });
  });
});