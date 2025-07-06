# 【新ビジョン】AIコパイロット対話型LPビルダー実装計画書

## 🎯 新ビジョンの定義

**「左：チャット、右：プレビュー」の対話ドリブンなLPビルダー**

### コアコンセプト
- ユーザーは常にAIとの対話を起点に操作
- 左側：AIとの対話チャットパネル（常時表示）
- 右側：リアルタイムプレビュー（編集結果即座反映）
- 右側プレビューの要素を直接選択してコンテキストメニューで操作

---

## 📊 現状分析と実装ギャップ

### ✅ 既存実装済み機能（活用可能）

| 機能 | 現状実装 | 活用度 |
|------|----------|--------|
| **左右分割UI** | `app/page.tsx` 完全実装 | 95% |
| **右側プレビュー** | `LPViewer` 完全実装 | 90% |
| **要素ホバーハイライト** | `SmartHoverMenu` 実装 | 85% |
| **コンテキストメニュー** | 編集・AI改善メニュー | 80% |
| **テキスト編集モーダル** | `EditModal` 完全実装 | 90% |
| **AI対話システム** | Mastra基盤完全実装 | 95% |

### ❌ 重要な機能ギャップ

#### 1. 画像アップロード・差し替え機能 🔴
- チャット内画像アップロード UI
- 「ページから選択」ボタン
- 画像差し替えモード
- ドラッグ&ドロップ画像アップロード

#### 2. 高度な画像編集機能 🔴
- 背景削除（Remove BG）
- AI背景生成（Generate BG）
- 画像編集モーダル（3タブ構成）

#### 3. UI/UX改善項目 🟡
- 画面暗転問題の修正
- チャット履歴の永続化
- レスポンシブ対応強化

---

## 🚀 実装ロードマップ

### フェーズ1：基盤修正・強化（1-2週間）
**目標：現在の問題修正と基盤強化**

#### 1.1 画面暗転問題の修正 🔴
```typescript
// 問題箇所の特定と修正
// app/page.tsx の663-677行目のオーバーレイ
// showAISuggestions, showVariantSelector の状態管理
```

**実装タスク：**
- [ ] オーバーレイコンポーネントの不具合修正
- [ ] 編集モード切り替えのスムーズ化
- [ ] ローディング状態の適切な表示

#### 1.2 左側チャットパネルの強化 🟡
```typescript
// 新機能追加
- 画像アップロード UI
- チャット履歴の永続化
- ファイルドラッグ&ドロップ対応
```

**実装タスク：**
- [ ] `AIChatPanel.tsx` に画像アップロード機能追加
- [ ] チャット履歴の LocalStorage 保存
- [ ] ドラッグ&ドロップ UI 実装

### フェーズ2：画像機能実装（2-3週間）
**目標：画像アップロード・差し替え・編集機能の完全実装**

#### 2.1 画像アップロード・差し替えシステム 🔴
```typescript
// 新コンポーネント作成
components/
├── ImageUploadChat.tsx      // チャット内画像アップロード
├── ImageReplacementMode.tsx // 画像差し替えモード
└── ImageDragDrop.tsx        // ドラッグ&ドロップ
```

**実装タスク：**
- [ ] チャット内画像アップロード UI
- [ ] 「ページから選択」ボタン実装
- [ ] 画像差し替えモード（プレビュー要素選択）
- [ ] 画像プレビュー・サムネイル表示

#### 2.2 AI画像編集機能 🔴
```typescript
// 新ツール作成
src/mastra/tools/
├── imageBackgroundRemovalTool.ts  // 背景削除
├── imageBackgroundGenerationTool.ts // AI背景生成
└── imageEditingTool.ts             // 統合画像編集
```

**実装タスク：**
- [ ] 背景削除 API 統合（Remove.bg または自社AI）
- [ ] AI背景生成（DALL-E 3 統合）
- [ ] 画像編集モーダル（3タブ構成）
- [ ] 画像処理パイプライン構築

### フェーズ3：UX最適化（1-2週間）
**目標：ユーザー体験の完全最適化**

#### 3.1 対話フローの最適化 🟡
```typescript
// 機能強化
- 自然言語での画像指示理解
- コンテキスト保持機能
- 操作ガイダンス
```

**実装タスク：**
- [ ] 自然言語画像指示の解析機能
- [ ] 操作履歴とUndo/Redo機能
- [ ] チュートリアル・ガイダンス実装

#### 3.2 パフォーマンス最適化 🟡
```typescript
// 最適化項目
- 画像処理の非同期化
- プレビュー更新の最適化
- メモリ使用量の削減
```

