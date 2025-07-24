/**
 * Production Monitoring and Logging System
 * Comprehensive monitoring for production environment
 */

export interface MonitoringConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  services: {
    analytics: boolean;
    errorTracking: boolean;
    performanceMonitoring: boolean;
    uptime: boolean;
  };
  sampling: {
    errors: number; // 0-1, percentage of errors to track
    performance: number; // 0-1, percentage of requests to monitor
    analytics: number; // 0-1, percentage of events to track
  };
  thresholds: {
    responseTime: number; // ms
    errorRate: number; // percentage
    memoryUsage: number; // bytes
    cpuUsage: number; // percentage
  };
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
  unit?: 'ms' | 'bytes' | 'percent' | 'count';
}

export interface ErrorReport {
  error: Error;
  context: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

export class ProductionMonitor {
  private static instance: ProductionMonitor;
  private config: MonitoringConfig;
  private metrics: MetricData[] = [];
  private logs: LogEntry[] = [];
  private errors: ErrorReport[] = [];
  private maxRetainedEntries = 1000;

  private constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      services: {
        analytics: true,
        errorTracking: true,
        performanceMonitoring: true,
        uptime: true
      },
      sampling: {
        errors: 1.0, // Track all errors in production
        performance: 0.1, // Sample 10% of requests
        analytics: 0.5 // Sample 50% of analytics events
      },
      thresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 5, // 5%
        memoryUsage: 512 * 1024 * 1024, // 512MB
        cpuUsage: 80 // 80%
      }
    };

    // Initialize monitoring services
    this.initializeServices();
  }

  public static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  /**
   * Log message with appropriate level
   */
  public log(level: LogEntry['level'], message: string, context?: string, metadata?: Record<string, any>): void {
    if (!this.config.enabled) return;
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
      requestId: this.generateRequestId(),
      traceId: this.generateTraceId()
    };

    this.logs.push(logEntry);
    this.maintainLogSize();

    // Output to console in development
    if (process.env.NODE_ENV === 'development') {
      console[level](`[${level.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}`, metadata || '');
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    }
  }

  /**
   * Track performance metric
   */
  public trackMetric(name: string, value: number, tags?: Record<string, string>, unit?: MetricData['unit']): void {
    if (!this.config.enabled || !this.config.services.performanceMonitoring) return;
    if (!this.shouldSample('performance')) return;

    const metric: MetricData = {
      name,
      value,
      timestamp: new Date().toISOString(),
      tags,
      unit
    };

    this.metrics.push(metric);
    this.maintainMetricsSize();

    // Check thresholds
    this.checkThresholds(metric);

    // Send to monitoring service
    this.sendToMonitoringService(metric);

    this.log('debug', `Metric tracked: ${name} = ${value}${unit || ''}`, 'Monitoring', { tags });
  }

  /**
   * Track error with context
   */
  public trackError(error: Error, context: string, metadata?: Record<string, any>): void {
    if (!this.config.enabled || !this.config.services.errorTracking) return;
    if (!this.shouldSample('errors')) return;

    const errorReport: ErrorReport = {
      error,
      context,
      timestamp: new Date().toISOString(),
      severity: this.classifyErrorSeverity(error, context),
      fingerprint: this.generateErrorFingerprint(error, context),
      stackTrace: error.stack,
      metadata,
      userId: metadata?.userId,
      sessionId: metadata?.sessionId,
      userAgent: metadata?.userAgent,
      url: metadata?.url
    };

    this.errors.push(errorReport);
    this.maintainErrorsSize();

    // Log error
    this.log('error', `Error in ${context}: ${error.message}`, context, {
      stack: error.stack,
      fingerprint: errorReport.fingerprint,
      severity: errorReport.severity,
      ...metadata
    });

    // Send to error tracking service
    this.sendToErrorTrackingService(errorReport);

    // Alert for critical errors
    if (errorReport.severity === 'critical') {
      this.sendCriticalAlert(errorReport);
    }
  }

  /**
   * Track user analytics event
   */
  public trackAnalytics(event: string, properties?: Record<string, any>, userId?: string): void {
    if (!this.config.enabled || !this.config.services.analytics) return;
    if (!this.shouldSample('analytics')) return;

    const analyticsData = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userAgent: this.getUserAgent(),
        url: this.getCurrentUrl()
      },
      userId,
      sessionId: this.getSessionId()
    };

    this.log('info', `Analytics event: ${event}`, 'Analytics', analyticsData);
    this.sendToAnalyticsService(analyticsData);
  }

  /**
   * Track API request performance
   */
  public trackAPIRequest(endpoint: string, method: string, duration: number, statusCode: number, userId?: string): void {
    const tags = {
      endpoint,
      method,
      status: statusCode.toString(),
      userId: userId || 'anonymous'
    };

    this.trackMetric('api_request_duration', duration, tags, 'ms');
    this.trackMetric('api_request_count', 1, tags, 'count');

    if (statusCode >= 400) {
      this.trackMetric('api_error_count', 1, tags, 'count');
    }

    // Track slow requests
    if (duration > this.config.thresholds.responseTime) {
      this.log('warn', `Slow API request: ${method} ${endpoint} took ${duration}ms`, 'Performance', { tags });
    }
  }

  /**
   * Track LP generation performance
   */
  public trackLPGeneration(duration: number, success: boolean, model?: string, tokensUsed?: number): void {
    const tags = {
      success: success.toString(),
      model: model || 'unknown'
    };

    this.trackMetric('lp_generation_duration', duration, tags, 'ms');
    this.trackMetric('lp_generation_count', 1, tags, 'count');

    if (tokensUsed) {
      this.trackMetric('lp_tokens_used', tokensUsed, tags, 'count');
    }

    if (!success) {
      this.trackMetric('lp_generation_errors', 1, tags, 'count');
    }
  }

  /**
   * Get monitoring dashboard data
   */
  public getDashboardData(): {
    metrics: MetricData[];
    recentLogs: LogEntry[];
    errorSummary: {
      total: number;
      bySeverity: Record<string, number>;
      recent: ErrorReport[];
    };
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical';
      checks: Array<{ name: string; status: 'pass' | 'fail'; message?: string }>;
    };
  } {
    const recentMetrics = this.metrics.slice(-100);
    const recentLogs = this.logs.slice(-50);
    const recentErrors = this.errors.slice(-20);

    const errorSummary = {
      total: this.errors.length,
      bySeverity: this.errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent: recentErrors
    };

    const systemHealth = this.getSystemHealth();

    return {
      metrics: recentMetrics,
      recentLogs,
      errorSummary,
      systemHealth
    };
  }

  /**
   * Export monitoring data for analysis
   */
  public exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      exportTime: new Date().toISOString(),
      config: this.config,
      metrics: this.metrics,
      logs: this.logs,
      errors: this.errors.map(error => ({
        ...error,
        error: {
          name: error.error.name,
          message: error.error.message,
          stack: error.error.stack
        }
      }))
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export for metrics
      const csvHeader = 'timestamp,name,value,unit,tags\n';
      const csvData = this.metrics.map(metric => 
        `${metric.timestamp},${metric.name},${metric.value},${metric.unit || ''},${JSON.stringify(metric.tags || {})}`
      ).join('\n');
      
      return csvHeader + csvData;
    }
  }

  // Private methods

  private initializeServices(): void {
    if (!this.config.enabled) return;

    // Start health checks
    if (this.config.services.uptime) {
      this.startHealthChecks();
    }

    // Initialize error boundaries
    if (this.config.services.errorTracking) {
      this.initializeErrorBoundaries();
    }

    this.log('info', 'Production monitoring initialized', 'Monitoring', {
      config: this.config,
      environment: process.env.NODE_ENV
    });
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private shouldSample(type: keyof MonitoringConfig['sampling']): boolean {
    return Math.random() < this.config.sampling[type];
  }

  private classifyErrorSeverity(error: Error, context: string): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('timeout')) {
      return 'medium';
    }
    
    if (message.includes('permission') || message.includes('auth')) {
      return 'high';
    }
    
    if (context.includes('api') && message.includes('500')) {
      return 'critical';
    }
    
    return 'low';
  }

  private generateErrorFingerprint(error: Error, context: string): string {
    const content = `${error.name}:${error.message}:${context}`;
    return this.simpleHash(content).toString(16);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private maintainLogSize(): void {
    if (this.logs.length > this.maxRetainedEntries) {
      this.logs = this.logs.slice(-this.maxRetainedEntries);
    }
  }

  private maintainMetricsSize(): void {
    if (this.metrics.length > this.maxRetainedEntries) {
      this.metrics = this.metrics.slice(-this.maxRetainedEntries);
    }
  }

  private maintainErrorsSize(): void {
    if (this.errors.length > this.maxRetainedEntries) {
      this.errors = this.errors.slice(-this.maxRetainedEntries);
    }
  }

  private checkThresholds(metric: MetricData): void {
    if (metric.name === 'api_request_duration' && metric.value > this.config.thresholds.responseTime) {
      this.log('warn', `Response time threshold exceeded: ${metric.value}ms`, 'Performance', { metric });
    }
    
    if (metric.name === 'memory_usage' && metric.value > this.config.thresholds.memoryUsage) {
      this.log('warn', `Memory usage threshold exceeded: ${Math.round(metric.value / 1024 / 1024)}MB`, 'Performance');
    }
  }

  private getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{ name: string; status: 'pass' | 'fail'; message?: string }>;
  } {
    const checks = [
      {
        name: 'Error Rate',
        status: this.calculateErrorRate() < this.config.thresholds.errorRate ? 'pass' : 'fail' as const,
        message: `${this.calculateErrorRate().toFixed(2)}% error rate`
      },
      {
        name: 'Memory Usage',
        status: this.getCurrentMemoryUsage() < this.config.thresholds.memoryUsage ? 'pass' : 'fail' as const,
        message: `${Math.round(this.getCurrentMemoryUsage() / 1024 / 1024)}MB used`
      },
      {
        name: 'Recent Errors',
        status: this.getRecentCriticalErrors() === 0 ? 'pass' : 'fail' as const,
        message: `${this.getRecentCriticalErrors()} critical errors in last hour`
      }
    ];

    const failedChecks = checks.filter(check => check.status === 'fail').length;
    const status = failedChecks === 0 ? 'healthy' : failedChecks <= 1 ? 'warning' : 'critical';

    return { status, checks };
  }

  private calculateErrorRate(): number {
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - new Date(m.timestamp).getTime() < 3600000 // Last hour
    );
    
    const totalRequests = recentMetrics.filter(m => m.name === 'api_request_count').length;
    const errorRequests = recentMetrics.filter(m => m.name === 'api_error_count').length;
    
    return totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
  }

  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  private getRecentCriticalErrors(): number {
    const oneHourAgo = Date.now() - 3600000;
    return this.errors.filter(error => 
      error.severity === 'critical' && 
      new Date(error.timestamp).getTime() > oneHourAgo
    ).length;
  }

  private startHealthChecks(): void {
    // Periodic health checks
    setInterval(() => {
      this.trackMetric('memory_usage', this.getCurrentMemoryUsage(), {}, 'bytes');
      this.trackMetric('uptime', Date.now(), {}, 'ms');
    }, 60000); // Every minute
  }

  private initializeErrorBoundaries(): void {
    // Global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError(event.error, 'Global Error Handler', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(new Error(event.reason), 'Unhandled Promise Rejection', {
          reason: event.reason
        });
      });
    }
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'Server';
  }

  private getCurrentUrl(): string {
    return typeof window !== 'undefined' ? window.location.href : 'Server';
  }

  private getSessionId(): string {
    // Simple session ID generation
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // External service integration methods (implement based on chosen services)
  private sendToLoggingService(logEntry: LogEntry): void {
    // Implement integration with logging service (e.g., LogRocket, DataDog)
    console.log('📊 [Monitoring] Log sent to external service:', logEntry);
  }

  private sendToMonitoringService(metric: MetricData): void {
    // Implement integration with monitoring service (e.g., New Relic, DataDog)
    console.log('📈 [Monitoring] Metric sent to external service:', metric);
  }

  private sendToErrorTrackingService(errorReport: ErrorReport): void {
    // Implement integration with error tracking service (e.g., Sentry, Bugsnag)
    console.error('🚨 [Monitoring] Error sent to external service:', errorReport);
  }

  private sendToAnalyticsService(analyticsData: any): void {
    // Implement integration with analytics service (e.g., Google Analytics, Mixpanel)
    console.log('📊 [Monitoring] Analytics sent to external service:', analyticsData);
  }

  private sendCriticalAlert(errorReport: ErrorReport): void {
    // Implement critical alert system (e.g., Slack, email, PagerDuty)
    console.error('🚨 [CRITICAL ALERT] Critical error detected:', errorReport);
  }
}

// Export singleton instance
export const productionMonitor = ProductionMonitor.getInstance();

// Convenience functions
export const logInfo = (message: string, context?: string, metadata?: Record<string, any>) => {
  productionMonitor.log('info', message, context, metadata);
};

export const logError = (message: string, context?: string, metadata?: Record<string, any>) => {
  productionMonitor.log('error', message, context, metadata);
};

export const logWarn = (message: string, context?: string, metadata?: Record<string, any>) => {
  productionMonitor.log('warn', message, context, metadata);
};

export const trackMetric = (name: string, value: number, tags?: Record<string, string>, unit?: MetricData['unit']) => {
  productionMonitor.trackMetric(name, value, tags, unit);
};

export const trackError = (error: Error, context: string, metadata?: Record<string, any>) => {
  productionMonitor.trackError(error, context, metadata);
};

export const trackAnalytics = (event: string, properties?: Record<string, any>, userId?: string) => {
  productionMonitor.trackAnalytics(event, properties, userId);
};