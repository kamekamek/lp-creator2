import { describe, it, expect, beforeEach } from '@jest/globals';
import { AISuggestionGenerator } from '../../src/utils/ai-suggestion-generator';
import type { BusinessContext } from '../../src/types/lp-generator';

// jsdomのセットアップが必要なため、Nodeエンバイロンメントをテスト
describe('AISuggestionGenerator', () => {
  let sampleHtml: string;
  let sampleCss: string;
  let businessContext: BusinessContext;

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
      
      h2 {
        color: #333;
      }
    `;

    businessContext = {
      industry: 'saas',
      targetAudience: '中小企業',
      businessGoal: 'リード獲得',
      competitiveAdvantage: ['高速', '使いやすい'],
      tone: 'professional'
    };
  });

  describe('analyzeContent', () => {
    it('HTML/CSSコンテンツを正しく分析できる', () => {
      const analysis = AISuggestionGenerator.analyzeContent(sampleHtml, sampleCss);

      expect(analysis).toBeDefined();
      expect(analysis.overallScore).toBeLessThan(100); // 改善点があるため100未満
      expect(analysis.contentScore).toBeGreaterThan(0);
      expect(analysis.designScore).toBeGreaterThan(0);
      expect(analysis.structureScore).toBeGreaterThan(0);
      expect(analysis.seoScore).toBeGreaterThan(0);
      expect(analysis.performanceScore).toBeGreaterThan(0);
      expect(analysis.issues).toBeInstanceOf(Array);
      expect(analysis.opportunities).toBeInstanceOf(Array);
    });

    it('スコアが0-100の範囲内である', () => {
      const analysis = AISuggestionGenerator.analyzeContent(sampleHtml, sampleCss);

      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
      expect(analysis.contentScore).toBeGreaterThanOrEqual(0);
      expect(analysis.contentScore).toBeLessThanOrEqual(100);
      expect(analysis.designScore).toBeGreaterThanOrEqual(0);
      expect(analysis.designScore).toBeLessThanOrEqual(100);
    });
  });

  describe('generateSuggestions', () => {
    it('基本的な改善提案を生成できる', () => {
      const suggestions = AISuggestionGenerator.generateSuggestions(sampleHtml, sampleCss);

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // 各提案の必須フィールドをチェック
      suggestions.forEach(suggestion => {
        expect(suggestion.id).toBeDefined();
        expect(suggestion.type).toBeDefined();
        expect(suggestion.category).toBeDefined();
        expect(suggestion.title).toBeDefined();
        expect(suggestion.description).toBeDefined();
        expect(suggestion.impact).toMatch(/^(low|medium|high)$/);
        expect(suggestion.confidence).toBeGreaterThan(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
        expect(suggestion.priority).toBeGreaterThan(0);
        expect(suggestion.action).toBeDefined();
        expect(suggestion.reasoning).toBeDefined();
      });
    });

    it('H1タグがない場合、H1追加の提案を生成する', () => {
      const suggestions = AISuggestionGenerator.generateSuggestions(sampleHtml, sampleCss);
      
      const h1Suggestion = suggestions.find(s => s.title.includes('H1') || s.title.includes('メインタイトル'));
      expect(h1Suggestion).toBeDefined();
      expect(h1Suggestion?.type).toBe('content');
      expect(h1Suggestion?.impact).toBe('high');
    });

    it('alt属性がない画像に対してアクセシビリティ提案を生成する', () => {
      const suggestions = AISuggestionGenerator.generateSuggestions(sampleHtml, sampleCss);
      
      const altSuggestion = suggestions.find(s => s.title.includes('alt'));
      expect(altSuggestion).toBeDefined();
      expect(altSuggestion?.type).toBe('seo');
      expect(altSuggestion?.category).toBe('compliance');
    });

    it('レスポンシブデザインがない場合、対応提案を生成する', () => {
      const suggestions = AISuggestionGenerator.generateSuggestions(sampleHtml, sampleCss);
      
      const responsiveSuggestion = suggestions.find(s => s.title.includes('レスポンシブ'));
      expect(responsiveSuggestion).toBeDefined();
      expect(responsiveSuggestion?.type).toBe('design');
      expect(responsiveSuggestion?.impact).toBe('high');
    });

    it('ビジネスコンテキストに基づく提案を生成する', () => {
      const suggestions = AISuggestionGenerator.generateSuggestions(
        sampleHtml, 
        sampleCss, 
        businessContext
      );

      // SaaS業界向けの提案があることを確認
      const saasSuggestion = suggestions.find(s => s.title.includes('トライアル'));
      expect(saasSuggestion).toBeDefined();

      // 中小企業向けの提案があることを確認
      const trustSuggestion = suggestions.find(s => s.title.includes('お客様') || s.title.includes('導入'));
      expect(trustSuggestion).toBeDefined();
    });

    it('提案が優先度順にソートされている', () => {
      const suggestions = AISuggestionGenerator.generateSuggestions(sampleHtml, sampleCss);

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].priority).toBeGreaterThanOrEqual(suggestions[i].priority);
      }
    });
  });

  describe('提案の分類', () => {
    it('すべての提案タイプが定義されている', () => {
      const suggestions = AISuggestionGenerator.generateSuggestions(sampleHtml, sampleCss, businessContext);
      
      const types = new Set(suggestions.map(s => s.type));
      const expectedTypes = ['content', 'design', 'structure', 'seo', 'conversion', 'accessibility'];
      
      // 少なくとも複数のタイプが含まれることを確認
      expect(types.size).toBeGreaterThan(1);
      
      // すべてのタイプが有効な値であることを確認
      suggestions.forEach(suggestion => {
        expect(expectedTypes.concat(['performance'])).toContain(suggestion.type);
      });
    });

    it('カテゴリが正しく設定されている', () => {
      const suggestions = AISuggestionGenerator.generateSuggestions(sampleHtml, sampleCss);
      
      const validCategories = ['marketing', 'technical', 'ux', 'compliance'];
      
      suggestions.forEach(suggestion => {
        expect(validCategories).toContain(suggestion.category);
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('空のHTMLに対しても正常に動作する', () => {
      expect(() => {
        AISuggestionGenerator.analyzeContent('', '');
      }).not.toThrow();
      
      expect(() => {
        AISuggestionGenerator.generateSuggestions('', '');
      }).not.toThrow();
    });

    it('不正なHTMLに対しても正常に動作する', () => {
      const invalidHtml = '<div><p>Test</div>'; // 閉じタグが間違っている
      
      expect(() => {
        AISuggestionGenerator.analyzeContent(invalidHtml, sampleCss);
      }).not.toThrow();
      
      expect(() => {
        AISuggestionGenerator.generateSuggestions(invalidHtml, sampleCss);
      }).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    it('大きなHTMLファイルでも妥当な時間で処理が完了する', () => {
      // 大きなHTMLコンテンツを生成
      let largeHtml = '<html><body>';
      for (let i = 0; i < 1000; i++) {
        largeHtml += `<div class="item-${i}"><h3>Item ${i}</h3><p>Description ${i}</p></div>`;
      }
      largeHtml += '</body></html>';

      const startTime = Date.now();
      const suggestions = AISuggestionGenerator.generateSuggestions(largeHtml, sampleCss);
      const endTime = Date.now();

      expect(suggestions).toBeInstanceOf(Array);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒以内
    });
  });
});