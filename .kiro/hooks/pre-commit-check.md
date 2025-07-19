# Pre-commit Check Hook

## 概要
Git commit前に自動で品質チェックを実行するHook

## トリガー条件
- Git commit実行時（pre-commit）
- ステージされたファイルに `.ts`, `.tsx` が含まれる場合

## 実行内容
1. ステージされたTypeScriptファイルの型チェック
2. 変更されたファイルのLint実行
3. 関連するテストの実行
4. 全てパスした場合のみcommitを許可

## 設定

```json
{
  "name": "Pre-commit Check",
  "description": "Git commit前の自動品質チェック",
  "trigger": {
    "type": "git_hook",
    "hook": "pre-commit",
    "conditions": [
      {
        "type": "staged_files",
        "patterns": ["**/*.ts", "**/*.tsx"],
        "exclude": ["**/*.d.ts"]
      }
    ]
  },
  "actions": [
    {
      "type": "run_command",
      "command": "npx tsc --noEmit --incremental",
      "description": "型チェック（インクリメンタル）",
      "failOnError": true
    },
    {
      "type": "run_command",
      "command": "npx eslint --fix $(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(ts|tsx)$' | tr '\\n' ' ')",
      "description": "ステージされたファイルのLint + 自動修正",
      "failOnError": false
    },
    {
      "type": "run_command",
      "command": "npm run test:unit -- --testPathPatterns=\"quick-test.test.ts\"",
      "description": "クイックテスト実行",
      "failOnError": true
    }
  ],
  "options": {
    "sequential": true,
    "stopOnError": true,
    "autoStage": true,
    "showProgress": true
  }
}
```

## 動作フロー
1. `git commit` 実行
2. ステージされたファイルをチェック
3. TypeScriptファイルがある場合、品質チェック実行
4. 全てパスした場合、commitを実行
5. エラーがある場合、commitを中止してエラー表示

## エラー時の対応
- 型エラー: 修正してから再commit
- Lintエラー: 自動修正されるものは自動で修正、手動修正が必要なものは修正してから再commit
- テストエラー: テストを修正してから再commit

## 無効化方法
緊急時は以下のコマンドでスキップ可能：
```bash
git commit --no-verify -m "commit message"
```