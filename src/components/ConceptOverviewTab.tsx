'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Target, TrendingUp, Clock } from 'lucide-react';
import { LPConcept } from '@/src/types/lp-generator';

interface ConceptOverviewTabProps {
  concept: LPConcept;
  conceptScore: number;
  isEditing?: boolean;
  onUpdateConcept?: (updates: Partial<LPConcept>) => void;
}

export const ConceptOverviewTab: React.FC<ConceptOverviewTabProps> = ({
  concept,
  conceptScore,
  isEditing = false,
  onUpdateConcept
}) => {
  const handleTitleChange = (newTitle: string) => {
    if (onUpdateConcept) {
      onUpdateConcept({ title: newTitle });
    }
  };

  const handleOverviewChange = (newOverview: string) => {
    if (onUpdateConcept) {
      onUpdateConcept({ overview: newOverview });
    }
  };

  return (
    <div className="space-y-6">
      {/* コンセプトスコア */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              コンセプトスコア
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-900">{conceptScore}/100</span>
              <Badge variant="outline" className={`${
                conceptScore >= 80 ? 'bg-green-100 text-green-800' :
                conceptScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {conceptScore >= 80 ? '優秀' :
                 conceptScore >= 60 ? '良好' : '要改善'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="text-blue-700 font-medium">価値提案</div>
              <div className="text-blue-900 font-bold">30%</div>
            </div>
            <div className="text-center">
              <div className="text-blue-700 font-medium">ターゲティング</div>
              <div className="text-blue-900 font-bold">25%</div>
            </div>
            <div className="text-center">
              <div className="text-blue-700 font-medium">デザイン</div>
              <div className="text-blue-900 font-bold">20%</div>
            </div>
            <div className="text-center">
              <div className="text-blue-700 font-medium">成果予測</div>
              <div className="text-blue-900 font-bold">15%</div>
            </div>
            <div className="text-center">
              <div className="text-blue-700 font-medium">実行可能性</div>
              <div className="text-blue-900 font-bold">10%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* コンセプトタイトル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            コンセプトタイトル
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <input
              type="text"
              value={concept.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-2xl font-bold text-gray-900 mb-4 w-full border border-gray-300 rounded-lg p-2"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {concept.title}
            </h2>
          )}
          
          {isEditing ? (
            <textarea
              value={concept.overview}
              onChange={(e) => handleOverviewChange(e.target.value)}
              className="w-full min-h-24 border border-gray-300 rounded-lg p-2 text-gray-600"
            />
          ) : (
            <div className="prose prose-sm text-gray-600">
              {concept.overview.split('\n').map((line, index) => (
                <p key={index} className="mb-2">{line}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 期待される成果 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            期待される成果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concept.expectedOutcome?.metrics?.map((metric, index) => (
              <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <BarChart3 className="w-4 h-4 text-green-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">{metric.name}</h4>
                    <p className="text-green-700 text-sm mt-1">{metric.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-green-800 font-bold">{metric.target}</span>
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                        {metric.timeframe}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 次のステップ */}
      {concept.nextSteps && concept.nextSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              次のステップ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {concept.nextSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};