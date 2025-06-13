'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SmartHoverMenuProps {
  isVisible: boolean;
  elementId: string;
  position: { x: number; y: number };
  onEdit: () => void;
  onAIImprove: () => void;
  onStyleEdit: () => void;
  onClose: () => void;
}

export const SmartHoverMenu: React.FC<SmartHoverMenuProps> = ({
  isVisible,
  elementId,
  position,
  onEdit,
  onAIImprove,
  onStyleEdit,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // メニューの位置調整（画面外に出ないように）
  useEffect(() => {
    if (isVisible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let newX = position.x;
      let newY = position.y;

      // 右端からはみ出る場合は左に移動
      if (newX + rect.width > viewport.width) {
        newX = viewport.width - rect.width - 10;
      }

      // 下端からはみ出る場合は上に移動
      if (newY + rect.height > viewport.height) {
        newY = position.y - rect.height - 10;
      }

      // 左端より左に行かないように
      if (newX < 10) {
        newX = 10;
      }

      // 上端より上に行かないように
      if (newY < 10) {
        newY = 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isVisible, position]);

  // クリック外でメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="smart-hover-menu fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-48"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {/* メニューヘッダー */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
        <span className="text-xs text-gray-500 font-medium">要素を編集</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm"
          title="閉じる"
        >
          ✕
        </button>
      </div>

      {/* 要素ID表示 */}
      <div className="mb-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
        {elementId}
      </div>

      {/* アクションボタン */}
      <div className="space-y-1">
        <button
          onClick={onEdit}
          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 rounded-lg transition-colors group"
        >
          <span className="text-lg">✏️</span>
          <div>
            <div className="text-sm font-medium text-gray-900">編集</div>
            <div className="text-xs text-gray-500">テキストを直接編集</div>
          </div>
        </button>

        <button
          onClick={onAIImprove}
          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-purple-50 rounded-lg transition-colors group"
        >
          <span className="text-lg">🤖</span>
          <div>
            <div className="text-sm font-medium text-gray-900">AI改善</div>
            <div className="text-xs text-gray-500">AIが自動で最適化</div>
          </div>
        </button>

        <button
          onClick={onStyleEdit}
          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-green-50 rounded-lg transition-colors group"
        >
          <span className="text-lg">🎨</span>
          <div>
            <div className="text-sm font-medium text-gray-900">スタイル</div>
            <div className="text-xs text-gray-500">色・フォント・レイアウト</div>
          </div>
        </button>
      </div>

      {/* 矢印インジケーター */}
      <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
    </div>
  );
};