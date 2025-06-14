'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Sparkles, Palette, Copy, Trash2 } from 'lucide-react';

interface SmartHoverMenuProps {
  elementId: string;
  isVisible: boolean;
  position: { x: number; y: number };
  onEdit: () => void;
  onAIImprove: () => void;
  onStyleEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  className?: string;
}

export const SmartHoverMenu: React.FC<SmartHoverMenuProps> = ({
  elementId,
  isVisible,
  position,
  onEdit,
  onAIImprove,
  onStyleEdit,
  onDuplicate,
  onDelete,
  onClose,
  className = ''
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // 画面外に出ないように位置調整
  useEffect(() => {
    if (isVisible && menuRef.current) {
      try {
        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 安全性チェック
        if (!rect || rect.width === 0 || rect.height === 0) {
          console.warn('⚠️ Invalid menu rect, skipping position adjustment');
          return;
        }

        let newX = position.x;
        let newY = position.y;

        // 右端チェック
        if (position.x + rect.width > viewportWidth) {
          newX = viewportWidth - rect.width - 10;
        }

        // 下端チェック
        if (position.y + rect.height > viewportHeight) {
          newY = position.y - rect.height - 10;
        }

        // 左端チェック
        if (newX < 10) {
          newX = 10;
        }

        // 上端チェック
        if (newY < 10) {
          newY = 10;
        }

        setAdjustedPosition({ x: newX, y: newY });
      } catch (error) {
        console.error('❌ Error adjusting menu position:', error);
        // エラー時は元の位置を使用
        setAdjustedPosition(position);
      }
    }
  }, [isVisible, position]);

  if (!isVisible) {
    return null;
  }

  const menuItems = [
    {
      icon: Edit3,
      label: '編集',
      onClick: onEdit,
      className: 'hover:bg-blue-50 hover:text-blue-600',
      primary: true
    },
    {
      icon: Sparkles,
      label: 'AI改善',
      onClick: onAIImprove,
      className: 'hover:bg-purple-50 hover:text-purple-600'
    },
    ...(onStyleEdit ? [{
      icon: Palette,
      label: 'スタイル',
      onClick: onStyleEdit,
      className: 'hover:bg-green-50 hover:text-green-600'
    }] : []),
    ...(onDuplicate ? [{
      icon: Copy,
      label: '複製',
      onClick: onDuplicate,
      className: 'hover:bg-gray-50 hover:text-gray-600'
    }] : []),
    ...(onDelete ? [{
      icon: Trash2,
      label: '削除',
      onClick: onDelete,
      className: 'hover:bg-red-50 hover:text-red-600'
    }] : [])
  ];

  return (
    <>
      {/* オーバーレイ（半透明背景） */}
      <div className="fixed inset-0 bg-black bg-opacity-5 z-40 pointer-events-none" />
      
      {/* メニュー本体 */}
      <div
        ref={menuRef}
        className={`
          fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl 
          min-w-[140px] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150
          ${className}
        `}
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y
        }}
        onMouseLeave={onClose}
      >
        {/* ヘッダー */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <div className="text-xs font-medium text-gray-600 truncate">
            要素を編集
          </div>
          <div className="text-xs text-gray-400 font-mono truncate">
            {elementId}
          </div>
        </div>

        {/* メニューアイテム */}
        <div className="py-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-sm text-black
                  transition-colors duration-150 ${item.className}
                  ${item.primary ? 'font-medium' : 'font-normal'}
                `}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* フッター（ヒント） */}
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            ダブルクリックでも編集可能
          </div>
        </div>
      </div>
    </>
  );
};