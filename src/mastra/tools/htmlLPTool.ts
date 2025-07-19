import { tool } from 'ai';
import { z } from 'zod';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export const htmlLPTool = tool({
  description: 'Generates HTML content for a specific section of a landing page using AI. Creates modern, responsive, and conversion-optimized sections.',
  parameters: z.object({
    topic: z.string().describe('The main topic or business focus of the landing page.'),
    sectionType: z.enum(['hero', 'features', 'testimonials', 'cta', 'faq', 'footer', 'about', 'pricing', 'contact']).describe('The type of section to generate.'),
    sectionIndex: z.number().optional().describe('Current section number in sequence (for ordering).'),
    totalSections: z.number().optional().describe('Total sections in the landing page (for context).'),
    content: z.string().optional().describe('Specific content requirements or key points for this section.'),
    colorScheme: z.object({
      primaryColor: z.string().optional().describe('Primary brand color hex code (e.g., #0056B1).'),
      accentColor: z.string().optional().describe('Accent color hex code (e.g., #FFB400).'),
      bgColor: z.string().optional().describe('Background color hex code (e.g., #F5F7FA).'),
      textColor: z.string().optional().describe('Main text color hex code (e.g., #333333).'),
    }).optional().describe('Color scheme for the section.'),
    designStyle: z.enum(['modern', 'minimalist', 'corporate', 'creative', 'tech', 'startup']).optional().default('modern').describe('Overall design style for the section.'),
    conversionGoal: z.string().optional().describe('Specific conversion goal (e.g., "email signup", "purchase", "demo request").'),
  }),
  execute: async ({ 
    topic, 
    sectionType, 
    sectionIndex, 
    totalSections, 
    content, 
    colorScheme, 
    designStyle, 
    conversionGoal 
  }) => {
    const uniqueSectionClass = `lp-section-${sectionType}-${Math.random().toString(36).substring(7)}`;

    // Arguments for the AI prompt
    const promptArgs = {
      topic: topic,
      sectionType: sectionType,
      content: content || `${sectionType} section for ${topic}`,
      sectionIndex: sectionIndex?.toString() || 'current',
      totalSections: totalSections?.toString() || 'N',
      primaryColor: colorScheme?.primaryColor || '#0056B1',
      accentColor: colorScheme?.accentColor || '#FFB400',
      bgColor: colorScheme?.bgColor || '#F5F7FA',
      textColor: colorScheme?.textColor || '#333333',
      designStyle: designStyle || 'modern',
      conversionGoal: conversionGoal || 'engagement',
      uniqueClass: uniqueSectionClass,
    };

    const baseDesignPrompt = `あなたはプロフェッショナルな「ランディングページデザイナー」です。

以下の要件に基づいて、高品質でコンバージョン重視のランディングページセクションのHTMLを生成してください。

# 要件
- トピック: ${promptArgs.topic}
- セクションタイプ: ${promptArgs.sectionType}
- コンテンツ要件: ${promptArgs.content}
- デザインスタイル: ${promptArgs.designStyle}
- コンバージョン目標: ${promptArgs.conversionGoal}
- セクション番号: ${promptArgs.sectionIndex}/${promptArgs.totalSections}

# カラースキーム
- プライマリーカラー: ${promptArgs.primaryColor}
- アクセントカラー: ${promptArgs.accentColor}
- 背景色: ${promptArgs.bgColor}
- テキストカラー: ${promptArgs.textColor}

# 生成ルール
1. **レスポンシブデザイン**: モバイルファーストで、全デバイスで美しく表示される
2. **Tailwind CSS**: 最新のTailwind CSSクラスのみを使用
3. **data-editable-id**: 編集可能な要素には \`data-editable-id="section-${promptArgs.sectionIndex}-element-X"\` を付与
4. **コンバージョン最適化**: CTAボタン、フォーム、視線誘導を考慮
5. **アクセシビリティ**: 適切なaria-label、alt属性、セマンティックHTML
6. **SEO**: 適切なheading構造、meta情報
7. **ユニーククラス**: ${promptArgs.uniqueClass} をルート要素に使用

# セクション別要件
${getSectionSpecificRequirements(sectionType, promptArgs)}

# 出力形式
- HTMLのみを出力（DOCTYPE、head、bodyタグは不要）
- <section>タグで囲む
- インラインスタイルは使用禁止
- 日本語コンテンツで自然な文章

生成してください：`;

    try {
      const { text } = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        prompt: baseDesignPrompt,
        maxTokens: 4000,
        temperature: 0.7,
      }, {});

      console.log(`✅ LP Section ${sectionIndex} (${sectionType}) HTML generated successfully`);
      
      // HTMLコンテンツの検証と清理
      const cleanHtml = cleanAndValidateHtml(text, uniqueSectionClass, sectionType, sectionIndex);
      
      return {
        html: cleanHtml,
        sectionType: sectionType,
        sectionIndex: sectionIndex,
        metadata: {
          topic: topic,
          designStyle: designStyle,
          conversionGoal: conversionGoal,
          colorScheme: colorScheme,
          uniqueClass: uniqueSectionClass,
        }
      };
    } catch (error) {
      console.error(`❌ LP Section ${sectionIndex} generation failed:`, error);
      
      // フォールバックHTML
      const fallbackHtml = generateFallbackHtml(sectionType, sectionIndex, promptArgs);
      
      return {
        html: fallbackHtml,
        sectionType: sectionType,
        sectionIndex: sectionIndex,
        metadata: {
          topic: topic,
          isError: true,
          uniqueClass: uniqueSectionClass,
        }
      };
    }
  }
});

