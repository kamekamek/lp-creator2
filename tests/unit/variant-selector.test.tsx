/**
 * LP Creator Platform - VariantSelector Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VariantSelector } from '../../src/components/VariantSelector';
import { LPVariant } from '../../src/types/lp-core';

// Mock variants for testing
const mockVariants: LPVariant[] = [
  {
    variantId: 'variant-1-modern-clean',
    score: 85,
    description: 'モダンでクリーンなデザインに重点を置いた、視覚的に美しく洗練されたバリエーション',
    features: ['洗練されたビジュアルデザイン', 'ミニマルで読みやすいレイアウト', 'モダンなタイポグラフィ'],
    designFocus: 'modern-clean',
    recommendation: {
      reason: 'ブランドイメージの向上と視覚的な印象を重視する場合に最適',
      targetUseCase: 'ブランド認知向上、プレミアム商品・サービスの紹介',
      strengths: ['洗練されたデザイン', '高いブランド価値の演出', 'ユーザビリティの向上']
    },
    htmlContent: '<div>Modern Clean HTML</div>',
    cssContent: 'body { font-family: sans-serif; }',
    title: 'Modern Clean LP',
    metadata: {
      generatedAt: new Date(),
      model: 'test-model',
      processingTime: 1000
    }
  },
  {
    variantId: 'variant-2-conversion-optimized',
    score: 92,
    description: 'コンバージョン最適化に重点を置いた、行動喚起と成果重視のバリエーション',
    features: ['強力なCTAボタン配置', '緊急性を演出する要素', 'ソーシャルプルーフ強化'],
    designFocus: 'conversion-optimized',
    recommendation: {
      reason: '具体的な行動（購入、登録、問い合わせ）を促進したい場合に最適',
      targetUseCase: 'リード獲得、売上向上、会員登録促進',
      strengths: ['高いコンバージョン率', '明確な行動喚起', '緊急性の演出']
    },
    htmlContent: '<div>Conversion Optimized HTML</div>',
    cssContent: 'body { background: #f0f0f0; }',
    title: 'Conversion Optimized LP',
    metadata: {
      generatedAt: new Date(),
      model: 'test-model',
      processingTime: 1200
    }
  },
  {
    variantId: 'variant-3-content-rich',
    score: 78,
    description: '情報豊富なコンテンツに重点を置いた、詳細で包括的なバリエーション',
    features: ['詳細な製品説明', '豊富なFAQセクション', '事例・実績の充実'],
    designFocus: 'content-rich',
    recommendation: {
      reason: '詳細な情報提供と信頼性の構築を重視する場合に最適',
      targetUseCase: '複雑な商品・サービスの説明、B2B営業支援',
      strengths: ['包括的な情報提供', '信頼性の構築', '意思決定支援']
    },
    htmlContent: '<div>Content Rich HTML</div>',
    cssContent: 'body { line-height: 1.6; }',
    title: 'Content Rich LP',
    metadata: {
      generatedAt: new Date(),
      model: 'test-model',
      processingTime: 1500
    }
  }
];

describe('VariantSelector Component', () => {
  const mockOnVariantSelect = jest.fn();
  const recommendedVariantId = 'variant-2-conversion-optimized';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render all variants', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    expect(screen.getByText('デザインバリエーション')).toBeInTheDocument();
    expect(screen.getByText('Modern Clean LP')).toBeInTheDocument();
    expect(screen.getByText('Conversion Optimized LP')).toBeInTheDocument();
    expect(screen.getByText('Content Rich LP')).toBeInTheDocument();
  });

  test('should display variant scores correctly', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  test('should mark recommended variant with star', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    expect(screen.getByText('★ 推奨')).toBeInTheDocument();
  });

  test('should display design focus labels correctly', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    expect(screen.getByText('モダン・クリーン')).toBeInTheDocument();
    expect(screen.getByText('コンバージョン最適化')).toBeInTheDocument();
    expect(screen.getByText('コンテンツ重視')).toBeInTheDocument();
  });

  test('should display variant features', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    expect(screen.getByText('洗練されたビジュアルデザイン')).toBeInTheDocument();
    expect(screen.getByText('強力なCTAボタン配置')).toBeInTheDocument();
    expect(screen.getByText('詳細な製品説明')).toBeInTheDocument();
  });

  test('should call onVariantSelect when variant is clicked', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    const firstVariantCard = screen.getByText('Modern Clean LP').closest('div');
    fireEvent.click(firstVariantCard!);

    expect(mockOnVariantSelect).toHaveBeenCalledWith(mockVariants[0]);
  });

  test('should call onVariantSelect when select button is clicked', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    const selectButtons = screen.getAllByText('選択');
    fireEvent.click(selectButtons[0]);

    expect(mockOnVariantSelect).toHaveBeenCalledWith(mockVariants[0]);
  });

  test('should show selected variant details', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
        selectedVariantId="variant-1-modern-clean"
      />
    );

    expect(screen.getByText('選択されたバリエーション')).toBeInTheDocument();
    expect(screen.getByText('ブランド認知向上、プレミアム商品・サービスの紹介')).toBeInTheDocument();
  });

  test('should highlight selected variant', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
        selectedVariantId="variant-1-modern-clean"
      />
    );

    expect(screen.getByText('選択中')).toBeInTheDocument();
  });

  test('should open preview modal when preview button is clicked', async () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    const previewButtons = screen.getAllByText('プレビュー');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Modern Clean LP - プレビュー')).toBeInTheDocument();
    });
  });

  test('should close preview modal when close button is clicked', async () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    // Open modal
    const previewButtons = screen.getAllByText('プレビュー');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Modern Clean LP - プレビュー')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Modern Clean LP - プレビュー')).not.toBeInTheDocument();
    });
  });

  test('should select variant from preview modal', async () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    // Open modal
    const previewButtons = screen.getAllByText('プレビュー');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('このバリエーションを選択')).toBeInTheDocument();
    });

    // Select from modal
    const selectFromModalButton = screen.getByText('このバリエーションを選択');
    fireEvent.click(selectFromModalButton);

    expect(mockOnVariantSelect).toHaveBeenCalledWith(mockVariants[0]);
  });

  test('should handle empty variants array', () => {
    render(
      <VariantSelector
        variants={[]}
        recommendedVariantId=""
        onVariantSelect={mockOnVariantSelect}
      />
    );

    expect(screen.getByText('デザインバリエーション')).toBeInTheDocument();
    expect(screen.queryByText('Modern Clean LP')).not.toBeInTheDocument();
  });

  test('should handle missing recommendation data', () => {
    const variantsWithoutRecommendation = mockVariants.map(variant => ({
      ...variant,
      recommendation: undefined
    }));

    render(
      <VariantSelector
        variants={variantsWithoutRecommendation}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    expect(screen.getByText('デザインバリエーション')).toBeInTheDocument();
    expect(screen.queryByText('推奨理由:')).not.toBeInTheDocument();
  });

  test('should display variant descriptions', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    expect(screen.getByText('モダンでクリーンなデザインに重点を置いた、視覚的に美しく洗練されたバリエーション')).toBeInTheDocument();
    expect(screen.getByText('コンバージョン最適化に重点を置いた、行動喚起と成果重視のバリエーション')).toBeInTheDocument();
    expect(screen.getByText('情報豊富なコンテンツに重点を置いた、詳細で包括的なバリエーション')).toBeInTheDocument();
  });
});

describe('VariantSelector Accessibility', () => {
  const mockOnVariantSelect = jest.fn();
  const recommendedVariantId = 'variant-2-conversion-optimized';

  test('should have proper ARIA labels', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    const iframe = screen.getByTitle(/Preview of/);
    expect(iframe).toHaveAttribute('title');
  });

  test('should be keyboard navigable', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        recommendedVariantId={recommendedVariantId}
        onVariantSelect={mockOnVariantSelect}
      />
    );

    const selectButtons = screen.getAllByText('選択');
    selectButtons.forEach(button => {
      expect(button).toBeInTheDocument();
      // Buttons should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });
});