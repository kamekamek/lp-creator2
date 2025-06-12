'use server';

import { createAI, getMutableAIState, createStreamableUI } from 'ai/rsc';
import type { CoreMessage } from 'ai';
import { generateUnifiedLP } from '@/src/mastra/tools/lpGeneratorTool';
import type { ReactNode } from 'react';

async function displayGeneratedLp({ topic }: { topic: string }) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: topic,
    },
  ]);

  const ui = createStreamableUI(
    <div className="p-4">
      <div className="animate-pulse">Generating your landing page for "{topic}"... Please wait.</div>
    </div>
  );

  (async () => {
    try {
      const lpObject = await generateUnifiedLP({ topic });

      aiState.done([
        ...aiState.get(),
        {
          role: 'assistant',
          content: `Generated a landing page for "${topic}".`,
        },
      ]);

      // Component to display the generated structure
      const StructureDisplay = (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Generated Page Structure:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            {lpObject.structure.sections.map((section: { type: string; prompt: string }, index: number) => (
              <li key={index} className="capitalize">
                {section.type.replace('_', ' ')}
              </li>
            ))}
          </ul>
        </div>
      );

      const LPPreview = (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Here is your generated landing page!</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <iframe
                srcDoc={lpObject.htmlContent}
                style={{ width: '100%', height: '600px', border: '1px solid #ccc', borderRadius: '8px' }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
            <div>
              {StructureDisplay}
            </div>
          </div>
        </div>
      );
      ui.done(LPPreview);
    } catch (error) {
      console.error('--- DETAILED LP GENERATION ERROR ---');
      console.error(error);
      console.error('------------------------------------');
      const ErrorDisplay = (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg">
          <h4 className="font-bold">An Error Occurred</h4>
          <p>Failed to generate the landing page. Please check the server console for details.</p>
          <pre className="mt-2 text-sm whitespace-pre-wrap">
            {error instanceof Error ? error.message : JSON.stringify(error)}
          </pre>
        </div>
      );
      aiState.done([
        ...aiState.get(),
        {
          role: 'assistant',
          content: `Failed to generate a landing page for "${topic}". Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
      ui.done(ErrorDisplay);
    }
  })();

  return {
    id: Date.now(),
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
