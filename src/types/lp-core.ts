/**
 * LP Creator Platform - Core Interfaces
 * 
 * This file contains the core interfaces for the LP Creator Platform.
 * These interfaces are used across the application to ensure type safety and consistency.
 */

/**
 * LP生成リクエストのインターフェース
 * ユーザーからの入力を受け取り、LP生成に必要な情報を格納する
 */
export interface LPGenerationRequest {
  userInput: string;
  businessType?: string;
  targetAudience?: string;
  goals?: string[];
  style?: 'modern' | 'classic' | 'minimal' | 'bold';
  colorScheme?: {
    primaryColor: string;
    accentColor: string;
    bgColor: string;
    textColor: string;
  };
  marketingStrategy?: {
    usePasona?: boolean;
    use4U?: boolean;
    useAida?: boolean;
  };
}

/**
 * LP生成結果のインターフェース
 * AI生成処理の結果を格納する
 */
export interface LPGenerationResult {
  htmlContent: string;
  cssContent: string;
  title: string;
  metadata: {
    generatedAt: Date;
    model: string;
    processingTime: number;
    businessContext?: BusinessContext;
  };
}

/**
 * LPバリエーションのインターフェース
 * 複数のバリエーションを生成する際に使用する
 */
export interface LPVariant extends LPGenerationResult {
  variantId: string;
  score: number;
  description: string;
  features: string[];
  designFocus: 'modern-clean' | 'conversion-optimized' | 'content-rich';
  recommendation?: {
    reason: string;
    targetUseCase: string;
    strengths: string[];
  };
}

/**
 * バリエーション生成リクエストのインターフェース
 */
export interface VariantGenerationRequest {
  topic: string;
  targetAudience?: string;
  businessGoal?: string;
  industry?: string;
  competitiveAdvantage?: string;
  designStyle?: 'modern' | 'minimalist' | 'corporate' | 'creative' | 'tech' | 'startup';
  variantCount?: number; // 1-3の範囲
  focusAreas?: ('modern-clean' | 'conversion-optimized' | 'content-rich')[];
}

/**
 * バリエーション生成結果のインターフェース
 */
export interface VariantGenerationResult {
  success: boolean;
  variants: LPVariant[];
  recommendedVariant: string; // variantId
  metadata: {
    generatedAt: Date;
    processingTime: number;
    totalVariants: number;
    version: string;
  };
  error?: string;
}

/**
 * ビジネスコンテキストのインターフェース
 * ユーザー入力から抽出したビジネス情報を格納する
 */
export interface BusinessContext {
  industry: string;
  targetAudience: string;
  businessGoal: string;
  competitiveAdvantage: string[];
  tone: 'professional' | 'friendly' | 'casual' | 'premium';
}

/**
 * 編集可能な要素のインターフェース
 * LP内の編集可能な要素を表現する
 */
export interface EditableElement {
  id: string;
  type: 'text' | 'heading' | 'button' | 'image';
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 編集操作のインターフェース
 * ユーザーによる編集操作を表現する
 */
export interface EditOperation {
  elementId: string;
  operation: 'update' | 'delete' | 'insert';
  oldValue: string;
  newValue: string;
  timestamp: string; // ISO 8601形式
}

/**
 * AI提案のインターフェース
 * AIによる改善提案を表現する
 */
export interface AISuggestion {
  id: string;
  type: 'content' | 'design' | 'structure' | 'seo';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action: {
    type: 'replace' | 'insert' | 'modify';
    target: string;
    value: string;
  };
}

/**
 * AIエラーのインターフェース
 * AI生成処理中に発生したエラーを表現する
 */
export interface AIGenerationError {
  type: 'model_timeout' | 'rate_limit' | 'invalid_response' | 'content_policy';
  message: string;
  retryable: boolean;
  retryAfter?: number;
  model?: string;
  timestamp: Date;
}

/**
 * セキュリティエラーのインターフェース
 * セキュリティ関連のエラーを表現する
 */
export interface SecurityError {
  type: 'xss_detected' | 'unsafe_html' | 'script_injection';
  element: string;
  severity: 'low' | 'medium' | 'high';
  details?: string;
  timestamp: Date;
}

/**
 * パフォーマンスエラーのインターフェース
 * パフォーマンス関連のエラーを表現する
 */
export interface PerformanceError {
  type: 'memory_limit' | 'processing_timeout' | 'large_content';
  threshold: number;
  current: number;
  details?: string;
  timestamp: Date;
}