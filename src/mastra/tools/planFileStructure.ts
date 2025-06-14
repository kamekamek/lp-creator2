import { createTool } from '@mastra/core';
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
  execute: async ({ input }) => {
    const { concept, copyContent, wireframe, targetAudience } = input;
    // ファイル構造の設計
    const fileStructure = {
      description: `${concept}に基づくモジュラー設計で、保守性とパフォーマンスを両立したファイル構造`,
      structure: `
project/
├── index.html              # メインHTMLファイル（セマンティックHTML5）
├── css/
│   ├── style.css          # メインスタイルシート
│   ├── components.css     # コンポーネント固有スタイル
│   └── utilities.css      # ユーティリティクラス
├── js/
│   ├── main.js           # メインJavaScriptファイル
│   ├── components/       # コンポーネント別JS
│   │   ├── hero.js       # ヒーローセクション
│   │   ├── form.js       # フォーム処理
│   │   └── animations.js # アニメーション処理
│   └── utils/
│       ├── analytics.js  # アナリティクス
│       └── performance.js # パフォーマンス最適化
├── assets/
│   ├── images/           # 最適化された画像
│   │   ├── hero/         # ヒーロー画像
│   │   ├── sections/     # セクション画像  
│   │   └── icons/        # アイコン
│   └── fonts/            # カスタムフォント（必要時）
└── docs/
    ├── README.md         # 実装ガイド
    └── image-prompts.json # 画像生成プロンプト
      `
    };

    // 実装戦略の策定
    const implementationStrategy = {
      htmlApproach: `
セマンティックHTML5による構造化マークアップ:
- ランドマーク要素（header, main, section, footer）の適切な使用
- 見出し階層（h1-h6）の論理的な構造
- ARIA属性によるアクセシビリティ強化
- 構造化データ（JSON-LD）の実装
- Open Graphメタタグによるソーシャル対応
      `,
      cssApproach: `
モダンCSS設計手法:
- CSS Custom Properties（変数）による一元管理
- Mobile-first レスポンシブデザイン
- CSS Grid + Flexboxによるレイアウト
- BEM記法によるクラス命名
- Critical CSS分離による初期表示最適化
- CSS Containmentによるパフォーマンス向上
      `,
      jsApproach: `
ES6+モジュラーJavaScript:
- クラスベースのコンポーネント設計
- Intersection Observer APIによる遅延読み込み
- Web APIs活用（Fetch, LocalStorage等）
- イベント委譲パターンによる効率的なイベント処理
- Promiseベースの非同期処理
- エラーハンドリングの実装
      `,
      performanceStrategy: `
Core Web Vitals最適化:
- LCP改善: Critical CSS、画像最適化、プリロード
- FID改善: コード分割、遅延実行
- CLS改善: レイアウト固定、フォント表示最適化
- 画像最適化: WebP/AVIF対応、srcset活用
- リソース最適化: 圧縮、CDN活用、キャッシュ戦略
      `
    };

    // 技術仕様の定義
    const technicalSpecs = {
      responsive: `
ブレークポイント設計:
- Mobile: 320px-768px
- Tablet: 769px-1024px  
- Desktop: 1025px-1440px
- Large Desktop: 1441px+

フルードタイポグラフィ:
- clamp()関数による可変フォントサイズ
- container queriesによる適応的レイアウト
      `,
      seo: `
検索エンジン最適化:
- メタタグ最適化（title, description, keywords）
- 構造化データ実装（Article, Organization等）
- サイトマップ生成準備
- robots.txt設定指針
- ページ速度最適化（PageSpeed Insights 90+目標）
      `,
      accessibility: `
WCAG 2.1 AA準拠:
- キーボードナビゲーション対応
- スクリーンリーダー対応（ARIA属性）
- 色覚異常対応（コントラスト比4.5:1以上）
- フォーカス管理とスキップリンク
- 代替テキストの適切な設定
      `,
      performance: `
パフォーマンス目標:
- First Contentful Paint: 1.8秒以内
- Time to Interactive: 3.8秒以内
- Cumulative Layout Shift: 0.1以下
- Lighthouse Performance Score: 90+
- バンドルサイズ最適化: <100KB（初期読み込み）
      `
    };

    return {
      fileStructure,
      implementationStrategy,
      technicalSpecs,
    };
  },
});