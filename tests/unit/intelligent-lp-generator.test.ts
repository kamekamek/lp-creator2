/**
 * LP Creator Platform - Intelligent LP Generator Tests
 */

import { intelligentLPGeneratorTool } from '../../src/mastra/tools/intelligentLPGeneratorTool';
import { enhancedLPGeneratorTool } from '../../src/mastra/tools/enhancedLPGeneratorTool';
import { analyzeBusinessContext } from '../../src/mastra/tools/utils/businessContextAnalyzer';
import { calculateDetailedVariantScore, compareVariants } from '../../src/mastra/tools/utils/variantScoringUtils';

// Mock dependencies
jest.mock('../../src/mastra/tools/enhancedLPGeneratorTool');
jest.mock('../../src/mastra/tools/utils/businessContextAnalyzer');
jest.mock('../../src/mastra/tools/utils/variantScoringUtils');

const mockEnhancedLPGeneratorTool = enhancedLPGeneratorTool as jest.Mocked<typeof enhancedLPGeneratorTool>;
const mockAnalyzeBusinessContext = analyzeBusinessContext as jest.MockedFunction<typeof analyzeBusinessContext>;
const mockCalculateDetailedVariantScore = calculateDetailedVariantScore as jest.MockedFunction<typeof calculateDetailedVariantScore>;

describe('Intelligent LP Generator Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockAnalyzeBusinessContext.mockReturnValue({
      industry: 'saas',
      targetAudience: '中小企業',
      businessGoal: 'リード獲得',
      competitiveAdvantage: ['高品質', '低価格'],
      tone: 'professional'
    });
    
    mockEnhancedLPGeneratorTool.execute.mockResolvedValue({
      success: true,
      htmlContent: '<div>Mock HTML Content</div>',
      cssContent: 'body { color: black; }',
      title: 'Mock LP Title',
      structure: null,
      metadata: {
        originalTopic: 'test',
        error: false,
        errorType: 'model_timeout' as const,
        errorMessage: '',
        generatedAt: new Date().toISOString(),
        version: '3.0-enhanced-marketing'
      }
    });
    
    mockCalculateDetailedVariantScore.mockReturnValue({
      score: 85,
      breakdown: {
        businessAlignment: 25,
        industryFit: 20,
        designQuality: 22,
        contentQuality: 18
      },
      reasoning: ['High quality variant']
    });
  });

  test('should generate 3 variants by default', async () => {
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'AIを活用したクラウドソフトウェア',
      designStyle: 'modern',
      variantCount: 3
    }, {});

    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(3);
    expect(result.metadata.totalVariants).toBe(3);
    expect(mockEnhancedLPGeneratorTool.execute).toHaveBeenCalledTimes(3);
  });

  test('should generate specified number of variants', async () => {
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'テストサービス',
      designStyle: 'modern',
      variantCount: 2
    }, {});

    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(2);
    expect(result.metadata.totalVariants).toBe(2);
    expect(mockEnhancedLPGeneratorTool.execute).toHaveBeenCalledTimes(2);
  });

  test('should generate variants with different design focuses', async () => {
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'テストLP',
      designStyle: 'modern',
      variantCount: 3
    }, {});

    expect(result.success).toBe(true);
    
    const designFocuses = result.variants.map(v => v.designFocus);
    expect(designFocuses).toContain('modern-clean');
    expect(designFocuses).toContain('conversion-optimized');
    expect(designFocuses).toContain('content-rich');
  });

  test('should respect focus areas parameter', async () => {
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'テストLP',
      designStyle: 'modern',
      variantCount: 2,
      focusAreas: ['modern-clean', 'conversion-optimized']
    }, {});

    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(2);
    
    const designFocuses = result.variants.map(v => v.designFocus);
    expect(designFocuses).toContain('modern-clean');
    expect(designFocuses).toContain('conversion-optimized');
    expect(designFocuses).not.toContain('content-rich');
  });

  test('should sort variants by score', async () => {
    // Mock different scores for variants
    mockCalculateDetailedVariantScore
      .mockReturnValueOnce({ score: 85, breakdown: {} as any, reasoning: [] })
      .mockReturnValueOnce({ score: 90, breakdown: {} as any, reasoning: [] })
      .mockReturnValueOnce({ score: 75, breakdown: {} as any, reasoning: [] });

    const result = await intelligentLPGeneratorTool.execute({
      topic: 'テストLP',
      designStyle: 'modern',
      variantCount: 3
    }, {});

    expect(result.success).toBe(true);
    // Check that variants are sorted by score (highest first)
    for (let i = 0; i < result.variants.length - 1; i++) {
      expect(result.variants[i].score).toBeGreaterThanOrEqual(result.variants[i + 1].score);
    }
  });
  test('should select recommended variant based on highest score', async () => {
    mockCalculateDetailedVariantScore
      .mockReturnValueOnce({ score: 75, breakdown: {} as any, reasoning: [] })
      .mockReturnValueOnce({ score: 90, breakdown: {} as any, reasoning: [] })
      .mockReturnValueOnce({ score: 80, breakdown: {} as any, reasoning: [] });

    const result = await intelligentLPGeneratorTool.execute({
      topic: 'テストLP',
      designStyle: 'modern',
      variantCount: 3
    }, {});

    expect(result.success).toBe(true);
    expect(result.recommendedVariant).toBe(result.variants[0].variantId); // Highest score variant
  });

  test('should include variant metadata and recommendations', async () => {
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'SaaSプラットフォーム'
    });

    expect(result.success).toBe(true);
    
    result.variants.forEach(variant => {
      expect(variant.variantId).toBeDefined();
      expect(variant.score).toBeGreaterThanOrEqual(0);
      expect(variant.description).toBeDefined();
      expect(variant.features).toBeInstanceOf(Array);
      expect(variant.designFocus).toMatch(/^(modern-clean|conversion-optimized|content-rich)$/);
      expect(variant.recommendation).toBeDefined();
      expect(variant.recommendation?.reason).toBeDefined();
      expect(variant.recommendation?.targetUseCase).toBeDefined();
      expect(variant.recommendation?.strengths).toBeInstanceOf(Array);
    });
  });

  test('should handle enhanced LP generator failures gracefully', async () => {
    mockEnhancedLPGeneratorTool.execute
      .mockResolvedValueOnce({
        success: true,
        htmlContent: '<div>Success</div>',
        cssContent: '',
        title: 'Success',
        structure: null,
        metadata: { 
          originalTopic: 'test',
          error: false,
          errorType: 'model_timeout' as const,
          errorMessage: '',
          generatedAt: new Date().toISOString(), 
          version: '3.0' 
        }
      })
      .mockRejectedValueOnce(new Error('Generation failed'))
      .mockResolvedValueOnce({
        success: true,
        htmlContent: '<div>Success</div>',
        cssContent: '',
        title: 'Success',
        structure: null,
        metadata: { 
          originalTopic: 'test',
          error: false,
          errorType: 'model_timeout' as const,
          errorMessage: '',
          generatedAt: new Date().toISOString(), 
          version: '3.0' 
        }
      });

    const result = await intelligentLPGeneratorTool.execute({
      topic: 'テストLP'
    });

    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(3); // Should still return 3 variants (with fallback)
    
    // Check that one variant is a fallback
    const fallbackVariant = result.variants.find(v => v.variantId.includes('fallback'));
    expect(fallbackVariant).toBeDefined();
    expect(fallbackVariant?.score).toBe(30); // Low fallback score
  });

  test('should use business context for variant configuration', async () => {
    mockAnalyzeBusinessContext.mockReturnValue({
      industry: 'ecommerce',
      targetAudience: '一般消費者',
      businessGoal: '売上向上',
      competitiveAdvantage: ['高品質商品'],
      tone: 'friendly'
    });

    const result = await intelligentLPGeneratorTool.execute({
      topic: 'オンラインショップ'
    });

    expect(result.success).toBe(true);
    expect(mockAnalyzeBusinessContext).toHaveBeenCalledWith('オンラインショップ');
    
    // Check that enhanced LP generator was called with business context
    expect(mockEnhancedLPGeneratorTool.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        industry: 'ecommerce',
        targetAudience: '一般消費者',
        businessGoal: '売上向上'
      })
    );
  });

  test('should override business context with manual parameters', async () => {
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'テストサービス',
      targetAudience: '個人事業主',
      businessGoal: 'ブランド認知',
      industry: 'consulting'
    });

    expect(result.success).toBe(true);
    
    // Check that manual parameters override auto-analyzed context
    expect(mockEnhancedLPGeneratorTool.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        targetAudience: '個人事業主',
        businessGoal: 'ブランド認知',
        industry: 'consulting'
      })
    );
  });

  test('should include performance metadata', async () => {
    const result = await intelligentLPGeneratorTool.execute({
      topic: 'テストLP'
    });

    expect(result.success).toBe(true);
    expect(result.metadata.generatedAt).toBeDefined();
    expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    expect(result.metadata.version).toBe('1.0-intelligent-variants');
  });

  test('should handle complete failure gracefully', async () => {
    mockEnhancedLPGeneratorTool.execute.mockRejectedValue(new Error('Complete failure'));

    const result = await intelligentLPGeneratorTool.execute({
      topic: 'テストLP'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.variants).toHaveLength(0);
    expect(result.recommendedVariant).toBe('');
  });
});

