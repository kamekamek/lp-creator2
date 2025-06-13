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
}

export const LPViewer: React.FC<LPViewerProps> = ({ 
  htmlContent, 
  cssContent = '',
  width = '100%',
  height = '100%',
  enableFullscreen = true,
  onTextUpdate,
  onAIImprove
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isEditMode, selectedElementId, selectElement } = useEditMode();
  
  // インライン編集の状態管理
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [hoverMenuVisible, setHoverMenuVisible] = useState(false);
  const [hoverMenuPosition, setHoverMenuPosition] = useState({ x: 0, y: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

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

  // テキスト抽出ヘルパー
  const extractTextFromElement = useCallback((elementId: string): string => {
    if (!iframeRef.current) return '';
    
    const doc = iframeRef.current.contentDocument;
    if (!doc) return '';
    
    const element = doc.querySelector(`[data-editable-id="${elementId}"]`);
    return element?.textContent?.trim() || '';
  }, []);

  // インライン編集開始
  const startInlineEdit = useCallback((elementId: string) => {
    setInlineEditingId(elementId);
    setHoverMenuVisible(false);
    selectElement(elementId);
  }, [selectElement]);

  // インライン編集保存
  const saveInlineEdit = useCallback((elementId: string, newText: string) => {
    if (onTextUpdate) {
      onTextUpdate(elementId, newText);
    }
    setInlineEditingId(null);
    selectElement(null);
  }, [onTextUpdate, selectElement]);

  // インライン編集キャンセル
  const cancelInlineEdit = useCallback(() => {
    setInlineEditingId(null);
    selectElement(null);
  }, [selectElement]);

  // AI改善処理
  const handleAIImprove = useCallback((elementId: string) => {
    const currentText = extractTextFromElement(elementId);
    if (onAIImprove && currentText) {
      onAIImprove(elementId, currentText);
    }
    setHoverMenuVisible(false);
  }, [extractTextFromElement, onAIImprove]);

  // iframe内要素のイベント設定（新しいインライン編集対応）
  const setupEditableElements = useCallback(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // コンテンツが読み込まれていない場合は処理をスキップ
    if (!doc.body || doc.body.children.length === 0) {
      console.log('⚠️ iframe content not ready, skipping setup');
      return;
    }

    try {
      console.log('🎯 Setting up inline editable elements...');

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

      // ダブルクリックでインライン編集開始
      const handleDoubleClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log(`✏️ Double-clicked element: ${editableId}`);
        startInlineEdit(editableId);
      };

      // ホバーでスマートメニュー表示
      const handleMouseEnter = (e: Event) => {
        if (!isEditMode || inlineEditingId) return;
        
        try {
          const rect = element.getBoundingClientRect();
          const iframeRect = iframe.getBoundingClientRect();
          
          // 位置計算の安全性確認
          if (rect && iframeRect) {
            setHoveredElementId(editableId);
            setHoverMenuPosition({
              x: iframeRect.left + rect.right + 10,
              y: iframeRect.top + rect.top
            });
            setHoverMenuVisible(true);
            
            // ホバー効果
            element.classList.add('edit-hover');
          }
        } catch (error) {
          console.error('❌ Error in handleMouseEnter:', error);
        }
      };

      // ホバー終了
      const handleMouseLeave = (e: Event) => {
        try {
          element.classList.remove('edit-hover');
          
          // 少し遅延してメニューを隠す（メニューに移動する時間を確保）
          setTimeout(() => {
            if (hoveredElementId === editableId) {
              setHoverMenuVisible(false);
              setHoveredElementId(null);
            }
          }, 100);
        } catch (error) {
          console.error('❌ Error in handleMouseLeave:', error);
        }
      };

      element.addEventListener('dblclick', handleDoubleClick);
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      element.setAttribute('data-edit-listener', 'true');
    });

    // 編集モードのスタイル管理
    const existingStyle = doc.getElementById('edit-mode-styles');
    
    if (isEditMode) {
      // 編集モードON: スタイルを注入
      if (!existingStyle) {
        const style = doc.createElement('style');
        style.id = 'edit-mode-styles';
        style.textContent = `
          /* 基本的な編集可能要素のスタイル */
          [data-editable-id] {
            transition: all 0.15s ease;
            position: relative;
            border-radius: 4px;
          }
          
          /* ホバー時の自然なハイライト */
          [data-editable-id]:hover.edit-hover {
            background-color: rgba(59, 130, 246, 0.05);
            outline: 1px solid rgba(59, 130, 246, 0.2);
            outline-offset: 1px;
            cursor: text;
          }
          
          /* ダブルクリックのヒント */
          [data-editable-id].edit-hover:after {
            content: "ダブルクリックで編集";
            position: absolute;
            top: -24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            white-space: nowrap;
            z-index: 1000;
            opacity: 0;
            animation: fadeInTooltip 0.3s ease 0.5s forwards;
          }
          
          @keyframes fadeInTooltip {
            to { opacity: 1; }
          }
          
          /* インライン編集中の要素 */
          [data-editable-id].editing {
            background-color: rgba(59, 130, 246, 0.1);
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
          
          /* テキスト色を明確に黒に設定 */
          [data-editable-id] {
            color: #000000 !important;
          }
          
          /* 見出し要素の色も確実に黒に */
          [data-editable-id] h1,
          [data-editable-id] h2,
          [data-editable-id] h3,
          [data-editable-id] h4,
          [data-editable-id] h5,
          [data-editable-id] h6,
          [data-editable-id] p,
          [data-editable-id] span,
          [data-editable-id] div {
            color: #000000 !important;
          }
        `;
        doc.head.appendChild(style);
      }
    } else {
      // 編集モードOFF: スタイルを削除
      if (existingStyle) {
        existingStyle.remove();
      }
    }
    } catch (error) {
      console.error('❌ Error setting up editable elements:', error);
      // エラーが発生しても続行できるようにする
    }
  }, [isEditMode, selectElement, selectedElementId, hoveredElementId, inlineEditingId, startInlineEdit]);

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
        
        // HTML更新後に編集可能要素を設定（安全な遅延）
        setTimeout(() => {
          // iframeがまだ存在し、コンテンツがロードされていることを確認
          if (iframeRef.current && iframeRef.current.contentDocument?.body) {
            setupEditableElements();
          }
        }, 200);
      }
    }
  }, [htmlContent, cssContent, isFullscreen, setupEditableElements]);

  // 編集モードが変更された時の処理
  useEffect(() => {
    if (!htmlContent) return;
    
    const handleEditModeChange = () => {
      if (!iframeRef.current) return;
      
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;
      
      console.log(`🔄 Edit mode changed: ${isEditMode ? 'ON' : 'OFF'}`);
      
      // 編集モードOFF時の清理
      if (!isEditMode) {
        // ホバーメニューを隠す
        setHoverMenuVisible(false);
        setHoveredElementId(null);
        
        // インライン編集を終了
        setInlineEditingId(null);
        
        // 選択を解除
        selectElement(null);
        
        // 全ての編集クラスを削除
        const editableElements = doc.querySelectorAll('[data-editable-id]');
        editableElements.forEach(el => {
          el.classList.remove('edit-hover', 'edit-highlight', 'editing');
        });
        
        // イベントリスナーを削除
        const elementsWithListeners = doc.querySelectorAll('[data-edit-listener]');
        elementsWithListeners.forEach(el => {
          el.removeAttribute('data-edit-listener');
        });
      }
      
      // 少し遅延を入れてスタイルとイベントを設定
      setTimeout(() => {
        try {
          setupEditableElements();
        } catch (error) {
          console.error('❌ Error in edit mode setup:', error);
        }
      }, 50);
    };
    
    handleEditModeChange();
  }, [isEditMode, htmlContent, setupEditableElements, selectElement]);

  // コンテナからマウスが離れた時の処理
  const handleContainerMouseLeave = useCallback(() => {
    if (isEditMode) {
      console.log('🖱️ Mouse left container, cleaning up hover effects');
      
      // ホバーメニューを隠す
      setHoverMenuVisible(false);
      setHoveredElementId(null);
      
      // iframe内の全てのhover効果を削除
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          const hoveredElements = doc.querySelectorAll('.edit-hover');
          hoveredElements.forEach(el => {
            el.classList.remove('edit-hover');
          });
        }
      }
    }
  }, [isEditMode]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${isFullscreen ? 'bg-black' : 'bg-white'}`}
      style={{ width, height }}
      onMouseLeave={handleContainerMouseLeave}
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

      {/* スマートホバーメニュー */}
      <SmartHoverMenu
        elementId={hoveredElementId || ''}
        isVisible={hoverMenuVisible && !!hoveredElementId && isEditMode}
        position={hoverMenuPosition}
        onEdit={() => hoveredElementId && startInlineEdit(hoveredElementId)}
        onAIImprove={() => hoveredElementId && handleAIImprove(hoveredElementId)}
        onClose={() => {
          setHoverMenuVisible(false);
          setHoveredElementId(null);
        }}
      />

      {/* インライン編集エディター */}
      {inlineEditingId && (
        <div className="absolute inset-0 z-30 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-black mb-2">テキストを編集</h3>
              <p className="text-sm text-gray-600">要素: {inlineEditingId}</p>
            </div>
            <InlineTextEditor
              initialText={extractTextFromElement(inlineEditingId)}
              elementId={inlineEditingId}
              isActive={true}
              onSave={(newText) => saveInlineEdit(inlineEditingId, newText)}
              onCancel={cancelInlineEdit}
              onAIImprove={onAIImprove ? (text) => onAIImprove(inlineEditingId, text) : undefined}
              placeholder="新しいテキストを入力してください..."
            />
          </div>
        </div>
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