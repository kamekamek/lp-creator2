// LP Generator関連の型定義

export interface BusinessContext {
  industry: string;
  targetAudience: string;
  businessGoal: string;
  competitiveAdvantage: string[];
  tone: 'professional' | 'friendly' | 'casual' | 'premium';
}

export interface VariantMetadata {
  originalTopic: string;
  enhancedTopic: string;
  targetAudience?: string;
  businessGoal?: string;
  industry?: string;
  competitiveAdvantage?: string;
  designStyle?: string;
  generatedAt: string;
  version: string;
}

export interface Variant {
  id: string;
  title: string;
  htmlContent: string;
  cssContent: string;
  variantSeed: number;
  designFocus: 'modern-clean' | 'conversion-optimized' | 'content-rich';
  metadata?: VariantMetadata;
  structure?: unknown;
}

export interface GenerationResult {
  success: boolean;
  analysisResult: BusinessContext | null;
  variants: Variant[];
  recommendedVariant: number;
  metadata: {
    originalInput: string;
    analyzedContext?: BusinessContext;
    contentStrategy?: unknown;
    focusAreas?: string[];
    generatedAt: string;
    version: string;
    error?: boolean;
  };
  error?: string;
}

export interface SuggestionAction {
  type: 'replace' | 'add' | 'modify';
  target: string;
  value: unknown;
}

export interface AISuggestion {
  id: string;
  type: 'content' | 'design' | 'conversion' | 'accessibility' | 'performance';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  preview?: string;
  action: SuggestionAction;
  reasoning: string;
}

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  noCache?: boolean;
  cacheTTL?: number;
}

export interface ProcessedInput {
  originalInput: string;
  intent: unknown;
  entities: Entity[];
  references: Reference[];
  confidence: number;
}

export interface Entity {
  type: string;
  value: string;
  position: number;
  confidence: number;
}

export interface Reference {
  type: string;
  target: string;
  confidence: number;
}

export interface ContentIntent {
  action: string;
  target: string;
  value?: string;
}