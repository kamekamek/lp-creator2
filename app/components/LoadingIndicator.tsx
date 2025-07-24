'use client';

import React from 'react';
import { useLoadingState } from '../../src/contexts/AppStateContext';

export interface LoadingIndicatorProps {
  show?: boolean;
  stage?: string;
  progress?: number;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'progress' | 'dots' | 'pulse';
  overlay?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  show,
  stage,
  progress,
  message,
  size = 'md',
  variant = 'spinner',
  overlay = false
}) => {
  const { isLoading, loadingStage, progress: contextProgress } = useLoadingState();

  const shouldShow = show ?? isLoading;
  const currentStage = stage ?? loadingStage;
  const currentProgress = progress ?? contextProgress;
  const displayMessage = message ?? getStageMessage(currentStage);

  if (!shouldShow) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const Component = (
    <div className={`flex flex-col items-center justify-center space-y-4 ${
      overlay ? 'fixed inset-0 bg-black bg-opacity-50 z-50' : ''
    }`}>
      <div className="flex flex-col items-center space-y-3">
        {/* Loading Animation */}
        <div className={`${sizeClasses[size]} relative`}>
          {variant === 'spinner' && <SpinnerAnimation size={size} />}
          {variant === 'progress' && <ProgressAnimation progress={currentProgress} size={size} />}
          {variant === 'dots' && <DotsAnimation size={size} />}
          {variant === 'pulse' && <PulseAnimation size={size} />}
        </div>

        {/* Stage and Message */}
        {(currentStage || displayMessage) && (
          <div className="text-center max-w-xs">
            {currentStage && (
              <div className="text-sm font-medium text-gray-900 mb-1">
                {currentStage}
              </div>
            )}
            {displayMessage && (
              <div className="text-xs text-gray-600">
                {displayMessage}
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {currentProgress > 0 && variant !== 'progress' && (
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(currentProgress, 100)}%` }}
            />
            <div className="text-xs text-gray-500 mt-1 text-center">
              {Math.round(currentProgress)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return overlay ? Component : <div className="flex justify-center p-4">{Component}</div>;
};

// Spinner Animation Component
const SpinnerAnimation: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => (
  <svg
    className={`animate-spin text-blue-600 ${
      size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-8 w-8' : 'h-12 w-12'
    }`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Progress Circle Animation Component
const ProgressAnimation: React.FC<{ progress: number; size: 'sm' | 'md' | 'lg' }> = ({ 
  progress, 
  size 
}) => {
  const radius = size === 'sm' ? 8 : size === 'md' ? 16 : 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <svg
        className={`transform -rotate-90 ${
          size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-8 w-8' : 'h-12 w-12'
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-gray-300"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-600 transition-all duration-300 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold text-blue-600 ${
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        }`}>
          {Math.round(progress)}
        </span>
      </div>
    </div>
  );
};

// Dots Animation Component
const DotsAnimation: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  const dotSize = size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3';
  
  return (
    <div className="flex space-x-1">
      <div className={`${dotSize} bg-blue-600 rounded-full animate-bounce`} />
      <div className={`${dotSize} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }} />
      <div className={`${dotSize} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }} />
    </div>
  );
};

// Pulse Animation Component
const PulseAnimation: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => (
  <div className={`${
    size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-8 w-8' : 'h-12 w-12'
  } bg-blue-600 rounded-full animate-pulse`} />
);

// Inline Loading Component for smaller spaces
export const InlineLoading: React.FC<{
  size?: 'sm' | 'md';
  message?: string;
}> = ({ size = 'sm', message }) => (
  <div className="flex items-center space-x-2">
    <SpinnerAnimation size={size} />
    {message && <span className="text-sm text-gray-600">{message}</span>}
  </div>
);

// Loading Overlay Component
export const LoadingOverlay: React.FC<{
  show: boolean;
  message?: string;
  progress?: number;
}> = ({ show, message, progress }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <LoadingIndicator
          show={true}
          message={message}
          progress={progress}
          size="lg"
          variant={progress ? 'progress' : 'spinner'}
        />
      </div>
    </div>
  );
};

// Skeleton Loading Component for content placeholders
export const SkeletonLoader: React.FC<{
  lines?: number;
  width?: string;
  className?: string;
}> = ({ lines = 3, width = '100%', className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <div
        key={i}
        className="h-4 bg-gray-300 rounded mb-2"
        style={{
          width: i === lines - 1 ? '75%' : width
        }}
      />
    ))}
  </div>
);

// Button Loading State Component
export const LoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
}> = ({ 
  loading, 
  children, 
  onClick, 
  disabled, 
  className = '',
  variant = 'primary'
}) => {
  const baseClasses = variant === 'primary'
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-900';
    
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        relative px-4 py-2 rounded-md font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${baseClasses}
        ${className}
      `}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <SpinnerAnimation size="sm" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

// Helper function to get stage-specific messages
function getStageMessage(stage: string | null): string {
  if (!stage) return '';

  const messages: Record<string, string> = {
    'AI処理中...': 'AIがあなたのリクエストを処理しています...',
    'LP生成中...': 'ランディングページを生成しています...',
    'コンテンツ分析中...': 'コンテンツを分析しています...',
    '提案生成中...': '改善提案を生成しています...',
    '保存中...': 'データを保存しています...',
    '読み込み中...': 'データを読み込んでいます...',
    'プレビュー生成中...': 'プレビューを生成しています...',
    'エクスポート中...': 'ファイルをエクスポートしています...',
  };

  return messages[stage] || stage;
}