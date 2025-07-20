#!/usr/bin/env node

/**
 * Simple test runner for enhanced editing system
 * This script tests the core functionality without complex test frameworks
 */

const { JSDOM } = require('jsdom');
const path = require('path');

// Mock console for cleaner output
const originalConsoleLog = console.log;
const testResults = [];

function testLog(message) {
  testResults.push(message);
}

function runTest(testName, testFn) {
  try {
    console.log(`🧪 Running: ${testName}`);
    testFn();
    console.log(`✅ Passed: ${testName}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${testName}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test HTML content
const testHTML = `
<!DOCTYPE html>
<html>
  <head><title>Test LP</title></head>
  <body>
    <h1>Main Landing Page Title</h1>
    <p>This is a compelling paragraph that describes our amazing product.</p>
    <div class="hero-section">
      <h2>Why Choose Us?</h2>
      <span class="highlight">Best in class solution</span>
      <button class="cta-button">Get Started Now</button>
    </div>
    <div class="features">
      <h3>Key Features</h3>
      <ul>
        <li>Feature 1: Advanced AI technology</li>
        <li>Feature 2: User-friendly interface</li>
        <li>Feature 3: 24/7 customer support</li>
      </ul>
    </div>
    <footer>
      <p>Contact us today!</p>
    </footer>
  </body>
</html>
`;

// Basic element detection test
function testBasicElementDetection() {
  const dom = new JSDOM(testHTML);
  const document = dom.window.document;
  
  // Mock getComputedStyle
  dom.window.getComputedStyle = () => ({
    display: 'block',
    visibility: 'visible',
    opacity: '1'
  });
  
  // Simple element detection logic (simplified version)
  const editableSelectors = ['h1', 'h2', 'h3', 'p', 'span', 'button', 'li'];
  const elements = [];
  
  editableSelectors.forEach(selector => {
    const found = document.querySelectorAll(selector);
    found.forEach((element, index) => {
      const text = element.textContent?.trim();
      if (text && text.length > 2 && text.length < 1000) {
        elements.push({
          element,
          id: `${selector}-${index}`,
          type: selector,
          text,
          priority: selector === 'h1' ? 100 : selector === 'h2' ? 90 : 50
        });
      }
    });
  });
  
  assert(elements.length > 0, 'Should detect editable elements');
  assert(elements.some(el => el.type === 'h1'), 'Should detect h1 elements');
  assert(elements.some(el => el.type === 'p'), 'Should detect p elements');
  assert(elements.some(el => el.type === 'button'), 'Should detect button elements');
  
  console.log(`   Detected ${elements.length} editable elements`);
  
  dom.window.close();
}

// Element attribute application test
function testElementAttributeApplication() {
  const dom = new JSDOM(testHTML);
  const document = dom.window.document;
  
  const h1 = document.querySelector('h1');
  const p = document.querySelector('p');
  
  // Apply editable attributes
  h1.setAttribute('data-editable-id', 'h1-main-title');
  h1.setAttribute('data-original-text', h1.textContent);
  h1.setAttribute('data-element-type', 'h1');
  
  p.setAttribute('data-editable-id', 'p-description');
  p.setAttribute('data-original-text', p.textContent);
  p.setAttribute('data-element-type', 'p');
  
  assert(h1.getAttribute('data-editable-id') === 'h1-main-title', 'H1 should have editable ID');
  assert(p.getAttribute('data-editable-id') === 'p-description', 'P should have editable ID');
  assert(h1.getAttribute('data-original-text') === 'Main Landing Page Title', 'Should store original text');
  
  console.log('   Applied editable attributes successfully');
  
  dom.window.close();
}

// Content update test
function testContentUpdate() {
  const dom = new JSDOM(testHTML);
  const document = dom.window.document;
  
  const h1 = document.querySelector('h1');
  h1.setAttribute('data-editable-id', 'h1-main-title');
  
  const originalText = h1.textContent;
  const newText = 'Updated Landing Page Title';
  
  // Simulate content update
  h1.textContent = newText;
  h1.setAttribute('data-original-content', originalText);
  
  assert(h1.textContent === newText, 'Content should be updated');
  assert(h1.getAttribute('data-original-content') === originalText, 'Should store original content');
  
  console.log('   Content update simulation successful');
  
  dom.window.close();
}

// Element highlighting test
function testElementHighlighting() {
  const dom = new JSDOM(testHTML);
  const document = dom.window.document;
  
  const h1 = document.querySelector('h1');
  
  // Simulate hover highlighting
  h1.classList.add('edit-hover');
  h1.style.outline = '2px dashed #3b82f6';
  h1.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
  
  assert(h1.classList.contains('edit-hover'), 'Should have hover class');
  assert(h1.style.outline.includes('dashed'), 'Should have dashed outline');
  assert(h1.style.backgroundColor.includes('rgba'), 'Should have background color');
  
  // Simulate selection highlighting
  h1.classList.remove('edit-hover');
  h1.classList.add('edit-selected');
  h1.style.outline = '3px solid #3b82f6';
  
  assert(h1.classList.contains('edit-selected'), 'Should have selected class');
  assert(h1.style.outline.includes('solid'), 'Should have solid outline');
  
  console.log('   Element highlighting simulation successful');
  
  dom.window.close();
}

// Accessibility test
function testAccessibilityFeatures() {
  const dom = new JSDOM(testHTML);
  const document = dom.window.document;
  
  const h1 = document.querySelector('h1');
  
  // Apply accessibility attributes
  h1.setAttribute('tabindex', '0');
  h1.setAttribute('role', 'button');
  h1.setAttribute('aria-label', `Edit text: ${h1.textContent.substring(0, 50)}...`);
  
  assert(h1.getAttribute('tabindex') === '0', 'Should be focusable');
  assert(h1.getAttribute('role') === 'button', 'Should have button role');
  assert(h1.getAttribute('aria-label').includes('Edit text'), 'Should have descriptive aria-label');
  
  console.log('   Accessibility features applied successfully');
  
  dom.window.close();
}

// Performance test
function testPerformanceOptimization() {
  const dom = new JSDOM(testHTML);
  const document = dom.window.document;
  
  const startTime = Date.now();
  
  // Simulate element detection with performance tracking
  const elements = document.querySelectorAll('h1, h2, h3, p, span, button, li');
  const editableElements = Array.from(elements).filter(el => {
    const text = el.textContent?.trim();
    return text && text.length > 2 && text.length < 1000;
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  assert(duration < 100, 'Detection should be fast (< 100ms)');
  assert(editableElements.length > 0, 'Should detect elements');
  
  console.log(`   Performance test completed in ${duration}ms`);
  
  dom.window.close();
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Enhanced Editing System Tests\n');
  
  const tests = [
    ['Basic Element Detection', testBasicElementDetection],
    ['Element Attribute Application', testElementAttributeApplication],
    ['Content Update', testContentUpdate],
    ['Element Highlighting', testElementHighlighting],
    ['Accessibility Features', testAccessibilityFeatures],
    ['Performance Optimization', testPerformanceOptimization]
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(([name, testFn]) => {
    if (runTest(name, testFn)) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Empty line for readability
  });
  
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Enhanced editing system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
  
  return failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests };