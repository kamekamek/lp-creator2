'use server';

import { createAI, getMutableAIState, createStreamableUI } from 'ai/rsc';
import type { CoreMessage } from 'ai';
import { generateUnifiedLP } from '@/src/mastra/tools/lpGeneratorTool';
import { partialUpdateLP } from '@/src/mastra/tools/partialUpdateTool';
import type { ReactNode } from 'react';
import { LpDisplay } from '@/app/components/LpDisplay';

export type AIState = Array<CoreMessage>;
export type UIState = Array<{
  id: number;
  role: 'user' | 'assistant';
  display: ReactNode;
}>;

async function submitUserMessage(userInput: string, selectedElementId: string | null) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: selectedElementId 
        ? `Modification for ${selectedElementId}: ${userInput}` 
        : userInput,
    },
  ]);

  const uiStream = createStreamableUI(
    <div className="p-4 bg-gray-100 rounded-lg text-center">
      <p className="font-semibold text-gray-900">Generating...</p>
    </div>
  );

  (async () => {
    try {
      let lpObject;
      if (selectedElementId) {
        const lastLpState = [...aiState.get()]
          .reverse()
          .find(msg => msg.role === 'assistant' && typeof msg.content === 'string' && msg.content.startsWith('{'));
        
        if (!lastLpState || typeof lastLpState.content !== 'string') {
          throw new Error("Could not find the previous LP state to update.");
        }
        const currentLP = JSON.parse(lastLpState.content);
        
        lpObject = await partialUpdateLP({
          currentLP,
          modificationPrompt: userInput,
          selectedElementId,
        });

      } else {
        const topic = userInput;
        lpObject = await generateUnifiedLP({ topic });
      }

      aiState.done([
        ...aiState.get(),
        {
          role: 'assistant',
          content: JSON.stringify(lpObject),
        },
      ]);

      uiStream.done(<LpDisplay lpObject={lpObject} />);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      uiStream.done(<div className="p-4 bg-red-100 text-red-700 rounded-lg">Error: {errorMessage}</div>);
      aiState.done([
        ...aiState.get(),
        {
          role: 'assistant',
          content: `Error: ${errorMessage}`,
        },
      ]);
    }
  })();

  return {
    id: Date.now(),
    role: 'assistant',
    display: uiStream.value,
  };
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  initialAIState: [],
});
