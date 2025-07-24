'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, AppError, ErrorType } from '../../src/utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error?: AppError;
  retryAttempts: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryAttempts: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Convert JS error to AppError
    const appError = errorHandler.createError(
      'unknown',
      error.message,
      { stack: error.stack, name: error.name },
      { component: 'ErrorBoundary' }
    );

    return {
      hasError: true,
      error: appError,
      retryAttempts: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ErrorBoundary] Caught error:', error, errorInfo);
    
    // Create detailed error with React error info
    const appError = errorHandler.createError(
      this.classifyReactError(error),
      error.message,
      {
        stack: error.stack,
        name: error.name,
        componentStack: errorInfo.componentStack,
        errorBoundary: errorInfo.errorBoundary?.constructor.name
      },
      {
        component: 'ErrorBoundary',
        action: 'componentDidCatch'
      }
    );

    this.setState({ error: appError });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  private classifyReactError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('chunk') || message.includes('loading')) {
      return 'network';
    }
    if (message.includes('memory') || message.includes('maximum call stack')) {
      return 'unknown';
    }
    if (message.includes('permission') || message.includes('denied')) {
      return 'permission';
    }

    return 'unknown';
  }

  private handleRetry = async () => {
    const { error, retryAttempts } = this.state;
    
    if (!error || retryAttempts >= 3) {
      return;
    }

    this.setState({ retryAttempts: retryAttempts + 1 });

    try {
      // Attempt to recover from the error
      await this.attemptRecovery(error);
      
      // If recovery successful, reset error state
      this.setState({
        hasError: false,
        error: undefined,
        retryAttempts: 0
      });
    } catch (recoveryError) {
      console.error('🔄 [ErrorBoundary] Recovery failed:', recoveryError);
      
      // Auto-retry after delay for retryable errors
      if (error.retryable && retryAttempts < 2) {
        this.retryTimeoutId = setTimeout(() => {
          this.handleRetry();
        }, 2000 * (retryAttempts + 1)); // Exponential backoff
      }
    }
  };

  private attemptRecovery = async (error: AppError): Promise<void> => {
    console.log('🛠️ [ErrorBoundary] Attempting error recovery for:', error.type);

    switch (error.type) {
      case 'network':
        // Try to reload the page or restore from cache
        await this.recoverFromNetworkError();
        break;
      
      case 'unknown':
        // General recovery strategies
        await this.recoverFromUnknownError();
        break;
      
      default:
        throw new Error('No recovery strategy available');
    }
  };

  private recoverFromNetworkError = async (): Promise<void> => {
    // Clear any cached data that might be causing issues
    if (typeof window !== 'undefined') {
      // Clear component state
      window.location.reload();
    }
  };

  private recoverFromUnknownError = async (): Promise<void> => {
    // Force garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
    
    // Small delay to let things settle
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  private handleReportError = () => {
    const { error } = this.state;
    if (!error) return;

    // Export error log for user to report
    const errorReport = errorHandler.exportErrorLog();
    const blob = new Blob([errorReport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  private handleClearError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      retryAttempts: 0
    });
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, retryAttempts } = this.state;
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorDisplay
          error={error}
          retryAttempts={retryAttempts}
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
          onClearError={this.handleClearError}
        />
      );
    }

    return this.props.children;
  }
}

// Error Display Component
interface ErrorDisplayProps {
  error?: AppError;
  retryAttempts: number;
  onRetry: () => void;
  onReportError: () => void;
  onClearError: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  retryAttempts,
  onRetry,
  onReportError,
  onClearError
}) => {
  if (!error) return null;

  const isRetryDisabled = retryAttempts >= 3 || !error.retryable;
  const severityColor = {
    low: 'blue',
    medium: 'yellow',
    high: 'orange',
    critical: 'red'
  }[error.severity];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 text-${severityColor}-600 mb-4`}>
            {error.severity === 'critical' ? (
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            エラーが発生しました
          </h2>
          
          <p className="text-lg text-gray-600 mb-4">
            {error.userMessage}
          </p>

          {error.suggestions.length > 0 && (
            <div className="text-left bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">解決方法:</h3>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {error.retryable && (
            <button
              onClick={onRetry}
              disabled={isRetryDisabled}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isRetryDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition-colors`}
            >
              {retryAttempts > 0 ? `再試行 (${retryAttempts}/3)` : '再試行'}
            </button>
          )}

          <button
            onClick={onClearError}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            エラーを無視して続行
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            ページを再読み込み
          </button>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <button
            onClick={onReportError}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            エラーレポートをダウンロード
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">開発者情報</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

// Helper component for wrapping individual components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};