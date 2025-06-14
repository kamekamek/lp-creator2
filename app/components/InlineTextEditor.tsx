'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Sparkles, Type } from 'lucide-react';

interface InlineTextEditorProps {
  initialText: string;
  elementId: string;
  isActive: boolean;
  onSave: (newText: string) => void;
  onCancel: () => void;
  onAIImprove?: (text: string) => void;
  className?: string;
  placeholder?: string;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  initialText,
  elementId,
  isActive,
  onSave,
  onCancel,
  onAIImprove,
  className = '',
  placeholder = 'テキストを入力...'
}) => {
  const [text, setText] = useState(initialText);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // テキスト変更の監視
  useEffect(() => {
    setHasChanges(text !== initialText);
  }, [text, initialText]);

  // アクティブになった時にフォーカス
  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isActive]);

  // テキストエリアの高さを自動調整
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  // キーボードイベント処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // 保存処理
  const handleSave = useCallback(() => {
    if (text.trim() && hasChanges) {
      onSave(text.trim());
    } else if (!text.trim()) {
      // 空の場合は元のテキストに戻す
      setText(initialText);
      onCancel();
    } else {
      onCancel();
    }
  }, [text, hasChanges, onSave, onCancel, initialText]);

  // キャンセル処理
  const handleCancel = useCallback(() => {
    setText(initialText);
    onCancel();
  }, [initialText, onCancel]);

  // AI改善処理
  const handleAIImprove = useCallback(() => {
    if (onAIImprove && text.trim()) {
      onAIImprove(text.trim());
    }
  }, [onAIImprove, text]);

  // 外部クリックでの保存
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isActive && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    if (isActive) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isActive, handleSave]);

  if (!isActive) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block w-full ${className}`}
    >
      {/* メインのテキストエリア */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`
          w-full min-h-[2rem] resize-none overflow-hidden
          bg-white border-2 border-blue-500 rounded-md
          px-3 py-2 text-black text-base leading-relaxed
          focus:outline-none focus:border-blue-600
          placeholder:text-gray-400
        `}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          lineHeight: 'inherit'
        }}
      />
      
      {/* 操作ボタン */}
      <div className="absolute -bottom-12 left-0 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 z-10">
        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || !text.trim()}
          className={`
            flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors
            ${hasChanges && text.trim() 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          title="Enter で保存"
        >
          <Check className="h-3 w-3" />
          保存
        </button>

        {/* キャンセルボタン */}
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          title="Esc でキャンセル"
        >
          <X className="h-3 w-3" />
          キャンセル
        </button>

        {/* AI改善ボタン */}
        {onAIImprove && (
          <button
            onClick={handleAIImprove}
            disabled={!text.trim()}
            className={`
              flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors
              ${text.trim()
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            title="AIで改善"
          >
            <Sparkles className="h-3 w-3" />
            AI改善
          </button>
        )}

        {/* 文字数表示 */}
        <div className="text-xs text-gray-500 ml-2">
          {text.length} 文字
        </div>
      </div>

      {/* キーボードショートカットヒント */}
      <div className="absolute -bottom-20 left-0 text-xs text-gray-400">
        Enter: 保存 | Esc: キャンセル | 外側クリック: 保存
      </div>
    </div>
  );
};