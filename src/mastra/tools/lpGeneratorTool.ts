
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// Define the schema for a single section of the LP
const sectionSchema = z.object({
  type: z.enum(['hero', 'features', 'testimonials', 'cta', 'faq', 'footer', 'about', 'pricing', 'contact']).describe('The type of section'),
  prompt: z.string().min(10).describe('A detailed prompt for the AI to generate this specific section.'),
  layoutType: z.enum(['default', 'image-left', 'image-right', 'full-graphic', 'quote', 'comparison', 'timeline', 'list', 'title', 'section-break', 'data-visualization', 'photo-with-caption']).optional().default('default').describe('The desired layout type for this section.'),
});

// Define the schema for the overall LP structure
const lpStructureSchema = z.object({
  title: z.string().describe('The main title of the landing page'),
  description: z.string().describe('A brief description of the landing page purpose'),
  sections: z.array(sectionSchema).min(3).max(10).describe('An array of sections that make up the landing page.'),
  colorScheme: z.object({
    primaryColor: z.string().default('#0056B1'),
    accentColor: z.string().default('#FFB400'),
    bgColor: z.string().default('#F5F7FA'),
    textColor: z.string().default('#333333'),
  }).describe('Color scheme for the landing page'),
  designStyle: z.enum(['modern', 'minimalist', 'corporate', 'creative', 'tech', 'startup']).default('modern').describe('Overall design style'),
});

// Define the schema for the generated HTML of a single section
const sectionHtmlSchema = z.object({
  html: z.string().min(50).describe('The HTML content for the section, styled with Tailwind CSS. Must be valid HTML without html, head, or body tags.'),
});

type LPSection = z.infer<typeof sectionSchema>;

/**
 * Generates the overall structure (outline) of the landing page as a JSON object.
 */
async function generateLPStructure(topic: string) {
  try {
    const { object: structure } = await generateObject({
      model: createAnthropic()('claude-3-5-sonnet-20241022'),
      schema: lpStructureSchema,
      maxTokens: 2000,
      temperature: 0.7,
      prompt: `あなたはプロフェッショナルなランディングページ戦略コンサルタントです。
「${topic}」についての高品質なランディングページ構造を設計してください。

# 設計要件
1. **title**: SEO最適化されたページタイトル
2. **description**: 魅力的なページ説明文（120文字以内）
3. **sections**: 3-8個の効果的なセクション構成
4. **colorScheme**: ブランドに適したカラーパレット
5. **designStyle**: ターゲット層に適したデザインスタイル

# セクション設計原則
- Hero: インパクトのあるファーストインプレッション
- Features: 具体的な価値提案と利益
- Social Proof: 信頼性とケーススタディ
- CTA: 明確なアクション誘導
- FAQ: 疑問解消とオブジェクション処理

# 利用可能なセクションタイプ
- hero, features, testimonials, cta, faq, footer, about, pricing, contact

# 利用可能なレイアウトタイプ  
- default, image-left, image-right, full-graphic, quote, comparison, timeline, list, title, section-break, data-visualization, photo-with-caption

各セクションには：
- type: セクションタイプ
- prompt: 具体的で詳細なセクション生成指示（50文字以上）
- layoutType: 最適なレイアウトタイプ

コンバージョン最適化を重視し、ユーザージャーニーを考慮した構成にしてください。`,
    });
    
    console.log('✅ LP Structure generated successfully:', structure.title);
    return structure;
  } catch (error) {
    console.error('❌ Structure generation failed:', error);
    // Enhanced fallback structure
    return {
      title: `${topic} - プロフェッショナルランディングページ`,
      description: `${topic}の魅力を最大限に伝える高品質なランディングページ`,
      sections: [
        {
          type: 'hero' as const,
          prompt: `${topic}のためのインパクトのあるヒーローセクションを作成。強力なヘッドライン、価値提案、明確なCTAボタンを含める。視覚的に魅力的で信頼性を演出する`,
          layoutType: 'full-graphic' as const
        },
        {
          type: 'features' as const,
          prompt: `${topic}の主要な特徴と利益を3-6個のポイントで紹介。各特徴にはアイコンと簡潔な説明文を付ける。ユーザーの問題解決に焦点を当てる`,
          layoutType: 'default' as const
        },
        {
          type: 'testimonials' as const,
          prompt: `${topic}の顧客体験談セクション。3-4個の信頼できる証言、顧客写真、評価スター、具体的な成果を含める。信頼性を高める要素を追加`,
          layoutType: 'quote' as const
        },
        {
          type: 'cta' as const,
          prompt: `${topic}のための強力なコールトゥアクションセクション。緊急性を演出し、行動を促す明確なメッセージとボタンを配置。背景にコントラストを効かせる`,
          layoutType: 'full-graphic' as const
        }
      ],
      colorScheme: {
        primaryColor: '#0056B1',
        accentColor: '#FFB400', 
        bgColor: '#F5F7FA',
        textColor: '#333333'
      },
      designStyle: 'modern' as const
    };
  }
}

