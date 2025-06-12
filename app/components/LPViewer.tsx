'use client';

import { useEditMode } from '@/app/contexts/EditModeContext';
import { useMemo, useRef, useEffect } from 'react';

interface LPViewerProps {
  htmlContent: string;
}

export function LPViewer({ htmlContent }: LPViewerProps) {
  const { isEditMode, selectedElementId, selectElement } = useEditMode();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Editモードの状態に応じて、iframeに注入するHTMLを動的に生成します。
  const processedHtml = useMemo(() => {
    // 編集可能な要素を視覚的に示すためのスタイル
    const style = `
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
      </style>
    `;

    // 編集モードなら<body>タグに 'edit-mode' クラスを追加
    const bodyClass = isEditMode ? ' class="edit-mode"' : '';
    const bodyRegex = /<body(.*?)>/i;

    let finalHtml = htmlContent;

    // 既存のbodyタグにクラスを挿入、またはbodyタグでラップ
    if (bodyRegex.test(finalHtml)) {
      finalHtml = finalHtml.replace(bodyRegex, `<body$1${bodyClass}>`);
    } else {
      finalHtml = `<body${bodyClass}>${finalHtml}</body>`;
    }

    // headタグにスタイルを挿入、またはheadタグでラップ
    const headRegex = /<head(.*?)>/i;
    if (headRegex.test(finalHtml)) {
      finalHtml = finalHtml.replace(headRegex, `<head$1>${style}`);
    } else {
      finalHtml = `<head>${style}</head>${finalHtml}`;
    }

    // htmlタグがなければ全体をラップ
    if (!/<html/i.test(finalHtml)) {
      finalHtml = `<!DOCTYPE html><html>${finalHtml}</html>`;
    }

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
      style={{ width: '100%', height: '600px', border: '1px solid #ccc', borderRadius: '8px' }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
