'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, CheckCircle, Award } from 'lucide-react';
import { LPConcept } from '@/src/types/lp-generator';

interface ConceptValuePropTabProps {
  concept: LPConcept;
  isEditing?: boolean;
  onUpdateConcept?: (updates: Partial<LPConcept>) => void;
}

export const ConceptValuePropTab: React.FC<ConceptValuePropTabProps> = ({
  concept,
  isEditing = false,
  onUpdateConcept
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          価値提案
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* メインヘッドライン */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">メインヘッドライン</h3>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              {isEditing ? (
                <input
                  type="text"
                  value={concept.valueProposition?.headline || ''}
                  onChange={(e) => onUpdateConcept?.({
                    valueProposition: { ...concept.valueProposition, headline: e.target.value }
                  })}
                  className="text-xl font-bold text-gray-900 w-full bg-transparent border-none outline-none"
                />
              ) : (
                <p className="text-xl font-bold text-gray-900">
                  {concept.valueProposition?.headline}
                </p>
              )}
            </div>
          </div>
          
          {/* サブヘッドライン */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">サブヘッドライン</h3>
            <div className="p-3 bg-gray-50 rounded-lg border">
              {isEditing ? (
                <textarea
                  value={concept.valueProposition?.subheadline || ''}
                  onChange={(e) => onUpdateConcept?.({
                    valueProposition: { ...concept.valueProposition, subheadline: e.target.value }
                  })}
                  className="text-gray-700 w-full bg-transparent border-none outline-none resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-gray-700">
                  {concept.valueProposition?.subheadline}
                </p>
              )}
            </div>
          </div>
          
          {/* 主要メリット */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">主要メリット</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {concept.valueProposition?.keyBenefits?.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-blue-900 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 実績・証拠 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">実績・証拠</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {concept.valueProposition?.proofPoints?.map((proof, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded border border-green-200">
                  <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-green-900 text-sm">{proof}</span>
                </div>
              ))}
            </div>
          </div>

          {/* リスクリバーサル */}
          {concept.valueProposition?.riskReversal && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">保証・リスク軽減</h3>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                {isEditing ? (
                  <textarea
                    value={concept.valueProposition.riskReversal}
                    onChange={(e) => onUpdateConcept?.({
                      valueProposition: { ...concept.valueProposition, riskReversal: e.target.value }
                    })}
                    className="text-purple-900 text-sm w-full bg-transparent border-none outline-none resize-none"
                    rows={2}
                  />
                ) : (
                  <p className="text-purple-900 text-sm">
                    {concept.valueProposition.riskReversal}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};