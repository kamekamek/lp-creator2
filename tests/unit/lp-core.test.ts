/**
 * LP Creator Platform - Core Interfaces and Utilities Tests
 */

import { 
  handleAIError, 
  sanitizeHTML, 
  handlePerformanceError, 
  handleSecurityError,
  extractEditableElements,
  updateElementText
} from '../../src/mastra/tools/utils/lpToolHelpers';
import { 
  AIGenerationError, 
  SecurityError, 
  PerformanceError 
} from '../../src/types/lp-core';

describe('LP Core Error Handling', () => {
  test('handleAIError should return appropriate action for model_timeout', () => {
    const error: AIGenerationError = {
      type: 'model_timeout',
      message: 'Model processing timed out',
      retryable: true,
      timestamp: new Date()
    };
    
    const result = handleAIError(error);
    expect(result.action).toBe('retry');
    expect(result.fallbackModel).toBe('gpt-3.5-turbo');
  });
  
  test('handleAIError should return appropriate action for rate_limit', () => {
    const error: AIGenerationError = {
      type: 'rate_limit',
      message: 'Rate limit exceeded',
      retryable: true,
      retryAfter: 30000,
      timestamp: new Date()
    };
    
    const result = handleAIError(error);
    expect(result.action).toBe('queue');
    expect(result.delay).toBe(30000);
  });
  
  test('handleSecurityError should block for high severity issues', () => {
    const error: SecurityError = {
      type: 'script_injection',
      element: '<script>alert("XSS")</script>',
      severity: 'high',
      timestamp: new Date()
    };
    
    const result = handleSecurityError(error);
    expect(result.action).toBe('block');
  });
  
  test('handlePerformanceError should handle large content appropriately', () => {
    const error: PerformanceError = {
      type: 'large_content',
      threshold: 100000,
      current: 150000,
      timestamp: new Date()
    };
    
    const result = handlePerformanceError(error);
    expect(result.action).toBe('chunk_processing');
    expect(result.chunkSize).toBe(50000);
  });
});

describe('HTML Processing Utilities', () => {
  test('sanitizeHTML should remove dangerous scripts', () => {
    const dangerousHtml = '<div>Safe content</div><script>alert("XSS")</script>';
    const sanitized = sanitizeHTML(dangerousHtml);
    
    expect(sanitized).toContain('<div>Safe content</div>');
    expect(sanitized).not.toContain('<script>');
  });
  
  test('extractEditableElements should find elements with data-editable-id', () => {
    const html = `
      <div>
        <h1 data-editable-id="title">Hello World</h1>
        <p data-editable-id="description">This is a test</p>
        <div>Non-editable content</div>
      </div>
    `;
    
    const elements = extractEditableElements(html);
    expect(elements.length).toBe(2);
    expect(elements[0].id).toBe('title');
    expect(elements[0].content).toBe('Hello World');
    expect(elements[1].id).toBe('description');
    expect(elements[1].content).toBe('This is a test');
  });
  
  test('updateElementText should update text of element with specific data-editable-id', () => {
    const html = `
      <div>
        <h1 data-editable-id="title">Hello World</h1>
        <p data-editable-id="description">This is a test</p>
      </div>
    `;
    
    const updated = updateElementText(html, 'title', 'New Title');
    expect(updated).toContain('New Title');
    expect(updated).toContain('This is a test');
  });
});

describe('Performance Monitoring', () => {
  let originalPerformance: any;

  beforeEach(() => {
    originalPerformance = global.performance;
    global.performance = {
      now: jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(150)
    } as any;
  });

  afterEach(() => {
    global.performance = originalPerformance;
  });

  test('monitorPerformance should track execution time', () => {
    const { monitorPerformance } = require('../../src/mastra/tools/utils/lpToolHelpers');
    const monitor = monitorPerformance();
    const result = monitor.end();
    
    expect(result.duration).toBe(150);
    expect(result.isWithinThreshold(200)).toBe(true);
    expect(result.isWithinThreshold(100)).toBe(false);
  });
});