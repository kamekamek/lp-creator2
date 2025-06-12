'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LPViewer } from './LPViewer';
import { X, RotateCcw, Download, FileText, Code, GripVertical, Monitor } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

interface LPPreviewPanelProps {
  htmlContent: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onWidthChange?: (width: number) => void;
}

export const LPPreviewPanel: React.FC<LPPreviewPanelProps> = ({
  htmlContent,
  title,
  isOpen,
  onClose,
  onWidthChange
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [editedHtml, setEditedHtml] = useState(htmlContent);
  const [previewHtml, setPreviewHtml] = useState(htmlContent);
  const [panelWidth, setPanelWidth] = useState<number>(80);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isExportingHTML, setIsExportingHTML] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const lpContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  
  useEffect(() => {
    setEditedHtml(htmlContent);
    setPreviewHtml(htmlContent);
  }, [htmlContent]);
  
  useEffect(() => {
    onWidthChange?.(panelWidth);
  }, [panelWidth, onWidthChange]);
  
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const viewportWidth = window.innerWidth;
      const widthPercentage = Math.min(Math.max(((viewportWidth - e.clientX) / viewportWidth) * 100, 20), 80);
      
      setPanelWidth(widthPercentage);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // HTMLをリセット
  const handleResetHtml = useCallback(() => {
    setEditedHtml(htmlContent);
    setPreviewHtml(htmlContent);
  }, [htmlContent]);

  // HTMLを適用
  const handleApplyHtml = useCallback(() => {
    setPreviewHtml(editedHtml);
  }, [editedHtml]);

  // HTML出力
  const handleExportHTML = useCallback(async () => {
    setIsExportingHTML(true);
    try {
      // 完全なHTMLドキュメントを生成
      const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
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
  </style>
</head>
<body>
${previewHtml}
</body>
</html>`;

      // ファイルダウンロード
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('HTML export completed successfully');
    } catch (error) {
      console.error('HTML export failed:', error);
    } finally {
      setIsExportingHTML(false);
    }
  }, [previewHtml, title]);

  // PDF出力（将来実装）
  const handleExportPDF = useCallback(async () => {
    setIsExportingPDF(true);
    try {
      // TODO: Puppeteer またはNutrient APIを使用してPDF変換
      console.log('PDF export will be implemented in Phase 3');
      alert('PDF出力機能は Phase 3 で実装予定です');
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExportingPDF(false);
    }
  }, [previewHtml, title]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white h-full overflow-hidden flex flex-col shadow-2xl"
        style={{ width: `${panelWidth}%` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* リサイズハンドル */}
        <div
          ref={resizeHandleRef}
          className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-300 transition-colors ${
            isDragging ? 'bg-blue-400' : 'bg-transparent'
          }`}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center justify-center h-full">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* ヘッダー */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {Math.round(previewHtml.length / 1024)}KB
              </Badge>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* タブとツールバー */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="preview">プレビュー</TabsTrigger>
                <TabsTrigger value="code">HTML編集</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleExportHTML}
                  disabled={isExportingHTML}
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isExportingHTML ? 'HTML出力中...' : 'HTML'}
                </Button>
                <Button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  size="sm"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {isExportingPDF ? 'PDF出力中...' : 'PDF'}
                </Button>
              </div>
            </div>

            <TabsContent value="preview" className="mt-0">
              <div className="text-sm text-gray-600">
                ランディングページのライブプレビューです。フルスクリーンで表示することも可能です。
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-0">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>HTMLコードを直接編集できます。</span>
                <div className="flex items-center space-x-2">
                  <Button onClick={handleResetHtml} size="sm" variant="ghost">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    リセット
                  </Button>
                  <Button onClick={handleApplyHtml} size="sm" variant="default">
                    適用
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsContent value="preview" className="h-full m-0">
              <div ref={lpContainerRef} className="h-full">
                <LPViewer htmlContent={previewHtml} />
              </div>
            </TabsContent>

            <TabsContent value="code" className="h-full m-0 p-4">
              <div className="h-full flex flex-col">
                <Label htmlFor="html-editor" className="text-sm font-medium mb-2">
                  HTML コード
                </Label>
                <Textarea
                  id="html-editor"
                  value={editedHtml}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedHtml(e.target.value)}
                  className="flex-1 font-mono text-sm resize-none"
                  placeholder="HTMLコードをここに入力..."
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* フッター */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>パネル幅: {panelWidth.toFixed(0)}%</span>
            <span>
              セクション数: {(previewHtml.match(/<section/g) || []).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};