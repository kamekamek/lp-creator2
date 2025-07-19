import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// OpenAI response type definition
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

// Robust fallback response creation
function createFallbackResponse(content: string): { strategySummary: string; personaCard: string; competitorMatrix: string } {
  // Try different parsing strategies
  const strategies = [
    // Strategy 1: Split by section markers
    () => {
      const sections = content.split(/^---$/m);
      if (sections.length >= 3) {
        return {
          strategySummary: sections[0]?.trim() || '',
          personaCard: sections[1]?.trim() || '',
          competitorMatrix: sections[2]?.trim() || ''
        };
      }
      return null;
    },
    // Strategy 2: Look for markdown headers
    () => {
      const strategySummaryMatch = content.match(/## 戦略サマリー[\s\S]*?(?=## |$)/);
      const personaCardMatch = content.match(/## ペルソナカード[\s\S]*?(?=## |$)/);
      const competitorMatrixMatch = content.match(/## 競合分析[\s\S]*?(?=## |$)/);
      
      if (strategySummaryMatch || personaCardMatch || competitorMatrixMatch) {
        return {
          strategySummary: strategySummaryMatch?.[0]?.replace(/## 戦略サマリー/, '').trim() || '',
          personaCard: personaCardMatch?.[0]?.replace(/## ペルソナカード/, '').trim() || '',
          competitorMatrix: competitorMatrixMatch?.[0]?.replace(/## 競合分析/, '').trim() || ''
        };
      }
      return null;
    },
    // Strategy 3: Use entire content as strategy summary
    () => ({
      strategySummary: content.trim(),
      personaCard: '',
      competitorMatrix: ''
    })
  ];

  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result && (result.strategySummary || result.personaCard || result.competitorMatrix)) {
        return result;
      }
    } catch (error) {
      console.warn('Fallback strategy failed:', error);
    }
  }

  // Final fallback
  return {
    strategySummary: content.trim() || '<戦略サマリー生成に失敗しました>',
    personaCard: '<ペルソナカード生成に失敗しました>',
    competitorMatrix: '<競合分析マトリクス生成に失敗しました>'
  };
}

/**
 * ステップ 1: ユーザーヒアリング回答を受け取り、
 * 戦略サマリー / ペルソナ / 競合分析 を生成するツール。
 * 今はプレースホルダーで固定文字列を返す。
 * TODO: OpenAI / Claude 呼び出しロジックを実装。
 */
export const collectStrategyInfo = createTool({
  id: "Collect Strategy Info",
  description:
    "Collects answers from user interview and returns strategy summary, persona card, and competitor analysis matrix.",
  inputSchema: z.object({
    answers: z.array(z.string().min(1)).min(1).describe("Ordered list of user answers to the interview questions"),
  }),
  outputSchema: z.object({
    strategySummary: z.string(),
    personaCard: z.string(),
    competitorMatrix: z.string(),
  }),
  execute: async ({ context: { answers } }) => {
    // OpenAI Chat Completion 呼び出し
    const prompt = `あなたはプロのマーケター兼コピーライターです。以下のヒアリング回答を基に、戦略サマリー・ペルソナカード・競合分析マトリクスを生成してください。

## 入力情報
${answers.map((a, i) => `- Q${i + 1}: ${JSON.stringify(a)}`).join("\n")}

## 出力形式
必ず以下のJSON形式で出力してください。他のテキストは含めないでください：

{
  "strategySummary": "戦略サマリーの内容をMarkdown形式で記述",
  "personaCard": "ペルソナカードの内容をMarkdown形式で記述",
  "competitorMatrix": "競合分析マトリクスの内容をMarkdown形式で記述"
}`;

    // API key validation
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    try {
      // Use fetch API instead of OpenAI SDK
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional marketer and copywriter. Always respond with valid JSON format only.' 
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json() as OpenAIResponse;

      if (data.error) {
        throw new Error(`OpenAI API error: ${data.error.message}`);
      }

      // Type-safe content extraction
      const firstChoice = data.choices?.[0];
      if (!firstChoice?.message?.content) {
        throw new Error('Invalid response structure from OpenAI API');
      }
      const content: string = firstChoice.message.content;

      // JSONパースを使用して構造化データを取得
      try {
        const parsedResult = JSON.parse(content.trim());
        
        // 必要なフィールドが存在することを確認
        const strategySummary = parsedResult.strategySummary || '';
        const personaCard = parsedResult.personaCard || '';
        const competitorMatrix = parsedResult.competitorMatrix || '';

        return {
          strategySummary,
          personaCard,
          competitorMatrix,
        };
      } catch (parseError) {
        console.error('[collectStrategyInfo] JSON parse error:', parseError);
        console.error('[collectStrategyInfo] Raw content:', content);
        
        // JSONパースに失敗した場合のロバストなフォールバック
        return createFallbackResponse(content);
      }
    } catch (err) {
      console.error('[collectStrategyInfo] OpenAI error', err);
      // フォールバック
      return {
        strategySummary: '<戦略サマリーシート placeholder>',
        personaCard: '<ペルソナカード placeholder>',
        competitorMatrix: '<競合分析マトリクス placeholder>',
      };
    }
  },
});
