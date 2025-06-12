import { tool } from 'ai';
import { z } from 'zod';
import { generateUnifiedLP } from './lpGeneratorTool';

export const enhancedLPGeneratorTool = tool({
  description: 'Enhanced unified landing page generator that creates complete, high-quality landing pages with improved prompts and structure generation inspired by Open_SuperAgent.',
  parameters: z.object({
    topic: z.string().describe('The main topic, business, or product/service for the landing page.'),
    targetAudience: z.string().optional().describe('Target audience or customer persona (e.g., "tech entrepreneurs", "small business owners").'),
    businessGoal: z.string().optional().describe('Primary business goal (e.g., "lead generation", "product sales", "newsletter signup").'),
    industry: z.string().optional().describe('Industry or business category (e.g., "SaaS", "e-commerce", "consulting").'),
    competitiveAdvantage: z.string().optional().describe('Unique selling proposition or competitive advantage.'),
    designStyle: z.enum(['modern', 'minimalist', 'corporate', 'creative', 'tech', 'startup']).optional().default('modern').describe('Preferred design style for the landing page.'),
  }),
  execute: async ({ topic, targetAudience, businessGoal, industry, competitiveAdvantage, designStyle }) => {
    console.log(`🚀 Enhanced LP Generator: Starting generation for "${topic}"`);
    
    // Enhanced topic with context for better generation
    const enhancedTopic = [
      topic,
      targetAudience && `（ターゲット: ${targetAudience}）`,
      businessGoal && `（目標: ${businessGoal}）`,
      industry && `（業界: ${industry}）`,
      competitiveAdvantage && `（強み: ${competitiveAdvantage}）`,
    ].filter(Boolean).join(' ');
    
    try {
      const result = await generateUnifiedLP({ 
        topic: enhancedTopic 
      });
      
      console.log(`✅ Enhanced LP Generator: Successfully generated LP for "${topic}"`);
      
      return {
        success: true,
        title: `${topic} - プロフェッショナルランディングページ`,
        htmlContent: result.htmlContent,
        cssContent: result.cssContent,
        structure: result.structure,
        metadata: {
          ...result.metadata,
          originalTopic: topic,
          enhancedTopic: enhancedTopic,
          targetAudience,
          businessGoal,
          industry,
          competitiveAdvantage,
          designStyle,
          generatedAt: new Date().toISOString(),
          version: '2.0-enhanced'
        }
      };
    } catch (error) {
      console.error(`❌ Enhanced LP Generator failed for "${topic}":`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        title: `${topic} - エラー`,
        htmlContent: `<section class="py-16 bg-red-50 border border-red-200">
          <div class="container mx-auto px-4 text-center">
            <h2 class="text-3xl font-bold text-red-800 mb-4">生成エラー</h2>
            <p class="text-red-600 mb-4">ランディングページの生成中にエラーが発生しました。</p>
            <p class="text-gray-600">トピック: ${topic}</p>
            <button class="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
              再試行
            </button>
          </div>
        </section>`,
        cssContent: '',
        structure: null,
        metadata: {
          originalTopic: topic,
          error: true,
          generatedAt: new Date().toISOString(),
          version: '2.0-enhanced'
        }
      };
    }
  }
});