/**
 * Generate CSS custom properties for dynamic color scheme
 */
function generateColorVariables(colorScheme: any): string {
  const colors = colorScheme || {
    primaryColor: '#0056B1',
    accentColor: '#FFB400',
    bgColor: '#F5F7FA',
    textColor: '#333333'
  };
  
  return `
    --primary-color: ${colors.primaryColor};
    --accent-color: ${colors.accentColor};
    --bg-color: ${colors.bgColor};
    --text-color: ${colors.textColor};
    --primary-rgb: ${hexToRgb(colors.primaryColor)};
    --accent-rgb: ${hexToRgb(colors.accentColor)};
    --bg-rgb: ${hexToRgb(colors.bgColor)};
  `;
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 86, 177';
}

/**
 * Generate custom CSS content for the LP
 */
function generateCustomCSS(colorScheme: any, designStyle: string): string {
  const colorVars = generateColorVariables(colorScheme);
  
  return `
<style>
  :root {
    ${colorVars}
  }
  
  /* Dynamic color classes */
  .bg-primary { background-color: var(--primary-color) !important; }
  .bg-accent { background-color: var(--accent-color) !important; }
  .bg-custom { background-color: var(--bg-color) !important; }
  .text-primary { color: var(--primary-color) !important; }
  .text-accent { color: var(--accent-color) !important; }
  .text-custom { color: var(--text-color) !important; }
  .border-primary { border-color: var(--primary-color) !important; }
  .border-accent { border-color: var(--accent-color) !important; }
  
  /* Gradient backgrounds */
  .bg-primary-gradient {
    background: linear-gradient(135deg, var(--primary-color), rgba(var(--primary-rgb), 0.8)) !important;
  }
  .bg-accent-gradient {
    background: linear-gradient(135deg, var(--accent-color), rgba(var(--accent-rgb), 0.8)) !important;
  }
  
  /* Enhanced hover effects */
  .hover-primary:hover {
    background-color: var(--primary-color) !important;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(var(--primary-rgb), 0.3);
  }
  .hover-accent:hover {
    background-color: var(--accent-color) !important;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(var(--accent-rgb), 0.3);
  }
  
  /* Modern design enhancements */
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .floating-animation {
    animation: floating 3s ease-in-out infinite;
  }
  
  @keyframes floating {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  /* Section-specific enhancements */
  .hero-gradient {
    background: linear-gradient(135deg, var(--bg-color), rgba(var(--primary-rgb), 0.1));
  }
  
  .feature-card {
    transition: all 0.3s ease;
    border: 1px solid rgba(var(--primary-rgb), 0.1);
  }
  
  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(var(--primary-rgb), 0.15);
    border-color: var(--accent-color);
  }
</style>
  `;
}

/**
 * Generates the HTML for a single section based on its definition using enhanced prompts from Open_SuperAgent style.
 */
