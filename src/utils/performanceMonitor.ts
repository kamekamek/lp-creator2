/**
 * Performance Monitoring and Benchmarking Utilities
 * Tracks application performance metrics and benchmarks
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface BenchmarkResult {
  name: string;
  duration: number;
  status: 'pass' | 'fail' | 'warning';
  threshold: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface PerformanceReport {
  totalMetrics: number;
  averageTime: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
  failedBenchmarks: BenchmarkResult[];
  passedBenchmarks: BenchmarkResult[];
  recommendations: string[];
}

// Define benchmark thresholds
export const PERFORMANCE_BENCHMARKS = {
  LP_GENERATION: {
    target: 10000, // 10 seconds
    warning: 8000,
    name: 'LP Generation'
  },
  EDIT_OPERATION: {
    target: 100, // 100ms
    warning: 80,
    name: 'Edit Operation'
  },
  COMPONENT_RENDER: {
    target: 16, // 16ms for 60fps
    warning: 12,
    name: 'Component Render'
  },
  MEMORY_USAGE: {
    target: 100 * 1024 * 1024, // 100MB
    warning: 80 * 1024 * 1024,
    name: 'Memory Usage'
  },
  BUNDLE_SIZE: {
    target: 500 * 1024, // 500KB
    warning: 400 * 1024,
    name: 'Bundle Size'
  }
} as const;

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private benchmarkResults: BenchmarkResult[] = [];
  private isEnabled = true;
  private maxStoredMetrics = 1000;

  private constructor() {
    // Initialize performance observer if available
    this.initializePerformanceObserver();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance observer for automatic metric collection
   */
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe navigation and resource loading
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordAutoMetric(entry);
        }
      });

      observer.observe({ 
        entryTypes: ['navigation', 'resource', 'measure', 'mark'] 
      });

      console.log('🎯 [Performance] Observer initialized');
    } catch (error) {
      console.warn('Performance observer initialization failed:', error);
    }
  }

  /**
   * Record automatic metrics from PerformanceObserver
   */
  private recordAutoMetric(entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      name: `auto_${entry.name}`,
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
      duration: entry.duration,
      metadata: {
        type: entry.entryType,
        auto: true
      }
    };

    this.addCompletedMetric(metric);
  }

  /**
   * Start measuring a performance metric
   */
  public startMeasure(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.set(name, metric);

    // Create performance mark for DevTools
    if ('mark' in performance) {
      performance.mark(`${name}-start`);
    }

    console.log(`🏁 [Performance] Started measuring: ${name}`);
  }

  /**
   * End measuring a performance metric
   */
  public endMeasure(name: string, additionalMetadata?: Record<string, any>): number {
    if (!this.isEnabled) return 0;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' was not started`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      metadata: {
        ...metric.metadata,
        ...additionalMetadata
      }
    };

    // Create performance measure for DevTools
    if ('measure' in performance && 'mark' in performance) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (error) {
        // Ignore marking errors
      }
    }

    this.addCompletedMetric(completedMetric);
    this.metrics.delete(name);

    console.log(`🏁 [Performance] Completed measuring: ${name} (${duration.toFixed(2)}ms)`);

    // Run benchmark check
    this.checkBenchmark(name, duration);

    return duration;
  }

  /**
   * Add completed metric to storage
   */
  private addCompletedMetric(metric: PerformanceMetric): void {
    this.completedMetrics.push(metric);

    // Keep storage size manageable
    if (this.completedMetrics.length > this.maxStoredMetrics) {
      this.completedMetrics = this.completedMetrics.slice(-this.maxStoredMetrics);
    }
  }

  /**
   * Check if performance meets benchmark thresholds
   */
  private checkBenchmark(name: string, duration: number): void {
    let benchmark: typeof PERFORMANCE_BENCHMARKS[keyof typeof PERFORMANCE_BENCHMARKS] | null = null;

    // Match benchmark by name pattern
    if (name.toLowerCase().includes('generation') || name.toLowerCase().includes('lp')) {
      benchmark = PERFORMANCE_BENCHMARKS.LP_GENERATION;
    } else if (name.toLowerCase().includes('edit')) {
      benchmark = PERFORMANCE_BENCHMARKS.EDIT_OPERATION;
    } else if (name.toLowerCase().includes('render')) {
      benchmark = PERFORMANCE_BENCHMARKS.COMPONENT_RENDER;
    }

    if (!benchmark) return;

    let status: 'pass' | 'fail' | 'warning' = 'pass';
    
    if (duration > benchmark.target) {
      status = 'fail';
    } else if (duration > benchmark.warning) {
      status = 'warning';
    }

    const result: BenchmarkResult = {
      name: benchmark.name,
      duration,
      status,
      threshold: benchmark.target,
      timestamp: Date.now()
    };

    this.benchmarkResults.push(result);

    if (status === 'fail') {
      console.warn(`⚠️ [Benchmark] FAILED: ${benchmark.name} took ${duration.toFixed(2)}ms (threshold: ${benchmark.target}ms)`);
    } else if (status === 'warning') {
      console.warn(`⚠️ [Benchmark] WARNING: ${benchmark.name} took ${duration.toFixed(2)}ms (warning: ${benchmark.warning}ms)`);
    } else {
      console.log(`✅ [Benchmark] PASSED: ${benchmark.name} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Measure a function execution time
   */
  public measureFunction<T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): T | Promise<T> {
    this.startMeasure(name, metadata);

    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        this.endMeasure(name);
      });
    } else {
      this.endMeasure(name);
      return result;
    }
  }

  /**
   * Get performance report
   */
  public getReport(): PerformanceReport {
    const metrics = this.completedMetrics.filter(m => m.duration !== undefined);
    
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageTime: 0,
        slowestOperation: null,
        fastestOperation: null,
        failedBenchmarks: [],
        passedBenchmarks: [],
        recommendations: ['No performance data available']
      };
    }

    const durations = metrics.map(m => m.duration!);
    const averageTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    const slowestOperation = metrics.reduce((slowest, current) => 
      (current.duration! > slowest.duration!) ? current : slowest
    );
    
    const fastestOperation = metrics.reduce((fastest, current) => 
      (current.duration! < fastest.duration!) ? current : fastest
    );

    const failedBenchmarks = this.benchmarkResults.filter(b => b.status === 'fail');
    const passedBenchmarks = this.benchmarkResults.filter(b => b.status === 'pass');

    const recommendations = this.generateRecommendations(metrics, failedBenchmarks);

    return {
      totalMetrics: metrics.length,
      averageTime,
      slowestOperation,
      fastestOperation,
      failedBenchmarks,
      passedBenchmarks,
      recommendations
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    metrics: PerformanceMetric[],
    failedBenchmarks: BenchmarkResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow operations
    const slowOperations = metrics.filter(m => m.duration! > 1000); // > 1 second
    if (slowOperations.length > 0) {
      recommendations.push(`${slowOperations.length} operations took longer than 1 second - consider optimization`);
    }

    // Check failed benchmarks
    if (failedBenchmarks.length > 0) {
      recommendations.push(`${failedBenchmarks.length} performance benchmarks failed - review implementation`);
      
      const lpGenFailures = failedBenchmarks.filter(b => b.name.includes('Generation'));
      if (lpGenFailures.length > 0) {
        recommendations.push('LP Generation is slow - consider streaming or chunking');
      }
      
      const editFailures = failedBenchmarks.filter(b => b.name.includes('Edit'));
      if (editFailures.length > 0) {
        recommendations.push('Edit operations are slow - optimize DOM updates');
      }
    }

    // Check memory usage patterns
    const memoryMetrics = metrics.filter(m => m.name.includes('memory'));
    if (memoryMetrics.length > 0) {
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / memoryMetrics.length;
      if (avgMemory > PERFORMANCE_BENCHMARKS.MEMORY_USAGE.target) {
        recommendations.push('High memory usage detected - implement cleanup strategies');
      }
    }

    // Default recommendations if none generated
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
      recommendations.push('Continue monitoring for trends');
    }

    return recommendations;
  }

  /**
   * Clear all stored metrics and benchmarks
   */
  public clearMetrics(): void {
    this.metrics.clear();
    this.completedMetrics = [];
    this.benchmarkResults = [];
    console.log('🧹 [Performance] Cleared all metrics');
  }

  /**
   * Enable/disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🎯 [Performance] Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Export performance data for analysis
   */
  public exportData(): {
    metrics: PerformanceMetric[];
    benchmarks: BenchmarkResult[];
    timestamp: number;
  } {
    return {
      metrics: [...this.completedMetrics],
      benchmarks: [...this.benchmarkResults],
      timestamp: Date.now()
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const [report, setReport] = React.useState<PerformanceReport | null>(null);
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  const updateReport = React.useCallback(() => {
    const newReport = performanceMonitor.getReport();
    setReport(newReport);
  }, []);

  React.useEffect(() => {
    // Update report every 5 seconds when monitoring
    let interval: NodeJS.Timeout | null = null;
    
    if (isMonitoring) {
      updateReport(); // Initial update
      interval = setInterval(updateReport, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isMonitoring, updateReport]);

  const startMonitoring = React.useCallback(() => {
    setIsMonitoring(true);
    performanceMonitor.setEnabled(true);
    console.log('🎯 Started performance monitoring');
  }, []);

  const stopMonitoring = React.useCallback(() => {
    setIsMonitoring(false);
    updateReport(); // Final update
    console.log('🛑 Stopped performance monitoring');
  }, [updateReport]);

  const clearData = React.useCallback(() => {
    performanceMonitor.clearMetrics();
    setReport(null);
  }, []);

  const measureAsync = React.useCallback(async <T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return performanceMonitor.measureFunction(name, fn, metadata) as Promise<T>;
  }, []);

  const measureSync = React.useCallback(<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T => {
    return performanceMonitor.measureFunction(name, fn, metadata) as T;
  }, []);

  return {
    report,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearData,
    measureAsync,
    measureSync,
    updateReport
  };
}

// Add React import for hook
import React from 'react';