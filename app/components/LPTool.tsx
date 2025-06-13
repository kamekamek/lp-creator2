'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { LPPreviewPanel } from './LPPreviewPanel';
import { DocumentTextIcon, PlayIcon, EyeIcon } from '@heroicons/react/24/outline';

interface LPToolProps {
  htmlContent?: string;
  cssContent?: string;
  title?: string;
  onCreateLP?: () => void;
  autoOpenPreview?: boolean; // 自動的にプレビューを開くためのフラグ
  forcePanelOpen?: boolean;  // 強制的にパネルを開くフラグ
  onPreviewOpen?: () => void; // プレビューが開かれたときに呼ばれる関数
  onPreviewClose?: () => void; // プレビューが閉じられたときに呼ばれる関数
}

export const LPTool: React.FC<LPToolProps> = ({
  htmlContent = '',
  cssContent = '',
  title = '生成されたランディングページ',
  onCreateLP,
  autoOpenPreview = false,
  forcePanelOpen = false,
  onPreviewOpen,
  onPreviewClose
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState(htmlContent);
  const [currentCss, setCurrentCss] = useState(cssContent);
  const [currentTitle, setCurrentTitle] = useState(title);

  // 新しいhtmlContentを設定
  const updateContent = useCallback((newContent: string) => {
    console.log("[LPTool] Updating HTML content:", newContent.substring(0, 100) + "...");
    setCurrentContent(newContent);
  }, []);

  // 新しいタイトルを設定
  const updateTitle = useCallback((newTitle: string) => {
    setCurrentTitle(newTitle);
  }, []);

  // プレビューパネルを開く
  const openPreviewPanel = useCallback(() => {
    console.log("[LPTool] Opening preview panel manually");
    setIsPanelOpen(true);
    onPreviewOpen?.(); // 親コンポーネントに通知
  }, [onPreviewOpen]);

  // プレビューパネルを閉じる
  const closePreviewPanel = useCallback(() => {
    console.log("[LPTool] Closing preview panel");
    setIsPanelOpen(false);
    onPreviewClose?.(); // 親コンポーネントに通知
  }, [onPreviewClose]);

  // htmlContentが変更されたときに更新
  useEffect(() => {
    if (htmlContent) {
      console.log("[LPTool] Updating HTML content from props:", htmlContent.substring(0, 50) + "...");
      setCurrentContent(htmlContent);
    }
  }, [htmlContent]);

  // titleが変更されたときに更新
  useEffect(() => {
    if (title) {
      setCurrentTitle(title);
    }
  }, [title]);

  // autoOpenPreviewフラグが設定されている場合、自動的にパネルを開く
  useEffect(() => {
    if (autoOpenPreview && currentContent) {
      console.log("[LPTool] Auto-opening panel due to autoOpenPreview flag");
      setIsPanelOpen(true);
      onPreviewOpen?.(); // 親コンポーネントに通知
    }
  }, [autoOpenPreview, currentContent, onPreviewOpen]);

  // forcePanelOpenフラグが設定されている場合、強制的にパネルを開く
  useEffect(() => {
    if (forcePanelOpen) {
      console.log("[LPTool] Forcing panel open due to forcePanelOpen flag");
      setIsPanelOpen(true);
      onPreviewOpen?.(); // 親コンポーネントに通知
    }
  }, [forcePanelOpen, onPreviewOpen]);

  return (
    <>
      {/* LPツールUIコンポーネント */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-800">
              Using Tool | {currentTitle}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={openPreviewPanel}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-400"
              disabled={!currentContent}
            >
              <EyeIcon className="h-4 w-4" />
              <span>プレビュー</span>
            </button>
            {onCreateLP && (
              <button
                onClick={onCreateLP}
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <PlayIcon className="h-4 w-4" />
                <span>LP編集</span>
              </button>
            )}
          </div>
        </div>

        {/* コンテンツ情報 */}
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex items-center justify-between">
            <span>コンテンツサイズ:</span>
            <span className="font-mono">
              {currentContent ? `${Math.round(currentContent.length / 1024)}KB` : '0KB'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>セクション数:</span>
            <span className="font-mono">
              {currentContent ? (currentContent.match(/<section/g) || []).length : 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>ステータス:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              currentContent 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {currentContent ? '生成完了' : '待機中'}
            </span>
          </div>
        </div>

        {/* コンテンツプレビュー（小） */}
        {currentContent && (
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <h4 className="text-xs font-medium text-gray-700 mb-2">HTMLプレビュー</h4>
            <div className="text-xs text-gray-600 font-mono bg-white p-2 rounded border overflow-x-auto">
              {currentContent.substring(0, 200)}
              {currentContent.length > 200 && '...'}
            </div>
          </div>
        )}
      </div>

      {/* プレビューパネル */}
      {isPanelOpen && (
        <LPPreviewPanel
          htmlContent={currentContent}
          cssContent={currentCss}
          title={currentTitle}
          isOpen={isPanelOpen}
          onClose={closePreviewPanel}
        />
      )}
    </>
  );
};