async function generateSectionHtml(section: LPSection, sectionIndex: number, structure: any) {
  const uniqueSectionClass = `lp-section-${section.type}-${Math.random().toString(36).substring(7)}`;
  
  // Enhanced prompt based on Open_SuperAgent's htmlSlideTool approach
  const enhancedPrompt = `あなたはプロフェッショナルな「ランディングページデザイナー」です。
企業レベルの高品質なランディングページセクションを作成してください。

【重要】出力形式の絶対的ルール
必ず以下の形式で出力してください：
{"html": "完全なHTMLコンテンツ"}

【入力パラメータ】
・セクションタイプ: ${section.type}
・レイアウトタイプ: ${section.layoutType || 'default'}
・セクション指示: ${section.prompt}
・セクション番号: ${sectionIndex}
・プライマリーカラー: ${structure.colorScheme?.primaryColor || '#0056B1'}
・アクセントカラー: ${structure.colorScheme?.accentColor || '#FFB400'}
・背景色: ${structure.colorScheme?.bgColor || '#F5F7FA'}
・テキストカラー: ${structure.colorScheme?.textColor || '#333333'}
・デザインスタイル: ${structure.designStyle || 'modern'}

【カラースキーム適用ルール】
- プライマリーカラーは主要なCTAボタン、ヘッダー、重要な要素に使用
- アクセントカラーはハイライト、ホバー効果、アクションを促すアクセントに使用
- 背景色は全体の背景やカードの背景に使用
- 以下のクラスを積極的に使用してください：
  * bg-primary, bg-accent, bg-custom (背景色)
  * text-primary, text-accent, text-custom (テキスト色)
  * border-primary, border-accent (ボーダー色)
  * bg-primary-gradient, bg-accent-gradient (グラデーション背景)
  * hover-primary, hover-accent (ホバー効果)
  * hero-gradient (ヒーローセクション用)
  * feature-card (フィーチャーカード用)

【最優先事項】
1. **プロ品質のLPデザイン** - AppleやGoogleのランディングページに匹敵する美しさ
2. **コンバージョン最適化** - CTAボタン、視線誘導、行動喚起を重視
3. **モバイルファーストレスポンシブ** - 全デバイスで美しく表示
4. **視覚的情報伝達** - アイコン、図解、視覚要素を効果的に配置

【出力要件】
1. **JSON形式で出力**: {"html": "HTMLコンテンツ"}
2. **Tailwind CSSクラスのみ使用**
3. **data-editable-id属性を主要要素に付与**: data-editable-id="section-${sectionIndex}-element-X"
4. **レスポンシブデザイン**: sm:, md:, lg:, xl: プレフィックスを活用
5. **アクセシビリティ**: aria-label、alt属性、適切なheading構造
6. **ユニーククラス**: ${uniqueSectionClass} をルート要素に追加

【レイアウト別要件】
${getLayoutSpecificRequirements(section.layoutType || 'default')}

【セクション別デザインガイドライン】
${getSectionDesignGuidelines(section.type)}

【モダンデザイン要素（必須）】
- 洗練されたグラデーション背景
- 適切なホワイトスペース活用
- ドロップシャドウ・borders効果
- ホバーアニメーション
- 視覚的階層の明確化

【絶対禁止事項】
- <html>, <head>, <body>タグの使用
- インラインスタイルの使用
- 外部画像URL（SVGアイコンは可）
- 説明文、コメント、マークダウンの出力
- JSON以外の形式での出力`;

  try {
    const { text } = await generateText({
      model: createAnthropic()('claude-3-5-sonnet-20241022'),
      prompt: enhancedPrompt,
      maxTokens: 4000,
      temperature: 0.7,
    });
    
    // Parse JSON response
    let htmlContent = '';
    try {
      const jsonResponse = JSON.parse(text.trim());
      htmlContent = jsonResponse.html || text;
    } catch {
      // If JSON.parse fails, attempt to extract the HTML value manually
      const regexMatch = text.trim().match(/"html"\s*:\s*"([\s\S]*?)"\s*\}?$/);
      if (regexMatch && regexMatch[1]) {
        // Unescape any escaped quotes
        htmlContent = regexMatch[1].replace(/\\"/g, '"');
      } else {
        // Fallback: treat entire text as HTML
        htmlContent = text.trim();
      }
    }
    
    // HTMLコンテンツの検証と清理
    if (!htmlContent || htmlContent.length < 50) {
      throw new Error('Generated HTML is too short or invalid');
    }
    
    // Ensure proper section wrapper
    if (!htmlContent.includes('<section')) {
      htmlContent = `<section class="${uniqueSectionClass} py-16" data-editable-id="section-${sectionIndex}-root">\n${htmlContent}\n</section>`;
    }
    
    console.log(`✅ Section ${sectionIndex} (${section.type}) HTML generated successfully`);
    return htmlContent;
  } catch (error) {
    console.error(`❌ Section ${sectionIndex} generation failed:`, error);
    
    // Enhanced fallback HTML with better design
    return generateEnhancedFallbackHtml(section, sectionIndex, uniqueSectionClass);
  }
}

