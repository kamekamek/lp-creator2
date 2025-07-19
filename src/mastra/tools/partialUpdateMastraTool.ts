import { tool } from 'ai';
import { z } from 'zod';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { JSDOM } from 'jsdom';

export const partialUpdateMastraTool = tool({
  description: 'Updates specific elements in the landing page by modifying their content while preserving the overall structure.',
  parameters: z.object({
    elementId: z.string().describe('The data-editable-id of the element to update (e.g., "section-0-element-1")'),
    newContent: z.string().describe('The new text content for the selected element'),
    htmlContent: z.string().describe('The current full HTML content of the landing page'),
  }),
  execute: async ({ elementId, newContent, htmlContent }) => {
    console.log(`🔄 Partial Update: Updating element ${elementId} with new content`);
    
    try {
      // HTMLを解析してDOM操作でテキストを更新（サーバーサイド対応）
      const dom = new JSDOM(htmlContent);
      const doc = dom.window.document;
      
      // 対象要素を検索
      const targetElement = doc.querySelector(`[data-editable-id="${elementId}"]`);
      
      if (!targetElement) {
        console.error(`❌ Element with id "${elementId}" not found`);
        return {
          success: false,
          error: `Element with id "${elementId}" not found`,
          htmlContent: htmlContent
        };
      }
      
      console.log(`✅ Found element: ${targetElement.tagName}`);
      
      // 要素のタイプに応じて適切に更新
      const tagName = targetElement.tagName.toLowerCase();
      
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'button', 'a', 'li'].includes(tagName)) {
        // テキスト系要素の場合は直接テキストを置換
        targetElement.textContent = newContent;
      } else {
        // その他の要素の場合はinnerHTMLを更新
        targetElement.innerHTML = newContent;
      }
      
      // 更新されたHTMLを取得
      let updatedHTML = dom.serialize();
      
      // 必要に応じてHTML形式を正規化
      if (!updatedHTML.startsWith('<!DOCTYPE')) {
        // body内のコンテンツのみを抽出
        const bodyContent = doc.body?.innerHTML || '';
        if (bodyContent) {
          updatedHTML = bodyContent;
        }
      }
      
      console.log(`✅ Partial Update completed for element: ${elementId}`);
      
      return {
        success: true,
        elementId: elementId,
        updatedContent: newContent,
        htmlContent: updatedHTML,
        message: `要素 "${elementId}" が正常に更新されました`
      };
      
    } catch (error) {
      console.error('❌ Partial Update failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        htmlContent: htmlContent,
        elementId: elementId
      };
    }
  }
});

// AI駆動の高度な部分更新ツール（将来の拡張用）
export const aiPartialUpdateTool = tool({
  description: 'Uses AI to intelligently update landing page elements while maintaining design consistency and context.',
  parameters: z.object({
    elementId: z.string().describe('The data-editable-id of the element to update'),
    updatePrompt: z.string().describe('Description of how the element should be changed'),
    htmlContent: z.string().describe('The current full HTML content'),
    context: z.string().optional().describe('Additional context about the landing page or brand'),
  }),
  execute: async ({ elementId, updatePrompt, htmlContent, context }) => {
    console.log(`🤖 AI Partial Update: Processing element ${elementId}`);
    
    try {
      // HTMLを解析して要素を特定（サーバーサイド対応）
      const dom = new JSDOM(htmlContent);
      const doc = dom.window.document;
      const targetElement = doc.querySelector(`[data-editable-id="${elementId}"]`);
      
      if (!targetElement) {
        return {
          success: false,
          error: `Element with id "${elementId}" not found`,
          htmlContent: htmlContent
        };
      }
      
      const currentContent = targetElement.textContent || targetElement.innerHTML;
      const elementType = targetElement.tagName.toLowerCase();
      const elementClasses = targetElement.className;
      
      // AIに新しいコンテンツを生成させる
      const prompt = `あなたはプロフェッショナルなランディングページライターです。
既存の要素を改善してください。

【現在の要素情報】
- 要素タイプ: ${elementType}
- 現在の内容: "${currentContent}"
- CSSクラス: ${elementClasses}
- 要素ID: ${elementId}

【更新要求】
${updatePrompt}

【追加コンテキスト】
${context || 'なし'}

【出力要件】
- 元の要素タイプ（${elementType}）に適した内容を生成
- 既存のスタイルとトーンを維持
- 簡潔で魅力的な文章
- HTMLタグは含めず、テキストコンテンツのみ出力
- 特殊文字は適切にエスケープ

新しいコンテンツ:`;

      const { text: newContent } = await generateText({
        model: createAnthropic()('claude-3-5-sonnet-20241022'),
        prompt: prompt,
        maxTokens: 500,
        temperature: 0.7,
      }, {});
      
      // 生成されたコンテンツで要素を更新
      targetElement.textContent = newContent.trim();
      
      // 更新されたHTMLを取得
      const updatedHTML = dom.serialize();
      
      console.log(`✅ AI Partial Update completed for element: ${elementId}`);
      
      return {
        success: true,
        elementId: elementId,
        originalContent: currentContent,
        updatedContent: newContent.trim(),
        htmlContent: updatedHTML,
        message: `AI により要素 "${elementId}" が改善されました`
      };
      
    } catch (error) {
      console.error('❌ AI Partial Update failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI処理中にエラーが発生しました',
        htmlContent: htmlContent,
        elementId: elementId
      };
    }
  }
});