/**
 * LP Creator Platform - Quick Tests for Task 3
 */

import { calculateDetailedVariantScore } from '../../src/mastra/tools/utils/variantScoringUtils';
import { LPVariant, BusinessContext } from '../../src/types/lp-core';

describe('Task 3 - Variant Generation System', () => {
  const mockBusinessContext: BusinessContext = {
    industry: 'saas',
    targetAudience: '中小企業',
    businessGoal: 'リード獲得',
    competitiveAdvantage: ['高品質', '低価格'],
    tone: 'professional'
  };

  const createMockVariant = (designFocus: 'modern-clean' | 'conversion-optimized' | 'content-rich'): LPVariant => ({
    variantId: `test-variant-${designFocus}`,
    score: 0,
    description: `Test ${designFocus} variant`,
    features: ['Feature 1', 'Feature 2'],
    designFocus,
    recommendation: {
      reason: 'Test reason',
      targetUseCase: 'Test use case',
      strengths: ['Strength 1', 'Strength 2']
    },
    htmlContent: '<section><h1>Test</h1><button>CTA</button></section>',
    cssContent: 'body { display: flex; }',
    title: 'Test Title',
    metadata: {
      generatedAt: new Date(),
      model: 'test-model',
      processingTime: 100
    }
  });

  test('should calculate variant scores correctly', () => {
    const variant = createMockVariant('conversion-optimized');
    const result = calculateDetailedVariantScore(variant, mockBusinessContext);

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown).toBeDefined();
    expect(result.reasoning).toBeInstanceOf(Array);
  });

  test('should handle different design focuses', () => {
    const focuses: ('modern-clean' | 'conversion-optimized' | 'content-rich')[] = [
      'modern-clean', 'conversion-optimized', 'content-rich'
    ];

    focuses.forEach(focus => {
      const variant = createMockVariant(focus);
      const result = calculateDetailedVariantScore(variant, mockBusinessContext);
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasoning).toContain(`${focus === 'modern-clean' ? 'モダンで洗練されたビジュアルデザインが特徴' : 
        focus === 'conversion-optimized' ? 'コンバージョン率向上に特化した設計' : 
        '情報提供と信頼性構築に重点を置いた設計'}`);
    });
  });

  test('should validate variant structure', () => {
    const variant = createMockVariant('modern-clean');
    
    // Check all required properties
    expect(variant.variantId).toBeDefined();
    expect(variant.score).toBeDefined();
    expect(variant.description).toBeDefined();
    expect(variant.features).toBeInstanceOf(Array);
    expect(['modern-clean', 'conversion-optimized', 'content-rich']).toContain(variant.designFocus);
    expect(variant.recommendation).toBeDefined();
    expect(variant.htmlContent).toBeDefined();
    expect(variant.cssContent).toBeDefined();
    expect(variant.title).toBeDefined();
    expect(variant.metadata).toBeDefined();
  });

  test('should handle business context variations', () => {
    const variant = createMockVariant('conversion-optimized');
    
    const ecommerceContext = { ...mockBusinessContext, industry: 'ecommerce', businessGoal: '売上向上' };
    const educationContext = { ...mockBusinessContext, industry: 'education', businessGoal: '情報提供' };
    
    const ecommerceResult = calculateDetailedVariantScore(variant, ecommerceContext);
    const educationResult = calculateDetailedVariantScore(variant, educationContext);
    
    expect(ecommerceResult.score).toBeGreaterThan(0);
    expect(educationResult.score).toBeGreaterThan(0);
    
    // Conversion-optimized should score higher for ecommerce + sales goal
    expect(ecommerceResult.breakdown.businessAlignment).toBeGreaterThan(educationResult.breakdown.businessAlignment);
  });

  test('should generate meaningful recommendations', () => {
    const focuses: ('modern-clean' | 'conversion-optimized' | 'content-rich')[] = [
      'modern-clean', 'conversion-optimized', 'content-rich'
    ];

    focuses.forEach(focus => {
      const variant = createMockVariant(focus);
      const result = calculateDetailedVariantScore(variant, mockBusinessContext);
      
      expect(result.reasoning).toBeInstanceOf(Array);
      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.reasoning.some(reason => reason.length > 10)).toBe(true);
    });
  });
});