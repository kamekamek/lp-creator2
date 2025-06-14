'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface InlineTextEditorProps {
  text: string;
  onSave: (newText: string) => Promise<void>;
  onCancel: () => void;
  className?: string;
  placeholder?: string;
  isLoading?: boolean;
  multiline?: boolean;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  text,
  onSave,
  onCancel,
  className = '',
  placeholder = 'テキストを入力...',
  isLoading = false,
  multiline = false
}) => {
  const [value, setValue] = useState(text);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // 編集開始
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setValue(text);
  }, [text]);

  // 編集確定
  const handleSave = useCallback(async () => {
    if (value.trim() !== text.trim()) {
      try {
        await onSave(value.trim());
      } catch (error) {
        console.error('Save failed:', error);
        setValue(text); // 元の値に戻す
      }
    }
    setIsEditing(false);
  }, [value, text, onSave]);

  // 編集キャンセル
  const handleCancel = useCallback(() => {
    setValue(text);
    setIsEditing(false);
    onCancel();
  }, [text, onCancel]);

  // キーボードイベント処理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel, multiline]);

  // フォーカス処理
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // テキスト全選択
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      } else if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.setSelectionRange(0, inputRef.current.value.length);
      }
    }
  }, [isEditing]);

  // フォーカス外れた時の処理
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // わずかな遅延を設けて他の要素のクリックを処理する
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 100);
  }, [isEditing, handleSave]);

  if (!isEditing) {
    return (
      <div
        className={`inline-text-editor-display ${className} cursor-pointer hover:bg-gray-100 transition-colors duration-200 rounded px-2 py-1`}
        onDoubleClick={startEditing}
        title="ダブルクリックで編集"
      >
        {text || <span className="text-gray-400 italic">{placeholder}</span>}
        {/* 編集アイコンをホバー時に表示 */}
        <span className="inline-text-editor-icon ml-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
          ✏️
        </span>
      </div>
    );
  }

  const commonProps = {
    ref: inputRef as any,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    className: `inline-text-editor-input ${className} border-2 border-blue-500 rounded px-2 py-1 outline-none text-gray-900 ${isLoading ? 'opacity-50' : ''}`,
    placeholder,
    disabled: isLoading
  };

  return (
    <div className="inline-text-editor-container relative">
      {multiline ? (
        <textarea
          {...commonProps}
          rows={3}
          className={`${commonProps.className} resize-none text-gray-900 placeholder:text-gray-400`}
        />
      ) : (
        <input
          type="text"
          {...commonProps}
          className={`${commonProps.className} text-gray-900 placeholder:text-gray-400`}
        />
      )}
      
      {/* 編集中のコントロールボタン */}
      <div className="inline-text-editor-controls absolute -bottom-8 left-0 flex gap-2 bg-white border border-gray-200 rounded shadow-lg p-1">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          title="保存 (Enter)"
        >
          {isLoading ? '保存中...' : '✓'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
          title="キャンセル (Esc)"
        >
          ✕
        </button>
      </div>
    </div>
  );
};