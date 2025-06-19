'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Eye, Download, Sparkles } from 'lucide-react';

interface Variant {
  id: string;
  title: string;
  htmlContent: string;
  cssContent: string;
  variantSeed: number;
  designFocus: string;
  metadata?: any;
}

interface VariantSelectorProps {
  variants: Variant[];
  onSelectVariant: (variant: Variant) => void;
  selectedVariantId?: string;
}

const designFocusLabels = {
  'modern-clean': '🎨 モダン・クリーン',
  'conversion-optimized': '📈 コンバージョン重視', 
  'content-rich': '📄 コンテンツ重視'
};

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  onSelectVariant,
  selectedVariantId
}) => {
  const [previewMode, setPreviewMode] = useState<'grid' | 'comparison'>('grid');
  
  const handleSelectVariant = (variant: Variant) => {
    onSelectVariant(variant);
  };

  const generatePreviewHtml = (variant: Variant) => {
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${variant.title}</title>
        <style>${variant.cssContent}</style>
      </head>
      <body>
        ${variant.htmlContent}
      </body>
      </html>
    `;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <Sparkles className="inline-block w-6 h-6 mr-2 text-blue-500" />
            デザインバリエーション
          </h2>
          <p className="text-gray-600">
            {variants.length}つのバリエーションから最適なデザインを選択してください
          </p>
        </div>
        
        {/* 表示モード切替 */}
        <div className="flex gap-2">
          <Button
            variant={previewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('grid')}
          >
            グリッド表示
          </Button>
          <Button
            variant={previewMode === 'comparison' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('comparison')}
          >
            比較表示
          </Button>
        </div>
      </div>

      {/* グリッド表示 */}
      {previewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              isSelected={selectedVariantId === variant.id}
              onSelect={() => handleSelectVariant(variant)}
              previewHtml={generatePreviewHtml(variant)}
            />
          ))}
        </div>
      )}

      {/* 比較表示 */}
      {previewMode === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {variants.map((variant) => (
            <ComparisonCard
              key={variant.id}
              variant={variant}
              isSelected={selectedVariantId === variant.id}
              onSelect={() => handleSelectVariant(variant)}
              previewHtml={generatePreviewHtml(variant)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// バリエーションカード（グリッド用）
const VariantCard: React.FC<{
  variant: Variant;
  isSelected: boolean;
  onSelect: () => void;
  previewHtml: string;
}> = ({ variant, isSelected, onSelect, previewHtml }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Card className={`relative transition-all hover:shadow-lg ${
      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{variant.title}</CardTitle>
          {isSelected && (
            <CheckCircle className="w-5 h-5 text-blue-500" />
          )}
        </div>
        <Badge variant="secondary" className="w-fit">
          {designFocusLabels[variant.designFocus as keyof typeof designFocusLabels] || variant.designFocus}
        </Badge>
      </CardHeader>
      
      <CardContent>
        {/* プレビューサムネイル */}
        <div className="relative mb-4 bg-gray-100 rounded-lg overflow-hidden" style={{ height: '200px' }}>
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full transform scale-50 origin-top-left"
            style={{ width: '200%', height: '200%' }}
            title={`Preview of ${variant.title}`}
          />
          <div className="absolute inset-0 bg-gray-900/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              size="sm"
              onClick={() => setShowPreview(true)}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 mr-2" />
              プレビュー
            </Button>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button
            onClick={onSelect}
            className="flex-1"
            variant={isSelected ? 'default' : 'outline'}
          >
            {isSelected ? '選択済み' : '選択'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      {/* フルプレビューモーダル */}
      {showPreview && (
        <PreviewModal
          variant={variant}
          previewHtml={previewHtml}
          onClose={() => setShowPreview(false)}
          onSelect={onSelect}
        />
      )}
    </Card>
  );
};

// 比較カード
const ComparisonCard: React.FC<{
  variant: Variant;
  isSelected: boolean;
  onSelect: () => void;
  previewHtml: string;
}> = ({ variant, isSelected, onSelect, previewHtml }) => {
  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{variant.title}</CardTitle>
          <Badge variant="secondary">
            {designFocusLabels[variant.designFocus as keyof typeof designFocusLabels]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 比較用プレビュー */}
        <div className="bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ height: '300px' }}>
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full transform scale-75 origin-top-left"
            style={{ width: '133%', height: '133%' }}
            title={`Comparison preview of ${variant.title}`}
          />
        </div>

        <Button
          onClick={onSelect}
          className="w-full"
          variant={isSelected ? 'default' : 'outline'}
        >
          {isSelected ? '✓ 選択済み' : '選択する'}
        </Button>
      </CardContent>
    </Card>
  );
};

// プレビューモーダル
const PreviewModal: React.FC<{
  variant: Variant;
  previewHtml: string;
  onClose: () => void;
  onSelect: () => void;
}> = ({ variant, previewHtml, onClose, onSelect }) => {
  const downloadHtml = () => {
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${variant.title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full h-5/6 flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{variant.title}</h3>
            <Badge variant="secondary" className="mt-1">
              {designFocusLabels[variant.designFocus as keyof typeof designFocusLabels]}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={downloadHtml}>
              <Download className="w-4 h-4 mr-2" />
              ダウンロード
            </Button>
            <Button size="sm" onClick={onSelect}>
              選択
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
        
        {/* プレビューエリア */}
        <div className="flex-1 bg-gray-100">
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full"
            title={`Full preview of ${variant.title}`}
          />
        </div>
      </div>
    </div>
  );
};