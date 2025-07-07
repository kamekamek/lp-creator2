# プロフェッショナル HP 作成ワークフロー - 詳細仕様

> **最終更新**: 2025-06-14  
> **ステータス**: ✅ **コア実装完了** | 🚀 **本番稼働可能**

---

## 🛠 実装技術詳細

### Mastraツール実装 (TypeScript + Zod)

| ツール名 | 入力スキーマ | 出力スキーマ | 実装ステータス | 主要機能 |
|----------|-------------|--------------|----------------|----------|
| `collectStrategyInfo` | `answers: string[]` | `strategySummary`, `personaCard`, `competitorMatrix` | ✅ 完了 | OpenAI統合済み戦略収集 |
| `generateConceptWireframe` | `strategy: string` | `siteMap`, `wireframe`, `improvementProposals` | ✅ 完了 | コンセプト・構成設計 |
| `writeCopyAndUX` | `persona`, `strategy` | `interactionSpec`, `copyDocument` | ✅ 完了 | PASONA法則実装 |
| `planFileStructure` | コンセプト情報 | `description`, `structure`, `technicalSpecs` | ✅ 完了 | モダンWeb構造設計 |
| `generateHTML` | 構成・コピー | セマンティックHTML | ✅ 完了 | SEO・アクセシビリティ最適化 |
| `generateCSS` | HTML・仕様 | モダンCSS | ✅ 完了 | CSS Grid・Flexbox・変数システム |
| `generateJS` | 仕様 | ES6+ JavaScript | ✅ 完了 | パフォーマンス最適化・モジュラー設計 |
| `makeImagePrompts` | HTML・コピー | 画像生成プロンプト | ✅ 完了 | ブランド一貫性・技術仕様対応 |
| `qualityChecklist` | 全ファイル | 品質レポート | ✅ 完了 | Lighthouse・SEO・アクセシビリティ |

### ワークフロー実装

```typescript
// ✅ 実装済み: 7ステップワークフロー
export const proHPWorkflow = {
  name: 'Professional HP Creation Workflow',
  steps: [
    strategyStep,           // 1. 戦略収集
    conceptStep,            // 2. コンセプト設計  
    copyStep,               // 3. コピーライティング
    fileStructureStep,      // 4. ファイル構造設計
    htmlStep,               // 5. HTML生成
    cssStep,                // 6. CSS生成
    finalStep,              // 7. 最終統合・品質チェック
  ],
  // TypeScript型安全性: ゼロエラー達成 ✅
  inputSchema: proHPWorkflowInputSchema,
  outputSchema: proHPWorkflowOutputSchema,
};
```

### API エンドポイント実装

#### `/api/pro-hp-workflow` - RESTful ワークフロー API
```typescript
✅ POST /api/pro-hp-workflow
  └── action: 'start' | 'resume' | 'status'
  └── レスポンス: 型安全なワークフロー状態

✅ GET /api/pro-hp-workflow?runId={id}
  └── ワークフロー状態取得・進捗計算
```

### フロントエンド統合

#### ✅ タブベースUI
- **クイック作成**: 高速シンプル生成
- **プロワークフロー**: 段階確認付き包括的作成

#### ✅ プロワークフローUI
- **`ProHPWorkflowPanel.tsx`**: メインワークフロー管理
- **段階確認システム**: 各ステップでユーザー承認待ち
- **リアルタイムプレビュー**: 生成結果の即座表示

---

## 🎯 ワークフロー詳細設計

### 9つのツール詳細仕様

#### 1. `collectStrategyInfo` - 戦略情報収集
```typescript
// 入力: 質問回答セット
input: {
  answers: [
    "業界: IT・SaaS",
    "ターゲット: スタートアップ経営者",
    "目標: 月間20件のリード獲得",
    "競合: A社・B社",
    "予算: 月10万円"
  ]
}

// 出力: 戦略分析結果
output: {
  strategySummary: "ターゲット戦略・競合分析・差別化要因",
  personaCard: "詳細ペルソナ・ニーズ・行動パターン",
  competitorMatrix: "競合比較・優位性分析"
}
```

