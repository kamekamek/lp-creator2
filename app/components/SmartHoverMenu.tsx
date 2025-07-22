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
  isTouchDevice?: boolean;
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
  className = '',
  isTouchDevice = false
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [isTouchDetected, setIsTouchDetected] = useState(false);

  // タッチデバイスを検出
  useEffect(() => {
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 768;
    setIsTouchDetected(hasTouchSupport || isSmallScreen || isTouchDevice);
  }, [isTouchDevice]);

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

        // タッチデバイス向けの位置調整
        if (isTouchDetected) {
          // モバイルでは画面中央下部に配置
          newX = Math.max(10, (viewportWidth - rect.width) / 2);
          newY = Math.max(viewportHeight - rect.height - 80, 50); // キーボード領域を考慮
        } else {
          // デスクトップでの通常の位置調整
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
        }

        setAdjustedPosition({ x: newX, y: newY });
      } catch (error) {
        console.error('❌ Error adjusting menu position:', error);
        // エラー時は元の位置を使用
        setAdjustedPosition(position);
      }
    }
  }, [isVisible, position, isTouchDetected]);

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
      {/* オーバーレイ（半透明背景） - タッチデバイスでは濃く表示 */}
      <div 
        className={`fixed inset-0 z-40 ${
          isTouchDetected 
            ? 'bg-black bg-opacity-20 pointer-events-auto cursor-pointer' 
            : 'bg-black bg-opacity-5 pointer-events-none'
        }`}
        onClick={isTouchDetected ? onClose : undefined}
        onTouchEnd={isTouchDetected ? onClose : undefined}
      />
      
      {/* メニュー本体 */}
      <div
        ref={menuRef}
        className={`
          fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl 
          ${isTouchDetected ? 'min-w-[200px]' : 'min-w-[140px]'} 
          overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150
          ${className}
        `}
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y
        }}
        onMouseLeave={!isTouchDetected ? onClose : undefined}
      >
        {/* ヘッダー - タッチデバイスでは閉じるボタンを追加 */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-600 truncate">
                要素を編集
              </div>
              <div className="text-xs text-gray-400 font-mono truncate">
                {elementId}
              </div>
            </div>
            {isTouchDetected && onClose && (
              <button
                onClick={onClose}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 touch-manipulation"
                aria-label="閉じる"
              >
                ✕
              </button>
            )}
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
                  w-full flex items-center gap-3 text-sm text-black
                  transition-colors duration-150 ${item.className}
                  ${item.primary ? 'font-medium' : 'font-normal'}
                  ${isTouchDetected 
                    ? 'px-4 py-3 text-base touch-manipulation' 
                    : 'px-3 py-2'
                  }
                `}
              >
                <Icon className={`flex-shrink-0 ${isTouchDetected ? 'h-5 w-5' : 'h-4 w-4'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* フッター（ヒント） */}
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {isTouchDetected ? 'タップして編集' : 'ダブルクリックでも編集可能'}
          </div>
        </div>
      </div>
    </>
  );
};