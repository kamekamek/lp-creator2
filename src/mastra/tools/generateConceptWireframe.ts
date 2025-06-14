import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * ステップ 2: 戦略サマリーをもとにコンセプト／サイトマップ／ワイヤーフレームを生成。
 * 現段階ではスタブ実装。
 */
export const generateConceptWireframe = createTool({
  id: "Generate Concept & Wireframe",
  description: "Generates visual sitemap, wireframe and three improvement patterns based on strategy info.",
  inputSchema: z.object({
    strategy: z.string(),
  }),
  outputSchema: z.object({
    siteMap: z.string(),
    wireframe: z.string(),
    improvementProposals: z.array(z.string()),
  }),
  execute: async ({ context: { strategy } }) => {
    console.log("[generateConceptWireframe] strategy", strategy);
    return {
      siteMap: "<サイトマップ placeholder>",
      wireframe: "<ワイヤーフレーム placeholder>",
      improvementProposals: [
        "保守的アプローチ placeholder",
        "標準アプローチ placeholder",
        "革新的アプローチ placeholder",
      ],
    };
  },
});