#### 2. `generateConceptWireframe` - コンセプト・ワイヤーフレーム
```typescript
// 入力: 戦略情報
input: {
  strategy: "戦略分析結果"
}

// 出力: サイト構成案
output: {
  siteMap: "サイト構造・ページ遷移図",
  wireframe: "各セクションのワイヤーフレーム",
  improvementProposals: "改善提案・最適化案"
}
```

#### 3. `writeCopyAndUX` - コピーライティング・UX設計
```typescript
// 入力: ペルソナ・戦略
input: {
  persona: "ペルソナ情報",
  strategy: "戦略情報"
}

// 出力: コピー・UX仕様
output: {
  interactionSpec: "インタラクション仕様",
  copyDocument: "PASONA法則ベースコピー"
}
```

#### 4. `planFileStructure` - ファイル構造設計
```typescript
// 入力: コンセプト情報
input: {
  concept: "コンセプト・ワイヤーフレーム",
  copy: "コピー・UX仕様"
}

// 出力: 技術仕様
output: {
  description: "技術選定・アーキテクチャ説明",
  structure: "ファイル構造・モジュール設計",
  technicalSpecs: "技術仕様・パフォーマンス要件"
}
```

#### 5. `generateHTML` - セマンティックHTML生成
```typescript
// 入力: 構成・コピー
input: {
  structure: "ファイル構造",
  copy: "コピー内容"
}

// 出力: HTML5
output: {
  html: "セマンティック・SEO最適化HTML",
  seoElements: "メタタグ・構造化データ",
  accessibility: "アクセシビリティ属性"
}
```

#### 6. `generateCSS` - モダンCSS生成
```typescript
// 入力: HTML・仕様
input: {
  html: "HTML構造",
  technicalSpecs: "技術仕様"
}

// 出力: CSS
output: {
  css: "CSS Grid・Flexbox・変数システム",
  responsive: "レスポンシブデザイン",
  performance: "パフォーマンス最適化"
}
```

#### 7. `generateJS` - ES6+ JavaScript生成
```typescript
// 入力: 仕様
input: {
  technicalSpecs: "技術仕様",
  interactionSpec: "インタラクション仕様"
}

// 出力: JavaScript
output: {
  javascript: "ES6+・モジュラー設計",
  performance: "パフォーマンス最適化",
  accessibility: "アクセシビリティ機能"
}
```

#### 8. `makeImagePrompts` - 画像生成プロンプト
```typescript
// 入力: HTML・コピー
input: {
  html: "HTML構造",
  copy: "コピー内容"
}

// 出力: 画像仕様
output: {
  prompts: "DALL-E・Midjourney対応プロンプト",
  specifications: "サイズ・形式・品質仕様",
  brandGuidelines: "ブランド一貫性ガイド"
}
```

#### 9. `qualityChecklist` - 品質チェック
```typescript
// 入力: 全ファイル
input: {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  imagePrompts: "画像プロンプト"
}

// 出力: 品質レポート
output: {
  lighthouseScore: "Lighthouse評価",
  seoChecklist: "SEO要件チェック",
  accessibilityReport: "アクセシビリティ評価",
  performanceMetrics: "パフォーマンス指標"
}
```

---

## 🎯 マーケティング心理学統合詳細

### PASONA法則実装

#### Problem（問題提起）
- **ペルソナ分析**: ターゲットの課題・痛み
- **共感創出**: 「こんなお悩みありませんか？」
- **数値化**: 具体的な損失・機会損失

#### Agitation（課題の深堀り）
- **リスク明確化**: 放置した場合の結果
- **競合比較**: 他社選択時のリスク
- **緊急性**: 「今すぐ」の必要性

#### Solution（解決策提示）
- **ベネフィット**: 機能ではなく価値
- **差別化**: 独自の解決方法
- **実績**: 成功事例・数値

#### Narrow down（対象限定）
- **ターゲット明確化**: 「こんな方に最適」
- **限定性**: 期間・数量限定
- **特別感**: 選ばれた感覚

#### Action（行動喚起）
- **CTA最適化**: 明確な次のステップ
- **リスク軽減**: 返金保証・試用期間
- **簡単さ**: 手軽な申し込み

### 4U原則実装

