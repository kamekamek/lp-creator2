/**
 * LP Creator Platform - Variant Scoring Utilities
 * 
 * バリエーションのスコアリングと推奨アルゴリズムのユーティリティ関数
 */

import { LPVariant, BusinessContext } from '../../../types/lp-core';

/**
 * バリエーションの包括的スコアリング
 */
export interface ScoringCriteria {
  businessAlignment: number;    // ビジネス目標との適合性 (0-30)
  industryFit: number;         // 業界適合性 (0-25)
  designQuality: number;       // デザイン品質 (0-25)
  contentQuality: number;      // コンテンツ品質 (0-20)
}

/**
 * 詳細なバリエーションスコアリング
 */
export function calculateDetailedVariantScore(
  variant: LPVariant,
  businessContext: BusinessContext,
  userPreferences?: {
    prioritizeConversion?: boolean;
    prioritizeDesign?: boolean;
    prioritizeContent?: boolean;
  }
): { score: number; breakdown: ScoringCriteria; reasoning: string[] } {
  
  const criteria: ScoringCriteria = {
    businessAlignment: calculateBusinessAlignment(variant, businessContext),
    industryFit: calculateIndustryFit(variant, businessContext),
    designQuality: calculateDesignQuality(variant),
    contentQuality: calculateContentQuality(variant)
  };
  
  // ユーザー設定に基づく重み付け調整
  // 各基準の重みを定義
  const weights = {
    businessAlignment: 0.30,
    industryFit:        0.25,
    designQuality:      0.25,
    contentQuality:     0.20
  };

  let weightedScore =
    criteria.businessAlignment * weights.businessAlignment +
    criteria.industryFit        * weights.industryFit +
    criteria.designQuality      * weights.designQuality +
    criteria.contentQuality     * weights.contentQuality;
  if (userPreferences) {
    if (userPreferences.prioritizeConversion && variant.designFocus === 'conversion-optimized') {
      weightedScore += 5;
    }
    if (userPreferences.prioritizeDesign && variant.designFocus === 'modern-clean') {
      weightedScore += 5;
    }
    if (userPreferences.prioritizeContent && variant.designFocus === 'content-rich') {
      weightedScore += 5;
    }
  }
  
  const reasoning = generateScoringReasoning(criteria, variant, businessContext);
  
  return {
    score: Math.min(100, Math.max(0, Math.round(weightedScore))),
    breakdown: criteria,
    reasoning
  };
}

/**
 * ビジネス目標との適合性を計算
 */
function calculateBusinessAlignment(variant: LPVariant, businessContext: BusinessContext): number {
  const goalAlignmentMatrix: Record<string, Record<string, number>> = {
    'modern-clean': {
      'ブランド認知': 25,
      '情報提供': 20,
      'リード獲得': 15,
      '売上向上': 12,
      '会員登録': 18,
      'アプリインストール': 16,
      'エンゲージメント': 22,
      '採用': 20,
      'コスト削減': 14,
      '顧客維持': 19
    },
    'conversion-optimized': {
      'リード獲得': 28,
      '売上向上': 30,
      '会員登録': 26,
      'アプリインストール': 24,
      'ブランド認知': 10,
      '情報提供': 12,
      'エンゲージメント': 20,
      '採用': 18,
      'コスト削減': 22,
      '顧客維持': 25
    },
    'content-rich': {
      '情報提供': 28,
      'ブランド認知': 22,
      'リード獲得': 20,
      '採用': 26,
      'コスト削減': 24,
      '顧客維持': 23,
      '売上向上': 16,
      '会員登録': 18,
      'アプリインストール': 14,
      'エンゲージメント': 21
    }
  };
  
  const alignment = goalAlignmentMatrix[variant.designFocus]?.[businessContext.businessGoal];
  return alignment || 15; // デフォルト値
}

/**
 * 業界適合性を計算
 */
