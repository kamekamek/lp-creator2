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
    industry: z.string().optional(),
    targetAudience: z.string().optional(),
    businessGoal: z.string().optional(),
    competitiveAdvantages: z.array(z.string()).optional(),
    tone: z.enum(['professional', 'friendly', 'premium']).optional(),
  }),
  outputSchema: z.object({
    copyDocument: z.string(),
    interactionSpec: z.string(),
  }),
  execute: async ({ context }) => {
    const { 
      persona, 
      strategy, 
      industry,
      targetAudience,
      businessGoal,
      competitiveAdvantages,
      tone 
    } = context;
    
    console.log("[writeCopyAndUX] Processing:", {
      personaLength: persona?.length || 0,
      strategyLength: strategy?.length || 0,
      industry: industry || 'not specified',
      tone: tone || 'not specified'
    });
    
    return {
      copyDocument: `<完全版コピー placeholder for ${industry || 'general'} industry>`,
      interactionSpec: `<インタラクション仕様書 placeholder with ${tone || 'professional'} tone>`,
    };
  },
});
