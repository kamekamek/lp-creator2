'use client';

import { LPViewer } from './LPViewer';

export function LpDisplay({ lpObject }: { lpObject: any }) {
  // デバッグ用ログ
  console.log('[LpDisplay] Received lpObject:', lpObject);
  
  if (!lpObject) {
    console.log('[LpDisplay] No lpObject provided');
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">LPデータなし</p>
          <p className="text-sm">lpObjectが提供されていません</p>
        </div>
      </div>
    );
  }

  if (!lpObject.htmlContent) {
    console.log('[LpDisplay] No htmlContent in lpObject:', Object.keys(lpObject));
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">HTMLコンテンツなし</p>
          <p className="text-sm">lpObject.htmlContentが空です</p>
          <p className="text-xs mt-2">Keys: {Object.keys(lpObject).join(', ')}</p>
        </div>
      </div>
    );
  }

  console.log('[LpDisplay] Rendering LP with htmlContent length:', lpObject.htmlContent.length);
  
  return (
    <div className="flex-1 h-full w-full bg-white rounded-lg overflow-hidden">
      <LPViewer htmlContent={lpObject.htmlContent} />
    </div>
  );
}
