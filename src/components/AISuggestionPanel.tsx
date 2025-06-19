'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  Palette, 
  Type, 
  Layout, 
  Zap,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';

import type { AISuggestion } from '../types/lp-generator';

interface AISuggestionPanelProps {
  suggestions: AISuggestion[];
  onApplySuggestion: (suggestion: AISuggestion) => Promise<void>;
  onDismissSuggestion: (suggestionId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const suggestionIcons = {
  content: Type,
  design: Palette,
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
  suggestions,
  onApplySuggestion,
  onDismissSuggestion,
  isVisible,
  onClose
}) => {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set());

  const handleApplySuggestion = async (suggestion: AISuggestion) => {
    setLoadingSuggestions(prev => new Set(prev).add(suggestion.id));
    
    try {
      await onApplySuggestion(suggestion);
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

  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    if (!groups[suggestion.type]) {
      groups[suggestion.type] = [];
    }
    groups[suggestion.type].push(suggestion);
    return groups;
  }, {} as Record<string, AISuggestion[]>);

  return (
    <div className="fixed right-4 top-20 w-96 max-h-[70vh] bg-white rounded-lg shadow-2xl border z-40 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI改善提案</h3>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {suggestions.length}件
          </Badge>
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

      {/* 提案リスト */}
      <div className="overflow-y-auto max-h-[60vh]">
        {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
          <div key={type} className="border-b last:border-b-0">
            <div className="p-3 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900 capitalize">
                {type === 'content' && 'コンテンツ'}
                {type === 'design' && 'デザイン'}
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
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {suggestion.description}
          </p>

          {/* プレビュー */}
          {suggestion.preview && (
            <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
              <span className="text-gray-500">プレビュー:</span>
              <div 
                className="mt-1 text-gray-700"
                dangerouslySetInnerHTML={{ __html: suggestion.preview }}
              />
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

// AIサジェスチョンジェネレーター
export class AISuggestionGenerator {
  static analyzeContent(htmlContent: string, cssContent: string): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // コンテンツ分析
    if (!htmlContent.includes('alt=')) {
      suggestions.push({
        id: 'img-alt-text',
        type: 'accessibility',
        title: '画像にalt属性を追加',
        description: 'アクセシビリティ向上のため、画像にalt属性を追加することをお勧めします。',
        impact: 'medium',
        confidence: 0.9,
        action: {
          type: 'modify',
          target: 'img',
          value: 'alt属性を追加'
        },
        reasoning: 'スクリーンリーダーのユーザーにとって重要で、SEOにも効果的です。'
      });
    }

    // CTA分析
    const ctaCount = (htmlContent.match(/(?:ボタン|button|申し込み|登録|問い合わせ)/gi) || []).length;
    if (ctaCount < 2) {
      suggestions.push({
        id: 'add-cta',
        type: 'conversion',
        title: 'CTA（行動喚起）を追加',
        description: 'コンバージョン率向上のため、追加のCTAボタンを配置することをお勧めします。',
        impact: 'high',
        confidence: 0.85,
        preview: '<button class="bg-blue-500 text-white px-6 py-3 rounded-lg">今すぐ申し込む</button>',
        action: {
          type: 'add',
          target: 'section',
          value: 'CTA追加'
        },
        reasoning: '複数のCTAポイントがあることで、ユーザーの行動機会が増加します。'
      });
    }

    // デザイン分析
    if (!cssContent.includes('box-shadow')) {
      suggestions.push({
        id: 'add-shadows',
        type: 'design',
        title: 'ボックスシャドウで奥行きを追加',
        description: 'カードやボタンにシャドウを追加して、より魅力的なデザインにできます。',
        impact: 'medium',
        confidence: 0.75,
        preview: 'box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);',
        action: {
          type: 'modify',
          target: 'css',
          value: 'シャドウ追加'
        },
        reasoning: '視覚的な階層とモダンな印象を与えます。'
      });
    }

    return suggestions;
  }

  static generateContextualSuggestions(businessContext: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // 業界特有の提案
    if (businessContext?.industry === 'saas') {
      suggestions.push({
        id: 'saas-trial',
        type: 'conversion',
        title: '無料トライアルセクションを追加',
        description: 'SaaSサービスでは無料トライアルが効果的なコンバージョン手法です。',
        impact: 'high',
        confidence: 0.9,
        action: {
          type: 'add',
          target: 'section',
          value: '無料トライアル'
        },
        reasoning: 'SaaSの場合、ユーザーは購入前に製品を試したがる傾向があります。'
      });
    }

    if (businessContext?.targetAudience === '中小企業') {
      suggestions.push({
        id: 'trust-signals',
        type: 'conversion',
        title: '導入実績・お客様の声を追加',
        description: '中小企業向けでは信頼性が重要です。導入実績やお客様の声を表示しましょう。',
        impact: 'high',
        confidence: 0.85,
        action: {
          type: 'add',
          target: 'section',
          value: '導入実績'
        },
        reasoning: '中小企業の意思決定者は、同業他社の成功事例を重視します。'
      });
    }

    return suggestions;
  }
}