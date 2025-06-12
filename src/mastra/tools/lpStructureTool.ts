import { tool } from 'ai';
import { z } from 'zod';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';

// セクション構造のスキーマ
const SectionSchema = z.object({
  type: z.enum(['hero', 'features', 'testimonials', 'cta', 'faq', 'footer', 'about', 'pricing', 'contact']),
  title: z.string(),
  description: z.string(),
  priority: z.number().min(1).max(10),
  content: z.string().optional(),
});

// LP構造のスキーマ
const LPStructureSchema = z.object({
  title: z.string(),
  description: z.string(),
  targetAudience: z.string(),
  conversionGoal: z.string(),
  sections: z.array(SectionSchema).min(3).max(12),
  colorScheme: z.object({
    primaryColor: z.string(),
    accentColor: z.string(),
    bgColor: z.string(),
    textColor: z.string(),
  }),
  designStyle: z.enum(['modern', 'minimalist', 'corporate', 'creative', 'tech', 'startup']),
});

export const lpStructureTool = tool({
  description: 'Creates a comprehensive structure and strategy for a landing page based on the business topic and goals.',
  parameters: z.object({
    topic: z.string().describe('The main business topic or product/service for the landing page.'),
    targetAudience: z.string().optional().describe('Target audience or customer persona.'),
    businessGoal: z.string().optional().describe('Primary business goal (e.g., lead generation, sales, sign-ups).'),
    industry: z.string().optional().describe('Industry or business category.'),
    competitiveAdvantage: z.string().optional().describe('Unique selling proposition or competitive advantage.'),
    designPreference: z.enum(['modern', 'minimalist', 'corporate', 'creative', 'tech', 'startup']).optional().default('modern'),
  }),
  execute: async ({ 
    topic, 
    targetAudience, 
    businessGoal, 
    industry, 
    competitiveAdvantage, 
    designPreference 
  }) => {
    const prompt = `あなたはランディングページ戦略の専門家です。以下の情報に基づいて、高コンバージョンのランディングページ構造を設計してください。

# ビジネス情報
- トピック/商品・サービス: ${topic}
- ターゲット顧客: ${targetAudience || '一般的なターゲット'}
- ビジネス目標: ${businessGoal || 'リード獲得'}
- 業界: ${industry || '一般'}
- 競合優位性: ${competitiveAdvantage || '高品質なサービス'}
- デザイン嗜好: ${designPreference}

# 要求事項
1. **title**: ランディングページのメインタイトル（SEO最適化）
2. **description**: ページの説明文（meta description用）
3. **targetAudience**: 具体的なターゲット顧客像
4. **conversionGoal**: 具体的なコンバージョン目標
5. **sections**: 最適なセクション構成（3-8個）
6. **colorScheme**: ブランドに適したカラーパレット
7. **designStyle**: デザインスタイル

# セクション設計の原則
- Hero: 強力なファーストインプレッション
- Features: 主要な機能・利益
- Social Proof: 信頼性の証明
- CTA: 明確なアクション誘導
- FAQ: 疑問解消
- Footer: 必要な情報

各セクションには以下を含める：
- type: セクションタイプ
- title: セクションタイトル
- description: セクションの説明・目的
- priority: 重要度（1-10）
- content: 具体的なコンテンツ指示

# カラースキーム要件
- ブランドに適した配色
- コンバージョンを促進する色使い
- アクセシビリティ考慮
- トレンドを取り入れた現代的な配色

JSON形式で構造化された設計を出力してください。`;

    try {
      const { object: structure } = await generateObject({
        model: anthropic('claude-3-5-sonnet-20241022'),
        schema: LPStructureSchema,
        prompt: prompt,
        maxTokens: 3000,
        temperature: 0.7,
      });

      console.log('✅ LP Structure generated successfully:', structure.title);
      
      return {
        success: true,
        structure: structure,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalSections: structure.sections.length,
          averagePriority: structure.sections.reduce((acc, section) => acc + section.priority, 0) / structure.sections.length,
        }
      };
    } catch (error) {
      console.error('❌ LP Structure generation failed:', error);
      
      // フォールバック構造
      const fallbackStructure = {
        title: `${topic} - Landing Page`,
        description: `Professional landing page for ${topic}`,
        targetAudience: targetAudience || 'Target customers',
        conversionGoal: businessGoal || 'Generate leads',
        sections: [
          {
            type: 'hero' as const,
            title: 'Hero Section',
            description: `Compelling introduction for ${topic}`,
            priority: 10,
            content: `Create an impactful hero section that immediately communicates the value of ${topic}`,
          },
          {
            type: 'features' as const,
            title: 'Key Features',
            description: `Main features and benefits of ${topic}`,
            priority: 9,
            content: `Highlight the most important features and benefits`,
          },
          {
            type: 'cta' as const,
            title: 'Call to Action',
            description: 'Drive conversions with clear CTA',
            priority: 10,
            content: 'Strong call-to-action to achieve the business goal',
          },
        ],
        colorScheme: {
          primaryColor: '#0056B1',
          accentColor: '#FFB400',
          bgColor: '#F5F7FA',
          textColor: '#333333',
        },
        designStyle: designPreference as any,
      };

      return {
        success: false,
        structure: fallbackStructure,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          generatedAt: new Date().toISOString(),
          totalSections: fallbackStructure.sections.length,
          isFallback: true,
        }
      };
    }
  }
});