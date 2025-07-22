/**
 * Memory Management Utilities for LP Creator
 * Handles large HTML content processing and cleanup strategies
 */

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface CleanupConfig {
  maxVariants: number;
  maxSuggestions: number;
  maxMessages: number;
  maxHTMLSize: number; // in bytes
  cleanupIntervalMs: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private config: CleanupConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryHistory: MemoryStats[] = [];
  private maxHistorySize = 50;

  private constructor(config?: Partial<CleanupConfig>) {
    this.config = {
      maxVariants: 5,
      maxSuggestions: 10,
      maxMessages: 50,
      maxHTMLSize: 1024 * 1024, // 1MB
      cleanupIntervalMs: 30000, // 30 seconds
      ...config
    };
  }

  public static getInstance(config?: Partial<CleanupConfig>): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager(config);
    }
    return MemoryManager.instance;
  }

  /**
   * Get current memory usage statistics
   */
  public getMemoryStats(): MemoryStats | null {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
    }
    return null;
  }

  /**
   * Track memory usage over time
   */
  public trackMemory(): void {
    const stats = this.getMemoryStats();
    if (stats) {
      this.memoryHistory.push(stats);
      
      // Keep only recent history
      if (this.memoryHistory.length > this.maxHistorySize) {
        this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize);
      }
    }
  }

  /**
   * Get memory usage trend
   */
  public getMemoryTrend(): { increasing: boolean; averageUsage: number; peakUsage: number } {
    if (this.memoryHistory.length < 2) {
      return { increasing: false, averageUsage: 0, peakUsage: 0 };
    }

    const recent = this.memoryHistory.slice(-10);
    const totalUsage = recent.reduce((sum, stat) => sum + stat.usedJSHeapSize, 0);
    const averageUsage = totalUsage / recent.length;
    const peakUsage = Math.max(...recent.map(stat => stat.usedJSHeapSize));
    
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, stat) => sum + stat.usedJSHeapSize, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, stat) => sum + stat.usedJSHeapSize, 0) / secondHalf.length;
    
    return {
      increasing: secondAvg > firstAvg * 1.1, // 10% increase threshold
      averageUsage,
      peakUsage
    };
  }

  /**
   * Check if memory usage is critical
   */
  public isMemoryCritical(): boolean {
    const stats = this.getMemoryStats();
    if (!stats) return false;
    
    const usageRatio = stats.usedJSHeapSize / stats.jsHeapSizeLimit;
    return usageRatio > 0.8; // 80% threshold
  }

  /**
   * Clean up large HTML content by chunking
   */
  public processLargeHTML(htmlContent: string): {
    chunks: string[];
    totalSize: number;
    needsChunking: boolean;
  } {
    const totalSize = new Blob([htmlContent]).size;
    const needsChunking = totalSize > this.config.maxHTMLSize;
    
    if (!needsChunking) {
      return {
        chunks: [htmlContent],
        totalSize,
        needsChunking: false
      };
    }

    // Split HTML into manageable chunks while preserving structure
    const chunks = this.chunkHTML(htmlContent, this.config.maxHTMLSize / 2);
    
    console.log(`📋 [Memory] Large HTML chunked: ${totalSize} bytes → ${chunks.length} chunks`);
    
    return {
      chunks,
      totalSize,
      needsChunking: true
    };
  }

  /**
   * Smart HTML chunking that preserves structure
   */
  private chunkHTML(html: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    let tagStack: string[] = [];
    let i = 0;

    while (i < html.length) {
      const char = html[i];
      currentChunk += char;

      // Track opening and closing tags
      if (char === '<') {
        const tagEnd = html.indexOf('>', i);
        if (tagEnd !== -1) {
          const tagContent = html.slice(i + 1, tagEnd);
          const tagName = tagContent.split(' ')[0].toLowerCase();
          
          if (tagContent.startsWith('/')) {
            // Closing tag
            const closingTag = tagName.substring(1);
            const stackIndex = tagStack.lastIndexOf(closingTag);
            if (stackIndex !== -1) {
              tagStack.splice(stackIndex, 1);
            }
          } else if (!tagContent.endsWith('/') && !this.isSelfClosingTag(tagName)) {
            // Opening tag
            tagStack.push(tagName);
          }
        }
      }

      // Check if we should create a new chunk
      if (currentChunk.length >= chunkSize && tagStack.length === 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      i++;
    }

    // Add remaining content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Check if tag is self-closing
   */
  private isSelfClosingTag(tagName: string): boolean {
    const selfClosingTags = [
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'
    ];
    return selfClosingTags.includes(tagName);
  }

  /**
   * Clean up application state to free memory
   */
  public cleanupAppState<T extends Record<string, any>>(
    state: T,
    cleanupRules: Partial<{
      variants: any[];
      suggestions: any[];
      messages: any[];
      htmlContent: string;
    }>
  ): T {
    const cleanedState = { ...state };
    
    // Clean up variants
    if (cleanupRules.variants && Array.isArray(cleanupRules.variants)) {
      if (cleanupRules.variants.length > this.config.maxVariants) {
        (cleanedState as any).variants = cleanupRules.variants.slice(0, this.config.maxVariants);
        console.log(`🧹 [Memory] Cleaned up variants: ${cleanupRules.variants.length} → ${this.config.maxVariants}`);
      }
    }

    // Clean up suggestions
    if (cleanupRules.suggestions && Array.isArray(cleanupRules.suggestions)) {
      if (cleanupRules.suggestions.length > this.config.maxSuggestions) {
        (cleanedState as any).suggestions = cleanupRules.suggestions.slice(0, this.config.maxSuggestions);
        console.log(`🧹 [Memory] Cleaned up suggestions: ${cleanupRules.suggestions.length} → ${this.config.maxSuggestions}`);
      }
    }

    // Clean up messages
    if (cleanupRules.messages && Array.isArray(cleanupRules.messages)) {
      if (cleanupRules.messages.length > this.config.maxMessages) {
        (cleanedState as any).messages = cleanupRules.messages.slice(-this.config.maxMessages);
        console.log(`🧹 [Memory] Cleaned up messages: ${cleanupRules.messages.length} → ${this.config.maxMessages}`);
      }
    }

    // Compress large HTML content
    if (cleanupRules.htmlContent && typeof cleanupRules.htmlContent === 'string') {
      const size = new Blob([cleanupRules.htmlContent]).size;
      if (size > this.config.maxHTMLSize) {
        // Store compressed version or chunked reference
        console.log(`🧹 [Memory] Large HTML content detected: ${size} bytes`);
        // Could implement compression here if needed
      }
    }

    return cleanedState;
  }

  /**
   * Force garbage collection (if available)
   */
  public forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
      console.log('🗑️ [Memory] Forced garbage collection');
    }
  }

  /**
   * Start automatic memory monitoring and cleanup
   */
  public startAutoCleanup(cleanupCallback?: (stats: MemoryStats) => void): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.trackMemory();
      
      const stats = this.getMemoryStats();
      if (stats) {
        const trend = this.getMemoryTrend();
        const isCritical = this.isMemoryCritical();
        
        if (isCritical || trend.increasing) {
          console.log(`⚠️ [Memory] ${isCritical ? 'Critical usage' : 'Increasing trend'} detected`, {
            current: `${Math.round(stats.usedJSHeapSize / 1024 / 1024)}MB`,
            limit: `${Math.round(stats.jsHeapSizeLimit / 1024 / 1024)}MB`,
            trend
          });
          
          if (cleanupCallback) {
            cleanupCallback(stats);
          }
        }
      }
    }, this.config.cleanupIntervalMs);

    console.log('🎯 [Memory] Started automatic cleanup monitoring');
  }

  /**
   * Stop automatic memory monitoring
   */
  public stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 [Memory] Stopped automatic cleanup monitoring');
    }
  }

  /**
   * Get cleanup recommendations based on current memory usage
   */
  public getCleanupRecommendations(): {
    priority: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const stats = this.getMemoryStats();
    const trend = this.getMemoryTrend();
    const recommendations: string[] = [];
    let priority: 'low' | 'medium' | 'high' = 'low';

    if (!stats) {
      return { priority, recommendations: ['Memory API not available'] };
    }

    const usageRatio = stats.usedJSHeapSize / stats.jsHeapSizeLimit;
    
    if (usageRatio > 0.8) {
      priority = 'high';
      recommendations.push('Critical: Clear unused variants and suggestions');
      recommendations.push('Critical: Force garbage collection');
      recommendations.push('Critical: Restart application if possible');
    } else if (usageRatio > 0.6 || trend.increasing) {
      priority = 'medium';
      recommendations.push('Medium: Clean up old messages');
      recommendations.push('Medium: Process large HTML content in chunks');
      recommendations.push('Medium: Clear component caches');
    } else if (usageRatio > 0.4) {
      priority = 'low';
      recommendations.push('Low: Monitor memory usage');
      recommendations.push('Low: Consider cleanup if memory keeps growing');
    }

    return { priority, recommendations };
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// React hook for memory monitoring
export function useMemoryManager() {
  const [memoryStats, setMemoryStats] = React.useState<MemoryStats | null>(null);
  const [recommendations, setRecommendations] = React.useState<{
    priority: 'low' | 'medium' | 'high';
    recommendations: string[];
  }>({ priority: 'low', recommendations: [] });

  React.useEffect(() => {
    const manager = MemoryManager.getInstance();
    
    const updateStats = () => {
      const stats = manager.getMemoryStats();
      setMemoryStats(stats);
      setRecommendations(manager.getCleanupRecommendations());
    };

    // Initial update
    updateStats();

    // Start monitoring
    manager.startAutoCleanup(updateStats);

    return () => {
      manager.stopAutoCleanup();
    };
  }, []);

  const forceCleanup = React.useCallback(() => {
    const manager = MemoryManager.getInstance();
    manager.forceGarbageCollection();
    
    // Update stats after cleanup
    setTimeout(() => {
      const stats = manager.getMemoryStats();
      setMemoryStats(stats);
      setRecommendations(manager.getCleanupRecommendations());
    }, 1000);
  }, []);

  return {
    memoryStats,
    recommendations,
    forceCleanup,
    isMemoryCritical: memoryStats ? memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit > 0.8 : false
  };
}

// Add React import for hook
import React from 'react';