/**
 * Edge Runtime Configuration and Optimization
 * Optimizes the application for Edge Runtime deployment
 */

// Edge Runtime compatibility check
export const isEdgeRuntime = () => {
  return typeof EdgeRuntime !== 'undefined';
};

// Edge-compatible configuration
export const edgeConfig = {
  // Runtime configuration
  runtime: 'edge' as const,
  
  // Regional deployment preferences
  regions: [
    'iad1', // US East (Northern Virginia)
    'nrt1', // Asia-Pacific (Tokyo)
    'fra1', // Europe (Frankfurt)
    'syd1', // Asia-Pacific (Sydney)
    'sfo1'  // US West (San Francisco)
  ],
  
  // Memory and CPU limits
  limits: {
    memory: '128MB',
    timeout: '30s',
    maxRequestSize: '4MB'
  },
  
  // Caching configuration
  cache: {
    // Static assets cache duration
    staticAssets: '31536000', // 1 year
    // API responses cache duration
    apiResponses: '300', // 5 minutes
    // HTML pages cache duration
    htmlPages: '3600' // 1 hour
  }
};

/**
 * Edge-compatible JSON parser
 * Handles large JSON payloads efficiently in Edge Runtime
 */
export class EdgeJSONParser {
  static parse<T>(text: string): T {
    try {
      // Use streaming parser for large payloads in Edge Runtime
      if (isEdgeRuntime() && text.length > 100000) {
        return this.parseStreaming<T>(text);
      }
      return JSON.parse(text);
    } catch (error) {
      console.error('🚫 [EdgeRuntime] JSON parse error:', error);
      throw new Error('Invalid JSON format');
    }
  }

  private static parseStreaming<T>(text: string): T {
    // Implement streaming JSON parsing for Edge Runtime
    // This is a simplified implementation
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error('JSON parsing failed in streaming mode');
    }
  }

  static stringify(value: any): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.error('🚫 [EdgeRuntime] JSON stringify error:', error);
      throw new Error('JSON stringify failed');
    }
  }
}

/**
 * Edge-compatible fetch wrapper
 * Optimizes network requests for Edge Runtime
 */
export class EdgeFetch {
  private static defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'LP-Creator-Edge/1.0'
    }
  };

  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const mergedOptions: RequestInit = {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers
      }
    };

    // Add timeout for Edge Runtime
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch(url, {
        ...mergedOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request timeout in Edge Runtime');
      }
      
      throw error;
    }
  }

  static async json<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetch(url, options);
    const text = await response.text();
    return EdgeJSONParser.parse<T>(text);
  }
}

/**
 * Edge Runtime memory optimization
 */
export class EdgeMemoryManager {
  private static memoryThreshold = 100 * 1024 * 1024; // 100MB

  static checkMemoryUsage(): { used: number; available: number; warning: boolean } {
    if (!isEdgeRuntime()) {
      return { used: 0, available: Infinity, warning: false };
    }

    // Edge Runtime memory checking (simplified)
    const used = (process.memoryUsage?.().heapUsed || 0);
    const available = this.memoryThreshold - used;
    const warning = used > this.memoryThreshold * 0.8;

    if (warning) {
      console.warn(`⚠️ [EdgeRuntime] High memory usage: ${Math.round(used / 1024 / 1024)}MB`);
    }

    return { used, available, warning };
  }

  static optimizeForEdge<T>(data: T): T {
    if (!isEdgeRuntime()) {
      return data;
    }

    // Optimize data structures for Edge Runtime
    if (typeof data === 'object' && data !== null) {
      // Remove undefined properties to save memory
      return JSON.parse(JSON.stringify(data));
    }

    return data;
  }

  static async cleanupMemory(): Promise<void> {
    if (!isEdgeRuntime()) {
      return;
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clear any cached data that's not essential
    // This would be implemented based on specific caching strategy
  }
}

/**
 * Edge Runtime error handling
 */
export class EdgeErrorHandler {
  static handleEdgeError(error: Error, context: string): Response {
    console.error(`🚫 [EdgeRuntime] Error in ${context}:`, error);

    // Return appropriate response for Edge Runtime
    const errorResponse = {
      error: 'Internal Server Error',
      message: 'An error occurred in Edge Runtime',
      timestamp: new Date().toISOString(),
      context
    };

    return new Response(EdgeJSONParser.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }

  static handleTimeout(): Response {
    const timeoutResponse = {
      error: 'Request Timeout',
      message: 'The request exceeded the Edge Runtime timeout limit',
      timestamp: new Date().toISOString()
    };

    return new Response(EdgeJSONParser.stringify(timeoutResponse), {
      status: 408,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

/**
 * Edge Runtime performance monitoring
 */
export class EdgePerformanceMonitor {
  private static metrics: Array<{
    name: string;
    duration: number;
    timestamp: number;
    memoryUsage: number;
  }> = [];

  static startTimer(name: string): () => void {
    const startTime = Date.now();
    const startMemory = EdgeMemoryManager.checkMemoryUsage().used;

    return () => {
      const duration = Date.now() - startTime;
      const endMemory = EdgeMemoryManager.checkMemoryUsage().used;
      
      this.metrics.push({
        name,
        duration,
        timestamp: Date.now(),
        memoryUsage: endMemory - startMemory
      });

      // Keep only recent metrics to save memory
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-50);
      }

      if (duration > 5000) {
        console.warn(`⚠️ [EdgeRuntime] Slow operation: ${name} took ${duration}ms`);
      }
    };
  }

  static getMetrics() {
    return [...this.metrics];
  }

  static clearMetrics() {
    this.metrics = [];
  }
}

/**
 * Edge Runtime response headers
 */
export const getEdgeResponseHeaders = (options: {
  cacheControl?: string;
  cors?: boolean;
  compression?: boolean;
} = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Edge-Runtime': 'true',
    'X-Powered-By': 'LP-Creator-Edge'
  };

  // Cache control
  if (options.cacheControl) {
    headers['Cache-Control'] = options.cacheControl;
  }

  // CORS headers
  if (options.cors) {
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }

  // Compression
  if (options.compression) {
    headers['Content-Encoding'] = 'gzip';
  }

  // Security headers
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-Frame-Options'] = 'DENY';
  headers['X-XSS-Protection'] = '1; mode=block';
  headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';

  return headers;
};

/**
 * Edge Runtime environment validation
 */
export const validateEdgeEnvironment = (): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check runtime compatibility
  if (!isEdgeRuntime()) {
    issues.push('Not running in Edge Runtime environment');
    recommendations.push('Deploy to Edge Runtime for optimal performance');
  }

  // Check memory usage
  const memory = EdgeMemoryManager.checkMemoryUsage();
  if (memory.warning) {
    issues.push('High memory usage detected');
    recommendations.push('Optimize data structures and implement memory cleanup');
  }

  // Check performance metrics
  const metrics = EdgePerformanceMonitor.getMetrics();
  const slowOperations = metrics.filter(m => m.duration > 10000);
  if (slowOperations.length > 0) {
    issues.push('Slow operations detected');
    recommendations.push('Optimize slow operations or implement caching');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
};

// Export runtime configuration for Next.js
export const runtime = edgeConfig.runtime;