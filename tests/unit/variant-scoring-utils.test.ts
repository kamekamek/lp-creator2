/**
 * LP Creator Platform - Variant Scoring Utils Tests
 */

import { calculateDetailedVariantScore, compareVariants } from '../../src/mastra/tools/utils/variantScoringUtils';
import { LPVariant, BusinessContext } from '../../src/types/lp-core';

describe('Variant Scoring Utils', () => {
  const mockBusinessContext: BusinessContext = {
    industry: 'saas',
    targetAudience: '中小企業',
    businessGoal: 'リード獲得',
    competitiveAdvantage: ['高品質', '低価格'],
    tone: 'professional'
  };

  const createMockVariant = (designFocus: 'modern-clean' | 'conversion-optimized' | 'content-rich'): LPVariant => ({
    variantId: `test-variant-${designFocus}`,
    score: 0, // Will be calculated
    description: `Test ${designFocus} variant`,
    features: ['Feature 1', 'Feature 2'],
    designFocus,
    recommendation: {
      reason: 'Test reason',
      targetUseCase: 'Test use case',
      strengths: ['Strength 1', 'Strength 2']
    },
    htmlContent: '<section><h1>Test</h1><button>CTA</button></section>',
    cssContent: 'body { display: flex; } @media (max-width: 768px) { }',
    title: 'Test Title',
    metadata: {
      generatedAt: new Date(),
      model: 'test-model',
      processingTime: 100
    }
  });

  describe('calculateDetailedVariantScore', () => {
    test('should calculate score for modern-clean variant', () => {
      const variant = createMockVariant('modern-clean');
      const result = calculateDetailedVariantScore(variant, mockBusinessContext);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.businessAlignment).toBeGreaterThan(0);
      expect(result.breakdown.industryFit).toBeGreaterThan(0);
      expect(result.breakdown.designQuality).toBeGreaterThan(0);
      expect(result.breakdown.contentQuality).toBeGreaterThan(0);
      expect(result.reasoning).toBeInstanceOf(Array);
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    test('should calculate score for conversion-optimized variant', () => {
      const variant = createMockVariant('conversion-optimized');
      const result = calculateDetailedVariantScore(variant, mockBusinessContext);

      expect(result.score).toBeGreaterThan(0);
      expect(result.breakdown.businessAlignment).toBeGreaterThan(0);
      expect(result.reasoning).toContain('コンバージョン率向上に特化した設計');
    });

    test('should calculate score for content-rich variant', () => {
      const variant = createMockVariant('content-rich');
      const result = calculateDetailedVariantScore(variant, mockBusinessContext);

      expect(result.score).toBeGreaterThan(0);
      expect(result.breakdown.contentQuality).toBeGreaterThan(0);
      expect(result.reasoning).toContain('情報提供と信頼性構築に重点を置いた設計');
    });

    test('should apply user preferences correctly', () => {
      const variant = createMockVariant('conversion-optimized');
      
      const resultWithPreference = calculateDetailedVariantScore(variant, mockBusinessContext, {
        prioritizeConversion: true
      });
      
      const resultWithoutPreference = calculateDetailedVariantScore(variant, mockBusinessContext);

      expect(resultWithPreference.score).toBeGreaterThan(resultWithoutPreference.score);
    });

    test('should handle different business goals appropriately', () => {
      const variant = createMockVariant('conversion-optimized');
      
      const salesContext = { ...mockBusinessContext, businessGoal: '売上向上' };
      const brandContext = { ...mockBusinessContext, businessGoal: 'ブランド認知' };
      
      const salesResult = calculateDetailedVariantScore(variant, salesContext);
      const brandResult = calculateDetailedVariantScore(variant, brandContext);

      // Conversion-optimized should score higher for sales than brand awareness
      expect(salesResult.breakdown.businessAlignment).toBeGreaterThan(brandResult.breakdown.businessAlignment);
    });

    test('should handle different industries appropriately', () => {
      const variant = createMockVariant('conversion-optimized');
      
      const ecommerceContext = { ...mockBusinessContext, industry: 'ecommerce' };
      const educationContext = { ...mockBusinessContext, industry: 'education' };
      
      const ecommerceResult = calculateDetailedVariantScore(variant, ecommerceContext);
      const educationResult = calculateDetailedVariantScore(variant, educationContext);

      // Conversion-optimized should score higher for ecommerce than education
      expect(ecommerceResult.breakdown.industryFit).toBeGreaterThan(educationResult.breakdown.industryFit);
    });
  });

  describe('compareVariants', () => {
    test('should compare multiple variants correctly', () => {
      const variants = [
        createMockVariant('modern-clean'),
        createMockVariant('conversion-optimized'),
        createMockVariant('content-rich')
      ];

      const comparison = compareVariants(variants, mockBusinessContext);

      expect(comparison.rankings).toHaveLength(3);
      expect(comparison.summary.bestOverall).toBeDefined();
      expect(comparison.summary.bestForBusiness).toBeDefined();
      expect(comparison.summary.bestDesign).toBeDefined();
      expect(comparison.summary.bestContent).toBeDefined();

      // Rankings should be sorted by score (highest first)
      for (let i = 0; i < comparison.rankings.length - 1; i++) {
        expect(comparison.rankings[i].score).toBeGreaterThanOrEqual(comparison.rankings[i + 1].score);
      }
    });

    test('should identify best variant for different criteria', () => {
      const variants = [
        createMockVariant('modern-clean'),
        createMockVariant('conversion-optimized'),
        createMockVariant('content-rich')
      ];

      const comparison = compareVariants(variants, mockBusinessContext);

      expect(comparison.summary.bestOverall.variant.variantId).toBeDefined();
      expect(comparison.summary.bestForBusiness.variant.variantId).toBeDefined();
      expect(comparison.summary.bestDesign.variant.variantId).toBeDefined();
      expect(comparison.summary.bestContent.variant.variantId).toBeDefined();
    });
  });

  describe('Scoring Components', () => {
    test('should analyze HTML quality correctly', () => {
      const highQualityVariant = createMockVariant('modern-clean');
      highQualityVariant.htmlContent = `
        <section>
          <header>
            <h1>Main Title</h1>
            <h2>Subtitle</h2>
          </header>
          <main>
            <img src="test.jpg" alt="Test image" />
            <button aria-label="Call to action">CTA</button>
          </main>
          <footer>
            <nav>Navigation</nav>
          </footer>
        </section>
      `;

      const lowQualityVariant = createMockVariant('modern-clean');
      lowQualityVariant.htmlContent = '<div>Simple content</div>';

      const highQualityResult = calculateDetailedVariantScore(highQualityVariant, mockBusinessContext);
      const lowQualityResult = calculateDetailedVariantScore(lowQualityVariant, mockBusinessContext);

      expect(highQualityResult.breakdown.designQuality).toBeGreaterThan(lowQualityResult.breakdown.designQuality);
    });

    test('should analyze CSS quality correctly', () => {
      const modernCSSVariant = createMockVariant('modern-clean');
      modernCSSVariant.cssContent = `
        :root { --primary: #000; }
        .container { 
          display: grid; 
          transform: translateY(0);
          transition: all 0.3s ease;
        }
        @media (max-width: 768px) { 
          .container { grid-template-columns: 1fr; }
        }
      `;

      const basicCSSVariant = createMockVariant('modern-clean');
      basicCSSVariant.cssContent = 'body { color: black; }';

      const modernResult = calculateDetailedVariantScore(modernCSSVariant, mockBusinessContext);
      const basicResult = calculateDetailedVariantScore(basicCSSVariant, mockBusinessContext);

      expect(modernResult.breakdown.designQuality).toBeGreaterThan(basicResult.breakdown.designQuality);
    });

    test('should analyze content structure correctly', () => {
      const richContentVariant = createMockVariant('content-rich');
      richContentVariant.htmlContent = `
        <section data-editable-id="hero">
          <h1 data-editable-id="title">Main Title</h1>
          <p data-editable-id="description">Detailed description with meaningful content that provides value to users and explains the product or service in depth.</p>
        </section>
        <section data-editable-id="features">
          <h2 data-editable-id="features-title">Features</h2>
          <ul>
            <li data-editable-id="feature-1">Feature 1</li>
            <li data-editable-id="feature-2">Feature 2</li>
          </ul>
        </section>
      `;

      const simpleContentVariant = createMockVariant('content-rich');
      simpleContentVariant.htmlContent = '<div>Short</div>';

      const richResult = calculateDetailedVariantScore(richContentVariant, mockBusinessContext);
      const simpleResult = calculateDetailedVariantScore(simpleContentVariant, mockBusinessContext);

      expect(richResult.breakdown.contentQuality).toBeGreaterThan(simpleResult.breakdown.contentQuality);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty HTML content', () => {
      const variant = createMockVariant('modern-clean');
      variant.htmlContent = '';

      const result = calculateDetailedVariantScore(variant, mockBusinessContext);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.contentQuality).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty CSS content', () => {
      const variant = createMockVariant('modern-clean');
      variant.cssContent = '';

      const result = calculateDetailedVariantScore(variant, mockBusinessContext);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.designQuality).toBeGreaterThanOrEqual(0);
    });

    test('should handle unknown industry gracefully', () => {
      const unknownIndustryContext = { ...mockBusinessContext, industry: 'unknown-industry' };
      const variant = createMockVariant('modern-clean');

      const result = calculateDetailedVariantScore(variant, unknownIndustryContext);

      expect(result.score).toBeGreaterThan(0);
      expect(result.breakdown.industryFit).toBeGreaterThan(0);
    });

    test('should handle unknown business goal gracefully', () => {
      const unknownGoalContext = { ...mockBusinessContext, businessGoal: 'unknown-goal' };
      const variant = createMockVariant('modern-clean');

      const result = calculateDetailedVariantScore(variant, unknownGoalContext);

      expect(result.score).toBeGreaterThan(0);
      expect(result.breakdown.businessAlignment).toBeGreaterThan(0);
    });
  });
});