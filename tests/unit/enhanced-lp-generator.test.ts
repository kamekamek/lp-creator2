/**
 * LP Creator Platform - Enhanced LP Generator Tests
 */

import { enhancedLPGeneratorTool } from '../../src/mastra/tools/enhancedLPGeneratorTool';
import { analyzeBusinessContext } from '../../src/mastra/tools/utils/businessContextAnalyzer';
import { applyPasonaFormula, apply4UPrinciple } from '../../src/mastra/tools/utils/lpToolHelpers';

// Mock dependencies
jest.mock('../../src/mastra/tools/lpGeneratorTool', () => ({
  generateUnifiedLP: jest.fn().mockResolvedValue({
    htmlContent: '<div>Mock HTML Content</div>',
    cssContent: 'body { color: black; }',
    structure: { title: 'Mock LP', sections: [] },
    metadata: { generationTime: 1000 }
  })
}));

jest.mock('../../src/mastra/tools/utils/businessContextAnalyzer');
jest.mock('../../src/mastra/tools/utils/lpToolHelpers', () => ({
  sanitizeHTML: jest.fn((html) => html),
  handleAIError: jest.fn(() => ({ action: 'retry', message: 'Mock error handling' })),
  applyPasonaFormula: jest.fn((content) => `PASONA: ${content}`),
  apply4UPrinciple: jest.fn((content) => `4U: ${content}`),
  enhanceAccessibility: jest.fn((html) => html),
  monitorPerformance: jest.fn(() => ({
    end: jest.fn(() => ({ duration: 1000 }))
  }))
}));

const mockAnalyzeBusinessContext = analyzeBusinessContext as jest.MockedFunction<typeof analyzeBusinessContext>;
const mockApplyPasonaFormula = applyPasonaFormula as jest.MockedFunction<typeof applyPasonaFormula>;
const mockApply4UPrinciple = apply4UPrinciple as jest.MockedFunction<typeof apply4UPrinciple>;

describe('Enhanced LP Generator Tool', () => {
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
    
    mockApplyPasonaFormula.mockReturnValue('Enhanced topic with PASONA');
    mockApply4UPrinciple.mockReturnValue('Enhanced topic with 4U');
  });

  test('should generate LP with marketing psychology applied', async () => {
    const result = await enhancedLPGeneratorTool.execute({
      topic: 'AIを活用したクラウドソフトウェア',
      useMarketingPsychology: { pasona: true, fourU: true }
    });

    expect(result.success).toBe(true);
    expect(result.htmlContent).toContain('Mock HTML Content');
    expect(result.metadata.version).toBe('3.0-enhanced-marketing');
    expect(mockAnalyzeBusinessContext).toHaveBeenCalledWith('AIを活用したクラウドソフトウェア');
    expect(mockApplyPasonaFormula).toHaveBeenCalled();
    expect(mockApply4UPrinciple).toHaveBeenCalled();
  });

  test('should use manual parameters over auto-analyzed context', async () => {
    const result = await enhancedLPGeneratorTool.execute({
      topic: 'テストサービス',
      targetAudience: '個人事業主',
      businessGoal: '売上向上',
      industry: 'consulting',
      competitiveAdvantage: '24時間サポート'
    });

    expect(result.success).toBe(true);
    expect(result.metadata.targetAudience).toBe('個人事業主');
    expect(result.metadata.businessGoal).toBe('売上向上');
    expect(result.metadata.industry).toBe('consulting');
    expect(result.metadata.competitiveAdvantage).toBe('24時間サポート');
  });

  test('should handle PASONA formula only', async () => {
    const result = await enhancedLPGeneratorTool.execute({
      topic: 'テストLP',
      useMarketingPsychology: { pasona: true, fourU: false }
    });

    expect(result.success).toBe(true);
    expect(mockApplyPasonaFormula).toHaveBeenCalled();
    expect(mockApply4UPrinciple).not.toHaveBeenCalled();
  });

  test('should handle 4U principle only', async () => {
    const result = await enhancedLPGeneratorTool.execute({
      topic: 'テストLP',
      useMarketingPsychology: { pasona: false, fourU: true }
    });

    expect(result.success).toBe(true);
    expect(mockApplyPasonaFormula).not.toHaveBeenCalled();
    expect(mockApply4UPrinciple).toHaveBeenCalled();
  });

  test('should disable marketing psychology when requested', async () => {
    const result = await enhancedLPGeneratorTool.execute({
      topic: 'テストLP',
      useMarketingPsychology: { pasona: false, fourU: false }
    });

    expect(result.success).toBe(true);
    expect(mockApplyPasonaFormula).not.toHaveBeenCalled();
    expect(mockApply4UPrinciple).not.toHaveBeenCalled();
  });

  test('should use default marketing psychology settings', async () => {
    const result = await enhancedLPGeneratorTool.execute({
      topic: 'テストLP'
    });

    expect(result.success).toBe(true);
    expect(mockApplyPasonaFormula).toHaveBeenCalled();
    expect(mockApply4UPrinciple).toHaveBeenCalled();
  });

  test('should include business context in metadata', async () => {
    const result = await enhancedLPGeneratorTool.execute({
      topic: 'SaaSプラットフォーム'
    });

    expect(result.success).toBe(true);
    expect(result.metadata.businessContext).toBeDefined();
    expect(result.metadata.businessContext?.industry).toBe('saas');
    expect(result.metadata.businessContext?.targetAudience).toBe('中小企業');
    expect(result.metadata.businessContext?.businessGoal).toBe('リード獲得');
  });

  test('should handle different design styles', async () => {
    const designStyles = ['modern', 'minimalist', 'corporate', 'creative', 'tech', 'startup'] as const;
    
    for (const style of designStyles) {
      const result = await enhancedLPGeneratorTool.execute({
        topic: 'テストLP',
        designStyle: style
      });

      expect(result.success).toBe(true);
      expect(result.metadata.designStyle).toBe(style);
    }
  });

  test('should generate enhanced topic with context information', async () => {
    const result = await enhancedLPGeneratorTool.execute({
      topic: 'テストサービス',
      targetAudience: '中小企業経営者',
      businessGoal: 'リード獲得',
      industry: 'consulting',
      competitiveAdvantage: '専門知識'
    });

    expect(result.success).toBe(true);
    expect(result.metadata.enhancedTopic).toContain('テストサービス');
    expect(result.metadata.enhancedTopic).toContain('中小企業経営者');
    expect(result.metadata.enhancedTopic).toContain('リード獲得');
    expect(result.metadata.enhancedTopic).toContain('consulting');
    expect(result.metadata.enhancedTopic).toContain('専門知識');
  });
});