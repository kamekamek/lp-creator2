# Interactive Hearing System

## 概要

Interactive Hearing System は、LP Creator Platform の中核機能の一つで、AI を活用してクライアントから段階的に情報を収集する高度なヒアリングシステムです。自然言語処理技術を用いて、効率的かつ包括的なビジネス要件の収集を実現します。

## 🎯 主要機能

### 1. 段階的情報収集
- **必須情報**: 商材内容、独自価値、ターゲットの悩み、コンバージョン目標
- **戦略情報**: 競合分析、集客チャネル、ブランドイメージ、成功指標
- **優先度ベース**: 重要度に応じた質問順序の自動調整

### 2. 自然言語処理
- **キーワード抽出**: 回答から重要なキーワードを自動抽出
- **感情分析**: ポジティブ/ネガティブ/ニュートラルの感情判定
- **エンティティ認識**: 業界、数値、固有名詞の自動識別

### 3. インテリジェント質問生成
- **コンテキスト認識**: 前の回答を考慮した次質問の生成
- **完了率追跡**: リアルタイムでの進捗状況監視
- **適応的フロー**: 回答内容に応じた質問ルートの動的調整

## 🏗️ システム構成

### HearingEngine クラス

```typescript
class HearingEngine {
  // ヒアリング項目の定義
  private hearingItems = {
    必須情報: [
      {
        key: '商材サービス内容',
        question: 'どのような商材・サービスを提供されていますか？',
        followUp: 'そちらの独自価値（UVP）は何でしょうか？'
      },
      // ... 他の必須項目
    ],
    戦略情報: [
      {
        key: '競合他社',
        question: '主要な競合他社を3社ほど教えてください。',
        followUp: 'それらの競合と比較した時の、御社の強みは？'
      },
      // ... 他の戦略項目
    ]
  };

  // 主要メソッド
  startHearing(): HearingResponse
  analyzeResponse(response: string, stage: string): AnalyzedResponse
  updateData(currentData: any, analyzedResponse: any): HearingData
  generateNextQuestion(data: any, stage: string): string
  calculateCompletion(data: any): number
  isHearingComplete(data: any): boolean
}
```

### データ構造

```typescript
interface HearingData {
  必須情報: {
    商材サービス内容?: string;
    独自価値UVP?: string;
    ターゲット顧客の悩み?: string;
    希望コンバージョン?: string;
    予算感覚と緊急度?: string;
  };
  戦略情報: {
    競合他社?: string[];
    現在の集客チャネル?: string;
    ブランドイメージ?: string;
    成功指標?: string;
  };
}

interface AnalyzedResponse {
  originalResponse: string;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  entities: Entity[];
  confidence: number;
}
```

## 🔄 処理フロー

### 1. ヒアリング開始
```typescript
// 初期化
const hearingEngine = new HearingEngine();
const initialResponse = hearingEngine.startHearing();

// 返却値
{
  success: true,
  currentStage: 'initial',
  message: 'LP作成のためのヒアリングを開始します',
  nextQuestion: '最初の質問',
  totalSteps: 8,
  currentStep: 1
}
```

### 2. 回答分析
```typescript
// ユーザー回答の分析
const analyzedResponse = await hearingEngine.analyzeResponse(
  userResponse, 
  currentStage
);

// 分析結果
{
  originalResponse: "AI写真編集アプリを開発しています",
  keywords: ["AI", "写真", "編集", "アプリ", "開発"],
  sentiment: "positive",
  entities: [
    { type: "industry", value: "AI" },
    { type: "product", value: "写真編集アプリ" }
  ],
  confidence: 0.85
}
```

### 3. データ更新と次質問生成
```typescript
// データ更新
const updatedData = hearingEngine.updateData(currentData, analyzedResponse);

// 次質問生成
const nextQuestion = await hearingEngine.generateNextQuestion(
  updatedData, 
  currentStage
);

// 完了率計算
const completionRate = hearingEngine.calculateCompletion(updatedData);
```

## 🧠 自然言語処理機能

### キーワード抽出
```typescript
private extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  return words.filter(word => word.length > 2);
}
```

### 感情分析
```typescript
private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['良い', '素晴らしい', '最高', '効果的'];
  const negativeWords = ['悪い', '問題', '困難', '課題'];
  
  const hasPositive = positiveWords.some(word => text.includes(word));
  const hasNegative = negativeWords.some(word => text.includes(word));
  
  if (hasPositive && !hasNegative) return 'positive';
  if (hasNegative && !hasPositive) return 'negative';
  return 'neutral';
}
```

### エンティティ認識
```typescript
private extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];
  
  // 業界キーワード
  const industries = ['SaaS', 'EC', 'コンサル', '教育', 'AI', 'フィンテック'];
  industries.forEach(industry => {
    if (text.includes(industry)) {
      entities.push({ type: 'industry', value: industry });
    }
  });
  
  // 数値抽出
  const numbers = text.match(/\d+/g);
  if (numbers) {
    numbers.forEach(num => {
      entities.push({ type: 'number', value: num });
    });
  }
  
  return entities;
}
```

## 📊 進捗管理

