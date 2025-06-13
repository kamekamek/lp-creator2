'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEditMode } from '../contexts/EditModeContext';

interface LPViewerProps {
  htmlContent: string;
  cssContent?: string;
  width?: string;
  height?: string;
  enableFullscreen?: boolean;
}

export const LPViewer: React.FC<LPViewerProps> = ({ 
  htmlContent, 
  cssContent = '',
  width = '100%',
  height = '100%',
  enableFullscreen = true
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isEditMode, selectedElementId, selectElement } = useEditMode();

  // フルスクリーン切り替え
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        // フルスクリーンに入る
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        }
      } else {
        // フルスクリーンを抜ける
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

  // フルスクリーン状態の監視
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

  // iframe内要素のクリック検出とハイライト機能
  const setupEditableElements = useCallback(() => {
    if (!iframeRef.current || !isEditMode) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    if (!doc) return;

    console.log('🎯 Setting up editable elements...');

    // 既存のイベントリスナーを削除
    const existingListeners = doc.querySelectorAll('[data-edit-listener]');
    existingListeners.forEach(el => {
      el.removeAttribute('data-edit-listener');
    });

    // 編集可能な要素を取得
    const editableElements = doc.querySelectorAll('[data-editable-id]');
    console.log(`📝 Found ${editableElements.length} editable elements`);

    editableElements.forEach((element) => {
      const editableId = element.getAttribute('data-editable-id');
      if (!editableId) return;

      // クリックイベントリスナーを追加
      const handleClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log(`🖱️ Clicked element: ${editableId}`);
        selectElement(editableId);
        
        // 他の要素のハイライトを削除
        editableElements.forEach(el => {
          el.classList.remove('edit-highlight');
        });
        
        // クリックされた要素をハイライト
        element.classList.add('edit-highlight');
      };

      element.addEventListener('click', handleClick);
      element.setAttribute('data-edit-listener', 'true');
      
      // ホバー効果も追加
      const handleMouseEnter = () => {
        if (selectedElementId !== editableId) {
          element.classList.add('edit-hover');
        }
      };
      
      const handleMouseLeave = () => {
        element.classList.remove('edit-hover');
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    });

    // 編集スタイルをiframe内に注入
    const existingStyle = doc.getElementById('edit-mode-styles');
    if (!existingStyle) {
      const style = doc.createElement('style');
      style.id = 'edit-mode-styles';
      style.textContent = `
        [data-editable-id] {
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        [data-editable-id]:hover.edit-hover {
          outline: 2px dashed #3b82f6;
          outline-offset: 2px;
        }
        
        [data-editable-id].edit-highlight {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        [data-editable-id].edit-highlight:before {
          content: "✏️ " attr(data-editable-id);
          position: absolute;
          top: -25px;
          left: 0;
          background: #3b82f6;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          z-index: 1000;
          white-space: nowrap;
        }
      `;
      doc.head.appendChild(style);
    }
  }, [isEditMode, selectElement, selectedElementId]);

  // 選択された要素のハイライトを更新
  useEffect(() => {
    if (!iframeRef.current) return;
    
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    // 全ての要素のハイライトを削除
    const allEditableElements = doc.querySelectorAll('[data-editable-id]');
    allEditableElements.forEach(el => {
      el.classList.remove('edit-highlight');
    });

    // 選択された要素をハイライト
    if (selectedElementId) {
      const selectedElement = doc.querySelector(`[data-editable-id="${selectedElementId}"]`);
      if (selectedElement) {
        selectedElement.classList.add('edit-highlight');
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedElementId]);

  // LPHTMLをiframeに展開する
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        // HTMLコンテンツのエスケープ処理を修正
        let processedContent = htmlContent;
        
        // 二重エンコーディングされたURLを修正
        processedContent = processedContent.replace(/&quot;/g, '"');
        processedContent = processedContent.replace(/&#x27;/g, "'");
        processedContent = processedContent.replace(/&lt;/g, '<');
        processedContent = processedContent.replace(/&gt;/g, '>');
        processedContent = processedContent.replace(/&amp;/g, '&');
        
        // 不正なSVGパス属性を修正（より厳密なパターン）
        processedContent = processedContent.replace(/d="\\*"/g, 'd=""');
        processedContent = processedContent.replace(/d="\\+"([^"]*)"\\*"/g, 'd="$1"');
        processedContent = processedContent.replace(/d="\\"([^"]*)\\""/g, 'd="$1"');
        processedContent = processedContent.replace(/d="\\\"([^"]*)\\\"/g, 'd="$1"');
        
        // 不正なイメージソースを修正（data URIも含む）
        processedContent = processedContent.replace(/src="\\"([^"]*)\\""/g, 'src="$1"');
        processedContent = processedContent.replace(/src="\\\"([^"]*)\\\"/g, 'src="$1"');
        processedContent = processedContent.replace(/href="\\"([^"]*)\\""/g, 'href="$1"');
        processedContent = processedContent.replace(/href="\\\"([^"]*)\\\"/g, 'href="$1"');
        
        // data URIの二重クォートエスケープを修正
        processedContent = processedContent.replace(/"data:image\/svg\+xml,[^"]*"/g, (match) => {
          return match.replace(/\\"/g, '"').replace(/""/g, '"');
        });
        
        // 不正な外部リソースパスを修正
        processedContent = processedContent.replace(/src="[^"]*\.jpg"\/"/g, 'src=""');
        processedContent = processedContent.replace(/src="\/[^"]*\.jpg\/"/g, 'src=""');
        processedContent = processedContent.replace(/href="\/[^"]*\.jpg\/"/g, 'href=""');
        
        // 空のsrc属性を持つ画像を隠す
        processedContent = processedContent.replace(/<img[^>]*src=""[^>]*>/g, '<div class="bg-gray-200 rounded-lg h-48 flex items-center justify-center"><span class="text-gray-500">画像プレースホルダー</span></div>');
        
        // htmlContentに<style>タグやHTML構造が含まれているか確認
        const hasStyleTag = processedContent.includes('<style>') && processedContent.includes('</style>');
        const hasHtmlStructure = processedContent.includes('<section') || processedContent.includes('<div') || processedContent.includes('<body');
        
        // 完全なHTMLドキュメントかどうかを確認
        const isCompleteHtml = processedContent.trim().startsWith('<!DOCTYPE') || processedContent.trim().startsWith('<html');
        
        if (isCompleteHtml) {
          // 完全なHTMLドキュメントの場合はそのまま表示
          doc.open();
          doc.write(processedContent);
          doc.close();
        } else if (hasStyleTag && hasHtmlStructure) {
          // スタイルタグとHTML構造が含まれている場合は、最小限のHTMLドキュメントで包む
          const minimalTemplate = `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
              ${cssContent}
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
                  overflow-x: hidden;
                  line-height: 1.6;
                  color: #333;
                }
                /* スクロールバーのカスタマイズ */
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
                /* LP専用スタイル */
                .lp-section {
                  width: 100%;
                  min-height: 50vh;
                  box-sizing: border-box;
                }
                /* アニメーション */
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
                
                /* フルスクリーン時のスタイル */
                .fullscreen-mode {
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
          doc.open();
          doc.write(minimalTemplate);
          doc.close();
        } else if (hasHtmlStructure) {
          // HTML構造のみある場合はデフォルトのスタイルを適用
          const defaultTemplate = `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
              ${cssContent}
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
                  overflow-x: hidden;
                  line-height: 1.6;
                  color: #333;
                  background: #fff;
                }
                main {
                  width: 100%;
                  height: 100%;
                }
                /* LP全体のスタイル */
                section {
                  width: 100%;
                  min-height: 50vh;
                  padding: 2rem;
                  box-sizing: border-box;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                }
                /* デフォルトのレスポンシブデザイン */
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
                /* スクロールバー */
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
              </style>
            </head>
            <body class="${isFullscreen ? 'fullscreen-mode' : ''}">
              <main>
                ${processedContent}
              </main>
            </body>
            </html>
          `;
          doc.open();
          doc.write(defaultTemplate);
          doc.close();
        } else {
          // プレーンテキストの場合はBasicなHTMLで囲む
          const basicTemplate = `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
              ${cssContent}
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 2rem;
                }
              </style>
            </head>
            <body class="${isFullscreen ? 'fullscreen-mode' : ''}">
              <div>${processedContent}</div>
            </body>
            </html>
          `;
          doc.open();
          doc.write(basicTemplate);
          doc.close();
        }
        
        // HTML更新後に編集可能要素を設定
        setTimeout(() => {
          setupEditableElements();
        }, 100);
      }
    }
  }, [htmlContent, cssContent, isFullscreen, setupEditableElements]);

  // 編集モードが変更された時も編集可能要素を再設定
  useEffect(() => {
    if (htmlContent) {
      setTimeout(() => {
        setupEditableElements();
      }, 100);
    }
  }, [isEditMode, setupEditableElements, htmlContent]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${isFullscreen ? 'bg-black' : 'bg-white'}`}
      style={{ width, height }}
    >
      {/* 編集モードインジケーター */}
      {isEditMode && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-md">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">編集モード</span>
        </div>
      )}

      {/* 選択された要素の情報 */}
      {isEditMode && selectedElementId && (
        <div className="absolute top-16 left-4 z-10 bg-white border border-gray-200 rounded-lg shadow-md p-3 max-w-xs">
          <div className="text-sm text-gray-600 mb-1">選択中の要素:</div>
          <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{selectedElementId}</div>
        </div>
      )}

      {/* フルスクリーンボタン */}
      {enableFullscreen && (
        <button
          onClick={toggleFullscreen}
          className={`absolute top-4 right-4 z-10 p-2 rounded-lg shadow-md transition-all duration-200 ${
            isFullscreen 
              ? 'bg-black bg-opacity-70 hover:bg-opacity-90 text-white' 
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
          title={isFullscreen ? 'フルスクリーンを終了' : 'フルスクリーン表示'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </button>
      )}

      {/* メインのiframe */}
      <iframe
        ref={iframeRef}
        className={`w-full h-full border-none rounded-lg ${
          isFullscreen ? 'rounded-none' : ''
        }`}
        style={{ 
          backgroundColor: '#fff',
          minHeight: isFullscreen ? '100vh' : '600px'
        }}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Landing Page Preview"
      />

      {/* フルスクリーン時のESCキーヒント */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
            ESCキーでフルスクリーンを終了
          </div>
        </div>
      )}
    </div>
  );
};