// @ts-nocheck
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const makeImagePromptsSchema = z.object({
  html: z.string().describe('生成されたHTMLコード'),
  copyContent: z.string().describe('作成されたコピー内容'),
  brandDirection: z.string().optional().describe('ブランドガイドライン'),
  targetAudience: z.string().describe('ターゲットオーディエンス'),
  wireframe: z.string().optional().describe('ワイヤーフレーム設計'),
});

const imagePromptSchema = z.object({
  id: z.string().describe('画像ID'),
  fileName: z.string().describe('ファイル名'),
  section: z.string().describe('配置セクション'),
  purpose: z.string().describe('画像の目的・役割'),
  aspectRatio: z.string().describe('アスペクト比'),
  resolution: z.string().describe('推奨解像度'),
  prompt: z.string().describe('画像生成プロンプト'),
  negativePrompt: z.string().describe('否定プロンプト'),
  style: z.string().describe('スタイル指定'),
  priority: z.enum(['high', 'medium', 'low']).describe('優先度'),
  alternatives: z.array(z.string()).describe('代替プロンプト案'),
});

const makeImagePromptsOutputSchema = z.object({
  imagePrompts: z.array(imagePromptSchema).describe('画像生成プロンプト一覧'),
  brandingGuidelines: z.object({
    colorPalette: z.array(z.string()).describe('カラーパレット'),
    visualStyle: z.string().describe('ビジュアルスタイル'),
    mood: z.string().describe('雰囲気・トーン'),
    consistency: z.string().describe('一貫性ガイドライン'),
  }),
  technicalSpecs: z.object({
    formats: z.array(z.string()).describe('推奨フォーマット'),
    optimization: z.string().describe('最適化指針'),
    accessibility: z.string().describe('アクセシビリティ対応'),
  }),
  implementation: z.object({
    fileStructure: z.string().describe('ファイル配置構造'),
    htmlIntegration: z.string().describe('HTML統合方法'),
    responsiveStrategy: z.string().describe('レスポンシブ対応戦略'),
  }),
});

