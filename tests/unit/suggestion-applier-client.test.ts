/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { SuggestionApplierClient } from '../../src/utils/suggestion-applier-client';
import type { AISuggestion } from '../../src/types/lp-generator';

describe('SuggestionApplierClient', () => {
  let sampleHtml: string;
  let sampleCss: string;

  beforeEach(() => {
    sampleHtml = `
      <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>
          <div class="container">
            <h2>About Us</h2>
            <p>This is a test page</p>
            <img src="test.jpg">
            <button>Click here</button>
          </div>
        </body>
      </html>
    `;

    sampleCss = `
      .container {
        padding: 20px;
        margin: 0 auto;
      }
    `;
  });

  describe('applySuggestionToContent', () => {
    it('H1タグ追加提案を正しく適用できる', () => {
      const suggestion: AISuggestion = {
        id: 'test-h1',
        type: 'content',
        category: 'marketing',
        title: 'H1タグを追加',
        description: 'メインタイトルを追加します',
        impact: 'high',
        confidence: 0.9,
        priority: 90,
        action: {
          type: 'add',
          target: 'h1',
          value: 'メインタイトル追加'
        },
        reasoning: 'SEO向上のため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, suggestion);

      expect(result.htmlContent).toContain('<h1');
      expect(result.htmlContent).toContain('メインタイトル');
      expect(result.cssContent).toBe(sampleCss); // CSSは変更されない
    });

    it('meta description追加提案を正しく適用できる', () => {
      const suggestion: AISuggestion = {
        id: 'test-meta',
        type: 'seo',
        category: 'technical',
        title: 'meta descriptionを追加',
        description: 'SEO向上のためmeta descriptionを追加',
        impact: 'high',
        confidence: 0.9,
        priority: 80,
        action: {
          type: 'add',
          target: 'meta',
          value: 'description追加'
        },
        reasoning: 'SEO効果を高めるため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, suggestion);

      expect(result.htmlContent).toContain('meta name="description"');
      expect(result.htmlContent).toContain('ページの説明を入力してください');
    });

    it('CTA追加提案を正しく適用できる', () => {
      const suggestion: AISuggestion = {
        id: 'test-cta',
        type: 'conversion',
        category: 'marketing',
        title: 'CTAセクションを追加',
        description: 'コンバージョン向上のためCTAを追加',
        impact: 'high',
        confidence: 0.85,
        priority: 88,
        action: {
          type: 'add',
          target: 'section',
          value: 'CTA追加'
        },
        reasoning: 'コンバージョン率向上のため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, suggestion);

      expect(result.htmlContent).toContain('今すぐ申し込む');
      expect(result.htmlContent).toContain('bg-blue-500');
    });

    it('画像alt属性追加提案を正しく適用できる', () => {
      const suggestion: AISuggestion = {
        id: 'test-alt',
        type: 'seo',
        category: 'compliance',
        title: '画像にalt属性を追加',
        description: 'アクセシビリティ向上のため',
        impact: 'medium',
        confidence: 0.95,
        priority: 75,
        action: {
          type: 'modify',
          target: 'img',
          value: 'alt属性追加'
        },
        reasoning: 'アクセシビリティとSEO向上のため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, suggestion);

      expect(result.htmlContent).toContain('alt="画像1の説明"');
    });

    it('ボタンテキスト強化提案を正しく適用できる', () => {
      const suggestion: AISuggestion = {
        id: 'test-button',
        type: 'conversion',
        category: 'marketing',
        title: 'CTAテキストを強化',
        description: 'より効果的なCTAテキストに変更',
        impact: 'medium',
        confidence: 0.8,
        priority: 70,
        action: {
          type: 'modify',
          target: 'button',
          value: 'CTA強化'
        },
        reasoning: 'クリック率向上のため'
      };

      const originalHtml = sampleHtml.replace('Click here', '申し込み');
      const result = SuggestionApplierClient.applySuggestionToContent(originalHtml, sampleCss, suggestion);

      expect(result.htmlContent).toContain('今すぐ申し込む');
    });

    it('CSSシャドウ追加提案を正しく適用できる', () => {
      const suggestion: AISuggestion = {
        id: 'test-shadow',
        type: 'design',
        category: 'ux',
        title: 'シャドウ効果を追加',
        description: '要素に奥行きを与える',
        impact: 'medium',
        confidence: 0.75,
        priority: 60,
        action: {
          type: 'add',
          target: 'css',
          value: 'シャドウ効果追加'
        },
        reasoning: 'モダンなデザインのため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, suggestion);

      expect(result.cssContent).toContain('box-shadow');
      expect(result.cssContent).toContain('rgba(0, 0, 0, 0.1)');
    });

    it('レスポンシブデザイン追加提案を正しく適用できる', () => {
      const suggestion: AISuggestion = {
        id: 'test-responsive',
        type: 'design',
        category: 'technical',
        title: 'レスポンシブデザインを追加',
        description: 'モバイル対応を追加',
        impact: 'high',
        confidence: 0.9,
        priority: 85,
        action: {
          type: 'add',
          target: 'css',
          value: 'メディアクエリ追加'
        },
        reasoning: 'モバイルユーザビリティ向上のため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, suggestion);

      expect(result.cssContent).toContain('@media');
      expect(result.cssContent).toContain('max-width: 768px');
    });

    it('ARIAラベル追加提案を正しく適用できる', () => {
      const suggestion: AISuggestion = {
        id: 'test-aria',
        type: 'accessibility',
        category: 'compliance',
        title: 'ARIAラベルを追加',
        description: 'アクセシビリティ向上',
        impact: 'medium',
        confidence: 0.9,
        priority: 65,
        action: {
          type: 'modify',
          target: 'interactive',
          value: 'ARIAラベル追加'
        },
        reasoning: 'スクリーンリーダー対応のため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, suggestion);

      expect(result.htmlContent).toContain('aria-label');
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なアクションタイプに対してエラーを投げない', () => {
      const invalidSuggestion: AISuggestion = {
        id: 'test-invalid',
        type: 'content',
        category: 'marketing',
        title: 'Invalid Action',
        description: 'Test invalid action',
        impact: 'low',
        confidence: 0.5,
        priority: 10,
        action: {
          type: 'invalid' as any,
          target: 'unknown',
          value: 'test'
        },
        reasoning: 'Test'
      };

      expect(() => {
        SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, invalidSuggestion);
      }).not.toThrow();
    });

    it('空のHTMLに対しても正常に動作する', () => {
      const suggestion: AISuggestion = {
        id: 'test-empty',
        type: 'content',
        category: 'marketing',
        title: 'Test on empty HTML',
        description: 'Test',
        impact: 'low',
        confidence: 0.5,
        priority: 10,
        action: {
          type: 'add',
          target: 'h1',
          value: 'test'
        },
        reasoning: 'Test'
      };

      expect(() => {
        SuggestionApplierClient.applySuggestionToContent('', '', suggestion);
      }).not.toThrow();
    });
  });

  describe('重複適用の防止', () => {
    it('既にH1タグがある場合、追加のH1を作成しない', () => {
      const htmlWithH1 = sampleHtml.replace('<h2>About Us</h2>', '<h1>Main Title</h1><h2>About Us</h2>');
      
      const suggestion: AISuggestion = {
        id: 'test-h1-duplicate',
        type: 'content',
        category: 'marketing',
        title: 'H1タグを追加',
        description: 'メインタイトルを追加',
        impact: 'high',
        confidence: 0.9,
        priority: 90,
        action: {
          type: 'add',
          target: 'h1',
          value: 'メインタイトル追加'
        },
        reasoning: 'SEO向上のため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(htmlWithH1, sampleCss, suggestion);
      
      // H1タグの数が1つのままであることを確認
      const h1Count = (result.htmlContent.match(/<h1/g) || []).length;
      expect(h1Count).toBe(1);
    });

    it('既にmeta descriptionがある場合、追加しない', () => {
      const htmlWithMeta = sampleHtml.replace(
        '<title>Test Page</title>',
        '<title>Test Page</title>\n<meta name="description" content="Existing description">'
      );
      
      const suggestion: AISuggestion = {
        id: 'test-meta-duplicate',
        type: 'seo',
        category: 'technical',
        title: 'meta descriptionを追加',
        description: 'SEO向上のため',
        impact: 'high',
        confidence: 0.9,
        priority: 80,
        action: {
          type: 'add',
          target: 'meta',
          value: 'description追加'
        },
        reasoning: 'SEO効果を高めるため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(htmlWithMeta, sampleCss, suggestion);
      
      // meta descriptionが既存のもののままであることを確認
      expect(result.htmlContent).toContain('Existing description');
      expect(result.htmlContent).not.toContain('ページの説明を入力してください');
    });
  });

  describe('コンテンツの整合性', () => {
    it('適用後のHTMLが有効な構造を保持している', () => {
      const suggestion: AISuggestion = {
        id: 'test-structure',
        type: 'content',
        category: 'marketing',
        title: 'H1タグを追加',
        description: 'メインタイトルを追加',
        impact: 'high',
        confidence: 0.9,
        priority: 90,
        action: {
          type: 'add',
          target: 'h1',
          value: 'メインタイトル追加'
        },
        reasoning: 'SEO向上のため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, suggestion);

      // 基本的な HTML 構造が保持されていることを確認
      expect(result.htmlContent).toContain('<html');
      expect(result.htmlContent).toContain('<head');
      expect(result.htmlContent).toContain('<body');
      expect(result.htmlContent).toContain('</html>');
    });

    it('元のコンテンツが保持されている', () => {
      const suggestion: AISuggestion = {
        id: 'test-preserve',
        type: 'design',
        category: 'ux',
        title: 'シャドウ効果を追加',
        description: '要素に奥行きを与える',
        impact: 'medium',
        confidence: 0.75,
        priority: 60,
        action: {
          type: 'add',
          target: 'css',
          value: 'シャドウ効果追加'
        },
        reasoning: 'モダンなデザインのため'
      };

      const result = SuggestionApplierClient.applySuggestionToContent(sampleHtml, sampleCss, suggestion);

      // 元のHTMLコンテンツが保持されていることを確認
      expect(result.htmlContent).toContain('About Us');
      expect(result.htmlContent).toContain('This is a test page');
      expect(result.htmlContent).toContain('Click here');
      
      // 元のCSSが保持されていることを確認
      expect(result.cssContent).toContain('.container');
      expect(result.cssContent).toContain('padding: 20px');
    });
  });
});