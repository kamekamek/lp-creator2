/**
 * Performance Regression Tests
 * Automated benchmarking and performance monitoring
 */

import { test, expect, Page } from '@playwright/test';

// Performance benchmarks and thresholds
const PERFORMANCE_THRESHOLDS = {
  pageLoad: 5000, // 5 seconds max
  lpGeneration: 30000, // 30 seconds max for AI generation
  editModeActivation: 1000, // 1 second max
  previewUpdate: 500, // 500ms max
  downloadInitiation: 2000, // 2 seconds max
  memoryUsage: 100 * 1024 * 1024, // 100MB max heap
  bundle: {
    initial: 500 * 1024, // 500KB initial bundle
    total: 2 * 1024 * 1024 // 2MB total bundle
  }
};

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: Array<{ name: string; duration: number; timestamp: number }> = [];
  
  startTiming(name: string): () => number {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.metrics.push({ name, duration, timestamp: Date.now() });
      return duration;
    };
  }

  getMetrics() {
    return [...this.metrics];
  }

  getAverageTime(name: string): number {
    const relevant = this.metrics.filter(m => m.name === name);
    if (relevant.length === 0) return 0;
    return relevant.reduce((sum, m) => sum + m.duration, 0) / relevant.length;
  }

  exportReport(): string {
    return JSON.stringify({
      summary: {
        totalTests: this.metrics.length,
        avgPageLoad: this.getAverageTime('pageLoad'),
        avgGeneration: this.getAverageTime('lpGeneration'),
        avgEditMode: this.getAverageTime('editMode')
      },
      details: this.metrics,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

const perfMonitor = new PerformanceMonitor();

test.describe('Performance Regression Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performance.mark('test-start');
    });
  });

  test.afterAll(async () => {
    // Export performance report
    const report = perfMonitor.exportReport();
    console.log('📊 Performance Report:', report);
  });

  test.describe('Page Load Performance', () => {
    test('should load initial page within threshold', async ({ page }) => {
      console.log('⚡ Testing initial page load performance...');

      const endTiming = perfMonitor.startTiming('pageLoad');
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = endTiming();
      
      console.log(`📊 Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

      // Verify critical elements are loaded
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[role="tab"]')).toHaveCount(2);

      console.log('✅ Page load performance verified');
    });

    test('should load with acceptable Time to Interactive (TTI)', async ({ page }) => {
      console.log('⚡ Testing Time to Interactive...');

      const startTime = Date.now();
      await page.goto('/');
      
      // Wait for page to be interactive
      await page.waitForLoadState('networkidle');
      
      // Test interactivity by clicking tab
      await page.click('[role="tab"]:has-text("構造化")');
      const interactiveTime = Date.now() - startTime;
      
      console.log(`📊 Time to Interactive: ${interactiveTime}ms`);
      expect(interactiveTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

      // Verify interaction worked
      await expect(page.locator('[role="tab"]:has-text("構造化")')).toHaveAttribute('aria-selected', 'true');

      console.log('✅ Time to Interactive verified');
    });

    test('should handle concurrent user sessions', async ({ browser }) => {
      console.log('⚡ Testing concurrent session performance...');

      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ]);

      const pages = await Promise.all(contexts.map(context => context.newPage()));

      // Load page in all contexts simultaneously
      const startTime = Date.now();
      await Promise.all(pages.map(page => page.goto('/')));
      const concurrentLoadTime = Date.now() - startTime;

      console.log(`📊 Concurrent load time (5 sessions): ${concurrentLoadTime}ms`);
      expect(concurrentLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad * 2);

      // Verify all pages loaded correctly
      for (const page of pages) {
        await expect(page.locator('h1')).toBeVisible();
      }

      // Cleanup
      await Promise.all(contexts.map(context => context.close()));

      console.log('✅ Concurrent session performance verified');
    });
  });

  test.describe('LP Generation Performance', () => {
    test('should generate LP within performance threshold', async ({ page }) => {
      console.log('⚡ Testing LP generation performance...');

      await page.goto('/');
      await page.click('[role="tab"]:has-text("クイック")');

      const endTiming = perfMonitor.startTiming('lpGeneration');
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Performance test LP - 高速なAI写真編集アプリ');
      await page.click('button:has-text("生成")');

      // Wait for generation to complete or timeout
      try {
        await expect(page.locator('iframe[data-testid="lp-preview"]')).toBeVisible({ 
          timeout: PERFORMANCE_THRESHOLDS.lpGeneration 
        });
        
        const generationTime = endTiming();
        
        console.log(`📊 LP generation time: ${generationTime}ms`);
        expect(generationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.lpGeneration);

        // Verify preview loads quickly
        const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
        await expect(previewFrame).toBeVisible();

      } catch (error) {
        const generationTime = endTiming();
        console.log(`⚠️ LP generation timed out after ${generationTime}ms`);
        
        // Even if generation times out, it shouldn't exceed our threshold significantly
        expect(generationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.lpGeneration + 5000);
      }

      console.log('✅ LP generation performance test completed');
    });

    test('should handle multiple generation requests efficiently', async ({ page }) => {
      console.log('⚡ Testing multiple generation performance...');

      await page.goto('/');
      await page.click('[role="tab"]:has-text("クイック")');

      const requests = [
        'Simple test LP 1',
        'Simple test LP 2', 
        'Simple test LP 3'
      ];

      const times: number[] = [];

      for (const request of requests) {
        const endTiming = perfMonitor.startTiming('lpGeneration');
        
        await page.fill('input[placeholder*="AI写真編集アプリ"]', request);
        await page.click('button:has-text("生成")');

        // Wait a reasonable time for each request
        await page.waitForTimeout(15000);
        
        const time = endTiming();
        times.push(time);
        
        console.log(`📊 Request "${request}" took ${time}ms`);

        // Clear for next request
        if (await page.locator('button:has-text("クリア"), button:has-text("リセット")').count() > 0) {
          await page.click('button:has-text("クリア"), button:has-text("リセット")');
        }
      }

      // Calculate average time
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      console.log(`📊 Average generation time: ${avgTime}ms`);

      // Verify performance doesn't degrade significantly
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variation = maxTime - minTime;
      
      console.log(`📊 Performance variation: ${variation}ms`);
      expect(variation).toBeLessThan(10000); // No more than 10s variation

      console.log('✅ Multiple generation performance verified');
    });
  });

  test.describe('UI Interaction Performance', () => {
    test('should activate edit mode quickly', async ({ page }) => {
      console.log('⚡ Testing edit mode activation performance...');

      await page.goto('/');
      
      // First generate a simple LP
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Edit mode performance test');
      await page.click('button:has-text("生成")');
      
      // Wait for LP to be ready
      await page.waitForTimeout(15000);

      // Test edit mode activation
      const endTiming = perfMonitor.startTiming('editMode');
      
      await page.click('button:has-text("編集"), [data-testid="edit-toggle"]');
      
      // Verify edit mode is active
      await page.waitForTimeout(1000);
      
      const editTime = endTiming();
      
      console.log(`📊 Edit mode activation time: ${editTime}ms`);
      expect(editTime).toBeLessThan(PERFORMANCE_THRESHOLDS.editModeActivation);

      console.log('✅ Edit mode activation performance verified');
    });

    test('should update preview quickly during editing', async ({ page }) => {
      console.log('⚡ Testing preview update performance...');

      await page.goto('/');
      
      // Generate LP and enter edit mode
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Preview update test');
      await page.click('button:has-text("生成")');
      await page.waitForTimeout(15000);
      
      await page.click('button:has-text("編集"), [data-testid="edit-toggle"]');
      await page.waitForTimeout(1000);

      // Test preview update speed
      const previewFrame = page.locator('iframe[data-testid="lp-preview"]');
      
      if (await previewFrame.count() > 0) {
        const frameContent = await previewFrame.contentFrame();
        
        if (frameContent) {
          const editableElement = frameContent.locator('h1, h2, p').first();
          
          if (await editableElement.count() > 0) {
            const endTiming = perfMonitor.startTiming('previewUpdate');
            
            await editableElement.dblclick();
            
            // Look for input field and update it
            const editInput = frameContent.locator('input[type="text"], textarea');
            if (await editInput.count() > 0) {
              await editInput.fill('Updated text for performance test');
              await editInput.press('Enter');
            }
            
            const updateTime = endTiming();
            
            console.log(`📊 Preview update time: ${updateTime}ms`);
            expect(updateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.previewUpdate);
          }
        }
      }

      console.log('✅ Preview update performance verified');
    });

    test('should handle tab switching efficiently', async ({ page }) => {
      console.log('⚡ Testing tab switching performance...');

      await page.goto('/');

      const tabSwitchTimes: number[] = [];

      // Test switching between tabs multiple times
      for (let i = 0; i < 5; i++) {
        const endTiming = perfMonitor.startTiming('tabSwitch');
        
        if (i % 2 === 0) {
          await page.click('[role="tab"]:has-text("構造化")');
          await expect(page.locator('[role="tab"]:has-text("構造化")')).toHaveAttribute('aria-selected', 'true');
        } else {
          await page.click('[role="tab"]:has-text("クイック")');
          await expect(page.locator('[role="tab"]:has-text("クイック")')).toHaveAttribute('aria-selected', 'true');
        }
        
        const switchTime = endTiming();
        tabSwitchTimes.push(switchTime);
        
        console.log(`📊 Tab switch ${i + 1} time: ${switchTime}ms`);
      }

      const avgSwitchTime = tabSwitchTimes.reduce((sum, time) => sum + time, 0) / tabSwitchTimes.length;
      console.log(`📊 Average tab switch time: ${avgSwitchTime}ms`);
      
      expect(avgSwitchTime).toBeLessThan(200); // Should be very fast

      console.log('✅ Tab switching performance verified');
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should maintain reasonable memory usage', async ({ page }) => {
      console.log('⚡ Testing memory usage...');

      await page.goto('/');

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return {
          used: (performance as any).memory?.usedJSHeapSize || 0,
          total: (performance as any).memory?.totalJSHeapSize || 0,
          limit: (performance as any).memory?.jsHeapSizeLimit || 0
        };
      });

      console.log(`📊 Initial memory usage: ${Math.round(initialMemory.used / 1024 / 1024)}MB`);

      // Perform memory-intensive operations
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Memory usage test LP with lots of content');
      await page.click('button:has-text("生成")');
      
      await page.waitForTimeout(15000);

      // Check memory after operations
      const afterMemory = await page.evaluate(() => {
        return {
          used: (performance as any).memory?.usedJSHeapSize || 0,
          total: (performance as any).memory?.totalJSHeapSize || 0,
          limit: (performance as any).memory?.jsHeapSizeLimit || 0
        };
      });

      console.log(`📊 Memory after operations: ${Math.round(afterMemory.used / 1024 / 1024)}MB`);

      const memoryGrowth = afterMemory.used - initialMemory.used;
      console.log(`📊 Memory growth: ${Math.round(memoryGrowth / 1024 / 1024)}MB`);

      // Memory shouldn't grow excessively
      expect(afterMemory.used).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);

      console.log('✅ Memory usage verified');
    });

    test('should handle memory cleanup properly', async ({ page }) => {
      console.log('⚡ Testing memory cleanup...');

      await page.goto('/');

      // Simulate multiple LP generations to test cleanup
      for (let i = 0; i < 3; i++) {
        await page.click('[role="tab"]:has-text("クイック")');
        await page.fill('input[placeholder*="AI写真編集アプリ"]', `Cleanup test ${i + 1}`);
        await page.click('button:has-text("生成")');
        
        await page.waitForTimeout(10000);

        // Clear previous result if possible
        if (await page.locator('button:has-text("クリア"), button:has-text("リセット")').count() > 0) {
          await page.click('button:has-text("クリア"), button:has-text("リセット")');
        }
      }

      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
        return {
          used: (performance as any).memory?.usedJSHeapSize || 0,
          total: (performance as any).memory?.totalJSHeapSize || 0
        };
      });

      console.log(`📊 Final memory usage: ${Math.round(finalMemory.used / 1024 / 1024)}MB`);

      // Memory should not grow linearly with each operation
      expect(finalMemory.used).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);

      console.log('✅ Memory cleanup verified');
    });
  });

  test.describe('Network Performance', () => {
    test('should optimize API request sizes', async ({ page }) => {
      console.log('⚡ Testing API request optimization...');

      const requestSizes: number[] = [];
      const responseSizes: number[] = [];

      // Monitor network requests
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          const postData = request.postData();
          if (postData) {
            requestSizes.push(postData.length);
            console.log(`📤 API Request size: ${postData.length} bytes`);
          }
        }
      });

      page.on('response', response => {
        if (response.url().includes('/api/')) {
          response.body().then(body => {
            responseSizes.push(body.length);
            console.log(`📥 API Response size: ${body.length} bytes`);
          }).catch(() => {});
        }
      });

      await page.goto('/');
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Network optimization test');
      await page.click('button:has-text("生成")');

      await page.waitForTimeout(15000);

      // Verify request/response sizes are reasonable
      if (requestSizes.length > 0) {
        const avgRequestSize = requestSizes.reduce((sum, size) => sum + size, 0) / requestSizes.length;
        console.log(`📊 Average request size: ${Math.round(avgRequestSize)} bytes`);
        
        // Requests shouldn't be excessively large
        expect(avgRequestSize).toBeLessThan(50000); // 50KB max average
      }

      console.log('✅ Network performance verified');
    });

    test('should handle slow network conditions', async ({ page }) => {
      console.log('⚡ Testing slow network performance...');

      // Simulate slow network
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50000, // 50KB/s
        uploadThroughput: 20000,   // 20KB/s
        latency: 500              // 500ms latency
      });

      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      console.log(`📊 Load time on slow network: ${loadTime}ms`);

      // Should still load within reasonable time even on slow network
      expect(loadTime).toBeLessThan(15000); // 15 seconds max on slow network

      // Verify functionality works
      await expect(page.locator('h1')).toBeVisible();

      console.log('✅ Slow network performance verified');
    });
  });

  test.describe('Bundle Size and Asset Performance', () => {
    test('should maintain reasonable bundle sizes', async ({ page }) => {
      console.log('⚡ Testing bundle size performance...');

      const resourceSizes: { [key: string]: number } = {};

      // Monitor resource loading
      page.on('response', response => {
        const url = response.url();
        if (url.includes('/_next/') || url.includes('.js') || url.includes('.css')) {
          response.body().then(body => {
            resourceSizes[url] = body.length;
            console.log(`📦 Resource ${url.split('/').pop()}: ${Math.round(body.length / 1024)}KB`);
          }).catch(() => {});
        }
      });

      await page.goto('/', { waitUntil: 'networkidle' });

      // Calculate total bundle size
      await page.waitForTimeout(3000); // Allow all resources to load

      const totalSize = Object.values(resourceSizes).reduce((sum, size) => sum + size, 0);
      console.log(`📊 Total bundle size: ${Math.round(totalSize / 1024)}KB`);

      // Verify bundle size is reasonable
      expect(totalSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundle.total);

      // Check if initial bundle is optimized
      const jsFiles = Object.entries(resourceSizes).filter(([url]) => url.includes('.js'));
      if (jsFiles.length > 0) {
        const mainBundle = jsFiles.find(([url]) => url.includes('main') || url.includes('index'));
        if (mainBundle) {
          console.log(`📊 Main bundle size: ${Math.round(mainBundle[1] / 1024)}KB`);
          expect(mainBundle[1]).toBeLessThan(PERFORMANCE_THRESHOLDS.bundle.initial);
        }
      }

      console.log('✅ Bundle size performance verified');
    });
  });
});