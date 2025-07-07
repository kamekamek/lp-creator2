import { createTool } from "@mastra/core/tools";
import { z } from "zod";

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
${answers.map((a, i) => `- Q${i + 1}: ${a}`).join("\n")}

## 出力形式
必ず以下のJSON形式で出力してください。他のテキストは含めないでください：

{
  "strategySummary": "戦略サマリーの内容をMarkdown形式で記述",
  "personaCard": "ペルソナカードの内容をMarkdown形式で記述",
  "competitorMatrix": "競合分析マトリクスの内容をMarkdown形式で記述"
}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`OpenAI API error: ${data.error.message}`);
      }

      const content: string = data.choices?.[0]?.message?.content ?? '';

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
        
        // JSONパースに失敗した場合は、従来の方法でフォールバック
        const sections = content.split(/^---$/m);
        const [strategySummary = '', personaCard = '', competitorMatrix = ''] = sections;

        return {
          strategySummary: strategySummary.trim(),
          personaCard: personaCard.trim(),
          competitorMatrix: competitorMatrix.trim(),
        };
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
