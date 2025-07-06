import { test, expect } from '@playwright/test';

test.describe('Intelligent LP Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('should display initial view correctly', async ({ page }) => {
    // 初期画面のチェック
    await expect(page.locator('h1')).toContainText('今日は何をデザインしますか？');
    await expect(page.locator('input[placeholder*="AI写真編集アプリ"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle natural language input for LP generation', async ({ page }) => {
    // 自然言語入力のテスト
    const input = 'AI画像生成ツールのサービスを個人クリエイター向けに販売したい。月額制で、他社より高品質な画像が生成できることが強み';
    
    await page.fill('input', input);
    await page.click('button[type="submit"]');
    
    // ローディング状態の確認
    await expect(page.locator('text=AIが作成中です')).toBeVisible({ timeout: 10000 });
    
    // 生成完了まで待機（最大30秒）
    await expect(page.locator('text=プレビュー')).toBeVisible({ timeout: 30000 });
    
    // プレビューエリアにコンテンツが表示されることを確認
    const previewFrame = page.locator('iframe').first();
    await expect(previewFrame).toBeVisible();
  });

  test('should show variant selector when multiple variants are generated', async ({ page }) => {
    // intelligentLPGeneratorToolが呼ばれる場合のテスト
    const input = 'SaaSツールのランディングページを作成したい。スタートアップ向けで、生産性向上が強み';
    
    await page.fill('input', input);
    await page.click('button[type="submit"]');
    
    // バリエーションボタンが表示されるまで待機
    await expect(page.locator('button:has-text("バリエーション")')).toBeVisible({ timeout: 30000 });
    
    // バリエーションボタンをクリック
    await page.click('button:has-text("バリエーション")');
    
    // バリエーションセレクターが表示されることを確認
    await expect(page.locator('text=デザインバリエーション')).toBeVisible();
    await expect(page.locator('text=バリエーションから最適なデザインを選択')).toBeVisible();
  });

  test('should display AI suggestions panel', async ({ page }) => {
    // まずLPを生成
    const input = 'eコマースサイトのランディングページ';
    await page.fill('input', input);
    await page.click('button[type="submit"]');
    
    // プレビューが表示されるまで待機
    await expect(page.locator('text=プレビュー')).toBeVisible({ timeout: 30000 });
    
    // AI改善提案ボタンをクリック
    await page.click('button:has-text("AI改善提案")');
    
    // AI提案パネルが表示されることを確認
    await expect(page.locator('text=AI改善提案')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('**/api/lp-creator/chat', route => {
      route.abort();
    });
    
    const input = 'テストLP';
    await page.fill('input', input);
    await page.click('button[type="submit"]');
    
    // より具体的なエラーメッセージをテスト
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    const errorText = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorText).toContain('接続エラー');
  });

  test('should maintain responsive design', async ({ page }) => {
    // モバイル表示のテスト
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input')).toBeVisible();
    
    // タブレット表示のテスト
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input')).toBeVisible();
  });

  test('should export HTML functionality', async ({ page }) => {
    // LP生成
    const input = 'シンプルなランディングページ';
    await page.fill('input', input);
    await page.click('button[type="submit"]');
    
    // プレビューが表示されるまで待機
    await expect(page.locator('text=プレビュー')).toBeVisible({ timeout: 30000 });
    
    // ダウンロードボタンの存在確認
    await expect(page.locator('button:has-text("HTMLダウンロード")')).toBeVisible();
    
    // ダウンロード機能のテスト（実際のダウンロードは環境依存のため、ボタンクリックのみ）
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("HTMLダウンロード")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.html$/);
  });
});

test.describe('Component Integration Tests', () => {
  test('VariantSelector component functionality', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // variants データをモック
    await page.evaluate(() => {
      const mockVariants = [
        {
          id: 'variant_1',
          title: 'Test Variant 1',
          htmlContent: '<div>Test Content 1</div>',
          cssContent: 'body { color: red; }',
          designFocus: 'modern-clean'
        },
        {
          id: 'variant_2', 
          title: 'Test Variant 2',
          htmlContent: '<div>Test Content 2</div>',
          cssContent: 'body { color: blue; }',
          designFocus: 'conversion-optimized'
        }
      ];
      
      // グローバル変数としてモックデータを設定
      (window as any).testVariants = mockVariants;
    });
    
    // VariantSelectorがレンダリングされた場合の動作テスト
    // 実際の統合では、LP生成後に自動的に表示される
  });

  test('AISuggestionPanel component functionality', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // AI提案データをモック
    await page.evaluate(() => {
      const mockSuggestions = [
        {
          id: 'suggestion_1',
          type: 'accessibility',
          title: '画像にalt属性を追加',
          description: 'アクセシビリティ向上のため画像にalt属性を追加',
          impact: 'medium',
          confidence: 0.9
        }
      ];
      
      (window as any).testSuggestions = mockSuggestions;
    });
  });
});