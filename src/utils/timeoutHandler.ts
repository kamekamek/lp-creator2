/**
 * Timeout Handling with Fallback Mechanisms
 * Manages long-running operations with proper timeout handling and user feedback
 */

export interface TimeoutConfig {
  defaultTimeout: number;
  lpGenerationTimeout: number;
  apiRequestTimeout: number;
  fileOperationTimeout: number;
  showProgressAfter: number;
  enableFallbacks: boolean;
}

export interface TimeoutOperation<T> {
  id: string;
  name: string;
  startTime: number;
  timeout: number;
  operation: () => Promise<T>;
  fallback?: () => Promise<T>;
  onProgress?: (elapsed: number, progress: number) => void;
  onTimeout?: () => void;
}

export class TimeoutHandler {
  private static instance: TimeoutHandler;
  private config: TimeoutConfig;
  private activeOperations = new Map<string, {
    timeoutId: NodeJS.Timeout;
    progressInterval?: NodeJS.Timeout;
    startTime: number;
  }>();

  private constructor() {
    this.config = {
      defaultTimeout: 30000, // 30 seconds
      lpGenerationTimeout: 120000, // 2 minutes
      apiRequestTimeout: 30000, // 30 seconds
      fileOperationTimeout: 60000, // 1 minute
      showProgressAfter: 3000, // Show progress after 3 seconds
      enableFallbacks: true
    };
  }

  public static getInstance(): TimeoutHandler {
    if (!TimeoutHandler.instance) {
      TimeoutHandler.instance = new TimeoutHandler();
    }
    return TimeoutHandler.instance;
  }

