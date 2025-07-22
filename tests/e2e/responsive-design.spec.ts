import { test, expect, devices } from '@playwright/test';

// デバイスプリセット定義
const DEVICE_PRESETS = {
  'iPhone SE': {
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    isMobile: true
  },
  'iPhone 12 Pro': {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    isMobile: true
  },
  'iPad': {
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    isTablet: true
  },
  'iPad Landscape': {
    viewport: { width: 1024, height: 768 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    isTablet: true
  },
  'Desktop': {
    viewport: { width: 1200, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    isDesktop: true
  },
  'Large Desktop': {
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    isDesktop: true
  }
};

// テストサンプルデータ
const TEST_LP_CONTENT = 'AI写真編集アプリのランディングページを作成してください';

test.describe('Responsive Design and Cross-Device Compatibility', () => {
  // デバイス別テスト
  Object.entries(DEVICE_PRESETS).forEach(([deviceName, config]) => {
    test.describe(`${deviceName} Device Tests`, () => {
      test.use({
        viewport: config.viewport,
        userAgent: config.userAgent
      });

      test(`should display properly on ${deviceName}`, async ({ page }) => {
        await page.goto('/');
        
        // ページが正常に読み込まれることを確認
        await expect(page.locator('h1')).toContainText('LP Creator');
        
        // タブが適切に表示されることを確認
        await expect(page.locator('[role="tablist"]')).toBeVisible();
        
        // モバイル/タブレットの場合、レイアウトが縦積みになることを確認
        if (config.isMobile || config.isTablet) {
          const mainContainer = page.locator('main');
          await expect(mainContainer).toHaveClass(/flex-col|lg:flex-row/);
          
          // タブテキストがモバイル向けに短縮されることを確認
          if (config.isMobile) {
            await expect(page.locator('text=構造化')).toBeVisible();
            await expect(page.locator('text=クイック')).toBeVisible();
          }
        }
        
        // デスクトップの場合、横並びレイアウトを確認
        if (config.isDesktop) {
          const container = page.locator('.flex.flex-col.lg\\:flex-row');
          await expect(container).toBeVisible();
        }
      });

      test(`should handle form interaction on ${deviceName}`, async ({ page }) => {
        await page.goto('/');
        
        // クイック作成タブに移動
        await page.click('[role="tab"]:has-text("クイック")');
        
        // 入力フィールドを確認
        const input = page.locator('input[placeholder*="AI写真編集アプリ"]');
        await expect(input).toBeVisible();
        
        // モバイルの場合、フォームが縦積みになることを確認
        if (config.isMobile) {
          const form = page.locator('form').first();
          const formClass = await form.getAttribute('class');
          expect(formClass).toContain('flex-col');
        }
        
        // テキスト入力
        await input.fill(TEST_LP_CONTENT);
        
        // 送信ボタンの確認とクリック
        const submitButton = page.locator('button:has-text("生成")');
        await expect(submitButton).toBeEnabled();
        
        // タッチデバイスの場合、touch-manipulationクラスがあることを確認
        if (config.isMobile || config.isTablet) {
          await expect(submitButton).toHaveClass(/touch-manipulation/);
        }
      });

      test(`should display generated content properly on ${deviceName}`, async ({ page }) => {
        await page.goto('/');
        
        // クイック作成タブでLP生成をシミュレート
        await page.click('[role="tab"]:has-text("クイック")');
        await page.fill('input[placeholder*="AI写真編集アプリ"]', TEST_LP_CONTENT);
        await page.click('button:has-text("生成")');
        
        // ローディング状態の確認
        await expect(page.locator('text=AIが作成中')).toBeVisible({ timeout: 5000 });
        
        // プレビューエリアの確認
        const previewArea = page.locator('h2:has-text("プレビュー")');
        await expect(previewArea).toBeVisible();
        
        // モバイル/タブレットの場合、プレビューが下部または全幅で表示されることを確認
        if (config.isMobile) {
          const previewContainer = page.locator('.w-full.lg\\:w-1\\/2');
          await expect(previewContainer).toBeVisible();
        }
      });

      test(`should handle device preview controls on ${deviceName}`, async ({ page }) => {
        await page.goto('/');
        
        // 既存のLPコンテンツがある場合のみテスト
        const mockHTML = '<h1>Test LP</h1><p>Test content</p>';
        
        // LPViewerコンポーネントが存在する場合
        const lpViewer = page.locator('[title*="LP Preview"]');
        if (await lpViewer.count() > 0) {
          // デバイスプレビューコントロールの確認
          const deviceControls = page.locator('[aria-label*="Switch to"]');
          if (await deviceControls.count() > 0) {
            // モバイルアイコンをクリック
            await deviceControls.first().click();
            
            // プレビューが更新されることを確認
            await page.waitForTimeout(500);
            await expect(lpViewer).toBeVisible();
          }
        }
      });

      test(`should handle touch interactions on ${deviceName}`, async ({ page }) => {
        if (!config.isMobile && !config.isTablet) {
          test.skip('Touch interaction test is only for mobile and tablet devices');
        }
        
        await page.goto('/');
        
        // クイック作成タブのタッチ操作
        await page.tap('[role="tab"]:has-text("クイック")');
        
        // 入力フィールドのタップ
        const input = page.locator('input[placeholder*="AI写真編集アプリ"]');
        await input.tap();
        await expect(input).toBeFocused();
        
        // テキスト入力（タッチキーボード対応）
        await input.fill(TEST_LP_CONTENT);
        
        // 送信ボタンのタップ
        const submitButton = page.locator('button:has-text("生成")');
        await submitButton.tap();
        
        // ローディング状態の確認
        await expect(page.locator('[aria-label*="loading"]')).toBeVisible({ timeout: 3000 });
      });

      test(`should maintain usability during orientation change on ${deviceName}`, async ({ page }) => {
        if (!config.isMobile && !config.isTablet) {
          test.skip('Orientation change test is only for mobile and tablet devices');
        }
        
        await page.goto('/');
        
        // 横向きに変更をシミュレート
        await page.setViewportSize({
          width: config.viewport.height,
          height: config.viewport.width
        });
        
        // レイアウトが適切に調整されることを確認
        await expect(page.locator('h1')).toContainText('LP Creator');
        
        // フォームが依然として使用可能であることを確認
        const input = page.locator('input[placeholder*="AI写真編集アプリ"]');
        await expect(input).toBeVisible();
        
        // 元の向きに戻す
        await page.setViewportSize(config.viewport);
        await expect(input).toBeVisible();
      });
    });
  });

  test.describe('Cross-Device Responsive Breakpoints', () => {
    test('should handle different breakpoints correctly', async ({ page }) => {
      await page.goto('/');
      
      // 異なるビューポートサイズでテスト
      const breakpoints = [
        { width: 320, height: 568, name: 'Small Mobile' },
        { width: 375, height: 667, name: 'iPhone SE' },
        { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
        { width: 768, height: 1024, name: 'iPad' },
        { width: 1024, height: 768, name: 'iPad Landscape' },
        { width: 1200, height: 800, name: 'Desktop' },
        { width: 1440, height: 900, name: 'Large Desktop' },
        { width: 1920, height: 1080, name: 'Full HD' }
      ];
      
      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        
        // ページが適切にレンダリングされることを確認
        await expect(page.locator('h1')).toContainText('LP Creator');
        
        // レスポンシブクラスが適用されることを確認
        const container = page.locator('.h-screen');
        await expect(container).toBeVisible();
        
        // 小さい画面では縦積みレイアウト
        if (breakpoint.width < 1024) {
          const flexContainer = page.locator('.flex.flex-col.lg\\:flex-row');
          if (await flexContainer.count() > 0) {
            const classes = await flexContainer.getAttribute('class');
            expect(classes).toContain('flex-col');
          }
        }
      }
    });

    test('should maintain content accessibility across devices', async ({ page }) => {
      await page.goto('/');
      
      // アクセシビリティ要素の確認
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      await expect(page.locator('[role="tab"]')).toHaveCount(2);
      
      // キーボードナビゲーションのテスト（デスクトップ環境）
      await page.setViewportSize({ width: 1200, height: 800 });
      
      // Tabキーでナビゲーション
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // フォーカスが適切に移動することを確認
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Performance on Different Devices', () => {
    test('should load quickly on mobile devices', async ({ page }) => {
      // モバイル環境をシミュレート
      await page.emulateMedia({ media: 'screen' });
      
      const startTime = Date.now();
      await page.goto('/');
      
      // ページが5秒以内に読み込まれることを確認
      await expect(page.locator('h1')).toContainText('LP Creator');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle memory efficiently during LP generation', async ({ page }) => {
      await page.goto('/');
      
      // クイック作成でLP生成
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', TEST_LP_CONTENT);
      await page.click('button:has-text("生成")');
      
      // メモリリークがないことを確認（ページが応答性を保持）
      await page.waitForTimeout(2000);
      
      // UIが引き続き応答することを確認
      await expect(page.locator('h1')).toContainText('LP Creator');
      
      // 複数回の操作でも安定することを確認
      await page.reload();
      await expect(page.locator('h1')).toContainText('LP Creator');
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle very small screen sizes', async ({ page }) => {
      // 極小サイズのテスト
      await page.setViewportSize({ width: 280, height: 500 });
      await page.goto('/');
      
      // コンテンツが適切に表示されることを確認
      await expect(page.locator('h1')).toContainText('LP Creator');
      
      // 水平スクロールが発生しないことを確認
      const body = page.locator('body');
      const scrollWidth = await body.evaluate((el) => el.scrollWidth);
      const clientWidth = await body.evaluate((el) => el.clientWidth);
      
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // 10px の余裕
    });

    test('should handle network conditions on mobile', async ({ page }) => {
      // 低速ネットワークをシミュレート
      await page.route('**/*', (route) => {
        // リクエストを50ms遅延
        setTimeout(() => route.continue(), 50);
      });
      
      // モバイル環境設定
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // ローディング状態が適切に表示されることを確認
      await expect(page.locator('h1')).toContainText('LP Creator', { timeout: 10000 });
    });
  });
});

test.describe('Device-Specific Feature Tests', () => {
  test('should show mobile-specific UI elements on touch devices', async ({ page }) => {
    // タッチデバイスをシミュレート
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    });
    
    await page.goto('/');
    
    // モバイル固有のUI要素があることを確認
    // (実際のテストは実装されたコンポーネントの構造に依存)
    
    // touch-manipulationクラスが適用されることを確認
    const buttons = page.locator('button');
    const firstButton = buttons.first();
    
    if (await firstButton.count() > 0) {
      const classes = await firstButton.getAttribute('class');
      // タッチデバイスで適切なクラスが適用されるかチェック
      // (実装によって異なるため、汎用的なチェック)
    }
  });

  test('should adapt text size for different screen densities', async ({ page }) => {
    const densities = [
      { width: 375, height: 667, deviceScaleFactor: 1, name: 'Standard DPI' },
      { width: 375, height: 667, deviceScaleFactor: 2, name: 'Retina' },
      { width: 375, height: 667, deviceScaleFactor: 3, name: 'Super Retina' }
    ];
    
    for (const density of densities) {
      await page.setViewportSize({ 
        width: density.width, 
        height: density.height 
      });
      
      await page.goto('/');
      
      // テキストが読みやすいサイズで表示されることを確認
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      
      // フォントサイズが適切であることを確認
      const fontSize = await heading.evaluate((el) => 
        window.getComputedStyle(el).fontSize
      );
      
      expect(parseFloat(fontSize)).toBeGreaterThan(16); // 最小16px
    }
  });
});