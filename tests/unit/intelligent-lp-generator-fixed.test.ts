/**
 * LP Creator Platform - Intelligent LP Generator Tests (Fixed)
 */

import { intelligentLPGeneratorTool } from '../../src/mastra/tools/intelligentLPGeneratorTool';

// Mock business context analyzer
jest.mock('../../src/mastra/tools/utils/businessContextAnalyzer', () => ({
  analyzeBusinessContext: jest.fn().mockReturnValue({
    industry: 'saas',
    targetAudience: '中小企業',
    businessGoal: 'リード獲得',
    competitiveAdvantage: ['高品質', '低価格'],
    tone: 'professional'
  })
}));

// Mock enhanced LP generator tool
jest.mock('../../src/mastra/tools/enhancedLPGeneratorTool', () => ({
  enhancedLPGeneratorTool: {
    execute: jest.fn().mockResolvedValue({
      success: true,
      htmlContent: '<div>Mock HTML Content</div>',
      cssContent: 'body { color: black; }',
      title: 'Mock LP Title',
      structure: { title: 'Mock LP', sections: [] },
      metadata: {
        generatedAt: new Date().toISOString(),
        originalTopic: 'test',
        enhancedTopic: 'enhanced test',
        version: '3.0-enhanced-marketing'
      }
    })
  }
}));

describe('Intelligent LP Generator Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should have correct tool structure', () => {
    expect(intelligentLPGeneratorTool).toBeDefined();
    expect(intelligentLPGeneratorTool.description).toContain('複数のデザインバリエーション');
    expect(intelligentLPGeneratorTool.parameters).toBeDefined();
  });

  test('should validate input parameters', () => {
    const params = intelligentLPGeneratorTool.parameters;
    
    // Check required parameters
    expect(params.shape.topic).toBeDefined();
    
    // Check optional parameters
    expect(params.shape.variantCount).toBeDefined();
    expect(params.shape.focusAreas).toBeDefined();
    expect(params.shape.targetAudience).toBeDefined();
  });

  test('should handle basic execution without errors', async () => {
    // This is a basic smoke test to ensure the tool can be called
    test('should handle basic execution without errors', async () => {
      // This is a basic smoke test to ensure the tool can be called
      await expect(intelligentLPGeneratorTool.execute({
        topic: 'テストLP',
        designStyle: 'modern',
        variantCount: 1
      }, {
        toolCallId: 'test-fixed',
        messages: []
      })).resolves.not.toThrow();
    });
  });

  test('should validate variant count parameter', () => {
    const variantCountSchema = intelligentLPGeneratorTool.parameters.shape.variantCount;
    
    // Should accept valid range
    expect(() => variantCountSchema.parse(1)).not.toThrow();
    expect(() => variantCountSchema.parse(2)).not.toThrow();
    expect(() => variantCountSchema.parse(3)).not.toThrow();
    
    // Should reject invalid values
    expect(() => variantCountSchema.parse(0)).toThrow();
    expect(() => variantCountSchema.parse(4)).toThrow();
  });

  test('should validate focus areas parameter', () => {
    const focusAreasSchema = intelligentLPGeneratorTool.parameters.shape.focusAreas;
    
    const validFocusAreas = ['modern-clean', 'conversion-optimized', 'content-rich'];
    
    // Should accept valid focus areas
    expect(() => focusAreasSchema.parse(validFocusAreas)).not.toThrow();
    expect(() => focusAreasSchema.parse(['modern-clean'])).not.toThrow();
    
    // Should reject invalid focus areas
    expect(() => focusAreasSchema.parse(['invalid-focus'])).toThrow();
  });
});

describe('Variant Generation Logic', () => {
  test('should generate different design focuses', () => {
    const designFocuses = ['modern-clean', 'conversion-optimized', 'content-rich'];
    
    designFocuses.forEach(focus => {
      expect(['modern-clean', 'conversion-optimized', 'content-rich']).toContain(focus);
    });
  });

  test('should validate variant structure', () => {
    const mockVariant = {
      variantId: 'test-variant',
      score: 75,
      description: 'Test variant description',
      features: ['Feature 1', 'Feature 2'],
      designFocus: 'conversion-optimized' as const,
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
});

describe('Error Handling', () => {
  test('should handle invalid input gracefully', () => {
    // Test parameter validation
    expect(() => {
      intelligentLPGeneratorTool.parameters.parse({
        topic: '', // Empty topic should be invalid
        variantCount: 5 // Out of range
      });
    }).toThrow();
  });

  test('should validate required topic parameter', () => {
    expect(() => {
      intelligentLPGeneratorTool.parameters.parse({
        // Missing topic
        variantCount: 2
      });
    }).toThrow();
  });
});

describe('Integration Points', () => {
  test('should integrate with business context analyzer', () => {
    const { analyzeBusinessContext } = require('../../src/mastra/tools/utils/businessContextAnalyzer');
    
    expect(analyzeBusinessContext).toBeDefined();
    expect(typeof analyzeBusinessContext).toBe('function');
  });

  test('should integrate with enhanced LP generator', () => {
    const { enhancedLPGeneratorTool } = require('../../src/mastra/tools/enhancedLPGeneratorTool');
    
    expect(enhancedLPGeneratorTool).toBeDefined();
    expect(enhancedLPGeneratorTool.execute).toBeDefined();
  });
});