'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, RotateCcw, Type } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  elementId: string | null;
  currentText: string;
  onSave: (newText: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  elementId,
  currentText,
  onSave,
  onClose,
  isLoading = false
}) => {
  const [editText, setEditText] = useState(currentText);
  const [hasChanges, setHasChanges] = useState(false);

  // currentTextが変更された時に編集テキストを更新
  useEffect(() => {
    setEditText(currentText);
    setHasChanges(false);
  }, [currentText, elementId]);

  // テキスト変更の監視
  useEffect(() => {
    setHasChanges(editText !== currentText);
  }, [editText, currentText]);

  // 保存処理
  const handleSave = useCallback(() => {
    if (hasChanges && editText.trim()) {
      onSave(editText);
    }
  }, [editText, hasChanges, onSave]);

  // リセット処理
  const handleReset = useCallback(() => {
    setEditText(currentText);
    setHasChanges(false);
  }, [currentText]);

  // Escキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        handleSave();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, handleSave]);

  if (!isOpen || !elementId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* モーダル本体 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Type className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">テキストを編集</h2>
              <p className="text-sm text-gray-500 font-mono">{elementId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="閉じる (Esc)"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              編集内容
            </label>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="編集したいテキストを入力してください..."
              autoFocus
              disabled={isLoading}
            />
            
            {/* 文字数とステータス */}
            <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
              <span>{editText.length} 文字</span>
              {hasChanges && (
                <span className="text-orange-600 font-medium">• 未保存の変更</span>
              )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={!hasChanges || isLoading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              リセット
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || !editText.trim() || isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存 (Ctrl+Enter)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};