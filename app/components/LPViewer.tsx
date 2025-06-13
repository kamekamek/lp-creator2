'use client';

import { useEditMode } from '@/app/contexts/EditModeContext';
import { useMemo, useRef, useEffect } from 'react';

interface LPViewerProps {
  htmlContent: string;
}

export function LPViewer({ htmlContent }: LPViewerProps) {
  const { isEditMode, selectedElementId, selectElement } = useEditMode();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // デバッグ用ログ
  console.log('[LPViewer] Received htmlContent:', {
    length: htmlContent.length,
    preview: htmlContent.substring(0, 200),
    isFallback: htmlContent.includes('This section is currently being generated')
  });

  // Editモードの状態に応じて、iframeに注入するHTMLを動的に生成します。
  const processedHtml = useMemo(() => {
    // Tailwind CSSとカスタムスタイルを含む完全なhead
    const head = `
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Landing Page Preview</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* 編集モード時に data-editable-id を持つ要素をハイライト */
          body.edit-mode [data-editable-id] {
            outline: 2px dashed #3b82f6; /* Tailwind blue-500 */
            outline-offset: 2px;
            cursor: pointer;
            transition: outline 0.2s ease-in-out;
          }
          body.edit-mode [data-editable-id]:hover {
            outline-color: #1d4ed8; /* Tailwind blue-700 */
            background-color: rgba(59, 130, 246, 0.1);
          }
          /* 選択された要素のスタイル */
          body.edit-mode [data-editable-id="${selectedElementId}"] {
              outline: 3px solid #2563eb; /* Tailwind blue-600 */
              background-color: rgba(59, 130, 246, 0.2);
          }
          /* 基本的なリセットとフォント設定 */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
        </style>
      </head>
    `;

    // 編集モードなら<body>タグに 'edit-mode' クラスを追加
    const bodyClass = isEditMode ? ' class="edit-mode"' : '';
    
    // HTMLコンテンツをbodyタグでラップ
    const bodyContent = `<body${bodyClass}>${htmlContent}</body>`;
    
    // 完全なHTMLドキュメントを構築
    const finalHtml = `<!DOCTYPE html><html lang="ja">${head}${bodyContent}</html>`;

    return finalHtml;
  }, [htmlContent, isEditMode, selectedElementId]);

  // iframe内の要素がクリックされたときの処理
  useEffect(() => {
    if (!isEditMode || !iframeRef.current) return;

    const iframeDoc = iframeRef.current.contentDocument;
    if (!iframeDoc) return;

    const handleClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      let target = event.target as HTMLElement | null;
      let editableId: string | null = null;

      // クリックされた要素またはその親を遡って data-editable-id を探す
      while (target) {
        if (target.hasAttribute('data-editable-id')) {
          editableId = target.getAttribute('data-editable-id');
          break;
        }
        target = target.parentElement;
      }
      
      selectElement(editableId);
    };

    iframeDoc.body.addEventListener('click', handleClick);

    return () => {
      if (iframeDoc) {
        iframeDoc.body.removeEventListener('click', handleClick);
      }
    };
  }, [isEditMode, selectElement, processedHtml]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={processedHtml}
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        border: 'none',
        borderRadius: '0px',
        backgroundColor: '#fff'
      }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
