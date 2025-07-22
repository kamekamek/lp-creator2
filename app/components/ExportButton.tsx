'use client';

import React, { useState } from 'react';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  downloadHTML, 
  validateHTMLForExport, 
  exportHTMLWithVerification,
  exportWithDependencies,
  generateStandaloneHTML,
  verifyExportIntegrity,
  type ExportOptions 
} from '../../src/utils/htmlExporter';

interface ExportButtonProps {
  htmlContent: string;
  cssContent?: string;
  title?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  options?: ExportOptions;
  enableVerification?: boolean;
  exportMode?: 'standard' | 'standalone' | 'with-dependencies';
  onExportStart?: () => void;
  onExportComplete?: (result: { filename: string; size: number; integrity?: any; dependencies?: string[]; warnings?: string[] }) => void;
  onExportError?: (error: Error) => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  htmlContent,
  cssContent = '',
  title = 'Generated Landing Page',
  className = '',
  variant = 'primary',
  size = 'md',
  options = {
    includeInlineCSS: true,
    includeExternalCSS: true,
    addMetaTags: true,
    responsive: true
  },
  enableVerification = true,
  exportMode = 'standalone',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ filename: string; timestamp: Date } | null>(null);

  const handleExport = async () => {
    if (!htmlContent || isExporting) return;

    setIsExporting(true);
    
    try {
      onExportStart?.();

      // Validate content before export
      const validation = validateHTMLForExport(htmlContent);
      
      if (!validation.isValid) {
        throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        const proceed = confirm(
          `警告があります:\n${validation.warnings.join('\n')}\n\nエクスポートを続行しますか？`
        );
        if (!proceed) {
          setIsExporting(false);
          return;
        }
      }

      // Perform export based on selected mode
      let result: any;
      
      switch (exportMode) {
        case 'with-dependencies':
          result = exportWithDependencies(htmlContent, cssContent, title, options);
          break;
        case 'standalone':
          // Use standalone HTML generation for better self-contained output
          const standaloneHTML = generateStandaloneHTML(htmlContent, cssContent, title, options);
          result = enableVerification 
            ? exportHTMLWithVerification(standaloneHTML, '', title, options)
            : downloadHTML(standaloneHTML, '', title, options);
          break;
        case 'standard':
        default:
          result = enableVerification 
            ? exportHTMLWithVerification(htmlContent, cssContent, title, options)
            : downloadHTML(htmlContent, cssContent, title, options);
          break;
      }

      setLastExport({
        filename: result.filename,
        timestamp: result.timestamp
      });

      // Show integrity warnings if verification is enabled
      if (enableVerification && 'integrity' in result && result.integrity && typeof result.integrity === 'object' && 'isValid' in result.integrity && !result.integrity.isValid) {
        const proceed = confirm(
          `整合性チェックで問題が検出されました:\n${(result.integrity as any).issues?.join('\n') || '不明なエラー'}\n\nエクスポートは完了しましたが、ファイルに問題がある可能性があります。`
        );
      }

      onExportComplete?.({
        filename: result.filename,
        size: result.size,
        integrity: 'integrity' in result ? result.integrity : undefined,
        dependencies: 'dependencies' in result ? result.dependencies : undefined,
        warnings: 'warnings' in result ? result.warnings : undefined
      });

      console.log('Export successful:', {
        filename: result.filename,
        size: result.size,
        timestamp: result.timestamp
      });

    } catch (error) {
      const exportError = error instanceof Error ? error : new Error('Unknown export error');
      console.error('Export failed:', exportError);
      onExportError?.(exportError);
      
      // Show user-friendly error message
      alert(`エクスポートに失敗しました: ${exportError.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Button styling based on variant and size
  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow-md',
      secondary: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white shadow-sm hover:shadow-md',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  };

  const isDisabled = !htmlContent || isExporting;

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isDisabled}
        className={getButtonClasses()}
        title={isDisabled ? 'コンテンツがありません' : 'HTMLファイルをダウンロード'}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            エクスポート中...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            HTMLダウンロード
          </>
        )}
      </button>

      {/* Export status indicator */}
      {lastExport && !isExporting && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
          <CheckCircle className="h-3 w-3" />
        </div>
      )}

      {/* Validation warnings indicator */}
      {htmlContent && (() => {
        const validation = validateHTMLForExport(htmlContent);
        return validation.warnings.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-1">
            <AlertCircle className="h-3 w-3" />
          </div>
        );
      })()}
    </div>
  );
};

// Export info component for showing export details
export const ExportInfo: React.FC<{
  htmlContent: string;
  cssContent?: string;
  className?: string;
}> = ({ htmlContent, cssContent = '', className = '' }) => {
  if (!htmlContent) return null;

  const validation = validateHTMLForExport(htmlContent);
  const estimatedSize = new Blob([htmlContent + cssContent]).size;

  return (
    <div className={`text-xs text-gray-500 space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        <FileText className="h-3 w-3" />
        <span>推定サイズ: {Math.round(estimatedSize / 1024)}KB</span>
      </div>
      
      {validation.warnings.length > 0 && (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="h-3 w-3" />
          <span>{validation.warnings.length}件の警告</span>
        </div>
      )}
      
      {!validation.isValid && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>エクスポートできません</span>
        </div>
      )}
    </div>
  );
};