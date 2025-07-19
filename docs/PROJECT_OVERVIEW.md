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
1. **ユーザープロンプト受信** → `enhancedLPGeneratorTool` がトピックを拡張
2. **構造生成** → `generateLPStructure()` がセクション配列を返却
3. **各セクション HTML 生成** → `generateSectionHtml()` が並列で呼び出され JSON `{"html": ...}` を返す
4. **HTML/CSS 結合** → `generateUnifiedLP()` で統合、カスタム CSS 生成
5. **セキュリティ処理** → `sanitizeHTMLServer()` で DOMPurify 適用、CSP ヘッダー生成
6. **プレビュー** → `LPViewer` iframe で安全に表示（sandbox="allow-scripts allow-same-origin allow-forms"）

<div align="center"><sub>※ 詳細シーケンス図は今後追加</sub></div>

## 📐 Key Design Guidelines
- **React 19 IME**: `isComposing` 管理禁止。`onChange` のみ使用。
- **文字色**: デフォルト黒 (`text-black` or `text-gray-900`)。淡色は補助テキストのみ。
- **Component Structure**: コンポーネントはファイルトップレベルに定義。

## 🔗 Reference Docs
- `TASK_BOARD.md` — 実装タスク一覧
- Mastra Docs: AI tools, memory, rag など
- Tailwind Docs: https://tailwindcss.com/
