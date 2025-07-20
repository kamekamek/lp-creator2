# LP Creator Task Board

> 最終更新: 2025-06-13

統合タスクボード。Priority/Status は絵文字で表現。

| ID | Task | Priority | Status | 備考 |
|----|------|----------|--------|------|
| A-1 | UI 2 カラムレイアウト改修 | 🔥 | ✅ | 実装済み PR #12 |
| A-2 | LpDisplay コンポーネント作成 | 🔥 | ✅ | `app/components/LpDisplay.tsx` |
| A-3 | CSS 未適用バグ応急修正 | 🔥 | ✅ | Tailwind CDN → proper inject |
| A+-1 | AI 生成スキーマ不整合修正 | 🔥 | ✅ | JSON抽出ロジック4パターン対応完了 |
| A+-2 | 生成処理安定化 (timeout) | 🔥 | ✅ | batch処理+retry+fallback実装完了 |
| A+-3 | MVP 動作テスト整備 | 🔴 | ✅ | Playwright E2E テストスイート完了 |
| B-1 | レスポンシブ実装 | 🔴 | ⏳ | breakpoints + flex-cols |
| B-2 | 画像差し替えシステム | 🔴 | ⏳ | `<EditableImage />` |
| B-3 | 状態管理簡素化 | 🟡 | ⏳ | useReducer 化検討 |
| B-4 | インタラクティブヒアリングシステム | 🔴 | ✅ | interactiveHearingTool.ts 実装完了 |
| C-1 | インライン編集完成 | 🟡 | ⏳ | data-editable-id 指定箇所 |
| C-2 | LP エクスポート | 🟢 | ⏳ | zip build |
| C-3 | 包括的テスト | 🟡 | ⏳ | Jest + Playwright |

## 🔥 Critical Fixes
| Issue | 状態 |
|-------|------|
| JSON `{\"html\":...}` 抽出失敗 → 404 | 対応済み (`lpGeneratorTool` regex) |
| 生成ループ長時間化 | 調査中 (retry + streaming) |

## 📝 Review Items
- コード肥大 → `app/page.tsx` を `layouts/MainView.tsx` へ分離 (レビュー指摘 #R1)
- any 多用 → Zod schema (`schemas/`) 追加 (レビュー指摘 #R2)

---

### 更新ルール
1. PR 作成 → 対応タスク行を **Status=🔄** に変更
2. マージ後 → **Status=✅** に変更しリリースノート追記
3. 新規タスクは最下部に追加
