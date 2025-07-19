# Test Report Generator Hook

## 概要
タスク3の実装品質レポートを生成するHook

## トリガー条件
- 手動実行
- 週次自動実行（金曜日 17:00）

## 実行内容
1. 全ユニットテスト実行
2. カバレッジレポート生成
3. 品質メトリクス収集
4. HTMLレポート生成
5. Slackまたはメール通知（オプション）

## 設定

```json
{
  "name": "Test Report Generator",
  "description": "タスク3の包括的品質レポートを生成",
  "trigger": {
    "type": "scheduled",
    "schedule": "0 17 * * 5",
    "timezone": "Asia/Tokyo",
    "manual": true
  },
  "actions": [
    {
      "type": "run_command",
      "command": "npm run test:unit:coverage -- --testPathPatterns=\"variant-scoring-utils.test.ts|intelligent-lp-generator-fixed.test.ts|quick-test.test.ts\"",
      "description": "タスク3関連テスト + カバレッジ"
    },
    {
      "type": "generate_report",
      "template": "quality_report",
      "output": "reports/task3-quality-report.html",
      "data": {
        "task": "Task 3 - Variant Generation System",
        "components": [
          "intelligentLPGeneratorTool",
          "variantScoringUtils", 
          "VariantSelector",
          "businessContextAnalyzer"
        ]
      }
    },
    {
      "type": "notify",
      "channels": ["console", "status_bar"],
      "message": "タスク3品質レポートが生成されました"
    }
  ],
  "options": {
    "generateTimestamp": true,
    "includeMetrics": true,
    "archiveReports": true
  }
}
```

## レポート内容
- **テスト結果サマリー**
  - 成功/失敗テスト数
  - テスト実行時間
  - カバレッジ率

- **コンポーネント別品質**
  - intelligentLPGeneratorTool: バリエーション生成機能
  - variantScoringUtils: スコアリングアルゴリズム
  - VariantSelector: UI コンポーネント
  - businessContextAnalyzer: ビジネス分析機能

- **品質メトリクス**
  - 型安全性スコア
  - コード複雑度
  - テストカバレッジ
  - パフォーマンス指標

## 使用方法
### 手動実行
```bash
# コマンドパレット
Cmd+Shift+P → "Test Report Generator"

# または直接実行
npm run test:unit:coverage
```

### 自動実行
- 毎週金曜日 17:00 に自動実行
- レポートは `reports/` ディレクトリに保存
- 通知がステータスバーに表示

## レポート確認
生成されたレポートは以下で確認可能：
- `reports/task3-quality-report.html` - HTMLレポート
- `coverage/lcov-report/index.html` - カバレッジレポート
- コンソール出力 - サマリー情報