# LP Creator - プロジェクトセットアップガイド

- **作成日:** 2025年06月12日
- **最終更新:** 2025年06月14日
- **目的:** このドキュメントは、「LP Creator」プロジェクトの初期セットアップ手順を定義し、開発をスムーズに開始するためのガイドです。

---

## ✅ プロジェクト概要

LP Creatorは、Mastraフレームワークを活用したAI駆動のランディングページ生成アプリケーションです。

### 主要機能
- **クイック作成モード**: 簡単で高速なランディングページ生成
- **プロフェッショナルHPワークフロー**: マーケティング心理学とSEO最適化を組み込んだ包括的な作成プロセス
- **リアルタイムプレビュー**: 生成されたページの即座のプレビュー
- **自然な編集システム**: Notion/Word風のインライン編集機能

---

## ✅ 完了済みセットアップ

### 1. プロジェクト構造
```
lp-creator/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── chat/                 # メイン生成API
│   │   ├── lp-creator/chat/      # Mastraエージェント API
│   │   └── pro-hp-workflow/      # プロワークフローAPI
│   ├── components/               # UIコンポーネント
│   │   ├── AIChatPanel.tsx       # AIチャットインターフェース
│   │   ├── LPViewer.tsx          # プレビューパネル
│   │   ├── ProHPWorkflowPanel.tsx # プロワークフローUI
│   │   └── EditModal.tsx         # 編集機能
│   └── page.tsx                  # メインページ（タブ切り替え）
├── src/mastra/                   # Mastraフレームワーク設定
│   ├── agents/
│   │   └── lpCreatorAgent.ts     # メインAIエージェント
│   ├── tools/                    # AIツール群
│   │   ├── enhancedLPGeneratorTool.ts
│   │   ├── collectStrategyInfo.ts
│   │   ├── generateConceptWireframe.ts
│   │   └── [その他のツール...]
│   ├── workflows/
│   │   └── proHPWorkflow.ts      # プロワークフロー実装
│   └── index.ts                  # Mastra設定
└── docs/                         # プロジェクト文書
```

### 2. 技術スタック
- **フレームワーク**: Next.js 15 (App Router)
- **AI フレームワーク**: Mastra
- **AIプロバイダー**: OpenAI, Claude, Google AI
- **スタイリング**: Tailwind CSS
- **データベース**: LibSQL (メモリ機能用)
- **TypeScript**: 完全対応

### 3. 実装済み機能

#### ✅ Mastraフレームワーク統合
- **エージェント**: 複数AIプロバイダー対応の動的モデル選択
- **ツール**: 15個の専門化されたLP生成ツール
- **ワークフロー**: 7ステップのプロフェッショナルHP作成プロセス
- **メモリ**: LibSQLを使用した会話履歴管理

#### ✅ プロフェッショナルHPワークフロー
```
1. 戦略収集 → 2. コンセプト設計 → 3. コピーライティング
       ↓              ↓                    ↓
4. ファイル構造 → 5. HTML生成 → 6. CSS生成 → 7. 最終品質チェック
```

#### ✅ UI/UX機能
- **分割パネル**: チャット（左）+ プレビュー（右）
- **タブシステム**: クイック作成 vs プロワークフロー
- **インライン編集**: ダブルクリックによる即座の編集
- **スマートホバーメニュー**: ✏️編集, 🤖AI改善, 🎨スタイル

#### ✅ API エンドポイント
- `/api/lp-creator/chat` - Mastraエージェント統合
- `/api/pro-hp-workflow` - プロワークフロー実行
- `/api/chat` - 基本的なチャット機能

---

## 🚀 開発開始方法

### 1. 依存関係のインストール
```bash
cd /Users/kamenonagare/kameno-dev/lp-creator
pnpm install
```

### 2. 環境変数の設定
```bash
# .env.local を作成し、以下を設定
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_claude_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
```

### 3. 開発サーバーの起動
```bash
pnpm dev
```

### 4. アプリケーションへのアクセス
- **URL**: http://localhost:3000
- **機能確認**:
  - クイック作成タブでシンプルなLP生成
  - プロワークフロータブで包括的なHP作成

---

## 📋 TypeScript設定

### ✅ 型安全性の確保
```bash
# TypeScript チェック
pnpm tsc --noEmit

# リンティング
pnpm lint
```

### 主要な型定義
- **Mastraワークフロー**: Zod スキーマによる厳密な型定義
- **API レスポンス**: 完全型付けされたレスポンス構造
- **ツール入出力**: 各ツールの入力・出力スキーマ

---

## 🛠 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# プロダクションビルド
pnpm build

# プロダクション実行
pnpm start

# 型チェック
pnpm tsc --noEmit

# リンティング
pnpm lint

# テスト実行（E2E）
pnpm test:e2e
```

---

## 📈 次のステップ

### 1. 機能拡張
- **画像生成統合**: AI画像生成プロンプトの実装
- **SEO最適化**: より高度なSEO機能
- **ダウンロード機能**: 完成したプロジェクトのZip配布

### 2. パフォーマンス最適化
- **Core Web Vitals**: パフォーマンス指標の改善
- **画像最適化**: Next.js Image最適化
- **コード分割**: 動的インポートの活用

### 3. 品質向上
- **テストカバレッジ**: ユニットテスト・E2Eテストの追加
- **エラーハンドリング**: より堅牢なエラー処理
- **ユーザビリティ**: UIの継続的改善

---

## 📖 関連ドキュメント

- **[PRO_HP_WORKFLOW_PLAN.md](./PRO_HP_WORKFLOW_PLAN.md)** - プロワークフローの詳細仕様
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - プロジェクト全体概要
- **[CLAUDE.md](../CLAUDE.md)** - Claude Code向け開発ガイド

---

## 📝 開発ノート

### 重要な実装ポイント
1. **Mastraツール実行**: 現在は簡略化実装、将来的に完全統合予定
2. **TypeScript型安全性**: ワークフロー全体で型安全性を維持
3. **ユーザー確認ポイント**: プロワークフローには3つのユーザー確認段階
4. **即座の反映**: 編集変更は即座にプレビューに反映

### デバッグ情報
- **ログ**: 非本番環境でのみ詳細ログ出力
- **開発者ツール**: ブラウザコンソールでのデバッグ情報
- **TypeScript**: 厳密な型チェックによるエラー早期発見