// Layout-specific requirements
function getLayoutSpecificRequirements(layoutType: string): string {
  switch (layoutType) {
    case 'image-left':
      return '- 左側に視覚要素（SVGアイコン、図解）、右側にテキストコンテンツ\n- 2カラムレスポンシブレイアウト';
    case 'image-right':
      return '- 右側に視覚要素（SVGアイコン、図解）、左側にテキストコンテンツ\n- 2カラムレスポンシブレイアウト';
    case 'full-graphic':
      return '- 背景全体にグラデーションまたは図解パターン\n- 中央にメインメッセージを配置';
    case 'quote':
      return '- 引用文を中央に大きく表示\n- 引用者情報を右下に小さく配置';
    case 'comparison':
      return '- 左右または上下で項目を比較する2カラム構成\n- 対比を明確にする視覚的要素';
    case 'timeline':
      return '- 水平または垂直のタイムライン表示\n- 各ステップに番号とアイコンを配置';
    case 'list':
      return '- 箇条書きを中心とした構成（最大6項目）\n- 各項目にアイコンまたは番号を付与';
    default:
      return '- 大きな見出し、簡潔な本文、視覚的要素をバランス良く配置\n- 3カラムまたはグリッドレイアウト';
  }
}

// Section-specific design guidelines
function getSectionDesignGuidelines(sectionType: string): string {
  switch (sectionType) {
    case 'hero':
      return `
## Hero Section専用ガイドライン
- インパクトのあるヘッドライン（32-48px）
- サブタイトル（18-24px）
- 目立つCTAボタン（プライマリーカラー）
- 背景グラデーションまたはパターン
- スクロール誘導アイコン
- ソーシャルプルーフ要素`;
    case 'features':
      return `
## Features Section専用ガイドライン
- 3-6個の主要機能を3カラムグリッドで配置
- 各機能にSVGアイコン（24x24px以上）
- 機能名（20-24px太字）+ 説明文（16-18px）
- ホバーエフェクト（transform、shadow）
- カード形式のデザイン`;
    case 'testimonials':
      return `
## Testimonials Section専用ガイドライン
- 3-4個の顧客証言をカード形式で表示
- 各証言に顧客アバター（円形、64x64px）
- 星評価（★★★★★）
- 会社名・役職情報
- 引用符アイコン
- カルーセルまたはグリッド表示`;
    case 'cta':
      return `
## CTA Section専用ガイドライン
- 強力なアクション促進文言
- 大きなCTAボタン（アクセントカラー）
- 緊急性を演出する要素
- コントラストの強い背景
- シンプルで焦点を絞った構成`;
    case 'faq':
      return `
## FAQ Section専用ガイドライン
- アコーディオン形式（5-8個の質問）
- 質問は太字、回答は通常フォント
- 開閉アイコン（+/-または矢印）
- ホバー・アクティブ状態のスタイリング`;
    default:
      return `
## ${sectionType} Section専用ガイドライン
- セクションの目的に応じた適切な構成
- 視覚的階層の明確化
- コンバージョンを促進する要素の配置`;
  }
}

