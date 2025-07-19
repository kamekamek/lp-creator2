// Polyfills for Jest testing environment

// TextEncoder/TextDecoder polyfill for Node.js
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock DOMPurify for server-side testing
global.DOMPurify = {
  sanitize: jest.fn((html, options) => {
    // More comprehensive mock implementation for testing
    let cleaned = html;
    
    // Remove script tags and their content
    cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
    
    // Remove dangerous event handlers but preserve the element
    cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s+on\w+\s*=\s*[^>\s]+/gi, '');
    
    // Remove javascript: URLs
    cleaned = cleaned.replace(/javascript:/gi, '');
    
    // Remove dangerous tags completely
    cleaned = cleaned.replace(/<iframe[\s\S]*?(?:<\/iframe>|>)/gi, '');
    cleaned = cleaned.replace(/<object[\s\S]*?(?:<\/object>|>)/gi, '');
    cleaned = cleaned.replace(/<embed[\s\S]*?(?:<\/embed>|>)/gi, '');
    cleaned = cleaned.replace(/<applet[\s\S]*?(?:<\/applet>|>)/gi, '');
    
    // Preserve safe attributes like aria-*, data-*, class, id, etc.
    // This is a simplified version - real DOMPurify is much more sophisticated
    
    return cleaned;
  })
};

// Mock window object for JSDOM tests
if (typeof window === 'undefined') {
  global.window = {};
}

// Mock performance API
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  };
}

// Mock requestFullscreen APIs
global.Element.prototype.requestFullscreen = jest.fn();
global.Element.prototype.webkitRequestFullscreen = jest.fn();
global.Element.prototype.mozRequestFullScreen = jest.fn();

global.document.exitFullscreen = jest.fn();
global.document.webkitExitFullscreen = jest.fn();
global.document.mozCancelFullScreen = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = jest.fn((...args) => {
  // Only show warnings that are not from our security system
  if (!args[0]?.includes?.('🔒') && !args[0]?.includes?.('Security')) {
    originalConsoleWarn(...args);
  }
});

console.error = jest.fn((...args) => {
  // Only show errors that are not from our security system
  if (!args[0]?.includes?.('🔒') && !args[0]?.includes?.('Security')) {
    originalConsoleError(...args);
  }
});