function calculateIndustryFit(variant: LPVariant, businessContext: BusinessContext): number {
  const industryFitMatrix: Record<string, Record<string, number>> = {
    'modern-clean': {
      'saas': 22,
      'tech': 25,
      'creative': 25,
      'startup': 23,
      'beauty': 24,
      'fashion': 25,
      'design': 25,
      'consulting': 18,
      'finance': 16,
      'healthcare': 17
    },
    'conversion-optimized': {
      'ecommerce': 25,
      'saas': 23,
      'finance': 22,
      'consulting': 20,
      'marketing': 24,
      'realestate': 23,
      'automotive': 22,
      'fitness': 24,
      'food': 21,
      'travel': 23
    },
    'content-rich': {
      'education': 25,
      'healthcare': 24,
      'legal': 25,
      'consulting': 23,
      'finance': 22,
      'government': 24,
      'nonprofit': 25,
      'manufacturing': 20,
      'logistics': 21,
      'energy': 22
    }
  };
  
  const fit = industryFitMatrix[variant.designFocus]?.[businessContext.industry];
  return fit || 18; // デフォルト値
}

/**
 * デザイン品質を計算
 */
function calculateDesignQuality(variant: LPVariant): number {
  let score = 15; // ベーススコア
  
  // HTMLの構造品質
  const htmlQuality = analyzeHTMLQuality(variant.htmlContent);
  score += htmlQuality;
  
  // CSSの品質
  const cssQuality = analyzeCSSQuality(variant.cssContent);
  score += cssQuality;
  
  // レスポンシブデザインの検出
  const responsiveScore = analyzeResponsiveDesign(variant.htmlContent, variant.cssContent);
  score += responsiveScore;
  
  return Math.min(25, score);
}

/**
 * コンテンツ品質を計算
 */
function calculateContentQuality(variant: LPVariant): number {
  let score = 10; // ベーススコア
  
  // コンテンツの長さと構造
  const contentStructure = analyzeContentStructure(variant.htmlContent);
  score += contentStructure;
  
  // 編集可能要素の存在
  const editableElements = analyzeEditableElements(variant.htmlContent);
  score += editableElements;
  
  // アクセシビリティ要素
  const accessibilityScore = analyzeAccessibility(variant.htmlContent);
  score += accessibilityScore;
  
  return Math.min(20, score);
}

/**
 * HTML品質を分析
 */
function analyzeHTMLQuality(html: string): number {
  let score = 0;
  
  // セマンティックHTML要素の使用
  const semanticTags = ['section', 'header', 'footer', 'nav', 'main', 'article', 'aside'];
  const semanticCount = semanticTags.filter(tag => html.includes(`<${tag}`)).length;
  score += Math.min(3, semanticCount);
  
  // 適切な見出し構造
  const headingPattern = /<h[1-6]/g;
  const headingCount = (html.match(headingPattern) || []).length;
  if (headingCount >= 2 && headingCount <= 6) score += 2;
  
  // 画像のalt属性
  const imgWithAlt = (html.match(/<img[^>]+alt=/g) || []).length;
  const totalImg = (html.match(/<img/g) || []).length;
  if (totalImg > 0 && imgWithAlt / totalImg > 0.8) score += 2;
  
  return score;
}

/**
 * CSS品質を分析
 */
function analyzeCSSQuality(css: string): number {
  let score = 0;
  
  // CSS変数の使用
  if (css.includes('--') || css.includes('var(')) score += 2;
  
  // レスポンシブデザインの指標
  if (css.includes('@media') || css.includes('sm:') || css.includes('md:')) score += 2;
  
  // モダンCSSプロパティの使用
  const modernProperties = ['grid', 'flex', 'transform', 'transition'];
  const modernCount = modernProperties.filter(prop => css.includes(prop)).length;
  score += Math.min(2, modernCount);
  
  return score;
}

/**
 * レスポンシブデザインを分析
 */
function analyzeResponsiveDesign(html: string, css: string): number {
  let score = 0;
  
  // Tailwind CSSのレスポンシブクラス
  const responsiveClasses = ['sm:', 'md:', 'lg:', 'xl:'];
  const responsiveCount = responsiveClasses.filter(cls => html.includes(cls)).length;
  score += Math.min(2, responsiveCount);
  
  // メディアクエリの存在
  if (css.includes('@media')) score += 1;
  
  // ビューポートメタタグ（通常は外部で設定されるが、チェック）
  if (html.includes('viewport')) score += 1;
  
  return score;
}

/**
 * コンテンツ構造を分析
 */
function analyzeContentStructure(html: string): number {
  let score = 0;
  
  // 適切なコンテンツ長
  const textContent = html.replace(/<[^>]*>/g, '').trim();
  const contentLength = textContent.length;
  if (contentLength > 200 && contentLength < 5000) score += 3;
  else if (contentLength > 100) score += 2;
  
  // セクションの多様性
  const sectionTypes = ['hero', 'features', 'testimonials', 'cta', 'faq'];
  const foundSections = sectionTypes.filter(type => 
    html.toLowerCase().includes(type) || 
    html.includes(`section-${type}`) ||
    html.includes(`${type}-section`)
  ).length;
  score += Math.min(2, foundSections);
  
  return score;
}

