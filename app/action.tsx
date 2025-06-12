'use server';

import { createAI, getMutableAIState, createStreamableUI } from 'ai/rsc';
import type { CoreMessage } from 'ai';
import { generateUnifiedLP } from '@/src/mastra/tools/lpGeneratorTool';
import { partialUpdateLP } from '@/src/mastra/tools/partialUpdateTool';
import { generateLPStructure } from '@/src/mastra/tools/structureTool';
import type { ReactNode } from 'react';
import { LpDisplay } from '@/app/components/LpDisplay';
import { StructureConfirmation } from '@/app/components/StructureConfirmation';

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
    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <div>
        <p className="font-semibold text-blue-900">LPを生成中...</p>
        <p className="text-sm text-blue-700">構造を分析しています</p>
      </div>
    </div>
  );

  (async () => {
    try {
      let lpObject;
      
      if (selectedElementId) {
        // 更新の場合
        uiStream.update(
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <p className="font-semibold text-blue-900">要素を更新中...</p>
              <p className="text-sm text-blue-700">{selectedElementId}を編集しています</p>
            </div>
          </div>
        );
        
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
        // 新規生成の場合 - まず構成案を生成
        const isStructureConfirmed = aiState.get().some(msg => 
          msg.role === 'assistant' && 
          typeof msg.content === 'string' && 
          msg.content.includes('"type":"structure"')
        );

        if (userInput === 'CONFIRM_STRUCTURE') {
          // 構成案確認後、LP生成を開始
          uiStream.update(
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-semibold text-blue-900">LPを生成中...</p>
                <p className="text-sm text-blue-700">構成案に基づいてHTMLを作成しています</p>
              </div>
            </div>
          );

          // 最後の構成案を取得
          const lastStructureState = [...aiState.get()]
            .reverse()
            .find(msg => msg.role === 'assistant' && typeof msg.content === 'string' && msg.content.includes('"type":"structure"'));
          
          if (!lastStructureState || typeof lastStructureState.content !== 'string') {
            throw new Error("Could not find the structure to generate LP from.");
          }
          
          const structureData = JSON.parse(lastStructureState.content);
          const topic = structureData.data.title || "Landing Page";
          
          console.log('🚀 Starting LP generation for:', topic);
          lpObject = await generateUnifiedLP({ topic });
          console.log('✅ LP generation completed successfully');
        } else if (userInput.startsWith('EDIT_STRUCTURE:')) {
          // 構成案編集の場合
          const newStructureJson = userInput.replace('EDIT_STRUCTURE:', '');
          const newStructure = JSON.parse(newStructureJson);
          
          aiState.done([
            ...aiState.get(),
            {
              role: 'assistant',
              content: JSON.stringify({ type: 'structure', data: newStructure }),
            },
          ]);

          uiStream.done(
            <StructureConfirmation structure={newStructure} />
          );
          
          return {
            id: Date.now(),
            role: 'assistant',
            display: uiStream.value,
          };
        } else if (!isStructureConfirmed) {
          // 構成案未確認の場合は構成案を生成
          uiStream.update(
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-semibold text-blue-900">構成案を作成中...</p>
                <p className="text-sm text-blue-700">最適な構造を分析しています</p>
              </div>
            </div>
          );
          
          const structure = await generateLPStructure(userInput);
          
          aiState.done([
            ...aiState.get(),
            {
              role: 'assistant',
              content: JSON.stringify({ type: 'structure', data: structure }),
            },
          ]);

          uiStream.done(
            <StructureConfirmation structure={structure} />
          );
          
          return {
            id: Date.now(),
            role: 'assistant',
            display: uiStream.value,
          };
        } else {
          // 構成案確認済みの場合はLP生成
          uiStream.update(
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-semibold text-blue-900">LPを生成中...</p>
                <p className="text-sm text-blue-700">セクション構造を設計しています</p>
              </div>
            </div>
          );
          
          const topic = userInput;
          
          lpObject = await generateUnifiedLP({ topic });
        }
      }

      // lpObjectが生成された場合のみ状態を更新
      if (lpObject) {
        console.log('📝 Updating AI state with LP object');
        aiState.done([
          ...aiState.get(),
          {
            role: 'assistant',
            content: JSON.stringify(lpObject),
          },
        ]);

        console.log('🎯 Finalizing UI stream with LP display');
        uiStream.done(
          <div className="lp-preview-message">
            <LpDisplay lpObject={lpObject} />
          </div>
        );
        console.log('✅ UI stream finalized successfully');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error('❌ Error in submitUserMessage:', errorMessage);
      console.error('Stack trace:', e instanceof Error ? e.stack : 'No stack trace available');
      
      uiStream.done(
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="font-semibold text-red-800">エラーが発生しました</p>
          <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
        </div>
      );
      
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