  /**
   * Execute operation with timeout handling
   */
  public async executeWithTimeout<T>(
    operation: TimeoutOperation<T>
  ): Promise<{ success: boolean; result?: T; timedOut: boolean; elapsed: number }> {
    const startTime = Date.now();
    
    console.log(`⏰ [TimeoutHandler] Starting operation: ${operation.name} (timeout: ${operation.timeout}ms)`);

    return new Promise<{ success: boolean; result?: T; timedOut: boolean; elapsed: number }>((resolve) => {
      let completed = false;
      let progressInterval: NodeJS.Timeout | undefined;

      // Set up timeout
      const timeoutId = setTimeout(async () => {
        if (completed) return;
        completed = true;

        const elapsed = Date.now() - startTime;
        console.warn(`⏰ [TimeoutHandler] Operation timed out: ${operation.name} (${elapsed}ms)`);

        // Clear progress interval
        if (progressInterval) {
          clearInterval(progressInterval);
        }

        // Call timeout callback
        if (operation.onTimeout) {
          operation.onTimeout();
        }

        // Try fallback if available
        if (this.config.enableFallbacks && operation.fallback) {
          console.log(`🛡️ [TimeoutHandler] Attempting fallback for: ${operation.name}`);
          
          try {
            const fallbackResult = await operation.fallback();
            resolve({
              success: true,
              result: fallbackResult,
              timedOut: true,
              elapsed: Date.now() - startTime
            });
          } catch (fallbackError) {
            console.error(`🛡️ [TimeoutHandler] Fallback failed for: ${operation.name}`, fallbackError);
            resolve({
              success: false,
              timedOut: true,
              elapsed: Date.now() - startTime
            });
          }
        } else {
          resolve({
            success: false,
            timedOut: true,
            elapsed: Date.now() - startTime
          });
        }

        this.activeOperations.delete(operation.id);
      }, operation.timeout);

      // Set up progress tracking
      if (operation.onProgress) {
        setTimeout(() => {
          if (completed) return;

          progressInterval = setInterval(() => {
            if (completed) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / operation.timeout) * 100, 95); // Max 95% until complete
            
            if (operation.onProgress) {
              operation.onProgress(elapsed, progress);
            }
          }, 500); // Update every 500ms
        }, this.config.showProgressAfter);
      }

      // Store operation reference
      this.activeOperations.set(operation.id, {
        timeoutId,
        progressInterval,
        startTime
      });

      // Execute the actual operation
      operation.operation()
        .then((result) => {
          if (completed) return;
          completed = true;

          const elapsed = Date.now() - startTime;
          console.log(`✅ [TimeoutHandler] Operation completed: ${operation.name} (${elapsed}ms)`);

          // Final progress update
          if (operation.onProgress) {
            operation.onProgress(elapsed, 100);
          }

          clearTimeout(timeoutId);
          if (progressInterval) {
            clearInterval(progressInterval);
          }

          resolve({
            success: true,
            result,
            timedOut: false,
            elapsed
          });

          this.activeOperations.delete(operation.id);
        })
        .catch((error) => {
          if (completed) return;
          completed = true;

          const elapsed = Date.now() - startTime;
          console.error(`❌ [TimeoutHandler] Operation failed: ${operation.name} (${elapsed}ms)`, error);

          clearTimeout(timeoutId);
          if (progressInterval) {
            clearInterval(progressInterval);
          }

          resolve({
            success: false,
            timedOut: false,
            elapsed
          });

          this.activeOperations.delete(operation.id);
        });
    });
  }

  /**
   * Execute LP generation with timeout
   */
  public async executeLPGeneration<T>(
    operation: () => Promise<T>,
    onProgress?: (elapsed: number, progress: number) => void,
    fallback?: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; timedOut: boolean; elapsed: number }> {
    const operationId = `lp-generation-${Date.now()}`;
    
    return this.executeWithTimeout({
      id: operationId,
      name: 'LP Generation',
      startTime: Date.now(),
      timeout: this.config.lpGenerationTimeout,
      operation,
      fallback,
      onProgress,
      onTimeout: () => {
        console.warn('⏰ LP生成がタイムアウトしました。より簡潔な内容で再度お試しください。');
      }
    });
  }

  /**
   * Execute API request with timeout
   */
  public async executeAPIRequest<T>(
    operation: () => Promise<T>,
    requestName: string = 'API Request',
    customTimeout?: number
  ): Promise<{ success: boolean; result?: T; timedOut: boolean; elapsed: number }> {
    const operationId = `api-${Date.now()}`;
    
    return this.executeWithTimeout({
      id: operationId,
      name: requestName,
      startTime: Date.now(),
      timeout: customTimeout || this.config.apiRequestTimeout,
      operation,
      onTimeout: () => {
        console.warn(`⏰ ${requestName}がタイムアウトしました。ネットワーク接続を確認してください。`);
      }
    });
  }

  /**
   * Execute file operation with timeout
   */
  public async executeFileOperation<T>(
    operation: () => Promise<T>,
    operationName: string = 'File Operation'
  ): Promise<{ success: boolean; result?: T; timedOut: boolean; elapsed: number }> {
    const operationId = `file-${Date.now()}`;
    
    return this.executeWithTimeout({
      id: operationId,
      name: operationName,
      startTime: Date.now(),
      timeout: this.config.fileOperationTimeout,
      operation,
      onTimeout: () => {
        console.warn(`⏰ ${operationName}がタイムアウトしました。`);
      }
    });
  }

  /**
   * Cancel operation by ID
   */
  public cancelOperation(operationId: string): boolean {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      return false;
    }

    console.log(`🛑 [TimeoutHandler] Cancelling operation: ${operationId}`);

    clearTimeout(operation.timeoutId);
    if (operation.progressInterval) {
      clearInterval(operation.progressInterval);
    }

    this.activeOperations.delete(operationId);
    return true;
  }

  /**
   * Cancel all active operations
   */
  public cancelAllOperations(): number {
    const count = this.activeOperations.size;
    
    console.log(`🛑 [TimeoutHandler] Cancelling ${count} active operations`);

    for (const [operationId, operation] of this.activeOperations) {
      clearTimeout(operation.timeoutId);
      if (operation.progressInterval) {
        clearInterval(operation.progressInterval);
      }
    }

    this.activeOperations.clear();
    return count;
  }

  /**
   * Get active operations info
   */
  public getActiveOperations(): Array<{
    id: string;
    elapsed: number;
    isLongRunning: boolean;
  }> {
    const now = Date.now();
    
    return Array.from(this.activeOperations.entries()).map(([id, operation]) => ({
      id,
      elapsed: now - operation.startTime,
      isLongRunning: (now - operation.startTime) > this.config.showProgressAfter
    }));
  }

  /**
   * Update timeout configuration
   */
  public updateConfig(newConfig: Partial<TimeoutConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ [TimeoutHandler] Config updated:', this.config);
  }

  /**
   * Get timeout recommendation based on operation type
   */
  public getRecommendedTimeout(operationType: 'lp-generation' | 'api-request' | 'file-operation' | 'default'): number {
    switch (operationType) {
      case 'lp-generation':
        return this.config.lpGenerationTimeout;
      case 'api-request':
        return this.config.apiRequestTimeout;
      case 'file-operation':
        return this.config.fileOperationTimeout;
      default:
        return this.config.defaultTimeout;
    }
  }

  /**
   * Create timeout-aware AbortController
   */
  public createAbortController(timeoutMs: number): {
    controller: AbortController;
    cleanup: () => void;
  } {
    const controller = new AbortController();
    
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`⏰ [TimeoutHandler] AbortController timed out after ${timeoutMs}ms`);
    }, timeoutMs);

    return {
      controller,
      cleanup: () => clearTimeout(timeoutId)
    };
  }

  /**
   * Wrap fetch with timeout
   */
  public async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = this.config.apiRequestTimeout
  ): Promise<Response> {
    const { controller, cleanup } = this.createAbortController(timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      cleanup();
      return response;
    } catch (error) {
      cleanup();
      
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Create a timeout promise that rejects after specified time
   */
  public createTimeoutPromise<T>(timeoutMs: number, message?: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(message || `Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Race a promise against a timeout
   */
  public async raceWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage?: string
  ): Promise<T> {
    return Promise.race([
      promise,
      this.createTimeoutPromise<T>(timeoutMs, timeoutMessage)
    ]);
  }
}

// Export singleton instance
export const timeoutHandler = TimeoutHandler.getInstance();

// React hook for timeout operations
export function useTimeoutHandler() {
  const [activeOperations, setActiveOperations] = React.useState<Array<{
    id: string;
    elapsed: number;
    isLongRunning: boolean;
  }>>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const operations = timeoutHandler.getActiveOperations();
      setActiveOperations(operations);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const executeLPGeneration = React.useCallback(async <T>(
    operation: () => Promise<T>,
    onProgress?: (elapsed: number, progress: number) => void,
    fallback?: () => Promise<T>
  ) => {
    return timeoutHandler.executeLPGeneration(operation, onProgress, fallback);
  }, []);

  const executeAPIRequest = React.useCallback(async <T>(
    operation: () => Promise<T>,
    requestName?: string,
    customTimeout?: number
  ) => {
    return timeoutHandler.executeAPIRequest(operation, requestName, customTimeout);
  }, []);

  const cancelAllOperations = React.useCallback(() => {
    return timeoutHandler.cancelAllOperations();
  }, []);

  return {
    activeOperations,
    executeLPGeneration,
    executeAPIRequest,
    cancelAllOperations,
    hasActiveOperations: activeOperations.length > 0,
    hasLongRunningOperations: activeOperations.some(op => op.isLongRunning)
  };
}

// Add React import for hook
import React from 'react';