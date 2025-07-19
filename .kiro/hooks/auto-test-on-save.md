# Auto Test on Save Hook

## 概要
TypeScriptファイル保存時に自動でユニットテストを実行するHook

## トリガー条件
- ファイル保存時
- 対象: `src/**/*.ts`, `tests/**/*.ts` ファイル

## 実行内容
1. 関連するユニットテストを実行
2. テスト結果をコンソールに表示
3. エラーがある場合は詳細を表示

## 設定

```json
{
  "name": "Auto Test on Save",
  "description": "TypeScriptファイル保存時に自動でユニットテストを実行",
  "trigger": {
    "type": "file_save",
    "patterns": ["src/**/*.ts", "tests/**/*.ts"],
    "exclude": ["**/*.d.ts", "**/*.stories.ts"]
  },
  "actions": [
    {
      "type": "run_command",
      "command": "npm run test:unit -- --testPathPatterns=\"quick-test.test.ts|variant-scoring-utils.test.ts|intelligent-lp-generator-fixed.test.ts\"",
      "description": "タスク3関連のユニットテストを実行"
    }
  ],
  "options": {
    "async": true,
    "showOutput": true,
    "notifyOnSuccess": true,
    "notifyOnError": true
  }
}
```

## 使用方法
1. TypeScriptファイルを編集
2. ファイルを保存 (Cmd+S / Ctrl+S)
3. 自動でテストが実行される
4. 結果が通知される

## カスタマイズ
- `patterns`: 監視するファイルパターンを変更
- `command`: 実行するテストコマンドを変更
- `options`: 通知設定を変更