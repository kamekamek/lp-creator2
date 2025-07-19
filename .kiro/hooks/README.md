# Kiro Hooks 設定ガイド

## 概要
このディレクトリには、タスク3（バリエーション生成システム）の品質保証を自動化するHooksが含まれています。

## 利用可能なHooks

### 1. 🔄 Auto Test on Save (`auto-test-on-save.md`)
- **トリガー**: TypeScriptファイル保存時
- **機能**: 関連するユニットテストを自動実行
- **メリット**: リアルタイムでテスト結果を確認

### 2. ✅ Quality Check (`quality-check.md`)  
- **トリガー**: 手動実行（ボタンクリック）
- **機能**: 型チェック + Lint + テスト + カバレッジ
- **メリット**: 包括的な品質チェックをワンクリックで実行

### 3. 🚫 Pre-commit Check (`pre-commit-check.md`)
- **トリガー**: Git commit前
- **機能**: commit前の自動品質チェック
- **メリット**: 品質の低いコードのcommitを防止

### 4. 📊 Test Report Generator (`test-report-generator.md`)
- **トリガー**: 手動 + 週次自動実行
- **機能**: 詳細な品質レポート生成
- **メリット**: 定期的な品質監視とレポート

## Hooksの有効化方法

### 方法1: Kiro Hook UI を使用
1. **コマンドパレット** を開く (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. `Open Kiro Hook UI` を検索・実行
3. Hook UI で各Hookを設定・有効化

### 方法2: Explorer View を使用
1. **Explorer View** を開く
2. **Agent Hooks** セクションを展開
3. 各Hookファイルを右クリック → `Enable Hook`

### 方法3: コマンドパレット経由
1. **コマンドパレット** を開く
2. `Kiro: Enable Hook` を検索
3. 有効化したいHookを選択

## 設定確認方法

### アクティブなHooksの確認
```bash
# コマンドパレット
Cmd+Shift+P → "Kiro: List Active Hooks"
```

### Hook実行ログの確認
```bash
# コマンドパレット  
Cmd+Shift+P → "Kiro: Show Hook Logs"
```

## トラブルシューティング

### Hookが動作しない場合
1. **権限確認**: Hookの実行権限があるか確認
2. **依存関係**: 必要なnpmパッケージがインストールされているか確認
3. **ログ確認**: Hook実行ログでエラーメッセージを確認

### よくある問題と解決方法

#### 問題: テストが実行されない
```bash
# 解決方法: テスト環境の確認
npm run test:unit -- --version
npm list jest
```

#### 問題: 型チェックでエラー
```bash
# 解決方法: TypeScript設定の確認
npx tsc --showConfig
```

#### 問題: Hookが重複実行される
```bash
# 解決方法: 重複Hookの無効化
# コマンドパレット → "Kiro: Disable Hook"
```

## カスタマイズ

### テスト対象の変更
各Hookファイルの `command` セクションを編集：
```json
{
  "command": "npm run test:unit -- --testPathPatterns=\"your-test-pattern\""
}
```

### 通知設定の変更
`options` セクションを編集：
```json
{
  "options": {
    "notifyOnSuccess": true,
    "notifyOnError": true,
    "showOutput": true
  }
}
```

### 実行頻度の変更
`trigger` セクションを編集：
```json
{
  "trigger": {
    "type": "scheduled",
    "schedule": "0 9 * * 1-5"  // 平日9時に実行
  }
}
```

## 推奨設定

### 開発時
- ✅ Auto Test on Save: 有効
- ✅ Quality Check: 有効  
- ✅ Pre-commit Check: 有効

### 本番運用時
- ✅ 全Hook: 有効
- ✅ Test Report Generator: 週次自動実行

## サポート

問題が発生した場合：
1. Hook実行ログを確認
2. 依存関係を確認
3. Kiro IDEのドキュメントを参照
4. 必要に応じてHookを一時的に無効化