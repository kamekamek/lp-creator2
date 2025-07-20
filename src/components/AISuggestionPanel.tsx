'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Palette, 
  Type, 
  Layout, 
  Zap,
  CheckCircle,
  X,
  Sparkles,
  Search,
  BarChart3
} from 'lucide-react';

import type { AISuggestion, BusinessContext, ContentAnalysis } from '../types/lp-generator';
import { AISuggestionGenerator } from '../utils/ai-suggestion-generator';

interface AISuggestionPanelProps {
  htmlContent?: string;
  cssContent?: string;
  businessContext?: BusinessContext;
  suggestions?: AISuggestion[];
  onApplySuggestion: (suggestion: AISuggestion) => Promise<void>;
  onDismissSuggestion: (suggestionId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const suggestionIcons = {
  content: Type,
  design: Palette,
  structure: Layout,
  seo: Search,
  conversion: TrendingUp,
  accessibility: CheckCircle,
  performance: Zap
};

const impactColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({
  htmlContent = '',
  cssContent = '',
  businessContext,
  suggestions: propSuggestions,
  onApplySuggestion,
  onDismissSuggestion,
  isVisible,
  onClose
}) => {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set());
  const [generatedSuggestions, setGeneratedSuggestions] = useState<AISuggestion[]>([]);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // コンテンツ分析と提案生成
  useEffect(() => {
    if (htmlContent && isVisible) {
      setIsAnalyzing(true);
      
      try {
        // コンテンツ分析を実行
        const analysis = AISuggestionGenerator.analyzeContent(htmlContent, cssContent);
        setContentAnalysis(analysis);
        
        // 提案を生成
        const suggestions = AISuggestionGenerator.generateSuggestions(
          htmlContent, 
          cssContent, 
          businessContext
        );
        setGeneratedSuggestions(suggestions);
      } catch (error) {
        console.error('Failed to analyze content:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [htmlContent, cssContent, businessContext, isVisible]);

  const handleApplySuggestion = async (suggestion: AISuggestion) => {
    setLoadingSuggestions(prev => new Set(prev).add(suggestion.id));
    
    try {
      // 提案適用時に適用日時を記録
      const appliedSuggestion = {
        ...suggestion,
        appliedAt: new Date().toISOString()
      };
      
      await onApplySuggestion(appliedSuggestion);
      setAppliedSuggestions(prev => new Set(prev).add(suggestion.id));
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    } finally {
      setLoadingSuggestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }
  };

  if (!isVisible) return null;

  // 提案データを統合（プロップスから渡されたものと生成されたものを結合）
  const allSuggestions = [...(propSuggestions || []), ...generatedSuggestions];
  
  const groupedSuggestions = allSuggestions.reduce((groups, suggestion) => {
    if (!groups[suggestion.type]) {
      groups[suggestion.type] = [];
    }
    groups[suggestion.type].push(suggestion);
    return groups;
  }, {} as Record<string, AISuggestion[]>);

  return (
    <div className="fixed lg:right-4 lg:top-20 lg:w-96 right-0 bottom-0 left-0 top-0 lg:max-h-[70vh] bg-white lg:rounded-lg shadow-2xl border z-40 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI改善提案</h3>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {allSuggestions.length}件
          </Badge>
          {isAnalyzing && (
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 animate-pulse">
              分析中...
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="text-white hover:bg-white/20 p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* コンテンツ分析スコア */}
      {contentAnalysis && (
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">総合スコア</span>
            <Badge 
              variant="outline" 
              className={`${
                contentAnalysis.overallScore >= 80 ? 'bg-green-100 text-green-800' :
                contentAnalysis.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              {contentAnalysis.overallScore}/100
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">コンテンツ:</span>
              <span className="font-medium">{contentAnalysis.contentScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">デザイン:</span>
              <span className="font-medium">{contentAnalysis.designScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">構造:</span>
              <span className="font-medium">{contentAnalysis.structureScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SEO:</span>
              <span className="font-medium">{contentAnalysis.seoScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* 提案リスト */}
      <div className="overflow-y-auto max-h-[60vh]">
        {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
          <div key={type} className="border-b last:border-b-0">
            <div className="p-3 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900 capitalize">
                {type === 'content' && 'コンテンツ'}
                {type === 'design' && 'デザイン'}
                {type === 'structure' && '構造'}
                {type === 'seo' && 'SEO'}
                {type === 'conversion' && 'コンバージョン'}
                {type === 'accessibility' && 'アクセシビリティ'}
                {type === 'performance' && 'パフォーマンス'}
              </h4>
            </div>
            
            {typeSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isApplied={appliedSuggestions.has(suggestion.id)}
                isLoading={loadingSuggestions.has(suggestion.id)}
                onApply={() => handleApplySuggestion(suggestion)}
                onDismiss={() => onDismissSuggestion(suggestion.id)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* フッター */}
      <div className="p-3 border-t bg-gray-50 text-center">
        <p className="text-xs text-gray-500">
          AI分析による改善提案 • 適用前にプレビューで確認してください
        </p>
      </div>
    </div>
  );
};

// 個別の提案カード
const SuggestionCard: React.FC<{
  suggestion: AISuggestion;
  isApplied: boolean;
  isLoading: boolean;
  onApply: () => void;
  onDismiss: () => void;
}> = ({ suggestion, isApplied, isLoading, onApply, onDismiss }) => {
  const [showDetails, setShowDetails] = useState(false);
  const IconComponent = suggestionIcons[suggestion.type];

  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex items-start gap-3">
        {/* アイコン */}
        <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0">
          <IconComponent className="w-4 h-4 text-gray-600" />
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-gray-900 text-sm leading-tight">
              {suggestion.title}
            </h4>
            <div className="flex gap-1 flex-shrink-0">
              <Badge 
                variant="secondary" 
                className={`text-xs ${impactColors[suggestion.impact]}`}
              >
                {suggestion.impact === 'high' && '高'}
                {suggestion.impact === 'medium' && '中'}
                {suggestion.impact === 'low' && '低'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {Math.round(suggestion.confidence * 100)}%
              </Badge>
              {suggestion.priority && (
                <Badge variant="outline" className="text-xs">
                  P{suggestion.priority}
                </Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {suggestion.description}
          </p>

          {/* プレビュー */}
          {suggestion.preview && (
            <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
              <span className="text-gray-500">プレビュー:</span>
              <div className="mt-1 text-gray-700">
                {suggestion.preview}
              </div>
            </div>
          )}

          {/* 詳細表示 */}
          {showDetails && (
            <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
              <span className="text-blue-600 font-medium">理由:</span>
              <p className="mt-1 text-blue-700">{suggestion.reasoning}</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2">
            {!isApplied ? (
              <Button
                size="sm"
                onClick={onApply}
                disabled={isLoading}
                className="h-7 px-3 text-xs"
              >
                {isLoading ? '適用中...' : '適用'}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="h-7 px-3 text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                適用済み
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="h-7 px-2 text-xs"
            >
              {showDetails ? '詳細を隠す' : '詳細'}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-7 px-2 text-xs text-gray-500"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

