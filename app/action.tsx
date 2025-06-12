'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import type { CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { mastra, lpGeneratorTool } from '@/src/mastra';
import type { ReactNode } from 'react';

async function displayGeneratedLp({ topic }: { topic: string }) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  const ui = await streamUI({
    model: openai('gpt-4o'),
    system: `You are an AI assistant that helps users create landing pages.
    When the user provides a topic or a description for a landing page, you must call the 'generate_lp_ui' tool with the inferred topic.
    Do not ask for confirmation. Call the tool directly.`,
    messages: aiState.get(),
    tools: {
      generate_lp_ui: {
        description: 'Generates and displays a landing page component based on a given topic.',
        parameters: z.object({
          topic: z.string().describe('The topic for the landing page to be generated.'),
        }),
        generate: async function* ({ topic }) {
          yield <div>Generating your landing page for "{topic}"... Please wait.</div>;

          const lpObject = await lpGeneratorTool.execute({ topic });

          aiState.done([
            ...aiState.get(),
            {
              role: 'assistant',
              content: `Generated a landing page for "${topic}".`,
            },
          ]);

          const LPPreview = (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-lg font-semibold">Here is a preview of your landing page!</h3>
              <iframe
                srcDoc={lpObject.htmlContent}
                style={{ width: '100%', height: '600px', border: '1px solid #ccc', borderRadius: '8px' }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          );
          return LPPreview;
        },
      },
    },
  });

  return {
    id: Date.now(),
    role: 'assistant' as const,
    display: ui.value,
  };
}

// AI State: The 'data' part of the conversation, a list of messages
// UI State: The 'UI' part, a list of React nodes to display
export const AI = createAI<
  // AI State
  CoreMessage[],
  // UI State
  {
    id: number;
    role: 'user' | 'assistant';
    display: ReactNode;
  }[]
> ({
  actions: {
    displayGeneratedLp,
  },
  initialUIState: [],
  initialAIState: [],
});
