import { JSDOM } from 'jsdom';
import type { 
  AISuggestion, 
  BusinessContext, 
  ContentAnalysis, 
  AnalysisIssue, 
  AnalysisOpportunity 
} from '../types/lp-generator';

/**
 * AI搭載改善提案システム
 * HTML/CSSコンテンツを分析して改善提案を生成
 */
export class AISuggestionGenerator {
  private static generateId(): string {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * HTMLコンテンツの包括的分析
   */
  static analyzeContent(htmlContent: string, cssContent: string = ''): ContentAnalysis {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    const contentScore = this.analyzeContentQuality(document);
    const designScore = this.analyzeDesign(document, cssContent);
    const structureScore = this.analyzeStructure(document);
    const seoScore = this.analyzeSEO(document);
    const performanceScore = this.analyzePerformance(document, cssContent);
    
    const overallScore = Math.round(
      (contentScore + designScore + structureScore + seoScore + performanceScore) / 5
    );

    const issues = this.identifyIssues(document, cssContent);
    const opportunities = this.identifyOpportunities(document, cssContent);

    return {
      contentScore,
      designScore,
      structureScore,
      seoScore,
      performanceScore,
      overallScore,
      issues,
      opportunities
    };
  }

  /**
   * 改善提案を生成
   */
  static generateSuggestions(
    htmlContent: string, 
    cssContent: string = '',
    businessContext?: BusinessContext
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // コンテンツ関連の提案
    suggestions.push(...this.generateContentSuggestions(document));
    
    // デザイン関連の提案
    suggestions.push(...this.generateDesignSuggestions(document, cssContent));
    
    // 構造関連の提案
    suggestions.push(...this.generateStructureSuggestions(document));
    
    // SEO関連の提案
    suggestions.push(...this.generateSEOSuggestions(document));
    
    // コンバージョン関連の提案
    suggestions.push(...this.generateConversionSuggestions(document));
    
    // アクセシビリティ関連の提案
    suggestions.push(...this.generateAccessibilitySuggestions(document));
    
    // ビジネスコンテキストベースの提案
    if (businessContext) {
      suggestions.push(...this.generateContextualSuggestions(document, businessContext));
    }

    // 優先度順でソート
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * コンテンツ品質分析
   */
  private static analyzeContentQuality(document: Document): number {
    let score = 100;
    
    const textContent = document.body?.textContent || '';
    const wordCount = textContent.trim().split(/\s+/).length;
    
    // 文字数チェック
    if (wordCount < 100) score -= 20;
    if (wordCount < 50) score -= 30;
    
    // 見出し構造チェック
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) score -= 15;
    if (h1Count > 1) score -= 10;
    
    // 画像alt属性チェック
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt'));
    if (imagesWithoutAlt.length > 0) score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * デザイン分析
   */
  private static analyzeDesign(document: Document, cssContent: string): number {
    let score = 100;
    
    // 色彩バランスチェック
    if (!cssContent.includes('color') && !cssContent.includes('background')) score -= 20;
    
    // レスポンシブデザインチェック
    if (!cssContent.includes('@media') && !cssContent.includes('responsive')) score -= 15;
    
    // フォント設定チェック
    if (!cssContent.includes('font-family')) score -= 10;
    
    // 余白設定チェック
    if (!cssContent.includes('margin') && !cssContent.includes('padding')) score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * 構造分析
   */
  private static analyzeStructure(document: Document): number {
    let score = 100;
    
    // セマンティック要素チェック
    const semanticElements = ['header', 'nav', 'main', 'section', 'article', 'footer'];
    const hasSemanticElements = semanticElements.some(tag => 
      document.querySelector(tag)
    );
    if (!hasSemanticElements) score -= 25;
    
    // 見出し階層チェック
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length < 2) score -= 15;
    
    return Math.max(0, score);
  }

  /**
   * SEO分析
   */
  private static analyzeSEO(document: Document): number {
    let score = 100;
    
    // title要素チェック
    const title = document.querySelector('title');
    if (!title || title.textContent!.length < 10) score -= 20;
    
    // meta description チェック
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) score -= 15;
    
    // meta keywords チェック（現在は重要度低）
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) score -= 5;
    
    return Math.max(0, score);
  }

