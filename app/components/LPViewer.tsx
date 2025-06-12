'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface LPViewerProps {
  htmlContent: string;
  width?: string;
  height?: string;
  enableFullscreen?: boolean;
}

export const LPViewer: React.FC<LPViewerProps> = ({ 
  htmlContent, 
  width = '100%',
  height = '100%',
  enableFullscreen = true
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // LPHTMLをiframeに展開する
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        // htmlContentに<style>タグやHTML構造が含まれているか確認
        const hasStyleTag = htmlContent.includes('<style>') && htmlContent.includes('</style>');
        const hasHtmlStructure = htmlContent.includes('<section') || htmlContent.includes('<div') || htmlContent.includes('<body');
        
        // 完全なHTMLドキュメントかどうかを確認
        const isCompleteHtml = htmlContent.trim().startsWith('<!DOCTYPE') || htmlContent.trim().startsWith('<html');
        
        if (isCompleteHtml) {
          // 完全なHTMLドキュメントの場合はそのまま表示
          doc.open();
          doc.write(htmlContent);
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
              ${htmlContent}
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
                ${htmlContent}
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
              <div>${htmlContent}</div>
            </body>
            </html>
          `;
          doc.open();
          doc.write(basicTemplate);
          doc.close();
        }
      }
    }
  }, [htmlContent, isFullscreen]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${isFullscreen ? 'bg-black' : 'bg-white'}`}
      style={{ width, height }}
    >
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