describe('Variant Scoring Utils - Real Implementation', () => {
  beforeAll(() => {
    jest.resetModules();
    jest.unmock('../../src/mastra/tools/utils/variantScoringUtils');
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('should calculate detailed variant scores', () => {
    const mockVariant = {
      variantId: 'test-variant',
      designFocus: 'conversion-optimized' as const,
      htmlContent: '<section><h1>Test</h1><button>CTA</button></section>',
      cssContent: 'body { display: flex; } @media (max-width: 768px) { }',
      score: 0,
      description: 'Test variant',
      features: [],
      title: 'Test',
      metadata: { generatedAt: new Date(), model: 'test', processingTime: 100 }
    };

    const businessContext = {
      industry: 'saas',
      targetAudience: '中小企業',
      businessGoal: 'リード獲得',
      competitiveAdvantage: [],
      tone: 'professional' as const
    };

    const { calculateDetailedVariantScore } = require('../../src/mastra/tools/utils/variantScoringUtils');
    const result = calculateDetailedVariantScore(mockVariant, businessContext);

    expect(result.score).toBeGreaterThan(0);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.businessAlignment).toBeGreaterThan(0);
    expect(result.breakdown.industryFit).toBeGreaterThan(0);
    expect(result.breakdown.designQuality).toBeGreaterThan(0);
    expect(result.breakdown.contentQuality).toBeGreaterThan(0);
    expect(result.reasoning).toBeInstanceOf(Array);
    expect(result.reasoning.length).toBeGreaterThan(0);
  });
});
    expect(result.breakdown.designQuality).toBeGreaterThan(0);
    expect(result.breakdown.contentQuality).toBeGreaterThan(0);
    expect(result.reasoning).toBeInstanceOf(Array);
    expect(result.reasoning.length).toBeGreaterThan(0);
  });
});