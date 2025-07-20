import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * ステップ 2: 戦略サマリーをもとにコンセプト／サイトマップ／ワイヤーフレームを生成。
 * 現段階ではスタブ実装。
 */

// 戦略情報に基づいて改善提案を動的生成
function generateImprovementProposals(strategy: string): string[] {
  const proposals = [];
  
  // 戦略から重要なキーワードを抽出
  const keywords = extractKeywords(strategy);
  
  // 保守的アプローチ
  const conservativeApproach = keywords.includes('安定') || keywords.includes('信頼')
    ? '既存の実績あるデザインパターンを活用し、段階的な改善を実施'
    : '確実性を重視した従来型のレイアウトとコンテンツ構成を採用';
  proposals.push(`保守的アプローチ: ${conservativeApproach}`);
  
  // 標準アプローチ
  proposals.push(`標準アプローチ: ${keywords.includes('効率') || keywords.includes('最適') ? 
    '業界標準のベストプラクティスを適用し、バランスの取れた改善を実施' : 
    '一般的なコンバージョン最適化手法を組み合わせた標準的なアプローチ'}`);
  
  // 革新的アプローチ
  proposals.push(`革新的アプローチ: ${keywords.includes('革新') || keywords.includes('最新') ? 
    '最新のUXトレンドと先進的なインタラクションを導入し、差別化を図る' : 
    '従来の枠を超えた創造的なデザインとユーザー体験を提案'}`);
  
  return proposals;
}

// 戦略からキーワードを抽出
function extractKeywords(strategy: string): string[] {
  const keywords: string[] = [];
  const patterns = [
    { pattern: /(安定|信頼|確実)/g, keyword: '安定' },
    { pattern: /(効率|最適|改善)/g, keyword: '効率' },
    { pattern: /(革新|最新|先進)/g, keyword: '革新' },
    { pattern: /(ユーザー|顧客|利用者)/g, keyword: 'ユーザー' },
    { pattern: /(コンバージョン|成果|売上)/g, keyword: 'コンバージョン' },
  ];
  
  patterns.forEach(({ pattern, keyword }) => {
    if (pattern.test(strategy)) {
      keywords.push(keyword);
    }
  });
  
  return keywords;
}

// サイトマップ生成
function generateSiteMap(strategy: string): string {
  const keywords = extractKeywords(strategy);
  
  return `
サイトマップ（${keywords.join('、')}を重視）:
1. ヘッダー
   - ロゴ
   - ナビゲーション
   - CTA（資料請求/問い合わせ）

2. ヒーローセクション
   - メインメッセージ
   - 価値提案
   - プライマリCTA

3. 課題・解決策セクション
   - 顧客の課題
   - 解決策の提示
   - 差別化要因

4. 実績・事例セクション
   - 成功事例
   - 数値実績
   - お客様の声

5. サービス詳細
   - 機能・特徴
   - 料金プラン
   - 導入フロー

6. フッター
   - 会社情報
   - 連絡先
   - プライバシーポリシー
  `.trim();
}

// ワイヤーフレーム生成
function generateWireframe(strategy: string): string {
  const keywords = extractKeywords(strategy);
  
  return `
ワイヤーフレーム（${keywords.join('、')}重視レイアウト）:

┌─────────────────────────────────────┐
│ [ロゴ]           [ナビ] [CTA]       │
├─────────────────────────────────────┤
│                                     │
│    [メインビジュアル]                │
│    メインメッセージ                  │
│    [プライマリCTA]                  │
│                                     │
├─────────────────────────────────────┤
│ [課題]    [解決策]    [差別化]      │
├─────────────────────────────────────┤
│ [実績1]   [実績2]    [実績3]       │
├─────────────────────────────────────┤
│           [お客様の声]               │
├─────────────────────────────────────┤
│ [機能1]   [機能2]    [機能3]       │
├─────────────────────────────────────┤
│          [料金プラン]                │
├─────────────────────────────────────┤
│         [最終CTA]                   │
├─────────────────────────────────────┤
│ [フッター情報]                      │
└─────────────────────────────────────┘
  `.trim();
}
export const generateConceptWireframe = createTool({
  id: "Generate Concept & Wireframe",
  description: "Generates visual sitemap, wireframe and three improvement patterns based on strategy info.",
  inputSchema: z.object({
    strategy: z.string(),
  }),
  outputSchema: z.object({
    siteMap: z.string(),
    wireframe: z.string(),
    improvementProposals: z.array(z.string()),
  }),
  execute: async (context) => {
    const { strategy } = context;

    if (!strategy || strategy.trim().length === 0) {
      throw new Error('戦略情報が提供されていません');
    }

    console.log("[generateConceptWireframe] strategy", strategy);
    
    // 戦略情報を解析して動的にimprovementProposalsを生成
    const improvementProposals = generateImprovementProposals(strategy);
    
    return {
      siteMap: generateSiteMap(strategy),
      wireframe: generateWireframe(strategy),
      improvementProposals,
    };
  }
});
