'use client';

import { LPViewer } from './LPViewer';

export function LpDisplay({ lpObject }: { lpObject: any }) {
  if (!lpObject || !lpObject.htmlContent) {
    return <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">Waiting for LP data...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="prose max-w-none">
          <LPViewer htmlContent={lpObject.htmlContent} />
      </div>
    </div>
  );
}
