# LP Creator Master Task List

_Last updated: 2025-06-13_

> 本ドキュメントは **LP Creator** プロジェクトにおける「やるべきこと」「要件」「関連ファイル」「進捗状況」を 1 箇所に集約したマスタートラッカーです。
>
> - **Priority**: 🔥 CRITICAL / 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW
> - **Status**: ✅ Done / 🔄 In-Progress / ⏳ Pending / 🚧 Blocked
>
> 各タスクには対応フェーズと関連ファイルを付記しています。PR 発行時やデイリー Stand-up 前に本リストを更新してください。

---

## 0. Legend / 伝説
| Priority | 意味 |
| --- | --- |
| 🔥 | 今すぐ対処すべき致命的課題 |
| 🔴 | 高優先。原則本日中に完了 |
| 🟡 | 今週中の完了を目指す中優先 |
| 🟢 | 余力があれば対応する低優先 |

| Status | 意味 |
| --- | --- |
| ✅ | 完了済み |
| 🔄 | 作業進行中 |
| ⏳ | 未着手（着手待ち） |
| 🚧 | ブロック中（要外部対応） |

---

## 1. Phase A — 緊急対応 (MVP 修正)
| # | Task | Priority | Status | Related File(s) |
| - | ---- | -------- | ------ | --------------- |
| A-1 | UI 2 カラムレイアウトへ全面改修 | 🔥 | ✅ | `app/page.tsx` |
| A-2 | `LpDisplay.tsx` コンポーネント新規作成 | 🔥 | ✅ | `app/components/LpDisplay.tsx` |
| A-3 | CSS 未適用問題の応急修正 | 🔥 | ✅ | `ai/*`, `lpGeneratorTool.ts` |
| A+-1 | AI 生成スキーマ不整合エラー修正 | 🔥 | 🔄 | `ai/unified-lp-generator.ts`, `schemas/*` |
| A+-2 | 生成処理のタイムアウト/安定化 | 🔥 | 🔄 | `ai/unified-lp-generator.ts`, `app/api/chat/route.ts` |
| A+-3 | 最低限の動作テスト一式 | 🔴 | ⏳ | `tests/*`, Playwright scripts |

## 2. Phase B — 品質向上 (短期)
| # | Task | Priority | Status | Related File(s) |
| - | ---- | -------- | ------ | --------------- |
| B-1 | レスポンシブデザイン実装 | 🔴 | ⏳ | `tailwind.config.ts`, LP generator prompts |
| B-2 | 画像表示/差し替えシステム強化 | 🔴 | ⏳ | `EditableImageContainer.tsx`, generator prompts |
| B-3 | 状態管理ロジック簡素化 | 🟡 | ⏳ | `contexts/*`, `app/page.tsx` |

## 3. Phase C — 機能完成 (中期)
| # | Task | Priority | Status | Related File(s) |
| - | ---- | -------- | ------ | --------------- |
| C-1 | インライン/部分編集機能完成 | 🟡 | ⏳ | `EditableText.tsx`, `EditModeContext.tsx` |
| C-2 | LP エクスポート (HTML/CSS/JS) | 🟢 | ⏳ | `exporter/*`, API route |
| C-3 | 包括的テスト (Jest + Playwright) | 🟡 | ⏳ | `tests/*`, GitHub Actions |

---

## 4. Backlog / Ideas
- マルチモデル (Claude など) 切り替え UI
- Web Vitals ベースのパフォーマンス最適化
- undo/redo & バージョン履歴管理

---

## 5. 参考ドキュメント
- [`docs/LP_CREATOR_PLAN.md`](./LP_CREATOR_PLAN.md) — 全体設計書
- [`docs/CRITICAL_FIXES_PLAN.md`](./CRITICAL_FIXES_PLAN.md) — 緊急修正計画書
- [`docs/PROJECT_SETUP_GUIDE.md`](./PROJECT_SETUP_GUIDE.md) — 環境構築ガイド

> 本ファイルを編集する際は、タスク完了後に **Status** を更新し、必要に応じて新規タスクを追加してください。
