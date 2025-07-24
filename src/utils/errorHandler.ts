/**
 * Comprehensive Error Handling and User Feedback System
 * Provides user-friendly error messages, retry functionality, and fallback mechanisms
 */

export type ErrorType = 
  | 'network' 
  | 'ai' 
  | 'generation' 
  | 'validation' 
  | 'timeout' 
  | 'quota' 
  | 'authentication'
  | 'permission'
  | 'storage'
  | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
  retryable: boolean;
  suggestions: string[];
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    sessionId?: string;
    additionalData?: Record<string, any>;
  };
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
  retryableErrors: ErrorType[];
}

export interface FallbackConfig {
  enableOfflineMode: boolean;
  fallbackModels: string[];
  gracefulDegradation: boolean;
  showProgressIndicators: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;
  private retryConfig: RetryConfig;
  private fallbackConfig: FallbackConfig;
  private retryAttempts = new Map<string, number>();

  private constructor() {
    this.retryConfig = {
      maxAttempts: 3,
      delayMs: 1000,
      backoffFactor: 2,
      maxDelayMs: 10000,
      retryableErrors: ['network', 'timeout', 'quota', 'ai']
    };

    this.fallbackConfig = {
      enableOfflineMode: true,
      fallbackModels: ['claude-3-sonnet', 'gpt-4', 'gpt-3.5-turbo'],
      gracefulDegradation: true,
      showProgressIndicators: true
    };
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create a standardized error object
   */
  public createError(
    type: ErrorType,
    message: string,
    details?: any,
    context?: AppError['context']
  ): AppError {
    const error: AppError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: this.determineSeverity(type),
      message,
      userMessage: this.generateUserMessage(type, message),
      details,
      timestamp: Date.now(),
      recoverable: this.isRecoverable(type),
      retryable: this.isRetryable(type),
      suggestions: this.generateSuggestions(type, message),
      context
    };

    this.logError(error);
    return error;
  }

  /**
   * Handle errors with automatic retry logic
   */
  public async handleError<T>(
    error: Error | AppError,
    retryFn?: () => Promise<T>,
    context?: AppError['context']
  ): Promise<{ success: boolean; result?: T; error?: AppError }> {
    let appError: AppError;

    if (error instanceof Error) {
      appError = this.createError(
        this.classifyError(error),
        error.message,
        { stack: error.stack, name: error.name },
        context
      );
    } else {
      appError = error;
    }

    console.error('🚨 [ErrorHandler] Handling error:', {
      type: appError.type,
      message: appError.message,
      retryable: appError.retryable,
      context: appError.context
    });

    // If error is retryable and we have a retry function
    if (appError.retryable && retryFn) {
      const retryResult = await this.executeWithRetry(retryFn, appError.id);
      if (retryResult.success) {
        return { success: true, result: retryResult.result };
      }
    }

    // Apply fallback strategies
    const fallbackResult = await this.applyFallbacks(appError);
    if (fallbackResult.success) {
      return { success: true, result: fallbackResult.result };
    }

    return { success: false, error: appError };
  }

