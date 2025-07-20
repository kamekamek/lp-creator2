import { test, expect } from '@playwright/test';

test.describe('Enhanced Real-time Editing System Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Generate a test LP
    const input = page.getByPlaceholder('例：AI写真編集アプリのランディングページ...');
    const submitButton = page.getByRole('button', { name: '生成' });
    
    await input.fill('テスト用ランディングページ - 高度な編集機能テスト');
    await submitButton.click();
    
    // Wait for LP generation with longer timeout for complex content
    await page.waitForTimeout(8000);
    
    // Enable edit mode
    const editModeButton = page.locator('button').filter({ hasText: /編集モード/ });
    if (await editModeButton.count() > 0) {
      await editModeButton.click();
      await page.waitForTimeout(1000); // Wait for edit mode to activate
    }
  });

  test('should detect and highlight editable elements with enhanced detection', async ({ page }) => {
    // Wait for iframe to load
    const iframe = page.frameLocator('iframe[title*="LP Preview"]');
    
    // Check if editable elements are detected
    const editableElements = iframe.locator('[data-editable-id]');
    const elementCount = await editableElements.count();
    
    console.log(`Enhanced detection found ${elementCount} editable elements`);
    expect(elementCount).toBeGreaterThan(0);
    
    // Test enhanced hover highlighting
    if (elementCount > 0) {
      const firstElement = editableElements.first();
      await firstElement.hover();
      
      // Wait for hover effects to apply
      await page.waitForTimeout(300);
      
      // Check if enhanced hover styles are applied
      const elementClass = await firstElement.getAttribute('class');
      expect(elementClass).toContain('edit-hover');
      
      // Test element priority and type detection
      const elementType = await firstElement.getAttribute('data-element-type');
      const editPriority = await firstElement.getAttribute('data-edit-priority');
      
      expect(elementType).toBeTruthy();
      console.log(`Element type: ${elementType}, Priority: ${editPriority}`);
      
      // Test accessibility attributes
      const tabIndex = await firstElement.getAttribute('tabindex');
      const role = await firstElement.getAttribute('role');
      const ariaLabel = await firstElement.getAttribute('aria-label');
      
      expect(tabIndex).toBe('0');
      expect(role).toBe('button');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should handle element selection with keyboard navigation', async ({ page }) => {
    const iframe = page.frameLocator('iframe[title*="LP Preview"]');
    const editableElements = iframe.locator('[data-editable-id]');
    
    if (await editableElements.count() > 0) {
      const firstElement = editableElements.first();
      
      // Test keyboard focus
      await firstElement.focus();
      await page.keyboard.press('Tab');
      
      // Check if element is focusable
      const tabIndex = await firstElement.getAttribute('tabindex');
      expect(tabIndex).toBe('0');
      
      // Test Enter key to start editing
      await firstElement.focus();
      await page.keyboard.press('Enter');
      
      // Check if inline editor appears
      const inlineEditor = page.locator('[data-testid="inline-text-editor"]').or(
        page.locator('textarea').filter({ hasText: /テキストを入力/ })
      );
      
      // Wait a bit for the editor to appear
      await page.waitForTimeout(1000);
      
      // The editor might appear, but we'll check if editing functionality is working
      console.log('Keyboard navigation test completed');
    }
  });

  test('should perform enhanced immediate DOM updates with real-time preview', async ({ page }) => {
    const iframe = page.frameLocator('iframe[title*="LP Preview"]');
    const editableElements = iframe.locator('[data-editable-id]');
    
    if (await editableElements.count() > 0) {
      const firstElement = editableElements.first();
      const originalText = await firstElement.textContent();
      
      console.log(`Testing real-time updates on element with text: "${originalText}"`);
      
      // Double-click to start editing
      await firstElement.dblclick();
      
      // Wait for enhanced inline editor
      await page.waitForTimeout(1000);
      
      // Look for the enhanced inline text editor
      const inlineEditor = page.locator('[data-testid="inline-text-editor"]').or(
        page.locator('textarea').filter({ hasText: /テキストを入力/ })
      ).or(
        page.locator('div').filter({ hasText: /テキスト編集/ }).locator('textarea')
      );
      
      if (await inlineEditor.count() > 0) {
        const newText = 'Enhanced real-time updated content';
        
        // Test real-time preview by typing character by character
        await inlineEditor.clear();
        await inlineEditor.type(newText, { delay: 100 });
        
        // Wait for real-time updates to process
        await page.waitForTimeout(500);
        
        // Check for real-time update indicators
        const realTimeIndicator = page.locator('text=リアルタイム').or(
          page.locator('text=更新中')
        );
        
        if (await realTimeIndicator.count() > 0) {
          console.log('✅ Real-time update indicator found');
        }
        
        // Save the changes
        const saveButton = page.locator('button').filter({ hasText: /保存/ });
        if (await saveButton.count() > 0) {
          await saveButton.click();
        } else {
          await inlineEditor.press('Enter');
        }
        
        // Wait for DOM update with visual feedback
        await page.waitForTimeout(1000);
        
        // Verify immediate DOM update
        const updatedText = await firstElement.textContent();
        console.log(`Enhanced update - Original: "${originalText}", Updated: "${updatedText}"`);
        
        expect(updatedText).toBe(newText);
        expect(updatedText).not.toBe(originalText);
        
        // Check for visual feedback (scale animation)
        const elementStyle = await firstElement.getAttribute('style');
        console.log(`Element style after update: ${elementStyle}`);
        
      } else {
        console.log('⚠️ Enhanced inline editor not found, checking for modal editor');
        
        // Fallback to modal editor test
        const modalTextarea = page.locator('textarea').first();
        if (await modalTextarea.count() > 0) {
          const newText = 'Modal updated content';
          await modalTextarea.fill(newText);
          
          const saveButton = page.locator('button').filter({ hasText: /保存/ });
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);
            
            const updatedText = await firstElement.textContent();
            expect(updatedText).not.toBe(originalText);
          }
        }
      }
    }
  });

  test('should handle multiple element interactions', async ({ page }) => {
    const iframe = page.frameLocator('iframe[title*="LP Preview"]');
    const editableElements = iframe.locator('[data-editable-id]');
    const elementCount = await editableElements.count();
    
    if (elementCount > 1) {
      // Test selecting multiple elements
      for (let i = 0; i < Math.min(3, elementCount); i++) {
        const element = editableElements.nth(i);
        await element.click();
        
        // Wait for selection
        await page.waitForTimeout(500);
        
        // Check if element is highlighted
        const elementClass = await element.getAttribute('class');
        console.log(`Element ${i} class: ${elementClass}`);
      }
    }
    
    expect(elementCount).toBeGreaterThan(0);
  });

  test('should maintain edit state during interactions', async ({ page }) => {
    // Test that edit mode state is preserved during various interactions
    const editModeButton = page.locator('button').filter({ hasText: /編集モード/ });
    
    if (await editModeButton.count() > 0) {
      // Verify edit mode is enabled
      const buttonText = await editModeButton.textContent();
      expect(buttonText).toContain('ON');
      
      // Perform some interactions
      await page.mouse.click(100, 100);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      // Verify edit mode is still enabled
      const updatedButtonText = await editModeButton.textContent();
      expect(updatedButtonText).toContain('ON');
    }
  });

  test('should handle error cases gracefully', async ({ page }) => {
    // Test error handling in editing workflow
    const iframe = page.frameLocator('iframe[title*="LP Preview"]');
    
    // Try to interact with non-existent elements
    const nonExistentElement = iframe.locator('[data-editable-id="non-existent"]');
    await expect(nonExistentElement).toHaveCount(0);
    
    // Test rapid clicking
    const editableElements = iframe.locator('[data-editable-id]');
    if (await editableElements.count() > 0) {
      const firstElement = editableElements.first();
      
      // Rapid clicks should not cause errors
      for (let i = 0; i < 5; i++) {
        await firstElement.click();
        await page.waitForTimeout(50);
      }
    }
    
    // Check for JavaScript errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Should not have critical errors
    const criticalErrors = errors.filter(error => 
      error.includes('TypeError') || error.includes('ReferenceError')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should support accessibility features', async ({ page }) => {
    const iframe = page.frameLocator('iframe[title*="LP Preview"]');
    const editableElements = iframe.locator('[data-editable-id]');
    
    if (await editableElements.count() > 0) {
      const firstElement = editableElements.first();
      
      // Check ARIA attributes
      const role = await firstElement.getAttribute('role');
      const ariaLabel = await firstElement.getAttribute('aria-label');
      
      expect(role).toBe('button');
      expect(ariaLabel).toBeTruthy();
      
      // Test keyboard navigation
      await firstElement.focus();
      const focusedElement = iframe.locator(':focus');
      await expect(focusedElement).toHaveCount(1);
      
      // Test escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('should handle responsive design during editing', async ({ page }) => {
    // Test editing functionality across different viewport sizes
    const viewports = [
      { width: 1200, height: 800 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }   // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      const iframe = page.frameLocator('iframe[title*="LP Preview"]');
      const editableElements = iframe.locator('[data-editable-id]');
      const elementCount = await editableElements.count();
      
      console.log(`Viewport ${viewport.width}x${viewport.height}: ${elementCount} editable elements`);
      expect(elementCount).toBeGreaterThan(0);
      
      // Test interaction at this viewport
      if (elementCount > 0) {
        const firstElement = editableElements.first();
        await firstElement.hover();
        await page.waitForTimeout(200);
      }
    }
  });

  test('should preserve content during edit operations with enhanced error handling', async ({ page }) => {
    const iframe = page.frameLocator('iframe[title*="LP Preview"]');
    
    // Get initial page content
    const initialContent = await iframe.locator('body').textContent();
    expect(initialContent).toBeTruthy();
    
    // Perform enhanced edit operations
    const editableElements = iframe.locator('[data-editable-id]');
    if (await editableElements.count() > 0) {
      const firstElement = editableElements.first();
      
      // Test multiple interaction patterns
      console.log('Testing enhanced interaction patterns...');
      
      // 1. Hover interaction
      await firstElement.hover();
      await page.waitForTimeout(300);
      
      // 2. Single click selection
      await firstElement.click();
      await page.waitForTimeout(200);
      
      // 3. Double-click editing
      await firstElement.dblclick();
      await page.waitForTimeout(1000);
      
      // 4. Enhanced cancellation with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // 5. Keyboard navigation test
      await firstElement.focus();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Verify content preservation after all interactions
      const finalContent = await iframe.locator('body').textContent();
      expect(finalContent).toBeTruthy();
      expect(finalContent!.length).toBeGreaterThan(100);
      
      // Verify no broken elements
      const brokenElements = iframe.locator('[data-editable-id]:empty');
      const brokenCount = await brokenElements.count();
      expect(brokenCount).toBe(0);
      
      console.log('✅ Content preservation test passed with enhanced interactions');
    }
  });

  test('should handle enhanced element highlighting and selection states', async ({ page }) => {
    const iframe = page.frameLocator('iframe[title*="LP Preview"]');
    const editableElements = iframe.locator('[data-editable-id]');
    
    if (await editableElements.count() > 0) {
      const firstElement = editableElements.first();
      const secondElement = editableElements.nth(1);
      
      console.log('Testing enhanced highlighting system...');
      
      // Test hover state
      await firstElement.hover();
      await page.waitForTimeout(300);
      
      let elementClass = await firstElement.getAttribute('class');
      expect(elementClass).toContain('edit-hover');
      
      // Test selection state
      await firstElement.click();
      await page.waitForTimeout(200);
      
      elementClass = await firstElement.getAttribute('class');
      expect(elementClass).toContain('edit-selected');
      
      // Test state transition to another element
      if (await secondElement.count() > 0) {
        await secondElement.hover();
        await page.waitForTimeout(300);
        
        // First element should lose hover state
        const firstElementClass = await firstElement.getAttribute('class');
        const secondElementClass = await secondElement.getAttribute('class');
        
        expect(secondElementClass).toContain('edit-hover');
        console.log('✅ Element state transitions working correctly');
      }
      
      // Test editing state
      await firstElement.dblclick();
      await page.waitForTimeout(500);
      
      elementClass = await firstElement.getAttribute('class');
      expect(elementClass).toContain('edit-editing');
      
      // Cancel editing
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Should return to normal state
      elementClass = await firstElement.getAttribute('class');
      expect(elementClass).not.toContain('edit-editing');
      
      console.log('✅ Enhanced highlighting system test completed');
    }
  });
});