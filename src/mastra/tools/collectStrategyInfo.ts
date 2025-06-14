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
    answers: z.array(z.string()).describe("Ordered list of user answers to the interview questions"),
  }),
  outputSchema: z.object({
    strategySummary: z.string(),
    personaCard: z.string(),
    competitorMatrix: z.string(),
  }),
  execute: async ({ context: { answers } }) => {
    // OpenAI Chat Completion 呼び出し
    const prompt = `あなたはプロのマーケター兼コピーライターです。以下の情報を基に、戦略サマリー・ペルソナカード・競合分析マトリクスを日本語でMarkdown形式で出力してください。\n\n---\n## 入力情報\n${answers.map((a, i) => `- Q${i + 1}: ${a}`).join("\n")}\n---`;

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
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      const json = await response.json();
      const content: string = json.choices?.[0]?.message?.content ?? '';

      // 簡易的にセクション分割（本番ではYAMLなど構造化する）
      const [strategySummary = '', personaCard = '', competitorMatrix = ''] = content.split(/^---$/m);

      return {
        strategySummary,
        personaCard,
        competitorMatrix,
      };
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