// セクション別の詳細要件を取得
function getSectionSpecificRequirements(sectionType: string, promptArgs: any): string {
  switch (sectionType) {
    case 'hero':
      return `
## Hero Section要件
- インパクトのあるヘッドライン
- 価値提案の明確な表現
- 目立つCTAボタン
- 背景画像またはグラデーション
- ソーシャルプルーフ（可能であれば）
- スクロール誘導要素`;

    case 'features':
      return `
## Features Section要件
- 3-6個の主要機能
- アイコンまたは画像付き
- 利益重視の説明文
- グリッドレイアウト
- ホバーエフェクト`;

    case 'testimonials':
      return `
## Testimonials Section要件
- 3-5個の顧客の声
- 顧客写真（プレースホルダー）
- 会社名・役職
- 星評価
- カルーセルまたはグリッド表示`;

    case 'cta':
      return `
## CTA Section要件
- 強力なアクション文言
- 目立つボタン
- 緊急性の演出
- 簡潔なフォーム（必要に応じて）
- 背景にコントラスト`;

    case 'faq':
      return `
## FAQ Section要件
- アコーディオン形式
- 5-8個のよくある質問
- 検索しやすい構造
- 折りたたみアニメーション`;

    case 'footer':
      return `
## Footer Section要件
- 連絡先情報
- ソーシャルメディアリンク
- プライバシーポリシー
- サイトマップ
- 著作権表示`;

    default:
      return `
## ${sectionType} Section要件
- セクションの目的に応じた適切なコンテンツ
- 視覚的階層の明確化
- コンバージョンを促進する要素`;
  }
}

// HTMLクリーニングと検証
function cleanAndValidateHtml(html: string, uniqueClass: string, sectionType: string, sectionIndex?: number): string {
  // 基本的なHTMLクリーニング
  let cleanHtml = html.trim();
  
  // マークダウンのコードブロックを除去
  cleanHtml = cleanHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '');
  
  // sectionタグが無い場合は追加
  if (!cleanHtml.includes('<section')) {
    cleanHtml = `<section class="${uniqueClass} py-16" data-editable-id="section-${sectionIndex}-root">\n${cleanHtml}\n</section>`;
  }
  
  return cleanHtml;
}

// フォールバックHTML生成
function generateFallbackHtml(sectionType: string, sectionIndex?: number, promptArgs?: any): string {
  const uniqueClass = promptArgs?.uniqueClass || `lp-section-${sectionType}-fallback`;
  
  return `<section class="${uniqueClass} py-16 bg-gray-50" data-editable-id="section-${sectionIndex}-root">
    <div class="container mx-auto px-4 text-center">
      <h2 class="text-3xl font-bold text-gray-800 mb-4" data-editable-id="section-${sectionIndex}-title">
        ${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Section
      </h2>
      <p class="text-gray-600 mb-8" data-editable-id="section-${sectionIndex}-description">
        This ${sectionType} section is currently being generated. Please try again.
      </p>
      <div class="text-sm text-gray-500" data-editable-id="section-${sectionIndex}-topic">
        Topic: ${promptArgs?.topic || 'Landing Page'}
      </div>
    </div>
  </section>`;
}