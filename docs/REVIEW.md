# 心配性エンジニア視点レビュー

## 1. アーキテクチャ・構造

### 肥大化した `app/page.tsx`
- **問題**: UI ロジック・状態管理・ユーティリティが混在。可読性・テスタビリティ低下懸念。
- **対策**: `components/layouts/MainView.tsx` などに分離し、Hooks・ユーティリティも別ファイルへ。

### `any` 多用
- **問題**: `lpObject` など型安全性が失われ XSS・null 例外を招きやすい。
- **対策**: Zod/TypeScript 型定義を共通 `schemas/` へ。

### AI 生成 HTML の直接描画
- **問題**: サニタイズなしで iframe に流し込む場合でも、親ページとの postMessage 制御必須。XSS・click-jacking リスク。
- **対策**: sandbox 属性を厳格に設定、ドメイン隔離、CSP 付与。

## 2. パフォーマンス

### `messages.reverse()` を毎レンダリングで実行
- **問題**: 配列が増えると O(n²)。
- **対策**: `useMemo + slice().reverse()` より `findLast(ES2023)` などに変更推奨。

### `console.log` 大量出力
- **問題**: ブラウザメモリ圧迫・情報漏えい。
- **対策**: debug ライブラリ or 環境変数で制御。

## 3. 状態管理

### `isEditMode / selectedElementId` が Context 1 つに集中
- **問題**: 将来スケール時に再レンダリング増。
- **対策**: Jotai/Zustand 等軽量ステート or React 19 Signal も検討。

### ローカル → AI へ渡すデータフローが不明瞭
- **問題**: どこでスキーマ検証しているか追いづらい。
- **対策**: `ai/` 層に Facade を作り、全入力を通す一本化ポイントを設置。

## 4. テスト・CI

### テストカバレッジ皆無
- **問題**: 生成 HTML のスナップショットテスト、主要 Hook 単体テスト必須。
- **対策**: Playwright で「プロンプト入力 → LP 生成 → DOM 検証」の E2E を最低 1 本。

### GitHub Actions 未整備
- **問題**: lint, type-check, test を PR ごとに自動実行しないと品質劣化リスク。

## 5. セキュリティ

### OpenAI API Key 取り扱い
- **問題**: `.env` 流出チェック。Vercel 環境変数権限も最小限に。

### 依存ライブラリ
- **問題**: mastra 自作フレームワークに外部 HTTP 呼び出しがある場合、SSRF・DoS 考慮。
- **対策**: OWASP Dependency-Check を CI に組込。

## 6. UX / アクセシビリティ

### カラーコントラスト
- **問題**: Grayscale テキスト使用ルールが docs にあるが、実装で `text-gray-500` が散見。
- **対策**: grep で一括チェック。

### キーボード操作
- **問題**: インライン編集要素が div だと tab 移動不可。
- **対策**: contentEditable / button に tabIndex 設定要。

## 7. 運用

### ログ収集戦略未定
- **問題**: Cloudflare / Vercel Logs などで生成失敗率を可視化しないと SLA 達成不可。

### リリースフロー
- **問題**: dev→stg→prod の環境差分管理（環境変数、ベータフラグ）を GitHub Actions + Vercel Preview で整備。

## 直近優先アクション（技術負債削減用）

1. **型強化**: `lpObject`, `message.display` へ Zod スキーマ導入。
2. **HTML サンドボックス**: iframe `sandbox="allow-same-origin"` + postMessage 制限。
3. **パフォーマンス**: `messages.reverse()` → `findLast` へ置換 & `useMemo`。
4. **開発環境**: ESLint + Prettier + CI ワークフロー整備。
5. **ログ管理**: `console.log` 削減、debug ライブラリへ移行。
6. **テスト**: Playwright で MVP フローの E2E テスト追加。

これらを完了すれば、長期的なリスクとメンテ工数が大幅に下がります。

