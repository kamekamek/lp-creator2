import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * ステップ 3: ペルソナ・戦略情報をもとにコピーライティングとUX仕様を生成。
 * TODO: Claude / OpenAI 呼び出しで詳細コピー生成。
 */
export const writeCopyAndUX = createTool({
  id: "Write Copy and UX",
  description: "Generates full copy document and interaction spec based on persona and strategy",
  inputSchema: z.object({
    persona: z.string(),
    strategy: z.string(),
  }),
  outputSchema: z.object({
    copyDocument: z.string(),
    interactionSpec: z.string(),
  }),
  execute: async ({ context: { persona, strategy } }) => {
    console.log("[writeCopyAndUX] persona,strategy", persona.length, strategy.length);
    return {
      copyDocument: "<完全版コピー placeholder>",
      interactionSpec: "<インタラクション仕様書 placeholder>",
    };
  },
});
