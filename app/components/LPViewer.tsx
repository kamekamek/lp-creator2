'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEditMode } from '../contexts/EditModeContext';
import { InlineTextEditor } from './InlineTextEditor';
import { SmartHoverMenu } from './SmartHoverMenu';

interface LPViewerProps {
  htmlContent: string;
  cssContent?: string;
  width?: string;
  height?: string;
  enableFullscreen?: boolean;
  onTextUpdate?: (elementId: string, newText: string) => void;
  onAIImprove?: (elementId: string, currentText: string) => void;
  isModalOpen?: boolean;
}

export const LPViewer: React.FC<LPViewerProps> = ({ 
  htmlContent, 
  cssContent = '',
  width = '100%',
  height = '100%',
  enableFullscreen = true,
  onTextUpdate,
  onAIImprove,
  isModalOpen = false
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isEditMode, selectedElementId, selectElement } = useEditMode();
  
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [hoverMenuVisible, setHoverMenuVisible] = useState(false);
  const [hoverMenuPosition, setHoverMenuPosition] = useState({ x: 0, y: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  // themeObserverRef は未使用のためコメントアウトまたは削除検討

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const extractTextFromElement = useCallback((elementId: string): string => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return '';
    const element = doc.querySelector(`[data-editable-id="${elementId}"]`);
    return element?.textContent?.trim() || '';
  }, []);

  const startInlineEdit = useCallback((elementId: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    setInlineEditingId(elementId);
    setHoverMenuVisible(false);
    selectElement(elementId);
  }, [selectElement]);

  const saveInlineEdit = useCallback((elementId: string, newText: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    if (onTextUpdate) {
      onTextUpdate(elementId, newText);
    }
    setInlineEditingId(null);
    selectElement(null);
  }, [onTextUpdate, selectElement]);

  const cancelInlineEdit = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    setInlineEditingId(null);
    selectElement(null);
  }, [selectElement]);

  const handleAIImprove = useCallback((elementId: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const currentText = extractTextFromElement(elementId);
    if (onAIImprove && currentText) {
      onAIImprove(elementId, currentText);
    }
    setHoverMenuVisible(false);
  }, [extractTextFromElement, onAIImprove]);

  const handleClick = useCallback((editableId: string | null) => {
    if (!editableId) return;
    selectElement(editableId);
    // 他のクリック時のロジックがあればここに追加
  }, [selectElement]);

  const setupEditableElements = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      console.warn('setupEditableElements: iframe not available. Skipping setup.');
      return;
    }
    const doc = iframe.contentDocument;
    if (!doc) {
      console.warn('setupEditableElements: iframe document not available. Skipping setup.');
      return;
    }
    if (!doc.body) {
      console.warn('setupEditableElements: iframe body not available. Skipping setup.');
      return;
    }
    if (doc.body.children.length === 0 && doc.readyState !== 'complete') {
        console.log('⚠️ iframe body is empty or not fully loaded, skipping setupEditableElements');
        return;
    }

    console.log('🎯 Setting up inline editable elements...');
    const editableElements = doc.querySelectorAll<HTMLElement>('[data-editable-id]');
    console.log(`📝 Found ${editableElements.length} editable elements`);
    console.log('🔧 [FIX] Using optimized DOM manipulation - no more cloning!');

    editableElements.forEach((element) => {
      const editableId = element.dataset.editableId;
      if (!editableId) return;

      // 🔧 [FIX] クローン・置き換えを削除してDOM操作を最小化
      // イベントリスナーは適切にクリーンアップしてパフォーマンスを向上
      const currentElement = element;

      if (isEditMode) {
        currentElement.contentEditable = 'true';
        currentElement.spellcheck = false;

          // 🔧 [FIX] 重複リスナー登録を防止して最適化
        if (!currentElement.hasAttribute('data-edit-listener')) {
          const handleDoubleClick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`✏️ Double-clicked element: ${editableId}`);
            startInlineEdit(editableId);
          };

          const handleMouseEnter = (e: MouseEvent) => {
            if (inlineEditingId || isModalOpen) return;
            const rect = currentElement.getBoundingClientRect();
            const iframeRect = iframe.getBoundingClientRect();
            setHoveredElementId(editableId);
            setHoverMenuPosition({
              x: iframeRect.left + rect.right + 10,
              y: iframeRect.top + rect.top,
            });
            setHoverMenuVisible(true);
            currentElement.classList.add('edit-hover');
          };

          const handleMouseLeave = () => {
            currentElement.classList.remove('edit-hover');
            setTimeout(() => {
              if (hoveredElementId === editableId && !document.querySelector('.smart-hover-menu:hover')) {
                 setHoverMenuVisible(false);
              }
            }, 100);
          };
          
          const handleBlur = (e: FocusEvent) => {
            e.stopPropagation();
            if (!inlineEditingId || inlineEditingId !== editableId) {
              selectElement(editableId);
            }
          };

          currentElement.addEventListener('dblclick', handleDoubleClick as EventListener);
          currentElement.addEventListener('mouseenter', handleMouseEnter as EventListener);
          currentElement.addEventListener('mouseleave', handleMouseLeave as EventListener);
          currentElement.addEventListener('click', () => handleClick(editableId));
          currentElement.setAttribute('data-edit-listener', 'true');
        }
      } else {
        currentElement.contentEditable = 'false';
        currentElement.removeAttribute('data-edit-listener');
        currentElement.classList.remove('edit-hover', 'edit-highlight', 'editing');
      }

      // ハイライトと編集中クラスの管理
      if (selectedElementId === editableId && isEditMode) {
        currentElement.classList.add('edit-highlight');
      } else {
        currentElement.classList.remove('edit-highlight');
      }
      if (inlineEditingId === editableId && isEditMode) {
        currentElement.classList.add('editing');
      } else {
        currentElement.classList.remove('editing');
      }
    });

    let style = doc.getElementById('edit-mode-styles') as HTMLStyleElement;
    if (isEditMode) {
      if (!style) {
        style = doc.createElement('style');
        style.id = 'edit-mode-styles';
        style.textContent = `
          [data-editable-id]:hover.edit-hover {
            outline: 1px dashed #007bff;
            cursor: pointer;
          }
          [data-editable-id].edit-highlight {
            outline: 2px solid #007bff !important;
            box-shadow: 0 0 8px rgba(0,123,255,0.5);
          }
          [data-editable-id].editing {
             outline: 2px solid #28a745 !important; /* 編集中は緑色の枠 */
          }
        `;
        if (doc && doc.head) {
          doc.head.appendChild(style);
        }
      }
    } else {
      if (style) {
        style.remove();
      }
      setHoverMenuVisible(false); // 編集モード解除時はホバーメニューも非表示
    }
  }, [isEditMode, selectElement, inlineEditingId, startInlineEdit, selectedElementId]);

  // iframeのコンテンツを初期化・更新する
  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;

    if (doc && htmlContent) {
      // HTMLサニタイゼーション処理を関数に分割
      const decodeHtmlEntities = (content: string): string => {
        return content
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&'); // 最後に処理することが重要
      };

      const fixBrokenSvgPaths = (content: string): string => {
        return content
          .replace(/d="\\*"/g, 'd=""')
          .replace(/d="\\+"([^"]*)"\\*"/g, 'd="$1"')
          .replace(/d="\\"([^"]*)\\""/g, 'd="$1"');
      };

      const fixBrokenAttributes = (content: string): string => {
        return content
          .replace(/src="\\"([^"]*)\\""/g, 'src="$1"')
          .replace(/href="\\"([^"]*)\\""/g, 'href="$1"');
      };

      const fixSvgDataUrls = (content: string): string => {
        return content.replace(/"data:image\/svg\+xml,[^"]*"/g, (match: string) => {
          return match.replace(/\\"/g, '"').replace(/""/g, '"');
        });
      };

      const replaceEmptyImages = (content: string): string => {
        return content.replace(
          /<img[^>]*src=""[^>]*>/g, 
          '<div class="bg-gray-200 rounded-lg h-48 flex items-center justify-center"><span class="text-gray-500">画像プレースホルダー</span></div>'
        );
      };

      const sanitizeHtmlContent = (content: string): string => {
        let processedContent = content;
        processedContent = decodeHtmlEntities(processedContent);
        processedContent = fixBrokenSvgPaths(processedContent);
        processedContent = fixBrokenAttributes(processedContent);
        processedContent = fixSvgDataUrls(processedContent);
        processedContent = replaceEmptyImages(processedContent);
        return processedContent;
      };

      let processedContent = sanitizeHtmlContent(htmlContent);

      const hasStyleTag = processedContent.includes('<style>') && processedContent.includes('</style>');
      const hasHtmlStructure = processedContent.includes('<section') || processedContent.includes('<div') || processedContent.includes('<body');
      const isCompleteHtml = processedContent.trim().startsWith('<!DOCTYPE') || processedContent.trim().startsWith('<html');

      // Escape characters that could break template literals for finalHtml and cssContent
      processedContent = processedContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
      const escapedCssContent = cssContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

      let finalHtml = '';
      if (isCompleteHtml) {
        finalHtml = processedContent;
      } else if (hasStyleTag && hasHtmlStructure) {
        finalHtml = `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
              // 🔧 [CRITICAL FIX] Tailwind ダークモードを強制無効化
              tailwind.config = {
                darkMode: false
              }
            </script>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
              /* 🔧 [CRITICAL FIX] prefers-color-scheme を iframe 内で強制無効化 */
              @media (prefers-color-scheme: dark) {
                html, body { 
                  background: white !important; 
                  color: black !important; 
                }
              }
              ${escapedCssContent}
              body {
                margin: 0;
                padding: 0;
                font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
                overflow-x: hidden;
                line-height: 1.6;
                color: #111827; /* USER MEMORY: text-black or text-gray-900 */
              }
              main {
                width: 100%;
                height: 100%;
              }
              section {
                width: 100%;
                min-height: 50vh;
                padding: 2rem;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 1rem;
              }
              @media (max-width: 768px) {
                section {
                  padding: 1rem;
                  min-height: 40vh;
                }
              }
              ::-webkit-scrollbar {
                width: 8px;
              }
              ::-webkit-scrollbar-track {
                background: #f1f1f1;
              }
              ::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
              .lp-section {
                width: 100%;
                min-height: 50vh;
                box-sizing: border-box;
                opacity: 0;
                animation: fadeInUp 0.6s ease-out forwards;
              }
              .lp-section:nth-child(2) { animation-delay: 0.1s; }
              .lp-section:nth-child(3) { animation-delay: 0.2s; }
              .lp-section:nth-child(4) { animation-delay: 0.3s; }
              .lp-section:nth-child(5) { animation-delay: 0.4s; }
              .lp-section:nth-child(6) { animation-delay: 0.5s; }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .fullscreen-mode body, .fullscreen-mode {
                background: #fff;
                width: 100vw;
                height: 100vh;
                overflow-y: auto;
              }
            </style>
          </head>
          <body class="${isFullscreen ? 'fullscreen-mode' : ''}">
            ${processedContent}
          </body>
          </html>
        `;
      } else if (hasHtmlStructure) {
        finalHtml = `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
              // 🔧 [CRITICAL FIX] Tailwind ダークモードを強制無効化
              tailwind.config = {
                darkMode: false
              }
            </script>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
              /* 🔧 [CRITICAL FIX] prefers-color-scheme を iframe 内で強制無効化 */
              @media (prefers-color-scheme: dark) {
                html, body { 
                  background: white !important; 
                  color: black !important; 
                }
              }
              /* Minimal styles if no cssContent is provided but HTML structure exists */
              body {
                margin: 0;
                padding: 0;
                font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
                overflow-x: hidden;
                line-height: 1.6;
                color: #111827; /* USER MEMORY: text-black or text-gray-900 */
              }
              main { width: 100%; height: 100%; }
              section { width: 100%; min-height: 50vh; padding: 2rem; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; }
              .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
              @media (max-width: 768px) { section { padding: 1rem; min-height: 40vh; } }
              ::-webkit-scrollbar { width: 8px; }
              ::-webkit-scrollbar-track { background: #f1f1f1; }
              ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
              ::-webkit-scrollbar-thumb:hover { background: #555; }
              .lp-section {
                opacity: 0;
                animation: fadeInUp 0.6s ease-out forwards;
              }
              .lp-section:nth-child(2) { animation-delay: 0.1s; }
              .lp-section:nth-child(3) { animation-delay: 0.2s; }
              .lp-section:nth-child(4) { animation-delay: 0.3s; }
              .lp-section:nth-child(5) { animation-delay: 0.4s; }
              .lp-section:nth-child(6) { animation-delay: 0.5s; }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .fullscreen-mode body, .fullscreen-mode {
                background: #fff;
                width: 100vw;
                height: 100vh;
                overflow-y: auto;
              }
            </style>
          </head>
          <body class="${isFullscreen ? 'fullscreen-mode' : ''}">
            <main>${processedContent}</main>
          </body>
          </html>
        `;
      } else {
        // プレーンテキストまたは非常に単純なHTMLの場合
        finalHtml = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: sans-serif; padding: 1rem; color: #333; }
            .fullscreen-mode body, .fullscreen-mode { background: #fff; width: 100vw; height: 100vh; overflow-y: auto; }
          </style>
        </head>
        <body class="${isFullscreen ? 'fullscreen-mode' : ''}">
          ${processedContent}
        </body>
        </html>
        `;
      }

  if (doc) {
    doc.open();
    doc.write(finalHtml);
    doc.close(); // ドキュメントのロードを完了させる
  } else {
    console.warn('Attempted to write to iframe but document was null.');
  }
}

}, [htmlContent, cssContent, isFullscreen]); // 🔧 [CRITICAL FIX] setupEditableElements削除でiframe再描画を防止

// isEditMode, selectedElementId, inlineEditingId, htmlContent が変更されたときに setupEditableElements を呼び出す
useEffect(() => {
  const iframe = iframeRef.current;
  const handleLoad = () => {
    if (iframe?.contentDocument?.body && iframe?.contentDocument?.readyState === 'complete') {
      console.log('iframe loaded, setting up editable elements via load event');
      setupEditableElements();
    } else if (iframe?.contentDocument?.body) {
      console.log('iframe load event fired, body present, but readyState not complete, attempting setup');
      setupEditableElements();
    }
  };

  if (iframe) {
    if (iframe.contentDocument?.body && iframe.contentDocument?.readyState === 'complete') {
      console.log('iframe already loaded with body, setting up editable elements immediately');
      setupEditableElements();
    } else {
      iframe.addEventListener('load', handleLoad);
    }
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }
}, [isEditMode, selectedElementId, inlineEditingId]); // 🔧 [CRITICAL FIX] 不要な依存削除で連鎖的再描画を防止

return (
  <div ref={containerRef} className="relative w-full h-full" style={{ width: isFullscreen ? '100vw' : width, height: isFullscreen ? '100vh' : height }}>
    <iframe
      ref={iframeRef}
      title="LP Preview"
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    />
    {enableFullscreen && (
      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors z-50"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
    )}
    {inlineEditingId && (
      <InlineTextEditor
        elementId={inlineEditingId!} 
        initialText={extractTextFromElement(inlineEditingId!)}
        onSave={(newText) => saveInlineEdit(inlineEditingId!, newText)}
        onCancel={cancelInlineEdit}
        isActive={!!inlineEditingId}
        // TODO: positionを適切に計算して渡す。現状は画面中央などに表示される想定。
      />
    )}
    {hoverMenuVisible && hoveredElementId && (
      <SmartHoverMenu
        isVisible={hoverMenuVisible}
        elementId={hoveredElementId!}
        position={hoverMenuPosition}
        onEdit={() => startInlineEdit(hoveredElementId!)}
        onAIImprove={() => handleAIImprove(hoveredElementId!)}
        onClose={() => setHoverMenuVisible(false)}
        className="smart-hover-menu"
      />
    )}
  </div>
);
};