// Enhanced fallback HTML generator with dynamic colors
function generateEnhancedFallbackHtml(section: LPSection, sectionIndex: number, uniqueClass: string): string {
  
  return `<section class="${uniqueClass} py-16 hero-gradient" data-editable-id="section-${sectionIndex}-root">
    <div class="container mx-auto px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary bg-opacity-10 rounded-full mb-6 floating-animation" data-editable-id="section-${sectionIndex}-icon">
          <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-4xl font-bold text-custom mb-6" data-editable-id="section-${sectionIndex}-title">
          ${section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
        </h2>
        <p class="text-xl text-custom opacity-80 mb-8 leading-relaxed" data-editable-id="section-${sectionIndex}-description">
          このセクションは現在生成中です。高品質なコンテンツをお届けするため、少々お待ちください。
        </p>
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-accent feature-card" data-editable-id="section-${sectionIndex}-content">
          <p class="text-custom text-left">
            <strong>セクションタイプ:</strong> ${section.type}<br>
            <strong>レイアウト:</strong> ${section.layoutType || 'default'}<br>
            <strong>生成指示:</strong> ${section.prompt}
          </p>
        </div>
        <button class="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover-primary transition-all duration-200" data-editable-id="section-${sectionIndex}-cta">
          再生成する
          <svg class="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>
    </div>
  </section>`;
}

export async function generateUnifiedLP({ topic }: { topic: string }) {
    console.log(`🚀 Starting LP generation for: ${topic}`);
    const startTime = Date.now();

    try {
        // Step 1: Generate the structure (faster with reduced complexity)
        console.log('📋 Step 1: Generating LP structure...');
        const structureStart = Date.now();
        const structure = await generateLPStructure(topic);
        console.log(`✅ LP Structure generated in ${Date.now() - structureStart}ms:`, structure);

        // Step 2: Generate HTML for each section in parallel with concurrency limit
        console.log('🎨 Step 2: Generating HTML for each section...');
        const htmlStart = Date.now();
        
        // Process in smaller batches to avoid API rate limits
        const batchSize = 2;
        const sectionHtmls: string[] = [];
        
        for (let i = 0; i < structure.sections.length; i += batchSize) {
            const batch = structure.sections.slice(i, i + batchSize);
            const batchPromises = batch.map((section, batchIndex) => 
                generateSectionHtml(section, i + batchIndex, structure)
            );
            
            console.log(`⚡ Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(structure.sections.length/batchSize)}`);
            const batchResults = await Promise.all(batchPromises);
            sectionHtmls.push(...batchResults);
        }
        
        console.log(`✅ All sections HTML generated in ${Date.now() - htmlStart}ms`);

        // Step 3: Combine all HTML parts
        console.log('🔧 Step 3: Combining all HTML sections...');
        const combineStart = Date.now();
        const fullHtmlContent = sectionHtmls.join('\n\n');
        console.log(`✅ HTML combined in ${Date.now() - combineStart}ms`);

        const totalTime = Date.now() - startTime;
        console.log(`🎉 LP generation completed in ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);

        // Step 4: Generate custom CSS for dynamic colors
        console.log('🎨 Step 4: Generating custom CSS...');
        const cssStart = Date.now();
        const customCSS = generateCustomCSS(structure.colorScheme, structure.designStyle);
        console.log(`✅ Custom CSS generated in ${Date.now() - cssStart}ms`);

        // Return the final object
        return {
            htmlContent: fullHtmlContent,
            cssContent: customCSS,
            structure,
            metadata: {
                generationTime: totalTime,
                sectionCount: structure.sections.length,
                topic: topic
            }
        };
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`❌ LP generation failed after ${totalTime}ms:`, error);
        throw error;
    }
}