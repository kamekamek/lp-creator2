import React, { useState } from 'react';
import { LPVariant } from '../types/lp-core';

interface VariantSelectorProps {
  variants: LPVariant[];
  recommendedVariantId: string;
  onVariantSelect: (variant: LPVariant) => void;
  selectedVariantId?: string;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  recommendedVariantId,
  onVariantSelect,
  selectedVariantId
}) => {
  const [previewVariant, setPreviewVariant] = useState<LPVariant | null>(null);

  const getDesignFocusLabel = (focus: string) => {
    const labels = {
      'modern-clean': 'モダン・クリーン',
      'conversion-optimized': 'コンバージョン最適化',
      'content-rich': 'コンテンツ重視'
    };
    return labels[focus as keyof typeof labels] || focus;
  };

  const getDesignFocusColor = (focus: string) => {
    const colors = {
      'modern-clean': 'bg-blue-100 text-blue-800 border-blue-200',
      'conversion-optimized': 'bg-green-100 text-green-800 border-green-200',
      'content-rich': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[focus as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };


const generatePreviewHtml = (variant: LPVariant) => {
  // 基本的なHTMLプレビューを生成（セキュリティのため簡略化）
  const cssContent = variant.cssContent || '';
  const htmlContent = variant.htmlContent || '<div>プレビューを読み込み中...</div>';

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${variant.title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      ${cssContent}
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
};

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          デザインバリエーション
        </h2>
        <p className="text-gray-600">
          バリエーションから最適なデザインを選択してください。推奨バリエーションには★マークが付いています。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {variants.map((variant) => {
          const isRecommended = variant.variantId === recommendedVariantId;
          const isSelected = variant.variantId === selectedVariantId;
          
          return (
            <div
              key={variant.variantId}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onVariantSelect(variant)}
            >
              {/* 推奨バッジ */}
              {isRecommended && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                  ★ 推奨
                </div>
              )}

              {/* デザインフォーカスバッジ */}
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mb-3 ${getDesignFocusColor(variant.designFocus)}`}>
                {getDesignFocusLabel(variant.designFocus)}
              </div>

              {/* スコア */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">品質スコア</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${variant.score}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{variant.score}</span>
                </div>
              </div>

              {/* 説明 */}
              <h3 className="font-semibold text-gray-900 mb-2">
                {variant.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {variant.description}
              </p>

              {/* 特徴 */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">主な特徴:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {variant.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-1">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 推奨理由 */}
              {variant.recommendation && (
                <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
                  <p className="text-gray-700">
                    <strong>推奨理由:</strong> {variant.recommendation.reason}
                  </p>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewVariant(variant);
                  }}
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  aria-label={`${variant.title}のプレビューを表示`}
                >
                  プレビュー
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVariantSelect(variant);
                  }}
                  className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  aria-label={`${variant.title}を選択`}
                  aria-pressed={isSelected}
                >
                  {isSelected ? '選択中' : '選択'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* プレビューモーダル */}
      {previewVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {previewVariant.title} - プレビュー
              </h3>
              <button
                onClick={() => setPreviewVariant(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 p-4">
              <iframe
                srcDoc={generatePreviewHtml(previewVariant)}
                className="w-full min-h-96 max-h-[70vh] border rounded resize-y"
                sandbox="allow-same-origin allow-scripts"
                loading="lazy"
                title={`Preview of ${previewVariant.title}`}
              />
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${getDesignFocusColor(previewVariant.designFocus)}`}>
                    {getDesignFocusLabel(previewVariant.designFocus)}
                  </span>
                  <span className="ml-2">スコア: {previewVariant.score}</span>
                </div>
                <button
                  onClick={() => {
                    onVariantSelect(previewVariant);
                    setPreviewVariant(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  このバリエーションを選択
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 選択されたバリエーションの詳細情報 */}
      {selectedVariantId && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">選択されたバリエーション</h3>
          {(() => {
            const selectedVariant = variants.find(v => v.variantId === selectedVariantId);
            if (!selectedVariant) return null;
            
            return (
              <div>
                <p className="text-blue-800 mb-2">{selectedVariant.description}</p>
                {selectedVariant.recommendation && (
                  <div className="text-sm text-blue-700">
                    <p><strong>適用場面:</strong> {selectedVariant.recommendation.targetUseCase}</p>
                    <p><strong>強み:</strong> {selectedVariant.recommendation.strengths.join('、')}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};