import { tool } from 'ai';
import { z } from 'zod';
import { enhancedLPGeneratorTool } from './enhancedLPGeneratorTool';
import { LPVariant, VariantGenerationResult, BusinessContext } from '../../types/lp-core';
import { analyzeBusinessContext } from './utils/businessContextAnalyzer';
import { monitorPerformance } from './utils/lpToolHelpers';

// ユーザーパラメータの型定義
interface UserParameters {
  targetAudience?: string;
  businessGoal?: string;
  industry?: string;
  competitiveAdvantage?: string;
  designStyle?: 'modern' | 'minimalist' | 'corporate' | 'creative' | 'tech' | 'startup';
  topic?: string;
  colorScheme?: {
    primaryColor?: string;
    accentColor?: string;
    bgColor?: string;
    textColor?: string;
  };
  marketingStrategy?: {
    usePasona?: boolean;
    use4U?: boolean;
    useAida?: boolean;
  };
}

/**
 * インテリジェント複数バリエーションLP生成ツール
 * 最大3つのデザインバリエーションを生成し、スコアリングと推奨を提供
 */
export const intelligentLPGeneratorTool = tool({
  description: '複数のデザインバリエーション（最大3つ）を生成し、ビジネス目標に基づいて最適なバリエーションを推奨するインテリジェントLP生成ツール',
  parameters: z.object({
    topic: z.string().describe('ランディングページのメインテーマ、ビジネス、製品/サービス'),
    targetAudience: z.string().optional().describe('ターゲットオーディエンスまたは顧客ペルソナ'),
    businessGoal: z.string().optional().describe('主要なビジネス目標'),
    industry: z.string().optional().describe('業界またはビジネスカテゴリ'),
    competitiveAdvantage: z.string().optional().describe('独自の販売提案または競争上の優位性'),
    designStyle: z.enum(['modern', 'minimalist', 'corporate', 'creative', 'tech', 'startup']).optional().default('modern').describe('ベースとなるデザインスタイル'),
    variantCount: z.number().min(1).max(3).optional().default(3).describe('生成するバリエーション数（1-3）'),
    focusAreas: z.array(z.enum(['modern-clean', 'conversion-optimized', 'content-rich'])).optional().describe('重点的に生成するデザインフォーカス領域'),
  }),
  execute: async ({ topic, targetAudience, businessGoal, industry, competitiveAdvantage, designStyle, variantCount, focusAreas }) => {
    console.log(`🚀 Intelligent LP Generator: Starting generation of ${variantCount} variants for "${topic}"`);
    const performanceMonitor = monitorPerformance();
    
    try {
      // ビジネスコンテキストの分析
      const businessContext = analyzeBusinessContext(topic);
      console.log(`🔍 Business context analyzed:`, businessContext);
      
      // バリエーション設定の決定
      const variantConfigs = generateVariantConfigurations(
        variantCount || 3,
        focusAreas,
        businessContext,
        { targetAudience, businessGoal, industry, competitiveAdvantage, designStyle }
      );
      
      console.log(`📋 Generated ${variantConfigs.length} variant configurations`);
      
      // 並列でバリエーションを生成
      const variantPromises = variantConfigs.map(async (config, index) => {
        console.log(`⚡ Generating variant ${index + 1}: ${config.designFocus}`);
        
        try {
          const result = await enhancedLPGeneratorTool.execute({
            topic: config.enhancedTopic,
            targetAudience: config.targetAudience,
            businessGoal: config.businessGoal,
            industry: config.industry,
            competitiveAdvantage: config.competitiveAdvantage,
            designStyle: config.designStyle || 'modern',
            useMarketingPsychology: config.marketingPsychology || { pasona: true, fourU: true }
          }, {
            toolCallId: `variant-${index + 1}`,
            messages: []
          });
          
          if ((result as any).success) {
            const variant: LPVariant = {
              ...(result as any),
              variantId: `variant_${index + 1}_${config.designFocus}`,
              score: calculateVariantScore(result, config.designFocus, businessContext),
              description: config.description,
              features: config.features,
              designFocus: config.designFocus,
              recommendation: generateRecommendation(config.designFocus, businessContext)
            };
            
            console.log(`✅ Variant ${index + 1} generated successfully (score: ${variant.score})`);
            return variant;
          } else {
            throw new Error((result as any).error || 'Variant generation failed');
          }
        } catch (error) {
          console.error(`❌ Variant ${index + 1} generation failed:`, error);
          // フォールバック用の基本バリエーションを生成
          return generateFallbackVariant(config, index + 1, error);
        }
      });
      
      // すべてのバリエーションの完了を待機
      const variants = await Promise.all(variantPromises);
      
      // 推奨バリエーションの決定
      const recommendedVariant = selectRecommendedVariant(variants, businessContext);
      
      const performanceResult = performanceMonitor.end();
      console.log(`🎉 Intelligent LP Generator completed in ${performanceResult.duration}ms`);
      
      const result: VariantGenerationResult = {
        success: true,
        variants: variants.sort((a, b) => b.score - a.score), // スコア順でソート
        recommendedVariant: recommendedVariant.variantId,
        metadata: {
          generatedAt: new Date(),
          processingTime: performanceResult.duration,
          totalVariants: variants.length,
          version: '1.0-intelligent-variants'
        }
      };
      
      return result;
      
    } catch (error) {
      console.error(`❌ Intelligent LP Generator failed:`, error);
      
      const performanceResult = performanceMonitor.end();
      
      return {
        success: false,
        variants: [],
        recommendedVariant: '',
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime: performanceResult.duration,
          totalVariants: 0,
          version: '1.0-intelligent-variants'
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
});

/**
 * バリエーション設定を生成する
 */
function generateVariantConfigurations(
  count: number,
  focusAreas: ('modern-clean' | 'conversion-optimized' | 'content-rich')[] | undefined,
  businessContext: BusinessContext,
  userParams: UserParameters
) {
  // デフォルトのフォーカス領域
  const defaultFocusAreas: ('modern-clean' | 'conversion-optimized' | 'content-rich')[] = [
    'modern-clean',
    'conversion-optimized', 
    'content-rich'
  ];
  
  const targetFocusAreas = focusAreas && focusAreas.length > 0 ? focusAreas : defaultFocusAreas;
  const selectedFocusAreas = targetFocusAreas.slice(0, count);
  
  return selectedFocusAreas.map((focus, index) => {
    const config = generateVariantConfig(focus, businessContext, userParams, index);
    return config;
  });
}

/**
 * 個別のバリエーション設定を生成する
 */
function generateVariantConfig(
  designFocus: 'modern-clean' | 'conversion-optimized' | 'content-rich',
  businessContext: BusinessContext,
  userParams: any,
  index: number
) {
  const baseConfig = {
    designFocus,
    targetAudience: userParams.targetAudience || businessContext.targetAudience,
    businessGoal: userParams.businessGoal || businessContext.businessGoal,
    industry: userParams.industry || businessContext.industry,
    competitiveAdvantage: userParams.competitiveAdvantage || businessContext.competitiveAdvantage.join('、'),
  };
  
  switch (designFocus) {
    case 'modern-clean':
      return {
        ...baseConfig,
        enhancedTopic: `${userParams.topic} - モダンでクリーンなデザインに重点を置いた、視覚的に美しく洗練されたランディングページ`,
        designStyle: 'modern' as const,
        description: 'モダンでクリーンなデザインに重点を置いた、視覚的に美しく洗練されたバリエーション',
        features: ['洗練されたビジュアルデザイン', 'ミニマルで読みやすいレイアウト', 'モダンなタイポグラフィ', '適切なホワイトスペース活用'],
        marketingPsychology: { pasona: true, fourU: false }
      };
      
    case 'conversion-optimized':
      return {
        ...baseConfig,
        enhancedTopic: `${userParams.topic} - コンバージョン最適化に重点を置いた、行動喚起と成果重視のランディングページ`,
        designStyle: 'startup' as const,
        description: 'コンバージョン最適化に重点を置いた、行動喚起と成果重視のバリエーション',
        features: ['強力なCTAボタン配置', '緊急性を演出する要素', 'ソーシャルプルーフ強化', 'フォーム最適化'],
        marketingPsychology: { pasona: true, fourU: true }
      };
      
    case 'content-rich':
      return {
        ...baseConfig,
        enhancedTopic: `${userParams.topic} - 情報豊富なコンテンツに重点を置いた、詳細で包括的なランディングページ`,
        designStyle: 'corporate' as const,
        description: '情報豊富なコンテンツに重点を置いた、詳細で包括的なバリエーション',
        features: ['詳細な製品説明', '豊富なFAQセクション', '事例・実績の充実', '段階的な情報提示'],
        marketingPsychology: { pasona: false, fourU: true }
      };
      
    default:
      return {
        ...baseConfig,
        enhancedTopic: userParams.topic,
        designStyle: userParams.designStyle || 'modern' as const,
        description: 'バランスの取れた標準的なバリエーション',
        features: ['バランスの取れたデザイン', '標準的な機能セット'],
        marketingPsychology: { pasona: true, fourU: true }
      };
  }
}

/**
 * バリエーションのスコアを計算する
 */
function calculateVariantScore(
  result: any,
  designFocus: 'modern-clean' | 'conversion-optimized' | 'content-rich',
  businessContext: BusinessContext
): number {
  let baseScore = 70; // ベーススコア
  
  // ビジネス目標との適合性
  const goalAlignment = calculateGoalAlignment(designFocus, businessContext.businessGoal);
  baseScore += goalAlignment;
  
  // 業界との適合性
  const industryAlignment = calculateIndustryAlignment(designFocus, businessContext.industry);
  baseScore += industryAlignment;
  
  // 生成品質（HTMLの長さ、構造の複雑さなど）
  const qualityScore = calculateQualityScore(result);
  baseScore += qualityScore;
  
  // ランダム要素を少し追加（同点を避けるため）
  const randomFactor = Math.random() * 2 - 1; // -1 to 1
  baseScore += randomFactor;
  
  return Math.min(100, Math.max(0, Math.round(baseScore)));
}

/**
 * ビジネス目標との適合性を計算
 */
function calculateGoalAlignment(designFocus: string, businessGoal: string): number {
  const alignmentMatrix: Record<string, Record<string, number>> = {
    'modern-clean': {
      'ブランド認知': 15,
      '情報提供': 10,
      'リード獲得': 5,
      '売上向上': 5,
      '会員登録': 8
    },
    'conversion-optimized': {
      'リード獲得': 15,
      '売上向上': 15,
      '会員登録': 12,
      'アプリインストール': 10,
      'ブランド認知': 3
    },
    'content-rich': {
      '情報提供': 15,
      'ブランド認知': 10,
      'リード獲得': 8,
      '採用': 12,
      'コスト削減': 10
    }
  };
  
  return alignmentMatrix[designFocus]?.[businessGoal] || 5;
}

/**
 * 業界との適合性を計算
 */
function calculateIndustryAlignment(designFocus: string, industry: string): number {
  const alignmentMatrix: Record<string, Record<string, number>> = {
    'modern-clean': {
      'saas': 10,
      'tech': 12,
      'creative': 15,
      'startup': 10,
      'beauty': 12
    },
    'conversion-optimized': {
      'ecommerce': 15,
      'saas': 12,
      'finance': 10,
      'consulting': 8,
      'marketing': 12
    },
    'content-rich': {
      'education': 15,
      'healthcare': 12,
      'legal': 15,
      'consulting': 12,
      'finance': 10
    }
  };
  
  return alignmentMatrix[designFocus]?.[industry] || 5;
}

/**
 * 生成品質スコアを計算
 */
function calculateQualityScore(result: any): number {
  let score = 0;
  
  // HTMLの長さ（適度な長さが良い）
  const htmlLength = result.htmlContent?.length || 0;
  if (htmlLength > 1000 && htmlLength < 10000) {
    score += 5;
  } else if (htmlLength > 500) {
    score += 3;
  }
  
  // CSSの存在
  if (result.cssContent && result.cssContent.length > 100) {
    score += 3;
  }
  
  // 構造の存在
  if (result.structure && result.structure.sections && result.structure.sections.length > 2) {
    score += 4;
  }
  
  return score;
}

/**
 * 推奨バリエーションを選択する
 */
function selectRecommendedVariant(variants: LPVariant[], businessContext: BusinessContext): LPVariant {
  // スコアが最も高いバリエーションを推奨
  return variants.reduce((best, current) => 
    current.score > best.score ? current : best
  );
}

/**
 * バリエーションの推奨理由を生成する
 */
function generateRecommendation(
  designFocus: 'modern-clean' | 'conversion-optimized' | 'content-rich',
  businessContext: BusinessContext
) {
  const recommendations = {
    'modern-clean': {
      reason: 'ブランドイメージの向上と視覚的な印象を重視する場合に最適',
      targetUseCase: 'ブランド認知向上、プレミアム商品・サービスの紹介',
      strengths: ['洗練されたデザイン', '高いブランド価値の演出', 'ユーザビリティの向上']
    },
    'conversion-optimized': {
      reason: '具体的な行動（購入、登録、問い合わせ）を促進したい場合に最適',
      targetUseCase: 'リード獲得、売上向上、会員登録促進',
      strengths: ['高いコンバージョン率', '明確な行動喚起', '緊急性の演出']
    },
    'content-rich': {
      reason: '詳細な情報提供と信頼性の構築を重視する場合に最適',
      targetUseCase: '複雑な商品・サービスの説明、B2B営業支援',
      strengths: ['包括的な情報提供', '信頼性の構築', '意思決定支援']
    }
  };
  
  return recommendations[designFocus];
}

/**
 * フォールバック用のバリエーションを生成する
 */
function generateFallbackVariant(config: any, index: number, error: any): LPVariant {
  return {
    variantId: `fallback_variant_${index}`,
    htmlContent: `<section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-gray-800 mb-4">バリエーション ${index}</h2>
        <p class="text-gray-600 mb-4">このバリエーションは現在生成中です。</p>
        <p class="text-sm text-gray-500">フォーカス: ${config.designFocus}</p>
      </div>
    </section>`,
    cssContent: '',
    title: `${config.designFocus} バリエーション`,
    metadata: {
      generatedAt: new Date(),
      model: 'fallback',
      processingTime: 0
    },
    score: 30, // 低いスコア
    description: config.description,
    features: config.features,
    designFocus: config.designFocus,
    recommendation: generateRecommendation(config.designFocus, {} as BusinessContext)
  };
}