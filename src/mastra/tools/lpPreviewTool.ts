import { tool } from 'ai';
import { z } from 'zod';

export const lpPreviewTool = tool({
  description: 'Displays a preview of the generated landing page HTML content with metadata for the UI.',
  parameters: z.object({
    htmlContent: z.string().describe('The complete HTML content of the landing page.'),
    title: z.string().optional().default('Generated Landing Page').describe('Title for the preview.'),
    metadata: z.object({
      topic: z.string().optional(),
      sections: z.array(z.string()).optional(),
      generationTime: z.number().optional(),
      designStyle: z.string().optional(),
      conversionGoal: z.string().optional(),
    }).optional().describe('Additional metadata about the landing page.'),
    autoOpen: z.boolean().optional().default(true).describe('Whether to automatically open the preview panel.'),
  }),
  execute: async ({ htmlContent, title, metadata, autoOpen }) => {
    // プレビューツールは主にフロントエンドでの表示を制御するためのメタデータを返す
    console.log(`🎯 LP Preview tool called for: ${title}`);
    console.log(`📏 HTML content length: ${htmlContent.length} characters`);
    
    // HTMLコンテンツの基本検証
    const isValidHtml = htmlContent.includes('<section') || htmlContent.includes('<div');
    const hasStyles = htmlContent.includes('class=') || htmlContent.includes('<style');
    
    // メタデータの生成
    const previewMetadata = {
      title: title,
      htmlLength: htmlContent.length,
      isValidHtml: isValidHtml,
      hasStyles: hasStyles,
      autoOpen: autoOpen,
      generatedAt: new Date().toISOString(),
      ...metadata,
    };

    // フロントエンドに表示するためのレスポンス
    return {
      success: true,
      htmlContent: htmlContent,
      title: title,
      metadata: previewMetadata,
      previewConfig: {
        autoOpen: autoOpen,
        panelWidth: 80, // デフォルトのパネル幅（%）
        showToolbar: true,
        enableFullscreen: true,
        enableExport: true,
      },
      message: `Landing page preview generated successfully. HTML content: ${htmlContent.length} characters.`,
    };
  }
});