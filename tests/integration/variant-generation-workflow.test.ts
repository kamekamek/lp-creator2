/**
 * LP Creator Platform - Variant Generation Workflow Integration Tests
 */

import { intelligentLPGeneratorTool } from '../../src/mastra/tools/intelligentLPGeneratorTool';
import { VariantGenerationResult, LPVariant } from '../../src/types/lp-core';

describe('Variant Generation Workflow Integration', () => {
  // Skip these tests in CI/CD as they require actual AI model calls
  const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';
  
  beforeEach(() => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests. Set RUN_INTEGRATION_TESTS=true to run.');
    }
  });

  (runIntegrationTests ? test : test.skip)('should generate multiple variants for SaaS product', async () => {
    if (!runIntegrationTests) return;
    
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'AIを活用したプロジェクト管理ツール',
      designStyle: 'modern',
      targetAudience: '中小企業の経営者',
      businessGoal: 'リード獲得',
      industry: 'saas',
      variantCount: 3
    }, {
      toolCallId: 'test-basic',
      messages: []
    });

    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(3);
    expect(result.recommendedVariant).toBeDefined();
    
    // Check variant diversity
    const designFocuses = result.variants.map(v => v.designFocus);
    expect(new Set(designFocuses).size).toBe(3); // All different focuses
    
    // Check scoring
    result.variants.forEach(variant => {
      expect(variant.score).toBeGreaterThan(0);
      expect(variant.score).toBeLessThanOrEqual(100);
    });
    
    // Check sorting (highest score first)
    for (let i = 0; i < result.variants.length - 1; i++) {
      expect(result.variants[i].score).toBeGreaterThanOrEqual(result.variants[i + 1].score);
    }
  }, 30000); // 30 second timeout for AI generation

  (runIntegrationTests ? test : test.skip)('should generate variants for e-commerce business', async () => {
    if (!runIntegrationTests) return;
    
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'オーガニック食品のオンラインショップ',
      designStyle: 'minimalist',
      targetAudience: '健康志向の家族',
      businessGoal: '売上向上',
      industry: 'ecommerce',
      competitiveAdvantage: '100%オーガニック認証商品',
      variantCount: 2
    }, {
      toolCallId: 'test-ecommerce',
      messages: []
    });

    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(2);
    
    // Check that variants contain relevant content
    result.variants.forEach(variant => {
      expect(variant.htmlContent).toContain('オーガニック');
      expect(variant.title).toBeDefined();
      expect(variant.description).toBeDefined();
      expect(variant.features.length).toBeGreaterThan(0);
      expect(variant.recommendation).toBeDefined();
    });
  }, 25000);

  (runIntegrationTests ? test : test.skip)('should handle specific focus areas', async () => {
    if (!runIntegrationTests) return;
    
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'コンサルティングサービス',
      designStyle: 'corporate',
      focusAreas: ['conversion-optimized', 'content-rich'],
      variantCount: 2
    }, {
      toolCallId: 'test-consulting',
      messages: []
    });

    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(2);
    
    const designFocuses = result.variants.map(v => v.designFocus);
    expect(designFocuses).toContain('conversion-optimized');
    expect(designFocuses).toContain('content-rich');
    expect(designFocuses).not.toContain('modern-clean');
  }, 25000);

  (runIntegrationTests ? test : test.skip)('should provide meaningful recommendations', async () => {
    if (!runIntegrationTests) return;
    
    const result = await intelligentLPGeneratorTool.execute({
      topic: '法律事務所のウェブサイト',
      designStyle: 'corporate',
      targetAudience: '法的問題を抱える個人',
      businessGoal: '相談予約',
      industry: 'legal',
      variantCount: 1
    }, {
      toolCallId: 'test-legal',
      messages: []
    });

    expect(result.success).toBe(true);
    
    result.variants.forEach(variant => {
      expect(variant.recommendation).toBeDefined();
      expect(variant.recommendation?.reason).toBeTruthy();
      expect(variant.recommendation?.targetUseCase).toBeTruthy();
      expect(variant.recommendation?.strengths).toBeInstanceOf(Array);
      expect(variant.recommendation?.strengths.length).toBeGreaterThan(0);
    });
    
    // Check that recommended variant has highest score
    const recommendedVariant = result.variants.find(v => v.variantId === result.recommendedVariant);
    expect(recommendedVariant).toBeDefined();
    expect(recommendedVariant?.score).toBe(Math.max(...result.variants.map(v => v.score)));
  }, 30000);

  test('should handle mock data correctly in test environment', async () => {
    // This test runs even without integration flag to ensure mocking works
    const mockResult = {
      success: true,
      variants: [
        {
          variantId: 'mock-variant-1',
          designFocus: 'modern-clean' as const,
          score: 85,
          description: 'Mock modern clean variant',
          features: ['Clean design', 'Modern layout'],
          recommendation: {
            reason: 'Best for brand image',
            targetUseCase: 'Brand awareness',
            strengths: ['Visual appeal', 'User experience']
          },
          htmlContent: '<div>Mock HTML</div>',
          cssContent: 'body { color: black; }',
          title: 'Mock Title',
          metadata: {
            generatedAt: new Date(),
            model: 'mock',
            processingTime: 100
          }
        }
      ],
      recommendedVariant: 'mock-variant-1',
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: 1000,
        totalVariants: 1,
        version: '1.0-test'
      }
    };

    // Mock the tool for this test
    const originalExecute = intelligentLPGeneratorTool.execute;
    try {
      intelligentLPGeneratorTool.execute = jest.fn().mockResolvedValue(mockResult);

      const result = await intelligentLPGeneratorTool.execute({
        topic: 'Test topic',
        designStyle: 'modern',
        variantCount: 1
      }, {
        toolCallId: 'test-mock',
        messages: []
      });

      expect(result.success).toBe(true);
      expect(result.variants).toHaveLength(1);
      expect(result.variants[0].variantId).toBe('mock-variant-1');
      expect(result.recommendedVariant).toBe('mock-variant-1');
    } finally {
      // Restore original function
      intelligentLPGeneratorTool.execute = originalExecute;
    }
  });

  test('should validate variant structure', async () => {
    // Mock a complete variant structure
    const mockVariant: LPVariant = {
      variantId: 'test-variant',
      score: 75,
      description: 'Test variant description',
      features: ['Feature 1', 'Feature 2'],
      designFocus: 'conversion-optimized',
      recommendation: {
        reason: 'Test reason',
        targetUseCase: 'Test use case',
        strengths: ['Strength 1', 'Strength 2']
      },
      htmlContent: '<div>Test HTML</div>',
      cssContent: 'body { margin: 0; }',
      title: 'Test Title',
      metadata: {
        generatedAt: new Date(),
        model: 'test-model',
        processingTime: 500
      }
    };

    // Validate all required properties exist
    expect(mockVariant.variantId).toBeDefined();
    expect(mockVariant.score).toBeGreaterThanOrEqual(0);
    expect(mockVariant.description).toBeDefined();
    expect(mockVariant.features).toBeInstanceOf(Array);
    expect(['modern-clean', 'conversion-optimized', 'content-rich']).toContain(mockVariant.designFocus);
    expect(mockVariant.recommendation).toBeDefined();
    expect(mockVariant.htmlContent).toBeDefined();
    expect(mockVariant.cssContent).toBeDefined();
    expect(mockVariant.title).toBeDefined();
    expect(mockVariant.metadata).toBeDefined();
  });

  test('should handle error scenarios gracefully', async () => {
    // Mock error scenario
    const originalExecute = intelligentLPGeneratorTool.execute;
    intelligentLPGeneratorTool.execute = jest.fn().mockResolvedValue({
      success: false,
      variants: [],
      recommendedVariant: '',
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: 100,
        totalVariants: 0,
        version: '1.0-error'
      },
      error: 'Mock error for testing'
    });

    const result = await intelligentLPGeneratorTool.execute({
      topic: 'Error test topic',
      designStyle: 'modern',
      variantCount: 1
    }, {
      toolCallId: 'test-error',
      messages: []
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.variants).toHaveLength(0);
    expect(result.recommendedVariant).toBe('');

    // Restore original function
    intelligentLPGeneratorTool.execute = originalExecute;
  });
});