'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle } from 'lucide-react';
import { LPConcept } from '@/src/types/lp-generator';

interface ConceptPersonaTabProps {
  concept: LPConcept;
  isEditing?: boolean;
  onUpdateConcept?: (updates: Partial<LPConcept>) => void;
}

export const ConceptPersonaTab: React.FC<ConceptPersonaTabProps> = ({
  concept,
  isEditing = false,
  onUpdateConcept
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          ターゲットペルソナ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">基本情報</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ペルソナ名:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={concept.targetPersona?.name || ''}
                        onChange={(e) => onUpdateConcept?.({
                          targetPersona: { ...concept.targetPersona, name: e.target.value }
                        })}
                        className="font-medium border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="font-medium">{concept.targetPersona?.name}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">属性:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={concept.targetPersona?.demographics || ''}
                        onChange={(e) => onUpdateConcept?.({
                          targetPersona: { ...concept.targetPersona, demographics: e.target.value }
                        })}
                        className="font-medium border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="font-medium">{concept.targetPersona?.demographics}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">好みのトーン:</span>
                    {isEditing ? (
                      <select
                        value={concept.targetPersona?.preferredTone || ''}
                        onChange={(e) => onUpdateConcept?.({
                          targetPersona: { ...concept.targetPersona, preferredTone: e.target.value }
                        })}
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="フォーマル">フォーマル</option>
                        <option value="カジュアル">カジュアル</option>
                        <option value="親しみやすい">親しみやすい</option>
                        <option value="専門的">専門的</option>
                      </select>
                    ) : (
                      <Badge variant="secondary">{concept.targetPersona?.preferredTone}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">行動パターン</h3>
                <div className="space-y-2">
                  {concept.targetPersona?.behaviors?.map((behavior, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">{behavior}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 課題と目標 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                主な課題
              </h3>
              <div className="space-y-2">
                {concept.targetPersona?.painPoints?.map((pain, index) => (
                  <div key={index} className="p-2 bg-red-50 rounded border-l-4 border-red-500">
                    <span className="text-sm text-red-700">{pain}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                目標
              </h3>
              <div className="space-y-2">
                {concept.targetPersona?.goals?.map((goal, index) => (
                  <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                    <span className="text-sm text-green-700">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 意思決定要因 */}
          {concept.targetPersona?.decisionFactors && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">意思決定要因</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {concept.targetPersona.decisionFactors.map((factor, index) => (
                  <Badge key={index} variant="outline" className="justify-center py-2">
                    {factor}
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