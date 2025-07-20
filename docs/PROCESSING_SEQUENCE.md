# LP Creator 処理シーケンス図

## 概要
LP Creator の主要な処理フローを示すシーケンス図です。ユーザーの入力からLP生成・表示までの流れを詳細に記載しています。

## 1. インタラクティブヒアリング処理フロー

```mermaid
sequenceDiagram
    participant U as User
    participant UI as page.tsx
    participant API as /api/lp-creator/chat/route.ts
    participant Agent as lpCreatorAgent.ts
    participant Hearing as interactiveHearingTool
    participant NLP as NLP Engine

    U->>UI: 初回チャット入力
    UI->>API: POST /api/lp-creator/chat
    API->>Agent: Mastra Agent 呼び出し
    
    Agent->>Hearing: startHearing() 実行
    Hearing-->>Agent: 初回質問返却
    Agent->>API: ヒアリング開始をストリーミング
    API-->>UI: 初回質問をストリーミング
    UI-->>U: 質問を表示
    
    loop ヒアリング継続
        U->>UI: 回答入力
        UI->>API: 回答をPOST
        API->>Agent: 回答を転送
        Agent->>Hearing: analyzeResponse() 実行
        Hearing->>NLP: キーワード・感情・エンティティ分析
        NLP-->>Hearing: 分析結果返却
        Hearing->>Hearing: updateData() でデータ更新
        Hearing->>Hearing: calculateCompletion() で進捗計算
        Hearing->>Hearing: generateNextQuestion() で次質問生成
        Hearing-->>Agent: 次質問と進捗返却
        Agent->>API: 質問をストリーミング
        API-->>UI: 質問と進捗をストリーミング
        UI-->>U: 質問と進捗表示
    end
    
    Hearing->>Hearing: isHearingComplete() チェック
    Hearing-->>Agent: 完了通知とデータ
    Agent-->>API: ヒアリング完了
    API-->>UI: コンセプト提案へ移行
```

## 2. メイン処理フロー（LP生成）

```mermaid
sequenceDiagram
    participant U as User
    participant UI as page.tsx
    participant API as /api/lp-creator/chat/route.ts
    participant Agent as lpCreatorAgent.ts
    participant Tools as Mastra Tools
    participant Viewer as LPViewer.tsx

    Note over U,Viewer: ヒアリング完了後の処理
    
    U->>UI: LP生成開始指示
    UI->>API: POST /api/lp-creator/chat
    API->>Agent: Mastra Agent 呼び出し
    
    Agent->>Tools: lpStructureTool 実行（ヒアリングデータ活用）
    Tools-->>Agent: 構造提案返却
    Agent->>API: ストリーミング応答開始
    API-->>UI: 構造提案をストリーミング
    UI-->>U: 構造提案を表示
    
    U->>UI: 構造承認
    UI->>API: 承認をPOST
    API->>Agent: 承認を転送
    
    Agent->>Tools: enhancedLPGeneratorTool 実行
    Tools-->>Agent: 完全なLP生成
    Agent->>API: LP結果をストリーミング
    API-->>UI: LP結果をストリーミング
    
    UI->>Viewer: HTML内容を渡す
    Viewer->>Viewer: iframe内でHTML表示
    Viewer-->>U: LP表示完了
```

## 3. 編集モード処理フロー

```mermaid
sequenceDiagram
    participant U as User
    participant Viewer as LPViewer.tsx
    participant Editor as InlineTextEditor
    participant Menu as SmartHoverMenu
    participant Panel as AIChatPanel
    participant API as /api/lp-creator/chat/route.ts

    U->>Viewer: 要素をダブルクリック
    Viewer->>Editor: 編集モード開始
    Editor-->>U: インライン編集UI表示
    
    U->>Editor: テキスト編集
    Editor->>Viewer: 即座にDOM更新
    Viewer-->>U: 変更を即座に反映
    
    Note over U,Viewer: または、ホバーによる改善
    
    U->>Viewer: 要素にホバー
    Viewer->>Menu: ホバーメニュー表示
    Menu-->>U: 編集・AI改善・スタイル選択肢表示
    
    U->>Menu: AI改善を選択
    Menu->>Panel: AI改善パネル表示
    Panel-->>U: 自然言語入力フォーム
    
    U->>Panel: 改善要求入力
    Panel->>API: 改善要求をPOST
    API->>Agent: 改善要求を転送
    Agent->>Tools: 適切なツール実行
    Tools-->>Agent: 改善結果返却
    Agent-->>API: 改善結果をストリーミング
    API-->>Panel: 改善結果受信
    Panel->>Viewer: 改善されたHTMLで更新
    Viewer-->>U: 改善結果を表示
```

