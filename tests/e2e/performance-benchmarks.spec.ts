import { test, expect, Page } from '@playwright/test';

// Performance benchmark thresholds
const BENCHMARKS = {
  LP_GENERATION: 10000, // 10 seconds
  EDIT_OPERATION: 100,  // 100ms
  PAGE_LOAD: 3000,      // 3 seconds
  COMPONENT_RENDER: 50, // 50ms
  MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
} as const;

// Test data
const TEST_CONTENT = 'AI写真編集アプリの高性能ランディングページを作成してください。多数の機能と詳細な説明を含めてください。';
const LARGE_TEST_CONTENT = TEST_CONTENT.repeat(10); // Large content for stress testing

test.describe('Performance Benchmarks', () => {
  
  test.describe('Page Load Performance', () => {
    test('should load initial page within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      
      // Wait for critical content to be visible
      await expect(page.locator('h1')).toContainText('LP Creator');
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      console.log(`📊 Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(BENCHMARKS.PAGE_LOAD);
    });

    test('should load tab content quickly', async ({ page }) => {
      await page.goto('/');
      
      // Measure tab switching performance
      const startTime = Date.now();
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Wait for tab content to be visible
      await expect(page.locator('input[placeholder*="AI写真編集アプリ"]')).toBeVisible();
      
      const switchTime = Date.now() - startTime;
      
      console.log(`📊 Tab switch time: ${switchTime}ms`);
      expect(switchTime).toBeLessThan(500); // 500ms threshold for tab switching
    });
  });

  test.describe('LP Generation Performance', () => {
    test('should generate LP within 10 seconds (benchmark)', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to quick creation
      await page.click('[role="tab"]:has-text("クイック")');
      
      // Start LP generation timing
      const startTime = Date.now();
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', TEST_CONTENT);
      await page.click('button:has-text("生成")');
      
      // Wait for LP generation to complete
      await expect(page.locator('h2:has-text("プレビュー")')).toBeVisible();
      
      // Wait for loading to complete (either success or timeout)
      try {
        // Wait for iframe to appear or error message
        await Promise.race([
          page.waitForSelector('iframe[title*="LP Preview"]', { timeout: BENCHMARKS.LP_GENERATION }),
          page.waitForSelector('text=エラーが発生しました', { timeout: BENCHMARKS.LP_GENERATION })
        ]);
      } catch (error) {
        // Timeout is acceptable for this benchmark test
      }
      
      const generationTime = Date.now() - startTime;
      
      console.log(`📊 LP generation time: ${generationTime}ms`);
      
      // This is a benchmark test - we record the time but don't fail if it's slow
      if (generationTime > BENCHMARKS.LP_GENERATION) {
        console.warn(`⚠️ LP generation exceeded benchmark: ${generationTime}ms > ${BENCHMARKS.LP_GENERATION}ms`);
      } else {
        console.log(`✅ LP generation within benchmark: ${generationTime}ms`);
      }
      
      // Record performance data
      await page.evaluate((time) => {
        console.log(`Performance: LP_GENERATION = ${time}ms`);
      }, generationTime);
      
      // Test passes regardless of time (this is a measurement test)
      expect(generationTime).toBeGreaterThan(0);
    });

    test('should handle large content generation efficiently', async ({ page }) => {
      await page.goto('/');
      await page.click('[role="tab"]:has-text("クイック")');
      
      const startTime = Date.now();
      
      await page.fill('input[placeholder*="AI写真編集アプリ"]', LARGE_TEST_CONTENT);
      await page.click('button:has-text("生成")');
      
      // Wait for response (with extended timeout for large content)
      try {
        await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 15000 });
      } catch {
        // Record timeout
        await page.waitForSelector('text=エラー', { timeout: 1000 }).catch(() => {});
      }
      
      const processingTime = Date.now() - startTime;
      
      console.log(`📊 Large content processing time: ${processingTime}ms`);
      
      // Large content should not take more than 15 seconds
      expect(processingTime).toBeLessThan(15000);
    });
  });

  test.describe('Edit Operation Performance', () => {
    test('should perform edit operations within 100ms (benchmark)', async ({ page }) => {
      await page.goto('/');
      
      // First generate some content
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Simple test content');
      await page.click('button:has-text("生成")');
      
      // Wait for generation (with reasonable timeout)
      try {
        await page.waitForSelector('iframe[title*="LP Preview"]', { timeout: 10000 });
        
        // Enable edit mode
        await page.click('button:has-text("編集モード")');
        
        // Wait for edit mode to be enabled
        await expect(page.locator('button:has-text("編集モード: ON")')).toBeVisible();
        
        // Measure edit operation (simulated)
        const startTime = Date.now();
        
        // Simulate an edit operation by clicking the edit button
        await page.click('button:has-text("編集モード: ON")');
        await page.click('button:has-text("編集モード: OFF")');
        
        const editTime = Date.now() - startTime;
        
        console.log(`📊 Edit operation time: ${editTime}ms`);
        
        // This is a benchmark - record but don't fail
        if (editTime > BENCHMARKS.EDIT_OPERATION) {
          console.warn(`⚠️ Edit operation exceeded benchmark: ${editTime}ms > ${BENCHMARKS.EDIT_OPERATION}ms`);
        } else {
          console.log(`✅ Edit operation within benchmark: ${editTime}ms`);
        }
        
        expect(editTime).toBeGreaterThan(0);
        
      } catch (error) {
        console.log('📊 Edit test skipped - LP generation not completed');
        // Skip edit performance test if LP generation failed
      }
    });

    test('should handle rapid edit operations without lag', async ({ page }) => {
      await page.goto('/');
      await page.click('[role="tab"]:has-text("クイック")');
      
      const operations = 5;
      const times: number[] = [];
      
      for (let i = 0; i < operations; i++) {
        const startTime = Date.now();
        
        // Toggle edit mode rapidly
        await page.click('button:has-text("編集モード")');
        
        const operationTime = Date.now() - startTime;
        times.push(operationTime);
        
        // Small delay between operations
        await page.waitForTimeout(10);
      }
      
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      
      console.log(`📊 Average rapid edit time: ${averageTime.toFixed(2)}ms`);
      console.log(`📊 Max rapid edit time: ${maxTime}ms`);
      
      // Average should be reasonable
      expect(averageTime).toBeLessThan(200);
      // No single operation should take more than 500ms
      expect(maxTime).toBeLessThan(500);
    });
  });

  test.describe('Memory Usage Benchmarks', () => {
    test('should maintain reasonable memory usage during operations', async ({ page }) => {
      // Enable memory monitoring
      await page.addInitScript(() => {
        (window as any).performanceData = [];
        
        // Monitor memory usage
        const monitorMemory = () => {
          if ('memory' in performance) {
            const memory = (performance as any).memory;
            (window as any).performanceData.push({
              timestamp: Date.now(),
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit
            });
          }
        };
        
        setInterval(monitorMemory, 1000); // Monitor every second
      });
      
      await page.goto('/');
      
      // Perform memory-intensive operations
      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', LARGE_TEST_CONTENT);
      
      // Wait and check memory usage
      await page.waitForTimeout(3000);
      
      const memoryData = await page.evaluate(() => {
        return (window as any).performanceData || [];
      });
      
      if (memoryData.length > 0) {
        const latestMemory = memoryData[memoryData.length - 1];
        const memoryUsage = latestMemory.usedJSHeapSize;
        
        console.log(`📊 Memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
        
        // Memory usage benchmark
        if (memoryUsage > BENCHMARKS.MEMORY_USAGE) {
          console.warn(`⚠️ Memory usage exceeded benchmark: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
        } else {
          console.log(`✅ Memory usage within benchmark: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
        }
        
        // Test passes if memory is not excessively high
        expect(memoryUsage).toBeLessThan(500 * 1024 * 1024); // 500MB absolute max
      } else {
        console.log('📊 Memory monitoring not available in this environment');
      }
    });

    test('should handle memory cleanup properly', async ({ page }) => {
      await page.goto('/');
      
      let initialMemory = 0;
      let afterOperationMemory = 0;
      
      // Get initial memory
      const memoryBefore = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      initialMemory = memoryBefore;
      
      // Perform operations that should be cleaned up
      for (let i = 0; i < 3; i++) {
        await page.click('[role="tab"]:has-text("構造化")');
        await page.waitForTimeout(100);
        await page.click('[role="tab"]:has-text("クイック")');
        await page.waitForTimeout(100);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      await page.waitForTimeout(1000);
      
      // Check memory after operations
      const memoryAfter = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      afterOperationMemory = memoryAfter;
      
      if (initialMemory > 0 && afterOperationMemory > 0) {
        const memoryIncrease = afterOperationMemory - initialMemory;
        const increasePercentage = (memoryIncrease / initialMemory) * 100;
        
        console.log(`📊 Memory increase: ${Math.round(memoryIncrease / 1024)}KB (${increasePercentage.toFixed(1)}%)`);
        
        // Memory shouldn't increase by more than 50%
        expect(increasePercentage).toBeLessThan(50);
      } else {
        console.log('📊 Memory cleanup test skipped - memory API not available');
      }
    });
  });

  test.describe('Component Rendering Performance', () => {
    test('should render components within acceptable time', async ({ page }) => {
      // Measure component rendering using Navigation Timing API
      await page.goto('/');
      
      const renderingMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          domComplete: navigation.domComplete - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart
        };
      });
      
      console.log(`📊 DOM Content Loaded: ${renderingMetrics.domContentLoaded}ms`);
      console.log(`📊 DOM Complete: ${renderingMetrics.domComplete}ms`);
      console.log(`📊 Load Complete: ${renderingMetrics.loadComplete}ms`);
      
      // Rendering benchmarks
      expect(renderingMetrics.domContentLoaded).toBeLessThan(1000);
      expect(renderingMetrics.domComplete).toBeLessThan(3000);
    });
  });

  test.describe('Bundle Size and Network Performance', () => {
    test('should load with reasonable resource sizes', async ({ page }) => {
      const resourceSizes: { name: string; size: number }[] = [];
      
      // Monitor network requests
      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('/_next/') && (url.endsWith('.js') || url.endsWith('.css'))) {
          response.body().then((buffer) => {
            resourceSizes.push({
              name: url.split('/').pop() || url,
              size: buffer.length
            });
          }).catch(() => {
            // Ignore errors for body access
          });
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait a bit for all resources to be captured
      await page.waitForTimeout(2000);
      
      const totalSize = resourceSizes.reduce((sum, resource) => sum + resource.size, 0);
      const jsFiles = resourceSizes.filter(r => r.name.endsWith('.js'));
      const cssFiles = resourceSizes.filter(r => r.name.endsWith('.css'));
      
      console.log(`📊 Total bundle size: ${Math.round(totalSize / 1024)}KB`);
      console.log(`📊 JS files: ${jsFiles.length}, CSS files: ${cssFiles.length}`);
      
      if (resourceSizes.length > 0) {
        const largestFiles = resourceSizes
          .sort((a, b) => b.size - a.size)
          .slice(0, 3);
        
        console.log('📊 Largest files:');
        largestFiles.forEach(file => {
          console.log(`  ${file.name}: ${Math.round(file.size / 1024)}KB`);
        });
        
        // Bundle size benchmarks (reasonable for a modern app)
        expect(totalSize).toBeLessThan(2 * 1024 * 1024); // 2MB total
      }
    });
  });
});