**実装タスク：**
- [ ] 画像処理のワーカー化
- [ ] プレビュー更新の差分レンダリング
- [ ] キャッシュ戦略の実装

---

## 🛠️ 技術実装詳細

### 新規作成コンポーネント

#### 1. ImageUploadChat.tsx
```typescript
interface ImageUploadChatProps {
  onImageUpload: (file: File, preview: string) => void;
  onSelectFromPage: (imageId: string) => void;
}

// 機能:
// - ドラッグ&ドロップ画像アップロード
// - 画像プレビュー表示
// - 「ページから選択」ボタン
// - 画像差し替えモード起動
```

#### 2. ImageReplacementMode.tsx
```typescript
interface ImageReplacementModeProps {
  isActive: boolean;
  targetImage: string;
  onReplace: (targetElement: HTMLElement) => void;
  onCancel: () => void;
}

// 機能:
// - プレビュー要素のハイライト
// - 画像要素の選択可能化
// - 差し替え実行
// - モード終了
```

#### 3. AIImageEditModal.tsx
```typescript
interface AIImageEditModalProps {
  image: string;
  onSave: (editedImage: string) => void;
  onCancel: () => void;
}

// 3タブ構成:
// - Replace: ファイルアップロード
// - Remove BG: 背景削除
// - Generate BG: AI背景生成
```

### 新規作成ツール

#### 1. imageBackgroundRemovalTool.ts
```typescript
export const imageBackgroundRemovalTool = {
  id: 'image-background-removal',
  description: '画像の背景を削除します',
  parameters: {
    imageUrl: { type: 'string', description: '処理対象の画像URL' }
  },
  // Remove.bg API または自社AI統合
}
```

#### 2. imageBackgroundGenerationTool.ts
```typescript
export const imageBackgroundGenerationTool = {
  id: 'image-background-generation',
  description: 'AI で新しい背景を生成します',
  parameters: {
    foregroundImage: { type: 'string' },
    backgroundPrompt: { type: 'string' }
  },
  // DALL-E 3 API統合
}
```

---

## 📋 実装チェックリスト

### フェーズ1：基盤修正・強化
- [ ] **画面暗転問題修正**
  - [ ] オーバーレイコンポーネント調査
  - [ ] 状態管理の見直し
  - [ ] ローディング表示の改善
- [ ] **チャットパネル強化**
  - [ ] 画像アップロード UI 追加
  - [ ] ドラッグ&ドロップ対応
  - [ ] チャット履歴永続化

### フェーズ2：画像機能実装
- [ ] **画像アップロード・差し替え**
  - [ ] ImageUploadChat コンポーネント
  - [ ] ImageReplacementMode コンポーネント
  - [ ] 画像差し替えロジック
- [ ] **AI画像編集**
  - [ ] AIImageEditModal コンポーネント
  - [ ] 背景削除ツール
  - [ ] AI背景生成ツール

### フェーズ3：UX最適化
- [ ] **対話フロー最適化**
  - [ ] 自然言語解析強化
  - [ ] 操作履歴・Undo機能
  - [ ] チュートリアル実装
- [ ] **パフォーマンス最適化**
  - [ ] 画像処理非同期化
  - [ ] プレビュー更新最適化
  - [ ] キャッシュ戦略

---

## 🎯 成功指標

### 技術指標
- [ ] 画面暗転問題：0件
- [ ] 画像アップロード成功率：>95%
- [ ] AI画像編集処理時間：<10秒
- [ ] プレビュー更新速度：<1秒

### UX指標
- [ ] ユーザー操作完了率：>90%
- [ ] 画像差し替え成功率：>95%
- [ ] 対話フロー完了率：>85%

---

## 📅 実装スケジュール

| フェーズ | 期間 | 主要成果物 |
|---------|------|------------|
| **フェーズ1** | 1-2週間 | 基盤修正・チャット強化 |
| **フェーズ2** | 2-3週間 | 画像機能完全実装 |
| **フェーズ3** | 1-2週間 | UX最適化・リリース準備 |
| **合計** | 4-7週間 | 新ビジョン完全実現 |

---

## 🔄 継続的改善

### 実装後の改善項目
1. **AI機能拡張**
   - 動画編集機能
   - 3D要素生成
   - アニメーション自動生成

2. **統合機能**
   - CMS連携（WordPress/Shopify）
   - A/Bテスト機能
   - アナリティクス統合

3. **エンタープライズ機能**
   - チーム協業機能
   - ブランドガイドライン適用
   - 大規模画像処理

---

*このドキュメントは新ビジョン実現のための包括的な実装計画書です。各フェーズの完了時に見直しを行い、必要に応じて調整を行います。* 