## 4. ツールシステム詳細フロー

```mermaid
sequenceDiagram
    participant Agent as lpCreatorAgent.ts
    participant Structure as lpStructureTool
    participant Generator as enhancedLPGeneratorTool
    participant Preview as lpPreviewTool
    participant HTML as htmlLPTool
    participant CSS as generateCSS
    participant JS as generateJS

    Agent->>Structure: 1. 構造提案要求
    Structure-->>Agent: セクション構造提案
    
    Agent->>Generator: 2. LP生成要求
    Generator->>HTML: HTML生成
    Generator->>CSS: CSS生成
    Generator->>JS: JavaScript生成
    
    HTML-->>Generator: HTML部分
    CSS-->>Generator: CSS部分
    JS-->>Generator: JS部分
    
    Generator-->>Agent: 完全なLP
    
    Agent->>Preview: 3. プレビュー生成
    Preview-->>Agent: プレビュー用HTML
    
    Agent-->>Agent: 全結果を統合
```

## 4. データフロー図

```mermaid
graph TB
    subgraph "Frontend"
        A["page.tsx"] --> B["LPViewer.tsx"]
        A --> C["InlineTextEditor"]
        A --> D["SmartHoverMenu"]
        A --> E["AIChatPanel"]
    end
    
    subgraph "API Layer"
        F["API Route<br/>chat/route.ts"]
    end
    
    subgraph "Mastra Framework"
        G["mastra/index.ts"]
        H["lpCreatorAgent.ts"]
        I["enhancedLPGeneratorTool.ts"]
        J["lpStructureTool.ts"]
        K["lpPreviewTool.ts"]
        L["htmlLPTool.ts"]
    end
    
    subgraph "Storage"
        M["LibSQL Database<br/>memory.db"]
    end
    
    A -->|useChat hook| F
    F -->|Mastra call| G
    G --> H
    H --> I
    H --> J
    H --> K
    H --> L
    H <-->|Memory| M
    
    F -->|Streaming| A
    A -->|HTML content| B
```

## 5. 状態管理フロー

```mermaid
stateDiagram-v2
    [*] --> Initial
    Initial --> StructureProposal: User Request
    StructureProposal --> UserReview: Structure Generated
    UserReview --> FullGeneration: User Approval
    UserReview --> StructureProposal: User Edit Request
    FullGeneration --> Displaying: LP Generated
    Displaying --> EditMode: User Edit Action
    EditMode --> Displaying: Edit Complete
    EditMode --> AIImprovement: AI Improvement Request
    AIImprovement --> Displaying: Improvement Applied
    Displaying --> [*]: Session End
```

## 技術スタック

- **Frontend**: Next.js 15.2.2, React (最新18.x系), TypeScript 5.8.2
- **AI Framework**: Mastra
- **API**: Next.js API Routes with Streaming
- **Database**: LibSQL (../memory.db)
- **Styling**: Tailwind CSS
- **AI Models**: Claude 3.7 Sonnet, OpenAI GPT-4.1 (mini/nano含む), Google Gemini

## 主要な特徴

1. **ストリーミング応答**: リアルタイムでAIの応答を表示
2. **構造提案と承認**: ユーザーが構造を確認・編集可能
3. **即座の編集反映**: チャット不要のインライン編集
4. **自然言語改善**: AI による自然言語での改善要求
5. **動的モデル選択**: 複数のAIプロバイダーをサポート