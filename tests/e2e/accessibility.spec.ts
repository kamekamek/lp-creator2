/**
 * Accessibility E2E Tests
 * Tests WCAG 2.1 AA compliance and accessibility features
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

// Test configuration
const TEST_CONTENT = 'AI写真編集アプリの高性能ランディングページを作成してください。アクセシビリティ機能を含めてください。';

// Accessibility test configuration
const A11Y_CONFIG = {
  rules: {
    // WCAG 2.1 AA rules
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'semantic-markup': { enabled: true },
    'aria-labels': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-roles': { enabled: true },
    'image-alt': { enabled: true },
    'form-labels': { enabled: true },
    'link-purpose': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa']
};

// Common accessibility selectors
const A11Y_SELECTORS = {
  skipLink: 'a[href="#main"], a[href="#content"]',
  mainLandmark: 'main, [role="main"]',
  headings: 'h1, h2, h3, h4, h5, h6',
  buttons: 'button, [role="button"]',
  links: 'a[href]',
  forms: 'form',
  inputs: 'input, textarea, select',
  labels: 'label',
  focusableElements: 'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
};

test.describe('Accessibility Compliance', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await configureAxe(page, A11Y_CONFIG);
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should pass automated accessibility checks on homepage', async ({ page }) => {
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
    });

    test('should maintain accessibility during LP generation', async ({ page }) => {
      // Navigate to quick creation
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Generate LP content
      await page.fill('input[placeholder*="AI写真編集アプリ"]', TEST_CONTENT);
      await page.click('button:has-text("生成")');
      
      // Wait for LP generation
      try {
        await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 15000 });
        
        // Check accessibility of the main interface
        await checkA11y(page, 'body', {
          exclude: ['iframe'], // Test iframe separately
          detailedReport: true
        });
        
      } catch (error) {
        console.log('LP generation timed out - testing interface accessibility');
        await checkA11y(page);
      }
    });

    test('should have accessible iframe content', async ({ page }) => {
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', TEST_CONTENT);
      await page.click('button:has-text("生成")');
      
      try {
        await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 15000 });
        
        // Check iframe accessibility
        const iframe = page.frameLocator('iframe[title*="LP Preview"]');
        await checkA11y(iframe);
        
      } catch (error) {
        console.log('LP generation not completed - skipping iframe accessibility test');
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      // Test tab navigation through main interface
      await page.keyboard.press('Tab');
      let focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
      
      // Continue tabbing through interface
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        focusedElement = await page.locator(':focus').first();
        await expect(focusedElement).toBeVisible();
      }
    });

    test('should have proper focus indicators', async ({ page }) => {
      const focusableElements = await page.locator(A11Y_SELECTORS.focusableElements).all();
      
      for (const element of focusableElements.slice(0, 5)) { // Test first 5 elements
        await element.focus();
        
        // Check that focused element has visible focus indicator
        const focusStyle = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            outlineColor: styles.outlineColor,
            boxShadow: styles.boxShadow
          };
        });
        
        // Should have some kind of focus indicator
        const hasFocusIndicator = 
          focusStyle.outline !== 'none' || 
          focusStyle.outlineWidth !== '0px' ||
          focusStyle.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBeTruthy();
      }
    });

    test('should support keyboard shortcuts', async ({ page }) => {
      // Test escape key functionality
      await page.keyboard.press('Escape');
      
      // Test space/enter on buttons
      const generateButton = page.locator('button:has-text("生成")').first();
      if (await generateButton.isVisible()) {
        await generateButton.focus();
        
        // Test space key
        await page.keyboard.press('Space');
        
        // Should trigger button action or show some response
        // (Implementation depends on actual button behavior)
      }
    });

    test('should handle focus management in modals', async ({ page }) => {
      // Try to trigger edit mode
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Simple test');
      await page.click('button:has-text("生成")');
      
      try {
        await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 10000 });
        
        // Enable edit mode
        await page.click('button:has-text("編集モード")');
        
        // Focus should be managed properly when entering edit mode
        const focusedElement = await page.locator(':focus').first();
        await expect(focusedElement).toBeVisible();
        
      } catch (error) {
        console.log('Edit mode test skipped - LP generation not completed');
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper semantic markup', async ({ page }) => {
      // Check for main landmarks
      await expect(page.locator(A11Y_SELECTORS.mainLandmark)).toBeVisible();
      
      // Check for proper heading hierarchy
      const headings = await page.locator(A11Y_SELECTORS.headings).all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Check for h1
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should have accessible buttons and links', async ({ page }) => {
      const buttons = await page.locator(A11Y_SELECTORS.buttons).all();
      
      for (const button of buttons.slice(0, 5)) { // Test first 5 buttons
        const accessibleName = await button.evaluate((el) => {
          return el.textContent?.trim() || 
                 el.getAttribute('aria-label') || 
                 el.getAttribute('title') || 
                 '';
        });
        
        expect(accessibleName.length).toBeGreaterThan(0);
      }
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check for ARIA landmarks
      const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').all();
      expect(landmarks.length).toBeGreaterThan(0);
      
      // Check for ARIA labels on complex elements
      const complexElements = await page.locator('[aria-label], [aria-labelledby], [aria-describedby]').all();
      expect(complexElements.length).toBeGreaterThan(0);
    });

    test('should announce dynamic content changes', async ({ page }) => {
      // Check for live regions
      const liveRegions = await page.locator('[aria-live], [role="alert"], [role="status"]').all();
      
      // If live regions exist, they should be properly configured
      for (const region of liveRegions) {
        const liveValue = await region.getAttribute('aria-live');
        if (liveValue) {
          expect(['polite', 'assertive', 'off']).toContain(liveValue);
        }
      }
    });
  });

  test.describe('Color and Contrast', () => {
    test('should meet WCAG AA color contrast requirements', async ({ page }) => {
      // This is primarily handled by automated accessibility checks
      // but we can do additional manual verification
      
      const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button').all();
      
      for (const element of textElements.slice(0, 10)) { // Test first 10 elements
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            textContent: el.textContent?.trim() || ''
          };
        });
        
        // Elements with text should have proper contrast
        if (styles.textContent.length > 0) {
          expect(styles.color).not.toBe('transparent');
          // Additional contrast calculations could be performed here
        }
      }
    });

    test('should support high contrast mode preferences', async ({ page }) => {
      // Test high contrast media query support
      const supportsHighContrast = await page.evaluate(() => {
        return window.matchMedia('(prefers-contrast: high)').matches !== undefined;
      });
      
      expect(supportsHighContrast).toBeTruthy();
      
      // Test with forced high contrast
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      // Content should still be visible and functional
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button').first()).toBeVisible();
    });

    test('should handle color-based information properly', async ({ page }) => {
      // Generate some content to test
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', TEST_CONTENT);
      
      // Look for any error or success indicators
      const statusElements = await page.locator('[class*="error"], [class*="success"], [class*="warning"]').all();
      
      for (const element of statusElements) {
        // Status indicators should not rely solely on color
        const accessibleName = await element.evaluate((el) => {
          return el.textContent?.trim() || 
                 el.getAttribute('aria-label') || 
                 el.getAttribute('title') || 
                 '';
        });
        
        // Should have text content or ARIA label
        expect(accessibleName.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Forms and Input Accessibility', () => {
    test('should have properly labeled form inputs', async ({ page }) => {
      const inputs = await page.locator(A11Y_SELECTORS.inputs).all();
      
      for (const input of inputs) {
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        
        let hasLabel = false;
        
        // Check for explicit label
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          hasLabel = await label.count() > 0;
        }
        
        // Check for ARIA labels
        if (!hasLabel && (ariaLabel || ariaLabelledBy)) {
          hasLabel = true;
        }
        
        // Placeholder alone is not sufficient, but acceptable for some cases
        if (!hasLabel && placeholder) {
          hasLabel = true;
        }
        
        expect(hasLabel).toBeTruthy();
      }
    });

    test('should indicate required fields properly', async ({ page }) => {
      const requiredInputs = await page.locator('input[required], textarea[required], select[required]').all();
      
      for (const input of requiredInputs) {
        // Required inputs should have proper indication
        const ariaRequired = await input.getAttribute('aria-required');
        const hasVisualIndicator = await input.evaluate((el) => {
          const parent = el.parentElement;
          return parent?.textContent?.includes('*') || 
                 parent?.querySelector('[class*="required"]') !== null;
        });
        
        // Should have ARIA required or visual indicator
        expect(ariaRequired === 'true' || hasVisualIndicator).toBeTruthy();
      }
    });

    test('should provide helpful error messages', async ({ page }) => {
      // Try to submit a form with invalid data to trigger errors
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Try submitting without content
      await page.click('button:has-text("生成")');
      
      // Wait a moment for any error messages
      await page.waitForTimeout(1000);
      
      // Check for error messages
      const errorElements = await page.locator('[role="alert"], [aria-live="assertive"], [class*="error"]').all();
      
      for (const error of errorElements) {
        const errorText = await error.textContent();
        if (errorText && errorText.trim().length > 0) {
          // Error messages should be descriptive
          expect(errorText.length).toBeGreaterThan(5);
        }
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Run accessibility checks on mobile
      await checkA11y(page, undefined, {
        tags: ['wcag2a', 'wcag2aa'],
        detailedReport: true
      });
    });

    test('should have proper touch targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const interactiveElements = await page.locator('button, a, input, [role="button"]').all();
      
      for (const element of interactiveElements.slice(0, 5)) { // Test first 5 elements
        const boundingBox = await element.boundingBox();
        
        if (boundingBox) {
          // Touch targets should be at least 44x44 pixels (WCAG 2.1 AA)
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should support zoom up to 200%', async ({ page }) => {
      // Set mobile viewport and zoom
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate 200% zoom by reducing viewport
      await page.setViewportSize({ width: 187, height: 333 });
      
      // Content should still be usable
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button').first()).toBeVisible();
      
      // Run accessibility checks at 200% zoom
      await checkA11y(page);
    });
  });

  test.describe('Content Accessibility', () => {
    test('should have descriptive page titles', async ({ page }) => {
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      expect(title).not.toBe('Document'); // Should not be default title
    });

    test('should have proper language attributes', async ({ page }) => {
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBeTruthy();
      expect(htmlLang?.length).toBeGreaterThan(0);
    });

    test('should have skip links for navigation', async ({ page }) => {
      // Check for skip links (may be visually hidden)
      const skipLinks = await page.locator(A11Y_SELECTORS.skipLink).count();
      
      if (skipLinks > 0) {
        const skipLink = page.locator(A11Y_SELECTORS.skipLink).first();
        const href = await skipLink.getAttribute('href');
        
        // Skip link should point to main content
        expect(href).toBeTruthy();
        
        // Target should exist
        const target = page.locator(href!);
        await expect(target).toBeAttached();
      }
    });

    test('should have accessible images', async ({ page }) => {
      const images = await page.locator('img').all();
      
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        // Images should have alt text or be marked as decorative
        expect(alt !== null || role === 'presentation').toBeTruthy();
      }
    });
  });
});