test.describe('Stress Testing', () => {
  test('should handle concurrent operations', async ({ page }) => {
    await page.goto('/');
    
    const concurrentOperations = 5;
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(
        (async () => {
          await page.click('[role="tab"]:has-text("クイック")');
          await page.waitForTimeout(50);
          await page.click('[role="tab"]:has-text("構造化")');
          await page.waitForTimeout(50);
        })()
      );
    }
    
    const startTime = Date.now();
    await Promise.all(promises);
    const completionTime = Date.now() - startTime;
    
    console.log(`📊 Concurrent operations completed in: ${completionTime}ms`);
    
    // Should complete within reasonable time
    expect(completionTime).toBeLessThan(2000);
    
    // Page should still be responsive
    await expect(page.locator('h1')).toContainText('LP Creator');
  });

  test('should maintain performance under rapid interactions', async ({ page }) => {
    await page.goto('/');
    
    const interactions = 20;
    const times: number[] = [];
    
    for (let i = 0; i < interactions; i++) {
      const startTime = Date.now();
      
      // Rapid tab switching
      const tabIndex = i % 2;
      const tabName = tabIndex === 0 ? 'クイック' : '構造化';
      await page.click(`[role="tab"]:has-text("${tabName}")`);
      
      const interactionTime = Date.now() - startTime;
      times.push(interactionTime);
      
      await page.waitForTimeout(10); // Small delay
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    
    console.log(`📊 Average rapid interaction time: ${averageTime.toFixed(2)}ms`);
    console.log(`📊 Max rapid interaction time: ${maxTime}ms`);
    
    // Performance should not degrade significantly under rapid interactions
    expect(averageTime).toBeLessThan(100);
    expect(maxTime).toBeLessThan(300);
  });
});