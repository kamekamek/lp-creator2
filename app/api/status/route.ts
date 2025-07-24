/**
 * Status API Route
 * Provides detailed system status and monitoring dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { productionMonitor, logInfo } from '../../../src/utils/productionMonitoring';
import { EdgePerformanceMonitor } from '../../../src/utils/edgeRuntime';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logInfo('Status dashboard requested', 'StatusAPI', {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for')
    });

    // Get comprehensive monitoring data
    const monitoringData = productionMonitor.getDashboardData();
    
    // Get performance metrics
    const performanceMetrics = EdgePerformanceMonitor.getMetrics();
    
    // Build status dashboard
    const statusData = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      runtime: process.env.EDGE_RUNTIME ? 'edge' : 'node',
      
      // Overall health
      health: {
        status: monitoringData.systemHealth.status,
        checks: monitoringData.systemHealth.checks,
        lastUpdate: new Date().toISOString()
      },

      // Performance metrics
      performance: {
        recent: performanceMetrics.slice(-20), // Last 20 operations
        summary: getPerformanceSummary(performanceMetrics),
        thresholds: {
          responseTime: 5000,
          memoryUsage: 100 * 1024 * 1024
        }
      },

      // Error tracking
      errors: {
        total: monitoringData.errorSummary.total,
        bySeverity: monitoringData.errorSummary.bySeverity,
        recent: monitoringData.errorSummary.recent.map(error => ({
          timestamp: error.timestamp,
          context: error.context,
          severity: error.severity,
          message: error.error.message,
          fingerprint: error.fingerprint
        })),
        trends: getErrorTrends(monitoringData.errorSummary.recent)
      },

      // System metrics
      system: {
        uptime: process.uptime ? process.uptime() : 0,
        memory: getMemoryStats(),
        requests: getRequestStats(monitoringData.metrics),
        responses: getResponseStats(monitoringData.metrics)
      },

      // Feature usage
      features: {
        lpGeneration: getLPGenerationStats(monitoringData.metrics),
        apiRequests: getAPIRequestStats(monitoringData.metrics),
        errors: getErrorRateStats(monitoringData.metrics)
      },

      // Logs summary
      logs: {
        total: monitoringData.recentLogs.length,
        byLevel: getLogsByLevel(monitoringData.recentLogs),
        recent: monitoringData.recentLogs.slice(-10).map(log => ({
          timestamp: log.timestamp,
          level: log.level,
          message: log.message,
          context: log.context
        }))
      }
    };

    // Track status request
    productionMonitor.trackMetric('status_request_duration', Date.now() - startTime, {}, 'ms');

    return NextResponse.json(statusData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Data-Freshness': new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Status request failed:', error);
    
    productionMonitor.trackError(error as Error, 'StatusAPI', {
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      error: 'Status data unavailable',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

/**
 * Export monitoring data for external systems
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { format = 'json', includeMetrics = true, includeLogs = false } = await request.json();

    logInfo('Status export requested', 'StatusAPI', {
      format,
      includeMetrics,
      includeLogs
    });

    let exportData;

    if (format === 'prometheus') {
      exportData = exportPrometheusMetrics();
    } else if (format === 'csv') {
      exportData = productionMonitor.exportData('csv');
    } else {
      // Default JSON export
      const data = productionMonitor.exportData('json');
      const parsed = JSON.parse(data);

      if (!includeMetrics) {
        delete parsed.metrics;
      }

      if (!includeLogs) {
        delete parsed.logs;
      }

      exportData = JSON.stringify(parsed, null, 2);
    }

    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : 'text/plain',
        'Content-Disposition': `attachment; filename="lp-creator-monitoring-${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'json'}"`
      }
    });

  } catch (error) {
    productionMonitor.trackError(error as Error, 'StatusExport', {
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions

function getPerformanceSummary(metrics: any[]) {
  if (metrics.length === 0) return null;

  const durations = metrics.map(m => m.duration);
  return {
    count: metrics.length,
    avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    recentAvg: durations.slice(-10).reduce((sum, d) => sum + d, 0) / Math.min(10, durations.length)
  };
}

function getErrorTrends(errors: any[]) {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  const lastHour = errors.filter(e => now - new Date(e.timestamp).getTime() < oneHour).length;
  const lastDay = errors.filter(e => now - new Date(e.timestamp).getTime() < oneDay).length;

  return {
    lastHour,
    lastDay,
    total: errors.length
  };
}

function getMemoryStats() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      used: usage.heapUsed,
      total: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers
    };
  }
  return null;
}

function getRequestStats(metrics: any[]) {
  const requestMetrics = metrics.filter(m => m.name === 'api_request_count');
  
  return {
    total: requestMetrics.length,
    recent: requestMetrics.slice(-100).length,
    avgPerHour: calculateAveragePerHour(requestMetrics)
  };
}

function getResponseStats(metrics: any[]) {
  const responseMetrics = metrics.filter(m => m.name === 'api_request_duration');
  
  if (responseMetrics.length === 0) return null;

  const durations = responseMetrics.map(m => m.value);
  return {
    avgResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    slowRequests: responseMetrics.filter(m => m.value > 5000).length,
    fastRequests: responseMetrics.filter(m => m.value < 1000).length
  };
}

function getLPGenerationStats(metrics: any[]) {
  const lpMetrics = metrics.filter(m => m.name.startsWith('lp_'));
  
  const generations = lpMetrics.filter(m => m.name === 'lp_generation_count');
  const successes = generations.filter(m => m.tags?.success === 'true');
  const errors = lpMetrics.filter(m => m.name === 'lp_generation_errors');

  return {
    total: generations.length,
    successful: successes.length,
    failed: errors.length,
    successRate: generations.length > 0 ? (successes.length / generations.length) * 100 : 0
  };
}

function getAPIRequestStats(metrics: any[]) {
  const apiMetrics = metrics.filter(m => m.name === 'api_request_count');
  const errorMetrics = metrics.filter(m => m.name === 'api_error_count');
  
  return {
    total: apiMetrics.length,
    errors: errorMetrics.length,
    errorRate: apiMetrics.length > 0 ? (errorMetrics.length / apiMetrics.length) * 100 : 0
  };
}

function getErrorRateStats(metrics: any[]) {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  const recentErrors = metrics.filter(m => 
    m.name === 'api_error_count' && 
    now - new Date(m.timestamp).getTime() < oneHour
  );
  
  const recentRequests = metrics.filter(m => 
    m.name === 'api_request_count' && 
    now - new Date(m.timestamp).getTime() < oneHour
  );

  return {
    errorsLastHour: recentErrors.length,
    requestsLastHour: recentRequests.length,
    errorRateLastHour: recentRequests.length > 0 ? (recentErrors.length / recentRequests.length) * 100 : 0
  };
}

function getLogsByLevel(logs: any[]) {
  return logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function calculateAveragePerHour(metrics: any[]) {
  if (metrics.length === 0) return 0;

  const timeSpan = Date.now() - new Date(metrics[0].timestamp).getTime();
  const hours = timeSpan / (60 * 60 * 1000);
  
  return hours > 0 ? metrics.length / hours : metrics.length;
}

function exportPrometheusMetrics() {
  // Export metrics in Prometheus format
  const monitoringData = productionMonitor.getDashboardData();
  
  let prometheusData = '# HELP lp_creator_metrics LP Creator application metrics\n';
  prometheusData += '# TYPE lp_creator_metrics gauge\n';
  
  // Convert metrics to Prometheus format
  monitoringData.metrics.forEach(metric => {
    const labels = metric.tags ? 
      Object.entries(metric.tags).map(([k, v]) => `${k}="${v}"`).join(',') : '';
    
    prometheusData += `lp_creator_${metric.name.replace(/-/g, '_')}{${labels}} ${metric.value}\n`;
  });

  // Add system health metrics
  prometheusData += `lp_creator_health_status{status="${monitoringData.systemHealth.status}"} 1\n`;
  prometheusData += `lp_creator_errors_total ${monitoringData.errorSummary.total}\n`;
  
  return prometheusData;
}