export const makeImagePromptsTool = createTool({
  id: 'makeImagePrompts',
  description: 'ランディングページの画像に対応する詳細な画像生成プロンプトを作成する',
  inputSchema: makeImagePromptsSchema,
  outputSchema: makeImagePromptsOutputSchema,
  execute: async ({ html, copyContent, brandDirection, targetAudience, wireframe }) => {
    
    // HTMLから画像要素を解析
    const imageElements = extractImageElementsFromHTML(html);
    
    // ブランディングガイドライン設定
    const brandingGuidelines = {
      colorPalette: [
        '#0066cc', // プライマリブルー
        '#ff6b35', // セカンダリオレンジ
        '#00c851', // アクセントグリーン
        '#ffffff', // ホワイト
        '#f5f5f5', // ライトグレー
        '#212121', // ダークグレー
      ],
      visualStyle: `
現代的でプロフェッショナル、信頼感を与えるビジュアルスタイル。
- クリーンで洗練されたデザイン
- ビジネス向けの上品な印象
- 技術力と専門性を表現
- 親しみやすさと信頼性のバランス
      `,
      mood: '信頼性、プロフェッショナリズム、革新性、親しみやすさ',
      consistency: `
全ての画像で以下の要素を統一:
- カラーパレットの一貫した使用
- 照明とコントラストの品質
- フォトグラフィックスタイルの統一
- 人物の多様性と包括性
- ブランド価値との整合性
      `,
    };

    // 画像プロンプト生成
    const imagePrompts = [
      // ヒーロー画像
      {
        id: 'hero-main',
        fileName: 'hero-main.webp',
        section: 'hero',
        purpose: 'メインビジュアルとしてユーザーの注意を引き、プロフェッショナリズムを表現',
        aspectRatio: '16:9',
        resolution: '1920x1080',
        prompt: `
Professional modern workspace with multiple monitors displaying web analytics dashboards and landing page designs, clean minimalist office environment, natural lighting from large windows, contemporary furniture, subtle blue accent lighting (#0066cc), high-tech atmosphere, depth of field, professional photography style, ultra-sharp focus, premium quality, inspirational and aspirational mood
        `,
        negativePrompt: 'cluttered, messy, outdated technology, poor lighting, blurry, low quality, stock photo feel, generic office, watermark, text overlay',
        style: 'Professional commercial photography, clean and modern aesthetic',
        priority: 'high' as const,
        alternatives: [
          'Modern team collaboration in bright office space with laptops and design materials, diverse professionals working together, innovative atmosphere',
          'Minimalist desk setup with laptop displaying beautiful landing page, coffee cup, notebook, natural lighting, productivity concept',
        ],
      },
      
      // 解決策セクションのグラフ画像
      {
        id: 'solution-chart',
        fileName: 'solution-chart.webp',
        section: 'solution',
        purpose: 'コンバージョン率向上を視覚的に示すインフォグラフィック',
        aspectRatio: '4:3',
        resolution: '1200x900',
        prompt: `
Clean modern infographic showing upward trending conversion rate graph, professional business chart with blue (#0066cc) and orange (#ff6b35) color scheme, rising arrow indicators, percentage improvement metrics, minimalist design, white background, professional data visualization, clear typography, business growth concept, vector-style illustration
        `,
        negativePrompt: 'complex, cluttered, hard to read, unprofessional colors, comic style, low resolution, blurry text',
        style: 'Clean vector infographic style, professional business visualization',
        priority: 'high' as const,
        alternatives: [
          'Split-screen comparison showing before/after conversion metrics with clear visual improvements',
          '3D bar chart visualization showing progressive improvement over time with professional styling',
        ],
      },

      // お客様の声の写真
      {
        id: 'testimonial-1',
        fileName: 'testimonial-1.webp',
        section: 'testimonials',
        purpose: 'お客様の信頼性を高める人物写真',
        aspectRatio: '1:1',
        resolution: '400x400',
        prompt: `
Professional Japanese business person headshot, middle-aged man in modern business attire, confident and friendly expression, clean studio lighting, neutral background, corporate photography style, high quality portrait, trustworthy appearance, slight smile, professional but approachable
        `,
        negativePrompt: 'casual clothing, unprofessional, poor lighting, blurry, stock photo feel, overly posed, artificial smile',
        style: 'Professional corporate headshot photography',
        priority: 'medium' as const,
        alternatives: [
          'Professional female business leader with confident expression in modern office setting',
          'Diverse business professional in contemporary workspace with natural lighting',
        ],
      },

      {
        id: 'testimonial-2',
        fileName: 'testimonial-2.webp',
        section: 'testimonials',
        purpose: 'お客様の信頼性を高める人物写真（多様性考慮）',
        aspectRatio: '1:1',
        resolution: '400x400',
        prompt: `
Professional Japanese businesswoman headshot, confident and intelligent expression, modern professional attire, studio lighting, clean neutral background, corporate photography style, high quality portrait, trustworthy and competent appearance, natural smile, professional demeanor
        `,
        negativePrompt: 'casual clothing, unprofessional, poor lighting, blurry, stock photo feel, overly posed, artificial expression',
        style: 'Professional corporate headshot photography',
        priority: 'medium' as const,
        alternatives: [
          'Young professional in tech industry with modern casual-business attire',
          'Senior executive with extensive experience, authoritative yet approachable',
        ],
      },

      // ロゴ・ブランディング
      {
        id: 'logo',
        fileName: 'logo.svg',
        section: 'header',
        purpose: 'ブランドアイデンティティを表現するロゴ',
        aspectRatio: '3:1',
        resolution: 'SVG Vector',
        prompt: `
Modern professional logo design for landing page creation service, clean typography with "Professional LP Creator" text, blue (#0066cc) primary color with subtle gradient, minimalist design, vector graphics, scalable, memorable, tech-forward aesthetic, professional services branding
        `,
        negativePrompt: 'complex, cluttered, hard to read, unprofessional, comic style, low quality, raster graphics',
        style: 'Modern vector logo design, minimalist and professional',
        priority: 'high' as const,
        alternatives: [
          'Abstract geometric logo combining LP and growth arrow elements',
          'Typography-focused logo with subtle tech elements and professional color scheme',
        ],
      },

      // Open Graph / ソーシャルメディア画像
      {
        id: 'og-image',
        fileName: 'og-image.jpg',
        section: 'meta',
        purpose: 'ソーシャルメディアでのシェア時に表示される画像',
        aspectRatio: '1.91:1',
        resolution: '1200x630',
        prompt: `
Professional social media banner for landing page service, modern typography displaying "プロフェッショナルランディングページ", blue (#0066cc) and white color scheme, clean background with subtle geometric patterns, laptop displaying beautiful landing page, professional and trustworthy design, high impact visual for social sharing
        `,
        negativePrompt: 'cluttered, unprofessional, poor typography, low quality, generic stock photo feel',
        style: 'Modern social media graphics design, professional and engaging',
        priority: 'medium' as const,
        alternatives: [
          'Infographic-style social banner highlighting key benefits and conversion rate improvements',
          'Professional team working on landing page projects with service branding overlay',
        ],
      },

      // Twitter用画像
      {
        id: 'twitter-image',
        fileName: 'twitter-image.jpg',
        section: 'meta',
        purpose: 'Twitter Card用の画像',
        aspectRatio: '2:1',
        resolution: '1200x600',
        prompt: `
Twitter-optimized image for professional landing page service, concise visual messaging, modern design with blue (#0066cc) branding, clean typography, laptop or device showing landing page success, professional and credible appearance, optimized for social media engagement
        `,
        negativePrompt: 'cluttered text, unprofessional, low quality, generic appearance, poor readability',
        style: 'Social media optimized design, clean and professional',
        priority: 'low' as const,
        alternatives: [
          'Statistics-focused design showing conversion improvements with clean visual hierarchy',
          'Before/after comparison of landing page effectiveness with professional styling',
        ],
      },

      // アイコン・装飾要素
      {
        id: 'feature-bg',
        fileName: 'feature-section-bg.webp',
        section: 'features',
        purpose: '特徴セクションの背景装飾',
        aspectRatio: '16:9',
        resolution: '1920x1080',
        prompt: `
Subtle abstract background pattern for professional website, light blue (#f8fbff) base with geometric elements, minimal and clean design, subtle gradients, professional web design aesthetic, not distracting, suitable for text overlay, modern and sophisticated
        `,
        negativePrompt: 'busy, distracting, loud colors, complex patterns, unprofessional',
        style: 'Subtle abstract background design, minimal and professional',
        priority: 'low' as const,
        alternatives: [
          'Clean gradient background with subtle tech-inspired geometric elements',
          'Minimalist dot pattern with professional color scheme and subtle depth',
        ],
      },
    ];

    // 技術仕様
    const technicalSpecs = {
      formats: ['WebP (推奨)', 'AVIF (次世代対応)', 'JPEG (フォールバック)', 'PNG (透明度必要時)', 'SVG (ロゴ・アイコン)'],
      optimization: `
画像最適化戦略:
- WebPフォーマットで80-90%品質での圧縮
- レスポンシブ対応のsrcset属性実装
- 遅延読み込み(lazy loading)の適用
- Critical画像の事前読み込み(preload)
- 適切なalt属性によるアクセシビリティ対応
- Core Web Vitals (LCP, CLS) 最適化
      `,
      accessibility: `
アクセシビリティガイドライン:
- 意味のある代替テキスト(alt属性)の設定
- 装飾的画像にはaria-hidden="true"
- 十分なコントラスト比の確保
- 情報を伝える画像にはキャプション追加
- 色覚異常者にも配慮した色使い
- スクリーンリーダー対応の画像説明
      `,
    };

    // 実装ガイド
    const implementation = {
      fileStructure: `
assets/images/
├── hero/
│   └── hero-main.webp
├── sections/
│   ├── solution-chart.webp
│   └── feature-section-bg.webp
├── testimonials/
│   ├── testimonial-1.webp
│   └── testimonial-2.webp
├── meta/
│   ├── og-image.jpg
│   └── twitter-image.jpg
└── brand/
    └── logo.svg
      `,
      htmlIntegration: `
HTML統合時の実装例:

<!-- ヒーロー画像（クリティカル） -->
<img src="/assets/images/hero/hero-main.webp" 
     alt="プロフェッショナルなランディングページのイメージ" 
     class="hero-img" 
     loading="eager"
     width="1920" 
     height="1080">

<!-- レスポンシブ対応画像 -->
<picture>
  <source media="(min-width: 1024px)" srcset="/assets/images/solution-chart.webp">
  <source media="(min-width: 768px)" srcset="/assets/images/solution-chart-tablet.webp">
  <img src="/assets/images/solution-chart-mobile.webp" 
       alt="コンバージョン率向上グラフ" 
       loading="lazy">
</picture>

<!-- Open Graph画像 -->
<meta property="og:image" content="/assets/images/meta/og-image.jpg">
      `,
      responsiveStrategy: `
レスポンシブ画像戦略:

1. ブレークポイント別最適化
   - モバイル: 480px幅で最適化
   - タブレット: 768px幅で最適化  
   - デスクトップ: 1200px幅で最適化
   - 大画面: 1920px幅で最適化

2. アートディレクション
   - モバイル: 正方形比率で重要部分をクロップ
   - デスクトップ: ワイド比率でフル画像表示

3. パフォーマンス優先順位
   - Above the fold: eager loading
   - Below the fold: lazy loading
   - 装飾画像: 最低優先度での読み込み
      `,
    };

    return {
      imagePrompts,
      brandingGuidelines,
      technicalSpecs,
      implementation,
    };
  },
});

// HTMLから画像要素を抽出するヘルパー関数
function extractImageElementsFromHTML(html: string): Array<{
  tag: string;
  src?: string;
  alt?: string;
  class?: string;
  section?: string;
}> {
  // 簡易HTMLパーサー（実際の実装では jsdom などを使用）
  const imgRegex = /<img[^>]*>/gi;
  const matches = html.match(imgRegex) || [];
  
  return matches.map(match => {
    const srcMatch = match.match(/src=["']([^"']*)["']/);
    const altMatch = match.match(/alt=["']([^"']*)["']/);
    const classMatch = match.match(/class=["']([^"']*)["']/);
    
    return {
      tag: match,
      src: srcMatch ? srcMatch[1] : undefined,
      alt: altMatch ? altMatch[1] : undefined,
      class: classMatch ? classMatch[1] : undefined,
    };
  });
}