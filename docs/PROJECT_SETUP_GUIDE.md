# LP Creator - プロジェクトセットアップガイド

- **作成日:** 2025年06月12日
- **目的:** このドキュメントは、「LP Creator」プロジェクトの初期セットアップ手順を定義し、開発をスムーズに開始するためのガイドです。

---

## ステップ1: プロジェクトの新規作成

まず、`Open-SuperAgent` とは**別の場所**に、LP Creator用の新しいディレクトリを作成し、Next.jsプロジェクトを初期化します。

```bash
# 1. Open-SuperAgentプロジェクトの外に移動します
cd /Users/kamenonagare/kameno-dev/

# 2. LP Creator用の新しいディレクトリを作成し、そこに移動します
mkdir lp-creator
cd lp-creator

# 3. Next.js 15 プロジェクトを初期化します
npx create-next-app@latest .
```

`create-next-app` の実行中に、以下の質問が表示されます。このように設定してください。

```
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like to use `src/` directory? … No
✔ Would you like to use App Router? (recommended) … Yes
✔ Would you like to customize the default import alias (@/*)? … No
```

## ステップ2: ディレクトリ構造の整備

計画書に基づき、AI関連のロジックやコンポーネントを格納するためのディレクトリを作成します。

```bash
# プロジェクトのルートディレクトリ（lp-creator/）で実行
mkdir -p ai/tools
mkdir -p app/components
mkdir -p app/contexts
```

## ステップ3: `Open-SuperAgent` からの知見の移植（再実装）

ここが最も重要なステップです。`Open-SuperAgent` の優れたロジックを参考に、新しいファイルとして実装します。**ファイルの直接コピーはライセンス違反になるため絶対に行わないでください。**

### 3.1. `ai/unified-lp-generator.ts` の作成

- **目的**: LP全体のHTMLを生成するコアなAIツールを作成します。
- **参考ファイル**: `Open-SuperAgent/src/mastra/tools/htmlSlideTool.ts`
- **実装のポイント**:
  1.  Vercel AI SDK の `generateObject` を使用して、構造化された出力を得られるようにします。
  2.  `htmlSlideTool.ts` のプロンプトを参考に、「LP全体を生成するための詳細な指示」を記述します。出力形式（HTML/CSSの構造、Tailwind CSSの利用など）を厳密に指定することが品質の鍵です。
  3.  初期バージョンでは、まずLP全体を一度に生成するシンプルな実装を目指します。

```typescript
// ai/unified-lp-generator.ts の実装イメージ
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function generateUnifiedLP(topic: string) {
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      htmlContent: z.string().describe('Complete HTML content for the landing page, using Tailwind CSS for styling.'),
      cssContent: z.string().optional().describe('Any additional CSS required.'),
    }),
    prompt: `Create a complete, single-page landing page about "${topic}". The page should be visually appealing, responsive, and use Tailwind CSS classes directly in the HTML. The structure should include a hero section, features, testimonials, and a call-to-action.`,
  });
  return object;
}
```

### 3.2. `app/api/chat/route.ts` の編集

- **目的**: フロントエンドからのリクエストを受け取り、AIツールを呼び出すAPIエンドポイントを構築します。
- **参考ファイル**: `Open-SuperAgent/app/api/chat/route.ts`
- **実装のポイント**:
  1.  Vercel AI SDKの `streamUI` または `streamObject` を使用して、フロントエンドにレスポンスを返します。
  2.  POSTリクエストからユーザーのプロンプト（トピック）を受け取ります。
  3.  `generateUnifiedLP` 関数を呼び出し、その結果をフロントエンドにストリーミングします。

```typescript
// app/api/chat/route.ts の実装イメージ
import { generateUnifiedLP } from '@/ai/unified-lp-generator';
import { streamUI } from 'ai/rsc';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastUserMessage = messages[messages.length - 1].content;

  const result = await streamUI({
    model: openai('gpt-4o'), // このモデルは直接使わないが、SDKの形式上必要
    text: `Generating a landing page for ${lastUserMessage}...`,
    tools: {
      displayGeneratedLp: {
        description: 'Displays the generated landing page content.',
        parameters: z.object({
          html: z.string(),
        }),
        generate: async function* ({ html }) {
          yield <div>Loading...</div>;
          const lpObject = await generateUnifiedLP(lastUserMessage);
          return <div>{lpObject.htmlContent}</div>; // ここは後でiframeに渡す
        },
      },
    },
  });

  return result.value;
}
```

### 3.3. フロントエンドコンポーネントの作成

- **目的**: AIとの対話UIと、生成されたLPのプレビューUIを作成します。
- **実装のポイント**:
  - **`app/page.tsx`**: メインのレイアウトを定義。`useActions` フックを使ってAPIを呼び出します。
  - **`app/components/ChatPanel.tsx`**: チャット入力フォームとメッセージ履歴を表示します。
  - **`app/components/UnifiedLPViewer.tsx`**: APIから受け取ったHTMLを `iframe` の `srcDoc` に設定して、安全にプレビュー表示します。

## 4. 次のステップ

このガイドに従ってプロジェクトの雛形が完成したら、`LP_CREATOR_PLAN.md` の**フェーズ1**のタスクリストを参考に、各コンポーネントの具体的な実装を進めていきましょう。
