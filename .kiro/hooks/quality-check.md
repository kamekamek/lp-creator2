# Quality Check Hook

## 概要
コード品質チェックを実行するHook（手動トリガー）

## トリガー条件
- 手動実行（コマンドパレット経由）
- ボタンクリック

## 実行内容
1. TypeScript型チェック
2. ESLint実行
3. ユニットテスト実行
4. カバレッジレポート生成

## 設定

```json
{
  "name": "Quality Check",
  "description": "コード品質の包括的チェックを実行",
  "trigger": {
    "type": "manual",
    "button": {
      "label": "品質チェック実行",
      "icon": "check-circle",
      "location": "status_bar"
    }
  },
  "actions": [
    {
      "type": "run_command",
      "command": "npx tsc --noEmit",
      "description": "TypeScript型チェック"
    },
    {
      "type": "run_command", 
      "command": "npm run lint",
      "description": "ESLint実行"
    },
    {
      "type": "run_command",
      "command": "npm run test:unit:coverage",
      "description": "ユニットテスト + カバレッジ"
    }
  ],
  "options": {
    "sequential": true,
    "stopOnError": false,
    "showProgress": true,
    "generateReport": true
  }
}
```

## レポート内容
- 型エラー数
- Lint警告/エラー数  
- テスト成功/失敗数
- コードカバレッジ率
- 実行時間

## 使用方法
1. コマンドパレット → "Quality Check" を検索
2. または画面下部の「品質チェック実行」ボタンをクリック
3. 結果レポートを確認