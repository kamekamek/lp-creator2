'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette } from 'lucide-react';
import { LPConcept } from '@/src/types/lp-generator';

interface ConceptDesignTabProps {
  concept: LPConcept;
  isEditing?: boolean;
  onUpdateConcept?: (updates: Partial<LPConcept>) => void;
}

export const ConceptDesignTab: React.FC<ConceptDesignTabProps> = ({
  concept,
  isEditing = false,
  onUpdateConcept
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-600" />
          デザイン方向性
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* スタイルとカラー */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">デザインスタイル</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={concept.designDirection?.style || ''}
                  onChange={(e) => onUpdateConcept?.({
                    designDirection: { ...concept.designDirection, style: e.target.value }
                  })}
                  className="text-sm py-2 px-4 border border-gray-300 rounded"
                />
              ) : (
                <Badge variant="outline" className="text-sm py-2 px-4">
                  {concept.designDirection?.style}
                </Badge>
              )}
              
              <h3 className="font-medium text-gray-900 mb-3 mt-4">レイアウト</h3>
              {isEditing ? (
                <textarea
                  value={concept.designDirection?.layoutApproach || ''}
                  onChange={(e) => onUpdateConcept?.({
                    designDirection: { ...concept.designDirection, layoutApproach: e.target.value }
                  })}
                  className="text-sm text-gray-600 w-full border border-gray-300 rounded p-2"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {concept.designDirection?.layoutApproach}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">カラースキーム</h3>
              <div className="flex gap-2 mb-4">
                {concept.designDirection?.colorScheme?.map((color, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              <h3 className="font-medium text-gray-900 mb-3">タイポグラフィ</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={concept.designDirection?.typography || ''}
                  onChange={(e) => onUpdateConcept?.({
                    designDirection: { ...concept.designDirection, typography: e.target.value }
                  })}
                  className="text-sm py-2 px-4 border border-gray-300 rounded"
                />
              ) : (
                <Badge variant="outline" className="text-sm py-2 px-4">
                  {concept.designDirection?.typography}
                </Badge>
              )}
            </div>
          </div>
          
          {/* ビジュアル要素 */}
          {concept.designDirection?.visualElements && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">ビジュアル要素</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {concept.designDirection.visualElements.map((element, index) => (
                  <Badge key={index} variant="secondary" className="justify-center py-2">
                    {element}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};