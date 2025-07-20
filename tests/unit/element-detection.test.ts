/**
 * Unit tests for element detection and DOM manipulation in the editing system
 */

import { JSDOM } from 'jsdom';

// Mock DOM environment for testing
const createMockDOM = (htmlContent: string) => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${htmlContent}</body></html>`);
  return dom.window.document;
};

// Element detection utility function (extracted from LPViewer logic)
const detectEditableElements = (doc: Document) => {
  const textElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a');
  const editableElements: HTMLElement[] = [];
  
  textElements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;
    const textContent = htmlElement.textContent?.trim();
    
    // Only consider elements with meaningful text content
    if (textContent && textContent.length > 0 && textContent.length < 500) {
      // Skip if already has data-editable-id
      if (!htmlElement.hasAttribute('data-editable-id')) {
        // Generate unique ID based on element type and content
        const elementType = htmlElement.tagName.toLowerCase();
        const contentHash = textContent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
        const editableId = `${elementType}-${contentHash}-${index}`;
        htmlElement.setAttribute('data-editable-id', editableId);
      }
      editableElements.push(htmlElement);
    }
  });
  
  return editableElements;
};

// Text extraction utility
const extractTextFromElement = (doc: Document, elementId: string): string => {
  try {
    const element = doc.querySelector(`[data-editable-id="${elementId}"]`);
    if (element) {
      return element.textContent?.trim() || '';
    }
  } catch (error) {
    console.error('Error extracting text from element:', error);
  }
  return '';
};

// DOM update utility
const updateElementText = (doc: Document, elementId: string, newText: string): boolean => {
  try {
    const element = doc.querySelector(`[data-editable-id="${elementId}"]`);
    if (element) {
      element.textContent = newText;
      return true;
    }
  } catch (error) {
    console.error('Error updating element text:', error);
  }
  return false;
};

describe('Element Detection System', () => {
  test('should detect editable elements in HTML content', () => {
    const htmlContent = `
      <div>
        <h1>Main Title</h1>
        <p>This is a paragraph with some content.</p>
        <button>Click Me</button>
        <span>Small text</span>
        <div></div>
        <p></p>
      </div>
    `;
    
    const doc = createMockDOM(htmlContent);
    const editableElements = detectEditableElements(doc);
    
    // Should detect h1, p, button, and span (not empty div and p)
    expect(editableElements.length).toBe(4);
    
    // Check that data-editable-id attributes are added
    editableElements.forEach(element => {
      expect(element.hasAttribute('data-editable-id')).toBe(true);
      const id = element.getAttribute('data-editable-id');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^(h1|p|button|span)-/);
    });
  });

  test('should generate unique IDs for elements', () => {
    const htmlContent = `
      <div>
        <h1>Title One</h1>
        <h1>Title Two</h1>
        <p>Paragraph One</p>
        <p>Paragraph Two</p>
      </div>
    `;
    
    const doc = createMockDOM(htmlContent);
    const editableElements = detectEditableElements(doc);
    
    expect(editableElements.length).toBe(4);
    
    // Check that all IDs are unique
    const ids = editableElements.map(el => el.getAttribute('data-editable-id'));
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('should skip elements with very long text content', () => {
    const longText = 'A'.repeat(600); // Longer than 500 character limit
    const htmlContent = `
      <div>
        <h1>Normal Title</h1>
        <p>${longText}</p>
        <p>Normal paragraph</p>
      </div>
    `;
    
    const doc = createMockDOM(htmlContent);
    const editableElements = detectEditableElements(doc);
    
    // Should detect h1 and normal paragraph, but not the long text paragraph
    expect(editableElements.length).toBe(2);
    
    const texts = editableElements.map(el => el.textContent?.trim());
    expect(texts).toContain('Normal Title');
    expect(texts).toContain('Normal paragraph');
    expect(texts).not.toContain(longText);
  });

  test('should skip empty elements', () => {
    const htmlContent = `
      <div>
        <h1>Title</h1>
        <p></p>
        <span>   </span>
        <div>Content</div>
        <button></button>
      </div>
    `;
    
    const doc = createMockDOM(htmlContent);
    const editableElements = detectEditableElements(doc);
    
    // Should only detect h1 and div with content
    expect(editableElements.length).toBe(2);
    
    const texts = editableElements.map(el => el.textContent?.trim());
    expect(texts).toContain('Title');
    expect(texts).toContain('Content');
  });

  test('should preserve existing data-editable-id attributes', () => {
    const htmlContent = `
      <div>
        <h1 data-editable-id="custom-title">Title</h1>
        <p>Paragraph</p>
      </div>
    `;
    
    const doc = createMockDOM(htmlContent);
    const editableElements = detectEditableElements(doc);
    
    expect(editableElements.length).toBe(2);
    
    const h1Element = editableElements.find(el => el.tagName === 'H1');
    expect(h1Element?.getAttribute('data-editable-id')).toBe('custom-title');
  });
});

describe('Text Extraction and Updates', () => {
  test('should extract text from elements by ID', () => {
    const htmlContent = `
      <div>
        <h1 data-editable-id="title-1">Main Title</h1>
        <p data-editable-id="para-1">This is a paragraph.</p>
      </div>
    `;
    
    const doc = createMockDOM(htmlContent);
    
    const titleText = extractTextFromElement(doc, 'title-1');
    const paraText = extractTextFromElement(doc, 'para-1');
    
    expect(titleText).toBe('Main Title');
    expect(paraText).toBe('This is a paragraph.');
  });

  test('should return empty string for non-existent elements', () => {
    const htmlContent = `<div><h1>Title</h1></div>`;
    const doc = createMockDOM(htmlContent);
    
    const text = extractTextFromElement(doc, 'non-existent-id');
    expect(text).toBe('');
  });

  test('should update element text content', () => {
    const htmlContent = `
      <div>
        <h1 data-editable-id="title-1">Original Title</h1>
        <p data-editable-id="para-1">Original paragraph.</p>
      </div>
    `;
    
    const doc = createMockDOM(htmlContent);
    
    const titleUpdated = updateElementText(doc, 'title-1', 'Updated Title');
    const paraUpdated = updateElementText(doc, 'para-1', 'Updated paragraph.');
    
    expect(titleUpdated).toBe(true);
    expect(paraUpdated).toBe(true);
    
    // Verify the updates
    const newTitleText = extractTextFromElement(doc, 'title-1');
    const newParaText = extractTextFromElement(doc, 'para-1');
    
    expect(newTitleText).toBe('Updated Title');
    expect(newParaText).toBe('Updated paragraph.');
  });

  test('should handle update failures gracefully', () => {
    const htmlContent = `<div><h1>Title</h1></div>`;
    const doc = createMockDOM(htmlContent);
    
    const updated = updateElementText(doc, 'non-existent-id', 'New Text');
    expect(updated).toBe(false);
  });

  test('should handle special characters in text content', () => {
    const htmlContent = `
      <div>
        <h1 data-editable-id="title-1">Title with "quotes" & symbols</h1>
        <p data-editable-id="para-1">Paragraph with <em>HTML</em> entities</p>
      </div>
    `;
    
    const doc = createMockDOM(htmlContent);
    
    const titleText = extractTextFromElement(doc, 'title-1');
    const paraText = extractTextFromElement(doc, 'para-1');
    
    expect(titleText).toBe('Title with "quotes" & symbols');
    expect(paraText).toBe('Paragraph with HTML entities');
    
    // Test updating with special characters
    const newText = 'Updated with émojis 🎉 and symbols @#$%';
    const updated = updateElementText(doc, 'title-1', newText);
    
    expect(updated).toBe(true);
    
    const updatedText = extractTextFromElement(doc, 'title-1');
    expect(updatedText).toBe(newText);
  });
});

describe('DOM Manipulation Edge Cases', () => {
  test('should handle malformed HTML gracefully', () => {
    const malformedHTML = `
      <div>
        <h1>Title
        <p>Unclosed paragraph
        <span>Text</span>
      </div>
    `;
    
    const doc = createMockDOM(malformedHTML);
    
    // Should not throw errors
    expect(() => {
      const elements = detectEditableElements(doc);
      expect(elements.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  test('should handle deeply nested elements', () => {
    const nestedHTML = `
      <div>
        <section>
          <article>
            <header>
              <h1>Deep Title</h1>
            </header>
            <div>
              <p>Deep paragraph</p>
            </div>
          </article>
        </section>
      </div>
    `;
    
    const doc = createMockDOM(nestedHTML);
    const editableElements = detectEditableElements(doc);
    
    expect(editableElements.length).toBe(2);
    
    const texts = editableElements.map(el => el.textContent?.trim());
    expect(texts).toContain('Deep Title');
    expect(texts).toContain('Deep paragraph');
  });

  test('should handle elements with mixed content', () => {
    const mixedHTML = `
      <div>
        <h1>Title with <strong>bold</strong> text</h1>
        <p>Paragraph with <a href="#">link</a> and <em>emphasis</em></p>
      </div>
    `;
    
    const doc = createMockDOM(mixedHTML);
    const editableElements = detectEditableElements(doc);
    
    expect(editableElements.length).toBe(2);
    
    const titleText = editableElements[0].textContent?.trim();
    const paraText = editableElements[1].textContent?.trim();
    
    expect(titleText).toBe('Title with bold text');
    expect(paraText).toBe('Paragraph with link and emphasis');
  });

  test('should maintain element structure during updates', () => {
    const htmlContent = `
      <div>
        <h1 data-editable-id="title-1" class="main-title" style="color: blue;">
          Original Title
        </h1>
      </div>
    `;
    
    const doc = createMockDOM(htmlContent);
    const element = doc.querySelector('[data-editable-id="title-1"]') as HTMLElement;
    
    // Store original attributes
    const originalClass = element.className;
    const originalStyle = element.getAttribute('style');
    
    // Update text
    updateElementText(doc, 'title-1', 'New Title');
    
    // Verify attributes are preserved
    expect(element.className).toBe(originalClass);
    expect(element.getAttribute('style')).toBe(originalStyle);
    expect(element.textContent).toBe('New Title');
  });
});