  /**
   * パフォーマンス分析
   */
  private static analyzePerformance(document: Document, cssContent: string): number {
    let score = 100;
    
    // CSSサイズチェック
    if (cssContent.length > 50000) score -= 15;
    
    // インライン style チェック
    const elementsWithInlineStyle = document.querySelectorAll('[style]');
    if (elementsWithInlineStyle.length > 10) score -= 10;
    
    // 画像最適化チェック
    const images = document.querySelectorAll('img');
    const largeImages = Array.from(images).filter(img => {
      const src = img.getAttribute('src');
      return src && !src.includes('webp') && !src.includes('optimized');
    });
    if (largeImages.length > 0) score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * 問題点を特定
   */
  private static identifyIssues(document: Document, cssContent: string): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    
    // 批判的な問題
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) {
      issues.push({
        type: 'critical',
        category: 'seo',
        message: 'H1タグが見つかりません',
        fix: 'メインタイトルにH1タグを追加してください'
      });
    }
    
    // 警告レベル
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt'));
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'warning',
        category: 'accessibility',
        message: `${imagesWithoutAlt.length}個の画像にalt属性がありません`,
        fix: '全ての画像に適切なalt属性を追加してください'
      });
    }
    
    return issues;
  }

  /**
   * 改善機会を特定
   */
  private static identifyOpportunities(document: Document, cssContent: string): AnalysisOpportunity[] {
    const opportunities: AnalysisOpportunity[] = [];
    
    // CTAボタンの最適化機会
    const buttons = document.querySelectorAll('button, .button, .btn');
    if (buttons.length < 2) {
      opportunities.push({
        type: 'enhancement',
        category: 'marketing',
        impact: 'high',
        effort: 'low',
        description: '追加のCTAボタンでコンバージョン率を向上'
      });
    }
    
    return opportunities;
  }

  /**
   * コンテンツ関連の提案生成
   */
  private static generateContentSuggestions(document: Document): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // 見出し構造の改善
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) {
      suggestions.push({
        id: this.generateId(),
        type: 'content',
        category: 'marketing',
        title: 'メインタイトル（H1）を追加',
        description: 'SEOとユーザビリティ向上のため、明確なH1タイトルを追加しましょう。',
        impact: 'high',
        confidence: 0.95,
        priority: 90,
        action: {
          type: 'add',
          target: 'h1',
          value: 'メインタイトルを追加'
        },
        reasoning: 'H1タグはSEOにとって重要で、ページの主要テーマを明確に示します。'
      });
    }
    
    // コンテンツの長さチェック
    const textContent = document.body?.textContent || '';
    const wordCount = textContent.trim().split(/\s+/).length;
    
    if (wordCount < 200) {
      suggestions.push({
        id: this.generateId(),
        type: 'content',
        category: 'marketing',
        title: 'コンテンツ量を増やす',
        description: '信頼性とSEO効果を高めるため、より詳細な説明を追加することをお勧めします。',
        impact: 'medium',
        confidence: 0.8,
        priority: 70,
        action: {
          type: 'add',
          target: 'content',
          value: '詳細説明を追加'
        },
        reasoning: '充実したコンテンツは検索エンジンとユーザーの両方に価値を提供します。'
      });
    }
    
    return suggestions;
  }

  /**
   * デザイン関連の提案生成
   */
  private static generateDesignSuggestions(document: Document, cssContent: string): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // シャドウ効果の追加
    if (!cssContent.includes('box-shadow') && !cssContent.includes('drop-shadow')) {
      suggestions.push({
        id: this.generateId(),
        type: 'design',
        category: 'ux',
        title: 'カードにシャドウ効果を追加',
        description: '要素に奥行きを与え、モダンで魅力的なデザインにします。',
        impact: 'medium',
        confidence: 0.75,
        priority: 60,
        preview: 'box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);',
        action: {
          type: 'modify',
          target: 'css',
          value: 'シャドウ効果追加'
        },
        reasoning: 'シャドウ効果は視覚的な階層を作り、プロフェッショナルな印象を与えます。'
      });
    }
    
    // レスポンシブデザインの改善
    if (!cssContent.includes('@media')) {
      suggestions.push({
        id: this.generateId(),
        type: 'design',
        category: 'technical',
        title: 'レスポンシブデザインを追加',
        description: 'モバイルデバイスでの表示を最適化します。',
        impact: 'high',
        confidence: 0.9,
        priority: 85,
        action: {
          type: 'add',
          target: 'css',
          value: 'メディアクエリ追加'
        },
        reasoning: 'モバイルトラフィックが全体の50%以上を占める現在、レスポンシブデザインは必須です。'
      });
    }
    
    return suggestions;
  }

  /**
   * 構造関連の提案生成
   */
  private static generateStructureSuggestions(document: Document): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // セマンティック要素の追加
    const semanticElements = ['header', 'nav', 'main', 'section', 'article', 'footer'];
    const hasSemanticElements = semanticElements.some(tag => document.querySelector(tag));
    
    if (!hasSemanticElements) {
      suggestions.push({
        id: this.generateId(),
        type: 'structure',
        category: 'technical',
        title: 'セマンティックHTML要素を使用',
        description: 'header、main、sectionなどのセマンティック要素でHTML構造を改善します。',
        impact: 'medium',
        confidence: 0.85,
        priority: 65,
        action: {
          type: 'modify',
          target: 'html',
          value: 'セマンティック要素追加'
        },
        reasoning: 'セマンティック要素はアクセシビリティとSEOを向上させます。'
      });
    }
    
    return suggestions;
  }

  /**
   * SEO関連の提案生成
   */
  private static generateSEOSuggestions(document: Document): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // meta description チェック
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      suggestions.push({
        id: this.generateId(),
        type: 'seo',
        category: 'technical',
        title: 'meta descriptionを追加',
        description: '検索結果での表示を改善するため、meta descriptionを追加します。',
        impact: 'high',
        confidence: 0.9,
        priority: 80,
        action: {
          type: 'add',
          target: 'meta',
          value: 'description追加'
        },
        reasoning: 'meta descriptionは検索結果でのクリック率に大きく影響します。'
      });
    }
    
    // 画像のalt属性チェック
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt'));
    
    if (imagesWithoutAlt.length > 0) {
      suggestions.push({
        id: this.generateId(),
        type: 'seo',
        category: 'compliance',
        title: '画像にalt属性を追加',
        description: `${imagesWithoutAlt.length}個の画像にalt属性が不足しています。SEOとアクセシビリティのため追加しましょう。`,
        impact: 'medium',
        confidence: 0.95,
        priority: 75,
        action: {
          type: 'modify',
          target: 'img',
          value: 'alt属性追加'
        },
        reasoning: '画像のalt属性は検索エンジンの理解を助け、アクセシビリティを向上させます。'
      });
    }
    
    return suggestions;
  }

  /**
   * コンバージョン関連の提案生成
   */
  private static generateConversionSuggestions(document: Document): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // CTAボタンの分析
    const ctaElements = document.querySelectorAll('button, .button, .btn, .cta');
    const ctaTexts = Array.from(ctaElements).map(el => el.textContent?.toLowerCase() || '');
    const hasStrongCTA = ctaTexts.some(text => 
      text.includes('今すぐ') || text.includes('無料') || text.includes('限定')
    );
    
    if (ctaElements.length < 2) {
      suggestions.push({
        id: this.generateId(),
        type: 'conversion',
        category: 'marketing',
        title: '追加のCTAボタンを配置',
        description: 'ページ内に複数のCTAポイントを設置してコンバージョン機会を増やします。',
        impact: 'high',
        confidence: 0.85,
        priority: 88,
        preview: '<button class="bg-blue-500 text-white px-6 py-3 rounded-lg">今すぐ始める</button>',
        action: {
          type: 'add',
          target: 'section',
          value: 'CTA追加'
        },
        reasoning: '複数のCTAポイントにより、ユーザーの行動機会が増加します。'
      });
    }
    
    if (!hasStrongCTA && ctaElements.length > 0) {
      suggestions.push({
        id: this.generateId(),
        type: 'conversion',
        category: 'marketing',
        title: 'CTAテキストを強化',
        description: '「今すぐ」「無料」「限定」などの強力なアクションワードを使用します。',
        impact: 'medium',
        confidence: 0.8,
        priority: 70,
        action: {
          type: 'modify',
          target: 'button',
          value: 'CTA強化'
        },
        reasoning: '緊急性や価値を伝えるCTAテキストはクリック率を向上させます。'
      });
    }
    
    return suggestions;
  }

  /**
   * アクセシビリティ関連の提案生成
   */
  private static generateAccessibilitySuggestions(document: Document): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // ARIAラベルのチェック
    const interactiveElements = document.querySelectorAll('button, input, select, textarea');
    const elementsWithoutAriaLabel = Array.from(interactiveElements).filter(el => 
      !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')
    );
    
    if (elementsWithoutAriaLabel.length > 0) {
      suggestions.push({
        id: this.generateId(),
        type: 'accessibility',
        category: 'compliance',
        title: 'ARIAラベルを追加',
        description: 'インタラクティブ要素にARIAラベルを追加してスクリーンリーダーのサポートを改善します。',
        impact: 'medium',
        confidence: 0.9,
        priority: 65,
        action: {
          type: 'modify',
          target: 'interactive',
          value: 'ARIAラベル追加'
        },
        reasoning: 'ARIAラベルは視覚障害のあるユーザーのアクセシビリティを向上させます。'
      });
    }
    
    return suggestions;
  }

  /**
   * ビジネスコンテキストベースの提案生成
   */
  private static generateContextualSuggestions(
    document: Document, 
    businessContext: BusinessContext
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // SaaS業界特有の提案
    if (businessContext.industry === 'saas') {
      const hasTrialSection = document.body?.textContent?.includes('トライアル') || 
                            document.body?.textContent?.includes('無料体験');
      
      if (!hasTrialSection) {
        suggestions.push({
          id: this.generateId(),
          type: 'conversion',
          category: 'marketing',
          title: '無料トライアルセクションを追加',
          description: 'SaaSサービスでは無料トライアルが効果的なコンバージョン手法です。',
          impact: 'high',
          confidence: 0.9,
          priority: 92,
          action: {
            type: 'add',
            target: 'section',
            value: '無料トライアル'
          },
          reasoning: 'SaaSの場合、ユーザーは購入前に製品を試したがる傾向があります。'
        });
      }
    }
    
    // 中小企業向けの信頼性強化
    if (businessContext.targetAudience.includes('中小企業')) {
      const hasTestimonials = document.body?.textContent?.includes('お客様') || 
                            document.body?.textContent?.includes('導入事例');
      
      if (!hasTestimonials) {
        suggestions.push({
          id: this.generateId(),
          type: 'conversion',
          category: 'marketing',
          title: 'お客様の声・導入事例を追加',
          description: '中小企業向けでは信頼性が重要です。導入実績やお客様の声を表示しましょう。',
          impact: 'high',
          confidence: 0.85,
          priority: 85,
          action: {
            type: 'add',
            target: 'section',
            value: '導入実績'
          },
          reasoning: '中小企業の意思決定者は、同業他社の成功事例を重視します。'
        });
      }
    }
    
    return suggestions;
  }
}