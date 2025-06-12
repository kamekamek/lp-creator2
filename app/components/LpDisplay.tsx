'use client';

import { LPViewer } from './LPViewer';

export function LpDisplay({ lpObject }: { lpObject: any }) {
  if (!lpObject || !lpObject.htmlContent) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">LPを準備中...</p>
          <p className="text-sm">しばらくお待ちください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white rounded-lg overflow-hidden">
      <LPViewer htmlContent={lpObject.htmlContent} />
    </div>
  );
}