#### Urgent（緊急性）
- **時間制限**: 期間限定オファー
- **数量制限**: 先着順要素
- **トレンド**: 今話題の要素

#### Unique（独自性）
- **差別化**: 他社にない特徴
- **イノベーション**: 新技術・新手法
- **専門性**: 特化した知識・経験

#### Ultra-specific（超具体性）
- **数値**: 具体的な成果・実績
- **固有名詞**: 企業名・人名
- **詳細**: 手順・プロセス

#### Useful（有用性）
- **実用性**: 実際に使える
- **価値**: 投資対効果
- **簡単さ**: 実装・運用の容易さ

---

## 🔧 技術アーキテクチャ詳細

### Mastraフレームワーク統合

#### エージェント設計
```typescript
// lpCreatorAgent.ts - 両ワークフロー対応
export const lpCreatorAgent = {
  name: 'LP Creator Agent',
  instructions: `
    あなたは高品質なランディングページを作成する専門エージェントです。
    - 簡単LP作成: 高速・シンプル生成
    - プロワークフロー: 段階確認付き包括的作成
  `,
  model: 'gpt-4o-mini',
  tools: [
    // 簡単LP作成用ツール
    enhancedLPGeneratorTool,
    lpStructureTool,
    // プロワークフロー用ツール
    ...proHPWorkflowTools
  ]
};
```

#### ワークフロー管理
```typescript
// proHPWorkflow.ts - メインワークフロー
export const proHPWorkflow = workflow({
  name: 'proHPWorkflow',
  triggerSchema: proHPWorkflowInputSchema,
  outputSchema: proHPWorkflowOutputSchema,
  steps: [
    step('strategy').output(collectStrategyInfo),
    step('concept').output(generateConceptWireframe),
    step('copy').output(writeCopyAndUX),
    step('fileStructure').output(planFileStructure),
    step('html').output(generateHTML),
    step('css').output(generateCSS),
    step('final').output(generateJS, makeImagePrompts, qualityChecklist),
  ],
});
```

### API設計

#### RESTful エンドポイント
```typescript
// /api/pro-hp-workflow/route.ts
export async function POST(request: Request) {
  const { action, runId, userInput } = await request.json();
  
  switch (action) {
    case 'start':
      return await startWorkflow(userInput);
    case 'resume':
      return await resumeWorkflow(runId, userInput);
    case 'status':
      return await getWorkflowStatus(runId);
  }
}
```

#### レスポンス型安全性
```typescript
// 型安全なワークフロー状態
type WorkflowState = {
  runId: string;
  currentStep: string;
  progress: number;
  results: Record<string, any>;
  awaitingInput: boolean;
  error?: string;
};
```

---

## 📖 参考リソース

### Mastraフレームワーク
- **Workflows**: `workflows/control-flow.mdx`, `workflows/suspend-and-resume.mdx`
- **Tools**: `reference/tools/create-tool.mdx`
- **Agents**: `reference/agents/create-agent.mdx`

### 既存実装参考
- **ツール設計**: `src/mastra/tools/enhancedLPGeneratorTool.ts`
- **エージェント統合**: `src/mastra/agents/lpCreatorAgent.ts`
- **UI統合**: `app/components/LPViewer.tsx`

### 技術スタック
- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS
- **バックエンド**: Mastra Framework, OpenAI GPT-4
- **データベース**: LibSQL (軽量SQLite互換)
- **デプロイ**: Vercel (推奨)

---

## 🎯 パフォーマンス最適化

### Core Web Vitals対応
- **LCP**: 2.5秒未満（画像最適化・Critical CSS）
- **FID**: 100ms未満（JavaScript最適化・非同期処理）
- **CLS**: 0.1未満（レイアウト安定性・サイズ指定）

### SEO最適化
- **セマンティックHTML**: 適切な見出し階層・構造化データ
- **メタタグ**: Open Graph・Twitter Card対応
- **サイトマップ**: 自動生成・検索エンジン最適化

### アクセシビリティ
- **WCAG 2.1 AA準拠**: 色コントラスト・キーボード操作
- **スクリーンリーダー対応**: ARIA属性・alt属性
- **多様性配慮**: 認知負荷軽減・分かりやすいUI