  /**
   * Execute function with retry logic
   */
  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationId: string
  ): Promise<{ success: boolean; result?: T; attempts: number }> {
    const currentAttempts = this.retryAttempts.get(operationId) || 0;
    
    if (currentAttempts >= this.retryConfig.maxAttempts) {
      this.retryAttempts.delete(operationId);
      return { success: false, attempts: currentAttempts };
    }

    try {
      const result = await fn();
      this.retryAttempts.delete(operationId);
      return { success: true, result, attempts: currentAttempts + 1 };
    } catch (error) {
      const newAttempts = currentAttempts + 1;
      this.retryAttempts.set(operationId, newAttempts);

      if (newAttempts < this.retryConfig.maxAttempts) {
        const delay = Math.min(
          this.retryConfig.delayMs * Math.pow(this.retryConfig.backoffFactor, newAttempts - 1),
          this.retryConfig.maxDelayMs
        );

        console.log(`🔄 [ErrorHandler] Retrying operation ${operationId} in ${delay}ms (attempt ${newAttempts})`);
        
        await this.delay(delay);
        return this.executeWithRetry(fn, operationId);
      }

      this.retryAttempts.delete(operationId);
      return { success: false, attempts: newAttempts };
    }
  }

  /**
   * Apply fallback strategies
   */
  private async applyFallbacks<T>(error: AppError): Promise<{ success: boolean; result?: T }> {
    console.log('🛡️ [ErrorHandler] Applying fallback strategies for:', error.type);

    switch (error.type) {
      case 'ai':
      case 'quota':
        return this.handleAIFallback(error);
      
      case 'network':
        return this.handleNetworkFallback(error);
      
      case 'storage':
        return this.handleStorageFallback(error);
      
      default:
        return { success: false };
    }
  }

  /**
   * Handle AI-related fallbacks
   */
  private async handleAIFallback(error: AppError): Promise<{ success: boolean; result?: any }> {
    // Try switching to a fallback model
    if (this.fallbackConfig.fallbackModels.length > 0) {
      console.log('🤖 [ErrorHandler] Attempting AI model fallback');
      
      // This would integrate with the model switching system
      // For now, we'll return a graceful degradation message
      return {
        success: true,
        result: {
          html: '<div class="fallback-content"><h1>一時的にサービスが利用できません</h1><p>申し訳ございませんが、現在AIサービスに接続できません。しばらく時間をおいて再度お試しください。</p></div>',
          css: '.fallback-content { padding: 2rem; text-align: center; color: #666; }',
          metadata: { fallback: true, reason: 'AI service unavailable' }
        }
      };
    }

    return { success: false };
  }

  /**
   * Handle network-related fallbacks
   */
  private async handleNetworkFallback(error: AppError): Promise<{ success: boolean; result?: any }> {
    if (this.fallbackConfig.enableOfflineMode) {
      console.log('📱 [ErrorHandler] Enabling offline mode');
      
      // Check if we have cached content
      const cachedContent = this.getCachedContent();
      if (cachedContent) {
        return {
          success: true,
          result: cachedContent
        };
      }
    }

    return { success: false };
  }

  /**
   * Handle storage-related fallbacks
   */
  private async handleStorageFallback(error: AppError): Promise<{ success: boolean; result?: any }> {
    // Try alternative storage methods
    if (localStorage && error.details?.storage === 'sessionStorage') {
      console.log('💾 [ErrorHandler] Falling back to localStorage');
      return { success: true };
    }

    return { success: false };
  }

  /**
   * Get user-friendly error message
   */
  public getUserMessage(error: AppError): string {
    return error.userMessage;
  }

  /**
   * Get error suggestions for user
   */
  public getSuggestions(error: AppError): string[] {
    return error.suggestions;
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: AppError[];
    mostCommonError: ErrorType | null;
  } {
    const errorsByType = this.errorLog.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<ErrorType, number>);

    const errorsBySeverity = this.errorLog.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const mostCommonError = Object.entries(errorsByType)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as ErrorType || null;

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorLog.slice(-10),
      mostCommonError
    };
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
    console.log('🧹 [ErrorHandler] Error log cleared');
  }

  /**
   * Export error log for debugging
   */
  public exportErrorLog(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      errors: this.errorLog,
      stats: this.getErrorStats()
    }, null, 2);
  }

  /**
   * Update retry configuration
   */
  public updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
    console.log('⚙️ [ErrorHandler] Retry config updated:', this.retryConfig);
  }

  /**
   * Update fallback configuration
   */
  public updateFallbackConfig(config: Partial<FallbackConfig>): void {
    this.fallbackConfig = { ...this.fallbackConfig, ...config };
    console.log('⚙️ [ErrorHandler] Fallback config updated:', this.fallbackConfig);
  }

  // Private helper methods

  private logError(error: AppError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console based on severity
    switch (error.severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', error);
        break;
      case 'high':
        console.error('❌ HIGH SEVERITY ERROR:', error);
        break;
      case 'medium':
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', error);
        break;
      case 'low':
        console.info('ℹ️ LOW SEVERITY ERROR:', error);
        break;
    }
  }

  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || name.includes('networkerror')) {
      return 'network';
    }
    if (message.includes('timeout') || name.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('quota') || message.includes('rate limit')) {
      return 'quota';
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authentication';
    }
    if (message.includes('storage') || message.includes('localstorage')) {
      return 'storage';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }

    return 'unknown';
  }

  private determineSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case 'authentication':
      case 'permission':
        return 'critical';
      case 'ai':
      case 'generation':
      case 'network':
        return 'high';
      case 'timeout':
      case 'quota':
      case 'storage':
        return 'medium';
      case 'validation':
      case 'unknown':
      default:
        return 'low';
    }
  }

  private isRecoverable(type: ErrorType): boolean {
    return !['authentication', 'permission'].includes(type);
  }

  private isRetryable(type: ErrorType): boolean {
    return this.retryConfig.retryableErrors.includes(type);
  }

  private generateUserMessage(type: ErrorType, message: string): string {
    const userMessages: Record<ErrorType, string> = {
      network: 'インターネット接続に問題があります。接続を確認して再度お試しください。',
      ai: 'AIサービスに一時的に接続できません。しばらく時間をおいて再度お試しください。',
      generation: 'ランディングページの生成中にエラーが発生しました。もう一度お試しください。',
      validation: '入力内容に問題があります。内容を確認して再度お試しください。',
      timeout: '処理に時間がかかりすぎています。しばらく時間をおいて再度お試しください。',
      quota: 'サービスの利用上限に達しています。しばらく時間をおいて再度お試しください。',
      authentication: '認証に失敗しました。再度ログインしてください。',
      permission: 'この操作を実行する権限がありません。',
      storage: 'データの保存中にエラーが発生しました。ブラウザの設定を確認してください。',
      unknown: '予期しないエラーが発生しました。ページを再読み込みして再度お試しください。'
    };

    return userMessages[type] || userMessages.unknown;
  }

  private generateSuggestions(type: ErrorType, message: string): string[] {
    const suggestions: Record<ErrorType, string[]> = {
      network: [
        'インターネット接続を確認してください',
        'VPNやプロキシ設定を確認してください',
        'ブラウザを再起動してみてください'
      ],
      ai: [
        'しばらく時間をおいて再度お試しください',
        '他のAIモデルを試してみてください',
        'リクエスト内容を簡潔にしてみてください'
      ],
      generation: [
        'プロンプトを短くしてみてください',
        '具体的な内容を入力してください',
        'テンプレートから始めてみてください'
      ],
      validation: [
        '入力内容を確認してください',
        '必須項目が入力されているか確認してください',
        '文字数制限を確認してください'
      ],
      timeout: [
        'ネットワーク接続を確認してください',
        'リクエスト内容を簡潔にしてください',
        'しばらく時間をおいて再度お試しください'
      ],
      quota: [
        'しばらく時間をおいて再度お試しください',
        'アカウントプランをアップグレードしてください',
        '明日再度お試しください'
      ],
      authentication: [
        '再度ログインしてください',
        'ブラウザのCookieを確認してください',
        'アカウント設定を確認してください'
      ],
      permission: [
        '管理者に連絡してください',
        'アカウント権限を確認してください',
        '別のアカウントでお試しください'
      ],
      storage: [
        'ブラウザのストレージ設定を確認してください',
        'プライベートブラウジングモードを無効にしてください',
        'ブラウザのキャッシュをクリアしてください'
      ],
      unknown: [
        'ページを再読み込みしてください',
        'ブラウザを再起動してください',
        '別のブラウザを試してください'
      ]
    };

    return suggestions[type] || suggestions.unknown;
  }

  private getCachedContent(): any {
    try {
      const cached = localStorage.getItem('lp-creator-fallback-content');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();