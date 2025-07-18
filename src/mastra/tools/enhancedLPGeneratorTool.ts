import { tool } from 'ai';
import { z } from 'zod';
import { generateUnifiedLP } from './lpGeneratorTool';
import { LPGenerationResult, AIGenerationError, BusinessContext } from '../../types/lp-core';
import { sanitizeHTML, handleAIError, applyPasonaFormula, apply4UPrinciple, enhanceAccessibility, monitorPerformance } from './utils/lpToolHelpers';
import { analyzeBusinessContext } from './utils/businessContextAnalyzer';

/**
 * マーケティング心理学を活用した拡張LP生成ツール
 * PASONA法則と4U原則を統合し、高品質なランディングページを生成する
 */
export const enhancedLPGeneratorTool = tool({
  description: 'マーケティング心理学（PASONA法則・4U原則）を活用した高品質ランディングページ生成ツール。ビジネス要件から最適化されたLPを自動生成します。',
  parameters: z.object({
    topic: z.string().describe('ランディングページのメインテーマ、ビジネス、製品/サービス'),
    targetAudience: z.string().optional().describe('ターゲットオーディエンスまたは顧客ペルソナ（例：「技術系起業家」、「中小企業オーナー」）'),
    businessGoal: z.string().optional().describe('主要なビジネス目標（例：「リード獲得」、「製品販売」、「ニュースレター登録」）'),
    industry: z.string().optional().describe('業界またはビジネスカテゴリ（例：「SaaS」、「Eコマース」、「コンサルティング」）'),
    competitiveAdvantage: z.string().optional().describe('独自の販売提案または競争上の優位性'),
    designStyle: z.enum(['modern', 'minimalist', 'corporate', 'creative', 'tech', 'startup']).optional().default('modern').describe('ランディングページの好みのデザインスタイル'),
    useMarketingPsychology: z.object({
      pasona: z.boolean().optional().default(true).describe('PASONA法則を適用する（Problem、Agitation、Solution、Offer、Narrow down、Action）'),
      fourU: z.boolean().optional().default(true).describe('4U原則を適用する（Useful、Urgent、Unique、Ultra-specific）'),
    }).optional().default({ pasona: true, fourU: true }),
  }),
  execute: async ({ topic, targetAudience, businessGoal, industry, competitiveAdvantage, designStyle, useMarketingPsychology }) => {
    console.log(`🚀 Enhanced LP Generator: Starting generation for "${topic}"`);
    const performanceMonitor = monitorPerformance();
    
    // 自動ビジネスコンテキスト分析（パラメータが不足している場合）
    const autoAnalyzedContext = analyzeBusinessContext(topic);
    console.log(`🔍 Auto-analyzed business context:`, autoAnalyzedContext);
    
    // ビジネスコンテキストの構築（手動指定 > 自動分析 > デフォルト値の優先順位）
    const businessContext: BusinessContext = {
      industry: industry || autoAnalyzedContext.industry || '一般',
      targetAudience: targetAudience || autoAnalyzedContext.targetAudience || '一般ユーザー',
      businessGoal: businessGoal || autoAnalyzedContext.businessGoal || 'コンバージョン向上',
      competitiveAdvantage: competitiveAdvantage ? [competitiveAdvantage] : autoAnalyzedContext.competitiveAdvantage || [],
      tone: autoAnalyzedContext.tone || 'professional'
    };
    
    console.log(`📊 Final business context:`, businessContext);
    
    // マーケティング心理学の適用
    let enhancedTopic = topic;
    if (useMarketingPsychology?.pasona) {
      enhancedTopic = applyPasonaFormula(topic, businessContext);
    }
    if (useMarketingPsychology?.fourU) {
      enhancedTopic = apply4UPrinciple(enhancedTopic, businessContext);
    }
    
    // コンテキスト情報の追加
    const contextEnhancedTopic = [
      enhancedTopic,
      targetAudience && `（ターゲット: ${targetAudience}）`,
      businessGoal && `（目標: ${businessGoal}）`,
      industry && `（業界: ${industry}）`,
      competitiveAdvantage && `（強み: ${competitiveAdvantage}）`,
    ].filter(Boolean).join(' ');
    
    try {
      // LP生成の実行
      const result = await generateUnifiedLP({ 
        topic: contextEnhancedTopic 
      });
      
      // HTMLのサニタイズとアクセシビリティ強化
      const sanitizedHtml = sanitizeHTML(result.htmlContent);
      const accessibleHtml = enhanceAccessibility(sanitizedHtml);
      
      const performanceResult = performanceMonitor.end();
      console.log(`✅ Enhanced LP Generator: Successfully generated LP for "${topic}" in ${performanceResult.duration}ms`);
      
      // 生成結果の返却
      const generationResult: LPGenerationResult = {
        htmlContent: accessibleHtml,
        cssContent: result.cssContent,
        title: `${topic} - プロフェッショナルランディングページ`,
        metadata: {
          generatedAt: new Date(),
          model: 'claude-3-5-sonnet-20241022',
          processingTime: performanceResult.duration,
          businessContext
        }
      };
      
      return {
        success: true,
        ...generationResult,
        structure: result.structure,
        metadata: {
          ...generationResult.metadata,
          originalTopic: topic,
          enhancedTopic: contextEnhancedTopic,
          targetAudience,
          businessGoal,
          industry,
          competitiveAdvantage,
          designStyle,
          generatedAt: new Date().toISOString(),
          version: '3.0-enhanced-marketing'
        }
      };
    } catch (error) {
      console.error(`❌ Enhanced LP Generator failed for "${topic}":`, error);
      
      // エラーハンドリング
      const aiError: AIGenerationError = {
        type: 'model_timeout',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retryable: true,
        timestamp: new Date()
      };
      
      const errorAction = handleAIError(aiError);
      console.log(`🔄 Error handling action: ${errorAction.action}`);
      
      // エラー時のフォールバックHTML
      return {
        success: false,
        error: aiError.message,
        title: `${topic} - エラー`,
        htmlContent: `<section class="py-16 bg-red-50 border border-red-200">
          <div class="container mx-auto px-4 text-center">
            <h2 class="text-3xl font-bold text-red-800 mb-4" data-editable-id="error-title">生成エラー</h2>
            <p class="text-red-600 mb-4" data-editable-id="error-message">ランディングページの生成中にエラーが発生しました。</p>
            <p class="text-gray-600" data-editable-id="error-details">トピック: ${topic}</p>
            <p class="text-gray-600 mt-2" data-editable-id="error-action">${errorAction.message || 'しばらく待ってから再試行してください'}</p>
            <button class="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors" data-editable-id="retry-button">
              再試行
            </button>
          </div>
        </section>`,
        cssContent: '',
        structure: null,
        metadata: {
          originalTopic: topic,
          error: true,
          errorType: aiError.type,
          errorMessage: aiError.message,
          generatedAt: new Date().toISOString(),
          version: '3.0-enhanced-marketing'
        }
      };
    }
  }
});