### 完了率計算
```typescript
calculateCompletion(data: any): number {
  const requiredFields = this.hearingItems.必須情報;
  const strategyFields = this.hearingItems.戦略情報;
  
  const requiredCount = requiredFields.filter(field => 
    data.必須情報?.[field.key]
  ).length;
  
  const strategyCount = strategyFields.filter(field => 
    data.戦略情報?.[field.key]
  ).length;
  
  const totalPossible = requiredFields.length + strategyFields.length;
  const totalCompleted = requiredCount + strategyCount;
  
  return Math.round((totalCompleted / totalPossible) * 100);
}
```

### 完了判定
```typescript
isHearingComplete(data: any): boolean {
  // 必須情報がすべて揃っているか
  const requiredComplete = this.hearingItems.必須情報.every(item =>
    data.必須情報?.[item.key]
  );
  
  // 戦略情報が一部でも揃っているか
  const strategyComplete = this.hearingItems.戦略情報.some(item =>
    data.戦略情報?.[item.key]
  );
  
  return requiredComplete && strategyComplete;
}
```

## 🎯 質問生成戦略

### 段階的アプローチ
1. **初期段階** (completion < 50%): 必須情報の収集に集中
2. **戦略段階** (50% ≤ completion < 80%): 戦略情報の収集
3. **確認段階** (completion ≥ 80%): 最終確認と次ステップ提案

### 質問選択ロジック
```typescript
async generateNextQuestion(data: any, stage: string): Promise<string> {
  const completion = this.calculateCompletion(data);
  
  if (completion < 50) {
    return this.getNextRequiredQuestion(data);
  } else if (completion < 80) {
    return this.getNextStrategyQuestion(data);
  } else {
    return this.getConfirmationQuestion(data);
  }
}
```

## 🔧 設定とカスタマイズ

### ヒアリング項目のカスタマイズ
```typescript
// 業界特化型の質問項目を追加
const customHearingItems = {
  ...defaultHearingItems,
  業界特化情報: [
    {
      key: 'SaaS特化項目',
      question: 'SaaS特有の質問...',
      condition: (data) => data.業界 === 'SaaS'
    }
  ]
};
```

### 分析精度の調整
```typescript
// 信頼度計算のカスタマイズ
private calculateConfidence(response: string): number {
  const length = response.length;
  const hasSpecifics = /\d/.test(response) || 
                      response.includes('例えば') || 
                      response.includes('具体的');
  
  let confidence = Math.min(length / 100, 1) * 0.7;
  if (hasSpecifics) confidence += 0.3;
  
  return Math.round(confidence * 100) / 100;
}
```

## 🚀 使用例

### 基本的な使用方法
```typescript
import { interactiveHearingTool } from '@/mastra/tools/interactiveHearingTool';

// ヒアリング開始
const initialResponse = await interactiveHearingTool.execute({
  stage: 'initial'
});

// ユーザー回答の処理
const nextResponse = await interactiveHearingTool.execute({
  stage: 'strategy',
  userResponse: 'AI写真編集アプリを開発しています',
  currentData: collectedData
});

// 完了チェック
if (nextResponse.isComplete) {
  // LP生成プロセスへ移行
  proceedToLPGeneration(nextResponse.collectedData);
}
```

### React コンポーネントでの統合
```typescript
const HearingInterface = () => {
  const [hearingState, setHearingState] = useState({
    stage: 'initial',
    data: {},
    question: '',
    completion: 0
  });
  
  const handleUserResponse = async (response: string) => {
    const result = await interactiveHearingTool.execute({
      stage: hearingState.stage,
      userResponse: response,
      currentData: hearingState.data
    });
    
    setHearingState({
      stage: result.currentStage,
      data: result.collectedData,
      question: result.nextQuestion,
      completion: result.completionRate
    });
  };
  
  return (
    <div>
      <ProgressBar completion={hearingState.completion} />
      <Question text={hearingState.question} />
      <ResponseInput onSubmit={handleUserResponse} />
    </div>
  );
};
```

## 🔍 デバッグとモニタリング

### ログ出力
```typescript
// ヒアリング進捗のログ
console.log('[Hearing] Stage:', currentStage);
console.log('[Hearing] Completion:', completionRate + '%');
console.log('[Hearing] Collected data:', collectedData);
```

### エラーハンドリング
```typescript
try {
  const result = await hearingEngine.analyzeResponse(userResponse, stage);
  return result;
} catch (error) {
  console.error('Hearing analysis error:', error);
  return {
    success: false,
    error: 'ヒアリング処理中にエラーが発生しました',
    fallbackQuestion: 'もう一度お聞かせください。'
  };
}
```

## 📈 パフォーマンス最適化

### 非同期処理
- 回答分析の並列処理
- キャッシュ機能による応答速度向上
- デバウンス処理による API 呼び出し最適化

### メモリ管理
- 不要なデータの自動クリーンアップ
- セッション管理による状態保持
- 大量データ処理時の分割処理

## 🔮 今後の拡張予定

### 高度な NLP 機能
- より精密な感情分析
- 意図理解の向上
- 多言語対応

### 学習機能
- ユーザー回答パターンの学習
- 質問精度の自動改善
- 業界特化型モデルの構築

### インテグレーション
- CRM システムとの連携
- 外部 API との統合
- リアルタイム協調編集

---

**Interactive Hearing System** は LP Creator Platform の知的な情報収集エンジンとして、効率的で包括的なクライアントヒアリングを実現し、高品質なランディングページ生成の基盤を提供します。