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
  onRealTimeUpdate?: (newText: string) => void;
  className?: string;
  placeholder?: string;
  position?: { x: number; y: number };
  maxLength?: number;
  enableRealTimePreview?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  initialText,
  elementId,
  isActive,
  onSave,
  onCancel,
  onAIImprove,
  onRealTimeUpdate,
  className = '',
  placeholder = 'テキストを入力...',
  position,
  maxLength = 1000,
  enableRealTimePreview = true,
  autoSave = false,
  autoSaveDelay = 2000
}) => {
  const [text, setText] = useState(initialText);
  const [hasChanges, setHasChanges] = useState(false);
  const [isValidText, setIsValidText] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [isRealTimeUpdating, setIsRealTimeUpdating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realTimeUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enhanced save processing with validation
  const handleSave = useCallback(() => {
    if (text.trim() && hasChanges && isValidText) {
      onSave(text.trim());
    }
  }, [text, hasChanges, isValidText, onSave]);

  // Enhanced text change monitoring with real-time updates
  useEffect(() => {
    setHasChanges(text !== initialText);
    setIsValidText(text.trim().length > 0 && text.length <= maxLength);
    setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length);
    
    // Real-time preview update
    if (enableRealTimePreview && onRealTimeUpdate && text !== initialText) {
      // Clear existing timeout
      if (realTimeUpdateTimeoutRef.current) {
        clearTimeout(realTimeUpdateTimeoutRef.current);
      }
      
      // Set new timeout for real-time update
      realTimeUpdateTimeoutRef.current = setTimeout(() => {
        setIsRealTimeUpdating(true);
        onRealTimeUpdate(text);
        setTimeout(() => setIsRealTimeUpdating(false), 500);
      }, 300); // 300ms debounce
    }
    
    // Auto-save functionality
    if (autoSave && hasChanges && isValidText) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, autoSaveDelay);
    }
  }, [text, initialText, maxLength, enableRealTimePreview, onRealTimeUpdate, autoSave, hasChanges, isValidText, autoSaveDelay, handleSave]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (realTimeUpdateTimeoutRef.current) {
        clearTimeout(realTimeUpdateTimeoutRef.current);
      }
    };
  }, []);

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

  // Cancel editing - restore original text
  const handleCancel = useCallback(() => {
    setText(initialText);
    onCancel?.();
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
      className={`fixed z-50 bg-white border-2 border-blue-500 rounded-lg shadow-xl p-4 min-w-[300px] max-w-[500px] ${className}`}
      style={position ? {
        left: Math.max(
          10,
          Math.min(
            position.x,
            typeof window !== 'undefined' ? window.innerWidth - 320 : 1000
          )
        ),
        top: Math.max(
          10,
          Math.min(
            position.y,
            typeof window !== 'undefined' ? window.innerHeight - 200 : 600
          )
        )
      } : {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Enhanced header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">テキスト編集</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{elementId}</span>
      </div>

      {/* Enhanced textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`
          w-full min-h-[80px] max-h-[200px] resize-y
          bg-white border border-gray-300 rounded-md
          px-3 py-2 text-black text-base leading-relaxed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          placeholder:text-gray-400 transition-colors
          ${!isValidText ? 'border-red-300 focus:ring-red-500' : ''}
        `}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          lineHeight: 'inherit'
        }}
      />

      {/* Enhanced status bar with real-time indicators */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{text.length}/{maxLength} 文字</span>
          <span>{wordCount} 単語</span>
          {enableRealTimePreview && (
            <span className="text-blue-600">
              {isRealTimeUpdating ? '🔄 更新中...' : '👁️ リアルタイム'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isValidText && (
            <span className="text-red-500 font-medium">⚠️ 無効なテキスト</span>
          )}
          {autoSave && hasChanges && (
            <span className="text-green-600 font-medium">💾 自動保存</span>
          )}
          {hasChanges && !autoSave && (
            <span className="text-orange-600 font-medium">• 未保存</span>
          )}
        </div>
      </div>
      
      {/* Enhanced action buttons */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {/* キャンセルボタン */}
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Esc でキャンセル"
          >
            <X className="h-4 w-4" />
            キャンセル
          </button>

          {/* AI改善ボタン */}
          {onAIImprove && (
            <button
              onClick={handleAIImprove}
              disabled={!text.trim()}
              className={`
                flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${text.trim()
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
              title="AIで改善"
            >
              <Sparkles className="h-4 w-4" />
              AI改善
            </button>
          )}
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || !text.trim() || !isValidText}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${hasChanges && text.trim() && isValidText
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          title="Enter で保存"
        >
          <Check className="h-4 w-4" />
          保存
        </button>
      </div>

      {/* Enhanced keyboard shortcuts hint */}
      <div className="mt-2 text-xs text-gray-400 text-center">
        <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> 保存 | 
        <kbd className="px-1 py-0.5 bg-gray-100 rounded ml-1">Esc</kbd> キャンセル | 
        <kbd className="px-1 py-0.5 bg-gray-100 rounded ml-1">Ctrl+Enter</kbd> 強制保存
      </div>
    </div>
  );
};