/**
 * 編集可能要素を分析
 */
function analyzeEditableElements(html: string): number {
  const editableElements = (html.match(/data-editable-id/g) || []).length;
  return Math.min(3, Math.floor(editableElements / 3));
}

/**
 * アクセシビリティを分析
 */
function analyzeAccessibility(html: string): number {
  let score = 0;
  
  // ARIA属性の使用
  if (html.includes('aria-')) score += 1;
  
  // 適切なボタンとリンク
  const buttons = (html.match(/<button/g) || []).length;
  const links = (html.match(/<a\s+href/g) || []).length;
  if (buttons + links > 0) score += 1;
  
  // フォームラベル
  if (html.includes('<label') && html.includes('for=')) score += 1;
  
  return score;
}

/**
 * スコアリングの理由を生成
 */
function generateScoringReasoning(
  criteria: ScoringCriteria,
  variant: LPVariant,
  businessContext: BusinessContext
): string[] {
  const reasoning: string[] = [];
  
  // ビジネス適合性
  if (criteria.businessAlignment > 20) {
    reasoning.push(`ビジネス目標「${businessContext.businessGoal}」に非常に適している`);
  } else if (criteria.businessAlignment > 15) {
    reasoning.push(`ビジネス目標「${businessContext.businessGoal}」に適している`);
  } else {
    reasoning.push(`ビジネス目標「${businessContext.businessGoal}」との適合性は標準的`);
  }
  
  // 業界適合性
  if (criteria.industryFit > 20) {
    reasoning.push(`${businessContext.industry}業界に最適化されている`);
  } else if (criteria.industryFit > 15) {
    reasoning.push(`${businessContext.industry}業界に適している`);
  }
  
  // デザイン品質
  if (criteria.designQuality > 20) {
    reasoning.push('高品質なデザインと構造を持っている');
  } else if (criteria.designQuality > 15) {
    reasoning.push('良好なデザイン品質を持っている');
  }
  
  // コンテンツ品質
  if (criteria.contentQuality > 15) {
    reasoning.push('豊富で構造化されたコンテンツを提供している');
  } else if (criteria.contentQuality > 10) {
    reasoning.push('適切なコンテンツ構造を持っている');
  }
  
  // デザインフォーカス固有の理由
  switch (variant.designFocus) {
    case 'modern-clean':
      reasoning.push('モダンで洗練されたビジュアルデザインが特徴');
      break;
    case 'conversion-optimized':
      reasoning.push('コンバージョン率向上に特化した設計');
      break;
    case 'content-rich':
      reasoning.push('情報提供と信頼性構築に重点を置いた設計');
      break;
  }
  
  return reasoning;
}

/**
 * バリエーション比較分析
 */
export function compareVariants(variants: LPVariant[], businessContext: BusinessContext) {
  if (!variants || variants.length === 0) {
    throw new Error('バリアントが指定されていません');
  }

  const comparisons = variants.map(variant => {
    try {
      const detailed = calculateDetailedVariantScore(variant, businessContext);
      return {
        variant,
        ...detailed
      };
    } catch (error) {
      console.error(`バリアント${variant.id}のスコア計算エラー:`, error);
      // エラー時のフォールバック
      return {
        variant,
        score: 0,
        breakdown: {
          businessAlignment: 0,
          industryFit: 0,
          designQuality: 0,
          contentQuality: 0
        },
        reasoning: ['スコア計算中にエラーが発生しました']
      };
    }
  });
  
  // スコア順でソート
  comparisons.sort((a, b) => b.score - a.score);
  
  return {
    rankings: comparisons,
    summary: {
      bestOverall: comparisons[0],
      bestForBusiness: comparisons.find(c => c.breakdown.businessAlignment === Math.max(...comparisons.map(c => c.breakdown.businessAlignment))),
      bestDesign: comparisons.find(c => c.breakdown.designQuality === Math.max(...comparisons.map(c => c.breakdown.designQuality))),
      bestContent: comparisons.find(c => c.breakdown.contentQuality === Math.max(...comparisons.map(c => c.breakdown.contentQuality)))
    }
  };
}