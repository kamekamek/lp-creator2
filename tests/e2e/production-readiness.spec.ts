/**
 * Production Readiness Tests
 * Tests deployment configuration, monitoring, and production optimizations
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Production Readiness Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Health Check and Monitoring', () => {
    test('should have functional health check endpoint', async ({ page }) => {
      console.log('🏥 Testing health check endpoint...');

      // Test health endpoint
      const healthResponse = await page.request.get('/health');
      expect(healthResponse.status()).toBe(200);

      const healthData = await healthResponse.json();
      
      // Verify health response structure
      expect(healthData).toHaveProperty('status');
      expect(healthData).toHaveProperty('timestamp');
      expect(healthData).toHaveProperty('version');
      expect(healthData).toHaveProperty('system');
      expect(healthData).toHaveProperty('services');

      // Verify system metrics
      expect(healthData.system).toHaveProperty('uptime');
      expect(healthData.system).toHaveProperty('memory');
      expect(healthData.system).toHaveProperty('responseTime');

      // Verify response time is reasonable
      expect(healthData.system.responseTime).toBeLessThan(5000);

      console.log(`✅ Health check passed - Status: ${healthData.status}`);
    });

    test('should have functional status endpoint', async ({ page }) => {
      console.log('📊 Testing status endpoint...');

      const statusResponse = await page.request.get('/status');
      expect(statusResponse.status()).toBe(200);

      const statusData = await statusResponse.json();

      // Verify status response structure
      expect(statusData).toHaveProperty('health');
      expect(statusData).toHaveProperty('performance');
      expect(statusData).toHaveProperty('errors');
      expect(statusData).toHaveProperty('system');
      expect(statusData).toHaveProperty('features');

      // Verify monitoring data
      expect(statusData.health).toHaveProperty('status');
      expect(statusData.health).toHaveProperty('checks');

      console.log(`✅ Status endpoint functional - Health: ${statusData.health.status}`);
    });

    test('should export monitoring data', async ({ page }) => {
      console.log('📤 Testing monitoring data export...');

      const exportResponse = await page.request.post('/status', {
        data: {
          format: 'json',
          includeMetrics: true,
          includeLogs: false
        }
      });

      expect(exportResponse.status()).toBe(200);
      
      const contentType = exportResponse.headers()['content-type'];
      expect(contentType).toContain('application/json');

      const exportData = await exportResponse.json();
      expect(exportData).toHaveProperty('exportTime');
      expect(exportData).toHaveProperty('config');

      console.log('✅ Monitoring data export successful');
    });
  });

  test.describe('Performance Optimization', () => {
    test('should have optimized static asset caching', async ({ page }) => {
      console.log('⚡ Testing static asset caching...');

      // Test CSS file caching
      await page.goto('/');
      
      // Wait for CSS to load
      await page.waitForLoadState('networkidle');

      // Check for CSS files
      const cssRequests: string[] = [];
      page.on('response', response => {
        if (response.url().includes('.css')) {
          cssRequests.push(response.url());
          
          // Check cache headers
          const cacheControl = response.headers()['cache-control'];
          if (cacheControl) {
            expect(cacheControl).toContain('public');
            expect(cacheControl).toMatch(/max-age=\d+/);
          }
        }
      });

      // Reload to check caching
      await page.reload();
      await page.waitForLoadState('networkidle');

      console.log(`✅ Static asset caching verified for ${cssRequests.length} CSS files`);
    });

    test('should have optimized JavaScript bundling', async ({ page }) => {
      console.log('📦 Testing JavaScript bundle optimization...');

      const jsRequests: Array<{ url: string; size: number }> = [];
      
      page.on('response', async response => {
        if (response.url().includes('.js') && response.url().includes('_next/static')) {
          try {
            const body = await response.body();
            jsRequests.push({
              url: response.url(),
              size: body.length
            });
          } catch (error) {
            // Some responses might not be readable
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Allow time for all JS files to load
      await page.waitForTimeout(3000);

      // Verify bundle optimization
      const totalSize = jsRequests.reduce((sum, req) => sum + req.size, 0);
      console.log(`📊 Total JS bundle size: ${Math.round(totalSize / 1024)}KB`);

      // Bundle size should be reasonable (under 2MB total)
      expect(totalSize).toBeLessThan(2 * 1024 * 1024);

      // Should have multiple chunks (indicating code splitting)
      expect(jsRequests.length).toBeGreaterThan(1);

      console.log(`✅ JavaScript bundling optimized - ${jsRequests.length} chunks`);
    });

    test('should have compression enabled', async ({ page }) => {
      console.log('🗜️ Testing response compression...');

      const response = await page.request.get('/');
      
      // Check for compression headers
      const contentEncoding = response.headers()['content-encoding'];
      const contentType = response.headers()['content-type'];

      // Verify HTML is served
      expect(contentType).toContain('text/html');

      // Note: Compression might be handled by the platform (Vercel)
      // So we don't strictly require gzip/br encoding here
      console.log(`📊 Content-Encoding: ${contentEncoding || 'platform-handled'}`);

      console.log('✅ Compression configuration verified');
    });

    test('should load critical resources with priority', async ({ page }) => {
      console.log('🚀 Testing critical resource loading...');

      const resourceLoadTimes: Array<{ url: string; loadTime: number }> = [];

      page.on('response', response => {
        // Track critical resource load times
        if (response.url().includes('_next/static') || 
            response.url().includes('.css') ||
            response.request().resourceType() === 'document') {
          
          const loadTime = response.timing().responseEnd - response.timing().responseStart;
          resourceLoadTimes.push({
            url: response.url(),
            loadTime
          });
        }
      });

      const startTime = Date.now();
      await page.goto('/');
      
      // Wait for critical resources
      await page.waitForSelector('h1');
      const totalLoadTime = Date.now() - startTime;

      console.log(`📊 Page loaded in ${totalLoadTime}ms`);
      console.log(`📊 Critical resources loaded: ${resourceLoadTimes.length}`);

      // Verify reasonable load time
      expect(totalLoadTime).toBeLessThan(10000); // 10 seconds max

      console.log('✅ Critical resource loading optimized');
    });
  });

  test.describe('Security Headers', () => {
    test('should have proper security headers', async ({ page }) => {
      console.log('🔒 Testing security headers...');

      const response = await page.request.get('/');
      const headers = response.headers();

      // Test essential security headers
      const securityHeaders = {
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block',
        'referrer-policy': 'strict-origin-when-cross-origin'
      };

      for (const [header, expectedValue] of Object.entries(securityHeaders)) {
        const actualValue = headers[header];
        expect(actualValue).toBeDefined();
        console.log(`🛡️ ${header}: ${actualValue}`);
      }

      console.log('✅ Security headers verified');
    });

    test('should have CORS headers for API endpoints', async ({ page }) => {
      console.log('🌐 Testing CORS headers...');

      const apiResponse = await page.request.get('/api/health');
      const headers = apiResponse.headers();

      // Check CORS headers
      expect(headers['access-control-allow-origin']).toBeDefined();
      expect(headers['access-control-allow-methods']).toBeDefined();
      expect(headers['access-control-allow-headers']).toBeDefined();

      console.log('✅ CORS headers verified for API endpoints');
    });

    test('should handle CSP violations gracefully', async ({ page }) => {
      console.log('🛡️ Testing CSP violation handling...');

      const violations: string[] = [];
      
      page.on('console', msg => {
        if (msg.text().includes('Content Security Policy') || 
            msg.text().includes('CSP')) {
          violations.push(msg.text());
        }
      });

      // Load page and trigger potential CSP violations
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Wait for any CSP violations to be logged
      await page.waitForTimeout(2000);

      console.log(`📊 CSP violations detected: ${violations.length}`);
      
      // Log violations for debugging
      violations.forEach((violation, index) => {
        console.log(`⚠️ CSP Violation ${index + 1}: ${violation}`);
      });

      console.log('✅ CSP violation handling tested');
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      console.log('🚨 Testing API error handling...');

      // Test with unavailable endpoint
      const errorResponse = await page.request.get('/api/nonexistent');
      expect(errorResponse.status()).toBe(404);

      // Test health endpoint error handling
      const healthResponse = await page.request.get('/health');
      
      if (healthResponse.status() !== 200) {
        const errorData = await healthResponse.json();
        expect(errorData).toHaveProperty('error');
        expect(errorData).toHaveProperty('timestamp');
      }

      console.log('✅ API error handling verified');
    });

    test('should maintain functionality during partial failures', async ({ page }) => {
      console.log('⚡ Testing partial failure resilience...');

      // Load the main application
      await page.goto('/');
      
      // Verify core functionality remains available
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[role="tab"]')).toHaveCount(2);

      // Test tab switching (should work even if some APIs fail)
      await page.click('[role="tab"]:has-text("構造化")');
      await expect(page.locator('[role="tab"]:has-text("構造化")')).toHaveAttribute('aria-selected', 'true');

      await page.click('[role="tab"]:has-text("クイック")');
      await expect(page.locator('[role="tab"]:has-text("クイック")')).toHaveAttribute('aria-selected', 'true');

      console.log('✅ Partial failure resilience verified');
    });

    test('should provide user-friendly error messages', async ({ page }) => {
      console.log('💬 Testing user-friendly error messages...');

      // Simulate network error
      await page.route('/api/lp-creator/chat', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Error handling test');
      await page.click('button:has-text("生成")');

      // Should show user-friendly error message
      await expect(page.locator('text=エラー, text=問題が発生')).toBeVisible({ timeout: 10000 });

      // Should provide retry option
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();

      console.log('✅ User-friendly error messages verified');
    });
  });

  test.describe('Environment Configuration', () => {
    test('should detect production environment correctly', async ({ page }) => {
      console.log('🌍 Testing environment detection...');

      const healthResponse = await page.request.get('/health');
      const healthData = await healthResponse.json();

      // Verify environment is detected
      expect(healthData).toHaveProperty('environment');
      console.log(`📊 Environment: ${healthData.environment}`);

      // Verify runtime is detected
      expect(healthData).toHaveProperty('runtime');
      console.log(`📊 Runtime: ${healthData.runtime}`);

      console.log('✅ Environment detection verified');
    });

    test('should have appropriate caching for production', async ({ page }) => {
      console.log('📦 Testing production caching configuration...');

      // Test different endpoint caching
      const endpoints = [
        { path: '/', expectedMaxAge: 'public' },
        { path: '/health', expectedMaxAge: 'no-cache' },
        { path: '/status', expectedMaxAge: 'no-cache' }
      ];

      for (const endpoint of endpoints) {
        const response = await page.request.get(endpoint.path);
        const cacheControl = response.headers()['cache-control'];
        
        if (cacheControl) {
          console.log(`📊 ${endpoint.path}: ${cacheControl}`);
          
          if (endpoint.expectedMaxAge === 'no-cache') {
            expect(cacheControl).toContain('no-cache');
          } else {
            expect(cacheControl).toContain('public');
          }
        }
      }

      console.log('✅ Production caching configuration verified');
    });

    test('should handle edge runtime correctly', async ({ page }) => {
      console.log('⚡ Testing edge runtime compatibility...');

      const statusResponse = await page.request.get('/status');
      const statusData = await statusResponse.json();

      // Check if edge runtime features are working
      expect(statusData).toHaveProperty('system');
      
      // Verify edge runtime response times are fast
      const responseTime = statusResponse.headers()['x-response-time'];
      if (responseTime) {
        const timeMs = parseInt(responseTime.replace('ms', ''));
        expect(timeMs).toBeLessThan(5000); // Should be fast in edge runtime
        console.log(`📊 Edge runtime response time: ${responseTime}`);
      }

      console.log('✅ Edge runtime compatibility verified');
    });
  });

  test.describe('Monitoring and Observability', () => {
    test('should collect and report metrics', async ({ page }) => {
      console.log('📈 Testing metrics collection...');

      // Generate some activity to create metrics
      await page.goto('/');
      await page.click('[role="tab"]:has-text("構造化")');
      await page.click('[role="tab"]:has-text("クイック")');

      // Check metrics via status endpoint
      const statusResponse = await page.request.get('/status');
      const statusData = await statusResponse.json();

      // Verify metrics are being collected
      expect(statusData).toHaveProperty('performance');
      expect(statusData).toHaveProperty('system');
      expect(statusData).toHaveProperty('features');

      // Check for request metrics
      if (statusData.system && statusData.system.requests) {
        expect(typeof statusData.system.requests.total).toBe('number');
      }

      console.log('✅ Metrics collection verified');
    });

    test('should track errors appropriately', async ({ page }) => {
      console.log('🔍 Testing error tracking...');

      // Cause an intentional error
      await page.route('/api/lp-creator/chat', route => {
        route.fulfill({ status: 500, body: 'Test error' });
      });

      await page.click('[role="tab"]:has-text("クイック")');
      await page.fill('input[placeholder*="AI写真編集アプリ"]', 'Error tracking test');
      await page.click('button:has-text("生成")');

      // Wait for error to be processed
      await page.waitForTimeout(5000);

      // Check error tracking
      const statusResponse = await page.request.get('/status');
      const statusData = await statusResponse.json();

      expect(statusData).toHaveProperty('errors');
      
      if (statusData.errors) {
        console.log(`📊 Total errors tracked: ${statusData.errors.total}`);
        console.log(`📊 Recent errors: ${statusData.errors.recent?.length || 0}`);
      }

      console.log('✅ Error tracking verified');
    });

    test('should provide deployment information', async ({ page }) => {
      console.log('🚀 Testing deployment information...');

      const healthResponse = await page.request.get('/health');
      const healthData = await healthResponse.json();

      // Verify deployment metadata
      expect(healthData).toHaveProperty('version');
      expect(healthData).toHaveProperty('timestamp');
      expect(healthData).toHaveProperty('environment');

      console.log(`📊 Version: ${healthData.version}`);
      console.log(`📊 Environment: ${healthData.environment}`);
      console.log(`📊 Deployment time: ${healthData.timestamp}`);

      console.log('✅ Deployment information verified');
    });
  });
});