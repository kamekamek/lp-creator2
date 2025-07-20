/**
 * Unit tests for enhanced element detection utilities
 */

import { JSDOM } from 'jsdom';
import {
  detectEditableElements,
  detectEditableElementsOptimized,
  applyEditableAttributes,
  removeEditableAttributes,
  applyElementHighlight,
  clearAllHighlights,
  updateElementContent,
  batchUpdateElements,
  validateEditableElement,
  type EditableElementInfo,
  type ElementHighlightInfo
} from '../../src/utils/elementDetection';

describe('Enhanced Element Detection Utilities', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <h1>Main Title</h1>
          <p>This is a paragraph with some text content.</p>
          <div class="content">
            <h2>Subtitle</h2>
            <span>Short text</span>
            <button>Click me</button>
          </div>
          <div class="no-edit">Should not be editable</div>
          <script>console.log('script');</script>
          <style>.test { color: red; }</style>
        </body>
      </html>
    `);
    document = dom.window.document;
    
    // Mock window and getComputedStyle for JSDOM
    (global as any).window = dom.window;
    (global as any).document = document;
    dom.window.getComputedStyle = jest.fn().mockReturnValue({
      display: 'block',
      visibility: 'visible',
      opacity: '1'
    });
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('detectEditableElements', () => {
    test('should detect basic editable elements', () => {
      const elements = detectEditableElements(document);
      
      expect(elements.length).toBeGreaterThan(0);
      
      // Should find h1, p, h2, span, button
      const elementTypes = elements.map(el => el.type);
      expect(elementTypes).toContain('h1');
      expect(elementTypes).toContain('p');
      expect(elementTypes).toContain('h2');
      expect(elementTypes).toContain('span');
      expect(elementTypes).toContain('button');
    });

    test('should exclude script and style elements', () => {
      const elements = detectEditableElements(document);
      
      const elementTypes = elements.map(el => el.type);
      expect(elementTypes).not.toContain('script');
      expect(elementTypes).not.toContain('style');
    });

    test('should respect custom exclude selectors', () => {
      const elements = detectEditableElements(document, {
        excludeSelectors: ['script', 'style', '.no-edit']
      });
      
      // Should not find elements with .no-edit class
      const noEditElements = elements.filter(el => 
        el.element.classList.contains('no-edit')
      );
      expect(noEditElements.length).toBe(0);
    });

    test('should prioritize headings when enabled', () => {
      const elements = detectEditableElements(document, {
        prioritizeHeadings: true
      });
      
      // H1 should have higher priority than other elements
      const h1Element = elements.find(el => el.type === 'h1');
      const pElement = elements.find(el => el.type === 'p');
      
      expect(h1Element).toBeTruthy();
      expect(pElement).toBeTruthy();
      expect(h1Element!.priority).toBeGreaterThan(pElement!.priority);
    });

    test('should calculate element depth correctly', () => {
      const elements = detectEditableElements(document);
      
      // H2 inside div should have greater depth than H1
      const h1Element = elements.find(el => el.type === 'h1');
      const h2Element = elements.find(el => el.type === 'h2');
      
      expect(h1Element).toBeTruthy();
      expect(h2Element).toBeTruthy();
      expect(h2Element!.depth).toBeGreaterThan(h1Element!.depth);
    });
  });

  describe('detectEditableElementsOptimized', () => {
    test('should provide performance metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const elements = detectEditableElementsOptimized(document);
      
      expect(elements.length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Element detection completed in')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('applyEditableAttributes', () => {
    test('should apply data attributes to elements', () => {
      const elements = detectEditableElements(document);
      applyEditableAttributes(elements);
      
      elements.forEach(elementInfo => {
        const element = elementInfo.element;
        expect(element.getAttribute('data-editable-id')).toBe(elementInfo.id);
        expect(element.getAttribute('data-original-text')).toBe(elementInfo.text);
        expect(element.getAttribute('data-element-type')).toBe(elementInfo.type);
      });
    });
  });

  describe('removeEditableAttributes', () => {
    test('should remove all editable attributes', () => {
      const elements = detectEditableElements(document);
      applyEditableAttributes(elements);
      
      // Verify attributes are applied
      const h1 = document.querySelector('h1');
      expect(h1?.getAttribute('data-editable-id')).toBeTruthy();
      
      // Remove attributes
      removeEditableAttributes(document);
      
      // Verify attributes are removed
      expect(h1?.getAttribute('data-editable-id')).toBeNull();
      expect(h1?.getAttribute('data-original-text')).toBeNull();
      expect(h1?.getAttribute('data-element-type')).toBeNull();
    });
  });

  describe('applyElementHighlight', () => {
    test('should apply hover highlighting', () => {
      const h1 = document.querySelector('h1') as HTMLElement;
      const highlightInfo: ElementHighlightInfo = {
        elementId: 'test-id',
        isHovered: true,
        isSelected: false,
        isEditing: false,
        highlightColor: '#3b82f6',
        zIndex: 10
      };
      
      applyElementHighlight(h1, highlightInfo);
      
      expect(h1.classList.contains('edit-hover')).toBe(true);
      expect(h1.style.outline).toContain('dashed');
      expect(h1.style.backgroundColor).toContain('rgba');
    });

    test('should apply selection highlighting', () => {
      const h1 = document.querySelector('h1') as HTMLElement;
      const highlightInfo: ElementHighlightInfo = {
        elementId: 'test-id',
        isHovered: false,
        isSelected: true,
        isEditing: false,
        highlightColor: '#3b82f6',
        zIndex: 10
      };
      
      applyElementHighlight(h1, highlightInfo);
      
      expect(h1.classList.contains('edit-selected')).toBe(true);
      expect(h1.style.outline).toContain('solid');
    });

    test('should apply editing highlighting', () => {
      const h1 = document.querySelector('h1') as HTMLElement;
      const highlightInfo: ElementHighlightInfo = {
        elementId: 'test-id',
        isHovered: false,
        isSelected: false,
        isEditing: true,
        highlightColor: '#10b981',
        zIndex: 10
      };
      
      applyElementHighlight(h1, highlightInfo);
      
      expect(h1.classList.contains('edit-editing')).toBe(true);
      expect(h1.style.outline).toContain('#10b981');
    });
  });

  describe('clearAllHighlights', () => {
    test('should remove all highlight classes and styles', () => {
      const h1 = document.querySelector('h1') as HTMLElement;
      const p = document.querySelector('p') as HTMLElement;
      
      // Apply highlights
      h1.classList.add('edit-hover');
      p.classList.add('edit-selected');
      h1.style.outline = '2px solid red';
      p.style.backgroundColor = 'yellow';
      
      clearAllHighlights(document);
      
      expect(h1.classList.contains('edit-hover')).toBe(false);
      expect(p.classList.contains('edit-selected')).toBe(false);
      expect(h1.style.outline).toBe('');
      expect(p.style.backgroundColor).toBe('');
    });
  });

  describe('updateElementContent', () => {
    test('should update element content immediately', () => {
      const h1 = document.querySelector('h1') as HTMLElement;
      h1.setAttribute('data-editable-id', 'test-h1');
      
      const success = updateElementContent(document, 'test-h1', 'New Title');
      
      expect(success).toBe(true);
      expect(h1.textContent).toBe('New Title');
      expect(h1.getAttribute('data-original-content')).toBe('Main Title');
    });

    test('should return false for non-existent elements', () => {
      const success = updateElementContent(document, 'non-existent', 'New Text');
      expect(success).toBe(false);
    });
  });

  describe('batchUpdateElements', () => {
    test('should update multiple elements', () => {
      const h1 = document.querySelector('h1') as HTMLElement;
      const p = document.querySelector('p') as HTMLElement;
      
      h1.setAttribute('data-editable-id', 'test-h1');
      p.setAttribute('data-editable-id', 'test-p');
      
      const updates = [
        { elementId: 'test-h1', content: 'Updated Title' },
        { elementId: 'test-p', content: 'Updated paragraph' },
        { elementId: 'non-existent', content: 'Should fail' }
      ];
      
      const result = batchUpdateElements(document, updates);
      
      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
      expect(h1.textContent).toBe('Updated Title');
      expect(p.textContent).toBe('Updated paragraph');
    });
  });

  describe('validateEditableElement', () => {
    test('should validate connected elements with text', () => {
      const h1 = document.querySelector('h1') as HTMLElement;
      const result = validateEditableElement(h1);
      
      expect(result.isValid).toBe(true);
      expect(result.reasons.length).toBe(0);
    });

    test('should invalidate elements without text', () => {
      const emptyDiv = document.createElement('div');
      document.body.appendChild(emptyDiv);
      
      const result = validateEditableElement(emptyDiv);
      
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('Element has no text content');
    });

    test('should invalidate script elements', () => {
      const script = document.querySelector('script') as HTMLElement;
      const result = validateEditableElement(script);
      
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('Element is in excluded container');
    });
  });
});