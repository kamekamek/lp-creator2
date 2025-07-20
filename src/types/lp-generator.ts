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

export interface VariantStructure {
  sections: string[];
  layout: 'single-column' | 'multi-column' | 'grid';
  components: string[];
}

export interface Variant {
  id: string;
  title: string;
  htmlContent: string;
  cssContent: string;
  variantSeed: number;
  designFocus: 'modern-clean' | 'conversion-optimized' | 'content-rich';
  metadata?: VariantMetadata;
  structure?: VariantStructure;
}

export interface GenerationResult {
  success: boolean;
  analysisResult: BusinessContext | null;
  variants: Variant[];
  recommendedVariant: number;
  metadata: {
    originalInput: string;
    analyzedContext?: BusinessContext;
    contentStrategy?: {
      approach: string;
      targetKeywords?: string[];
      focusPoints?: string[];
    };
    focusAreas?: string[];
    generatedAt: string;
  };
}

export interface SuggestionAction {
  type: 'replace' | 'add' | 'modify';
  target: string;
  value: string | number | boolean | object;
}

export interface AISuggestion {
  id: string;
  type: 'content' | 'design' | 'structure' | 'seo' | 'conversion' | 'accessibility' | 'performance';
  category: 'marketing' | 'technical' | 'ux' | 'compliance';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  priority: number;
  preview?: string;
  action: SuggestionAction;
  reasoning: string;
  appliedAt?: string;
  relatedElements?: string[];
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
  intent: ContentIntent;
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

export interface ContentAnalysis {
  contentScore: number;
  designScore: number;
  structureScore: number;
  seoScore: number;
  performanceScore: number;
  overallScore: number;
  issues: AnalysisIssue[];
  opportunities: AnalysisOpportunity[];
}

export interface AnalysisIssue {
  type: 'critical' | 'warning' | 'info';
  category: 'content' | 'design' | 'structure' | 'seo' | 'performance' | 'accessibility';
  message: string;
  element?: string;
  fix?: string;
}

export interface AnalysisOpportunity {
  type: 'enhancement' | 'optimization' | 'feature';
  category: 'marketing' | 'technical' | 'ux';
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  description: string;
}