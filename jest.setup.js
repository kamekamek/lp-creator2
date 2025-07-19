import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock performance API
let mockTime = 0;
global.performance = {
  now: jest.fn(() => {
    mockTime += 150; // Increment by 150ms each call
    return mockTime;
  }),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
  getEntriesByType: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
}

// Mock DOMParser for Node.js environment
global.DOMParser = class DOMParser {
  parseFromString(str, type) {
    // Enhanced mock implementation
    const mockElements = [];
    
    // Extract elements with data-editable-id
    const editableMatches = str.match(/data-editable-id="([^"]+)"/g) || [];
    editableMatches.forEach((match, index) => {
      const id = match.match(/data-editable-id="([^"]+)"/)[1];
      const contentMatch = str.match(new RegExp(`data-editable-id="${id}"[^>]*>([^<]*)`));
      const content = contentMatch ? contentMatch[1] : '';
      
      mockElements.push({
        getAttribute: jest.fn((attr) => attr === 'data-editable-id' ? id : null),
        textContent: content,
        setAttribute: jest.fn(),
        parentNode: {
          insertBefore: jest.fn()
        }
      });
    });
    
    const doc = {
      documentElement: {
        outerHTML: str
      },
      querySelectorAll: jest.fn((selector) => {
        if (selector === '[data-editable-id]') {
          return mockElements;
        }
        return [];
      }),
      querySelector: jest.fn((selector) => {
        if (selector.includes('data-editable-id')) {
          return mockElements[0] || null;
        }
        return null;
      })
    }
    return doc
  }
}