import { createTool } from '@mastra/core/tools';
import { z } from 'zod';


const planFileStructureSchema = z.object({
  concept: z.string().describe('サイトのコンセプトとデザイン方向性'),
  copyContent: z.string().describe('作成されたコピー内容'),
  wireframe: z.string().describe('ワイヤーフレーム設計'),
  targetAudience: z.string().describe('ターゲットオーディエンス'),
});

const planFileStructureOutputSchema = z.object({
  fileStructure: z.object({
    description: z.string().describe('ファイル構造の説明'),
    structure: z.string().describe('推奨ファイルツリー構造'),
  }),
  implementationStrategy: z.object({
    htmlApproach: z.string().describe('HTML実装方針'),
    cssApproach: z.string().describe('CSS実装方針'),
    jsApproach: z.string().describe('JavaScript実装方針'),
    performanceStrategy: z.string().describe('パフォーマンス最適化戦略'),
  }),
  technicalSpecs: z.object({
    responsive: z.string().describe('レスポンシブデザイン仕様'),
    seo: z.string().describe('SEO最適化仕様'),
    accessibility: z.string().describe('アクセシビリティ仕様'),
    performance: z.string().describe('パフォーマンス仕様'),
  }),
});

export const planFileStructureTool = createTool({
  id: 'planFileStructure',
  description: 'サイトコンセプトに基づいてファイル構造と実装方針を設計する',
  inputSchema: planFileStructureSchema,
  outputSchema: planFileStructureOutputSchema,
  execute: async ({ context }) => {
    const { concept, copyContent, wireframe, targetAudience } = context;
    
    // ターゲットオーディエンスに基づく戦略の調整
    const isB2B = targetAudience.toLowerCase().includes('b2b') || 
                  targetAudience.toLowerCase().includes('企業') ||
                  targetAudience.toLowerCase().includes('法人');
    
    // コンセプトに基づく特化した構造とコンポーネント識別
    const conceptKeywords = concept.toLowerCase();
    const isEcommerce = conceptKeywords.includes('ec') || conceptKeywords.includes('ショップ') || conceptKeywords.includes('販売');
    const isService = conceptKeywords.includes('サービス') || conceptKeywords.includes('相談') || conceptKeywords.includes('申込');
    const isPortfolio = conceptKeywords.includes('ポートフォリオ') || conceptKeywords.includes('作品') || conceptKeywords.includes('実績');
    
    // ファイル構造の動的生成
    const generateFileStructure = () => {
      let specificComponents = '';
      let specificAssets = '';
      
      if (isEcommerce) {
        specificComponents = `│   │   ├── product-gallery.js # 商品ギャラリー
│   │   ├── cart.js          # カート機能
│   │   ├── checkout.js      # 決済処理
│   │   └── product-filter.js # 商品フィルター`;
        specificAssets = `│   ├── products/        # 商品画像
│   ├── testimonials/    # お客様の声画像`;
      } else if (isService) {
        specificComponents = `│   │   ├── service-tabs.js   # サービスタブ
│   │   ├── consultation.js  # 相談フォーム
│   │   ├── pricing-calc.js  # 料金計算機
│   │   └── booking.js       # 予約システム`;
        specificAssets = `│   ├── services/        # サービス関連画像
│   ├── case-studies/    # 事例画像`;
      } else if (isPortfolio) {
        specificComponents = `│   │   ├── portfolio-grid.js # ポートフォリオグリッド
│   │   ├── modal-viewer.js  # モーダル表示
│   │   ├── filter-tags.js   # タグフィルター
│   │   └── lightbox.js      # ライトボックス`;
        specificAssets = `│   ├── portfolio/       # 作品画像
│   ├── process/         # 制作過程画像`;
      } else {
        specificComponents = `│   │   ├── hero.js       # ヒーローセクション
│   │   ├── form.js       # フォーム処理
│   │   └── animations.js # アニメーション処理`;
        specificAssets = `│   ├── hero/         # ヒーロー画像
│   ├── sections/     # セクション画像`;
      }
      
      return `
project/
├── index.html              # メインHTMLファイル（${concept}特化型セマンティックHTML5）
├── css/
│   ├── style.css          # メインスタイルシート
│   ├── components.css     # ${concept}向けコンポーネントスタイル
│   └── utilities.css      # ユーティリティクラス
├── js/
│   ├── main.js           # メインJavaScriptファイル
│   ├── components/       # ${concept}特化コンポーネント
${specificComponents}
│   └── utils/
│       ├── analytics.js  # ${isB2B ? 'B2B向けアナリティクス' : 'コンバージョン分析'}
│       └── performance.js # パフォーマンス最適化
├── assets/
│   ├── images/           # 最適化された画像
${specificAssets}
│   │   └── icons/        # アイコン
│   └── fonts/            # カスタムフォント（必要時）
└── docs/
    ├── README.md         # ${concept}実装ガイド
    └── image-prompts.json # ${concept}向け画像生成プロンプト
      `;
    };
    
    const fileStructure = {
      description: `${concept}に特化したモジュラー設計で、${targetAudience}向けの保守性とパフォーマンスを両立したファイル構造`,
      structure: generateFileStructure()
    };

    // 実装戦略の動的生成
    const generateImplementationStrategy = () => {
      const tone = isB2B ? '信頼性と専門性' : '親しみやすさと使いやすさ';
      const priority = isB2B ? 'セキュリティと信頼性' : 'ユーザビリティとエンゲージメント';
      
      return {
        htmlApproach: `
${concept}に最適化されたセマンティックHTML5による構造化マークアップ:
- ${targetAudience}向けランドマーク要素の適切な使用
- ${tone}を重視した見出し階層の設計
- ARIA属性による${targetAudience}のアクセシビリティ強化
- ${concept}関連の構造化データ（JSON-LD）の実装
- ${isB2B ? 'LinkedIn対応のOpen Graph' : 'SNS共有最適化のOpen Graph'}メタタグ
        `,
        cssApproach: `
${targetAudience}向けモダンCSS設計手法:
- ${concept}ブランドに合わせたCSS Custom Properties管理
- ${isB2B ? 'デスクトップファースト' : 'Mobile-first'} レスポンシブデザイン
- ${tone}を表現するCSS Grid + Flexboxレイアウト
- ${concept}向けBEM記法によるクラス命名
- ${priority}を重視したCritical CSS分離
- ${isB2B ? 'ビジネス向け' : 'ユーザー体験重視の'}CSS Containment実装
        `,
        jsApproach: `
${concept}特化のES6+モジュラーJavaScript:
- ${targetAudience}のユーザー行動に基づくコンポーネント設計
- ${isB2B ? 'セキュアな' : 'スムーズな'}Intersection Observer API実装
- ${concept}に必要なWeb APIs活用（${isB2B ? 'Fetch with CSRF protection' : 'Fetch, LocalStorage等'}）
- ${priority}を考慮したイベント委譲パターン
- ${isB2B ? 'エラー処理重視の' : 'UX最適化の'}非同期処理
- ${targetAudience}向けエラーハンドリングの実装
        `,
        performanceStrategy: `
${targetAudience}向けCore Web Vitals最適化:
- LCP改善: ${concept}特化Critical CSS、${isB2B ? 'プロフェッショナル画像' : 'エンゲージメント重視画像'}最適化
- FID改善: ${priority}を考慮したコード分割
- CLS改善: ${tone}を保つレイアウト固定
- ${concept}向け画像最適化: WebP/AVIF対応、${isB2B ? 'ビジネス向け' : 'ユーザー体験重視の'}srcset活用
- ${targetAudience}最適化: 圧縮、CDN活用、${isB2B ? 'セキュアな' : '高速な'}キャッシュ戦略
        `
      };
    };

    const implementationStrategy = generateImplementationStrategy();

    // 技術仕様の動的生成
    const generateTechnicalSpecs = () => {
      return {
        responsive: `
${targetAudience}向けブレークポイント設計:
- Mobile: 320px-768px ${isB2B ? '(ビジネスモバイル対応)' : '(モバイルファースト)'}
- Tablet: 769px-1024px ${isB2B ? '(プレゼン対応)' : '(タブレット体験最適化)'}
- Desktop: 1025px-1440px ${isB2B ? '(ワークステーション対応)' : '(デスクトップ体験)'}
- Large Desktop: 1441px+ ${isB2B ? '(マルチモニター環境)' : '(大画面対応)'}

${concept}向けフルードタイポグラフィ:
- ${tone}を表現するclamp()関数による可変フォントサイズ
- ${targetAudience}に最適化されたcontainer queriesレイアウト
        `,
        seo: `
${concept}特化検索エンジン最適化:
- ${targetAudience}向けメタタグ最適化（${concept}関連キーワード重視）
- ${isB2B ? 'B2B向け構造化データ' : 'コンシューマー向け構造化データ'}実装
- ${concept}関連サイトマップ生成準備
- ${targetAudience}向けrobots.txt設定指針
- ${priority}重視のページ速度最適化（PageSpeed Insights 90+目標）
        `,
        accessibility: `
${targetAudience}向けWCAG 2.1 AA準拠:
- ${isB2B ? 'ビジネス環境での' : '一般ユーザーの'}キーボードナビゲーション対応
- ${concept}コンテンツのスクリーンリーダー対応
- ${tone}を保つ色覚異常対応（コントラスト比4.5:1以上）
- ${targetAudience}向けフォーカス管理とスキップリンク
- ${concept}に適した代替テキストの設定
        `,
        performance: `
${targetAudience}向けパフォーマンス目標:
- First Contentful Paint: ${isB2B ? '2.0秒以内（信頼性重視）' : '1.5秒以内（体験重視）'}
- Time to Interactive: ${isB2B ? '4.0秒以内' : '3.0秒以内'}
- Cumulative Layout Shift: 0.1以下
- Lighthouse Performance Score: ${isB2B ? '85+（安定性重視）' : '90+（速度重視）'}
- ${concept}向けバンドルサイズ最適化: ${isB2B ? '<150KB' : '<100KB'}（初期読み込み）
        `
      };
    };

    const technicalSpecs = generateTechnicalSpecs();

    return {
      fileStructure,
      implementationStrategy,
      technicalSpecs,
    };
  },
});