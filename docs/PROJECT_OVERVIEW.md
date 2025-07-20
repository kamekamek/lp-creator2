# LP Creator Project Overview

## 🎯 Mission
Next.js + React19 + TailwindCSS をベースに、**自律型 AI** が高速にランディングページを生成・編集できる SaaS プラットフォームを構築する。

## 🏗️ Architecture Snapshot
| Layer | Technology | 主要ポイント |
|-------|-----------|--------------|
| Front-end | Next.js 15 / React 19 | App Router, Client + Server Components, Edge Runtime ready |
| Styling | Tailwind CSS + CSS Variables | ダークモード・ブランドカラーを動的反映 |
| AI Orchestration | Vercel AI SDK v4 + Mastra tools | Claude / GPT / etc. マルチモデル対応、tool インジェクション |
| State | React Context + useChat Hook | 編集モードとチャットセッションを分離 |
| Security | DOMPurify + iframe sandbox + CSP | 多層セキュリティで AI 生成 HTML を完全隔離 |

> 詳細コード構造は `docs/REVIEW.md` の指摘を随時取り込み中。

## 🛣️ Roadmap
| Phase | 期間目安 | 成果物 |
|-------|---------|--------|
| 1 | 1-2 週 | 動的スキーマ・基盤エージェント |
| 2 | 2-3 週 | コア分析ツール・構造設計 |
| 3 | 2-3 週 | コンテンツ生成 + ワークフロー統合 |
| 4 | 1-2 週 | UI 統合・品質最適化 |
| **Total** | **6-10 週** | **完全自律型 LP 生成システム** |

## 🤖 Autonomous LP Generation Flow (概要)
1. **インタラクティブヒアリング** → `interactiveHearingTool` が段階的に顧客情報を収集
   - 必須情報: 商材内容、UVP、ターゲットの悩み、コンバージョン目標
   - 戦略情報: 競合分析、集客チャネル、ブランドイメージ、成功指標
   - 自然言語処理: キーワード抽出、感情分析、エンティティ認識
   - 進捗管理: リアルタイム完了率追跡、次質問の自動生成
2. **ユーザープロンプト受信** → `enhancedLPGeneratorTool` がトピックを拡張
3. **構造生成** → `generateLPStructure()` がセクション配列を返却
4. **各セクション HTML 生成** → `generateSectionHtml()` が並列で呼び出され JSON `{"html": ...}` を返す
5. **バリエーション生成** → `intelligentLPGeneratorTool` が複数デザインパターンを生成
6. **スコアリング・推奨** → `variantScoringUtils` がビジネス文脈に基づいて最適バリエーションを推奨
7. **HTML/CSS 結合** → `generateUnifiedLP()` で統合、カスタム CSS 生成
8. **AI改善提案** → `AISuggestionPanel` がコンテンツ分析し、改善提案を生成・表示
9. **セキュリティ処理** → `sanitizeHTMLServer()` で DOMPurify 適用、CSP ヘッダー生成
10. **プレビュー** → `LPViewer` iframe で安全に表示（sandbox="allow-scripts allow-same-origin allow-forms"）

<div align="center"><sub>※ 詳細シーケンス図は今後追加</sub></div>

## 🎯 Intelligent Variant Scoring System

### スコアリング基準 (最大100点)
| 基準 | 配点 | 説明 |
|------|------|------|
| **ビジネス適合性** | 30点 | ビジネス目標（リード獲得、売上向上等）との適合度 |
| **業界適合性** | 25点 | 業界特性（SaaS、EC、教育等）に最適化されたデザイン |
| **デザイン品質** | 25点 | HTML構造、CSS品質、レスポンシブ対応 |
| **コンテンツ品質** | 20点 | コンテンツ構造、編集可能要素、アクセシビリティ |

### デザインフォーカス別特徴
- **Modern Clean**: ブランド認知・クリエイティブ業界に最適
- **Conversion Optimized**: リード獲得・売上向上に特化
- **Content Rich**: 情報提供・教育・コンサルティングに適合

### 自動推奨アルゴリズム
1. ビジネス文脈分析（業界・目標・ターゲット）
2. 各バリエーションの多角的スコアリング
3. ユーザー設定（コンバージョン重視等）による重み付け調整
4. 最適バリエーションの自動選択と理由説明

## 🤖 AI Suggestion System

### 提案カテゴリ
| カテゴリ | 説明 | 例 |
|---------|------|-----|
| **コンテンツ** | テキスト改善・キーワード最適化 | 見出しの魅力度向上、CTA文言強化 |
| **デザイン** | 視覚的改善・レイアウト最適化 | 色彩調整、スペーシング改善 |
| **構造** | HTML構造・情報アーキテクチャ | セクション順序、階層構造最適化 |
| **SEO** | 検索エンジン最適化 | メタタグ、構造化データ |
| **コンバージョン** | 成果向上施策 | フォーム最適化、信頼性向上 |
| **アクセシビリティ** | WCAG準拠・ユーザビリティ | alt属性、キーボードナビゲーション |

### 提案生成プロセス
1. **コンテンツ分析** → HTML/CSS構造とビジネス文脈を解析
2. **品質スコアリング** → 各カテゴリで現状評価（0-100点）
3. **改善提案生成** → 優先度・影響度・実装難易度を考慮した提案作成
4. **ユーザー提示** → カテゴリ別整理、プレビュー付きで表示

## 📐 Key Design Guidelines
- **React 19 IME**: `isComposing` 管理禁止。`onChange` のみ使用。
- **文字色**: デフォルト黒 (`text-black` or `text-gray-900`)。淡色は補助テキストのみ。
- **Component Structure**: コンポーネントはファイルトップレベルに定義。

## 🔗 Reference Docs
- `TASK_BOARD.md` — 実装タスク一覧
- Mastra Docs: AI tools, memory, rag など
- Tailwind Docs: https://tailwindcss.com/
