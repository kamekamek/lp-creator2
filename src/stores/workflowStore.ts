'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ワークフロー段階の定義
export type WorkflowStage = 'hearing' | 'concept' | 'structure' | 'generation' | 'complete';

// ワークフローデータの型定義
export interface HearingData {
  essentialInfo?: {
    serviceContent?: string;
    uniqueValueProposition?: string;
    targetCustomerPain?: string;
    desiredConversion?: string;
    budgetAndUrgency?: string;
  };
  strategyInfo?: {
    competitors?: string[];
    currentChannels?: string;
    brandImage?: string;
    successMetrics?: string;
  };
}

export interface ConceptData {
  id: string;
  title: string;
  overview: string;
  targetPersona: {
    age: string;
    gender: string;
    occupation: string;
    painPoints: string[];
  };
  valueProposition: {
    mainBenefit: string;
    subBenefits: string[];
  };
  designDirection: {
    tone: string;
    colorScheme: string;
    style: string;
  };
  expectedOutcome: {
    kpi: string;
    metrics: string[];
  };
  createdAt: string;
  approvedAt?: string;
}

export interface StructureData {
  sections: Array<{
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    contentType: string;
  }>;
  wireframe?: string;
  approvedAt?: string;
}

export interface GenerationResult {
  htmlContent: string;
  cssContent: string;
  title: string;
  metadata: any;
  generatedAt: string;
}

// ワークフロー状態の型定義
export interface WorkflowState {
  // 現在の段階
  currentStage: WorkflowStage;
  
  // 各段階のデータ
  hearingData: HearingData;
  conceptData: ConceptData | null;
  structureData: StructureData | null;
  generationResult: GenerationResult | null;
  
  // 進捗状況
  completionRate: number;
  isProcessing: boolean;
  
  // エラー状態
  error: string | null;
  
  // ナビゲーション履歴
  stageHistory: WorkflowStage[];
  
  // メタデータ
  sessionId: string;
  startedAt: string;
  lastUpdated: string;
}

// ワークフローアクション
export interface WorkflowActions {
  // 段階管理
  setStage: (stage: WorkflowStage) => void;
  nextStage: () => void;
  previousStage: () => void;
  goToStage: (stage: WorkflowStage) => void;
  resetWorkflow: () => void;
  
  // データ更新
  updateHearingData: (data: Partial<HearingData>) => void;
  setConceptData: (concept: ConceptData) => void;
  setStructureData: (structure: StructureData) => void;
  setGenerationResult: (result: GenerationResult) => void;
  
  // 進捗管理
  updateProgress: () => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  
  // ユーティリティ
  canProceedToNext: () => boolean;
  canGoBack: () => boolean;
  getStageProgress: (stage: WorkflowStage) => number;
  getStageHistory: () => WorkflowStage[];
  exportWorkflowData: () => any;
  importWorkflowData: (data: any) => void;
}

export type WorkflowStore = WorkflowState & WorkflowActions;

// 初期状態
const initialState: WorkflowState = {
  currentStage: 'hearing',
  hearingData: {},
  conceptData: null,
  structureData: null,
  generationResult: null,
  completionRate: 0,
  isProcessing: false,
  error: null,
  stageHistory: ['hearing'],
  sessionId: generateSessionId(),
  startedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
};

// セッションID生成
function generateSessionId(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return `workflow_${Date.now()}_${Array.from(array, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('')}`;
  }
  // Fallback for non-browser environments
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      return `workflow_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    } catch (e) {
      console.warn('Crypto module not available, using less secure fallback');
    }
  }
  return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 段階の順序定義
const stageOrder: WorkflowStage[] = ['hearing', 'concept', 'structure', 'generation', 'complete'];

// Zustandストア
export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // 段階管理
      setStage: (stage: WorkflowStage) => {
        set((state) => {
          const newHistory = [...state.stageHistory];
          if (newHistory[newHistory.length - 1] !== stage) {
            newHistory.push(stage);
          }
          
          return {
            ...state,
            currentStage: stage,
            stageHistory: newHistory,
            lastUpdated: new Date().toISOString()
          };
        });
        get().updateProgress();
      },
      
      nextStage: () => {
        const currentIndex = stageOrder.indexOf(get().currentStage);
        if (currentIndex < stageOrder.length - 1) {
          get().setStage(stageOrder[currentIndex + 1]);
        }
      },
      
      previousStage: () => {
        const state = get();
        const currentIndex = stageOrder.indexOf(state.currentStage);
        if (currentIndex > 0) {
          get().setStage(stageOrder[currentIndex - 1]);
        }
      },
      
      goToStage: (stage: WorkflowStage) => {
        const state = get();
        const targetIndex = stageOrder.indexOf(stage);
        const currentIndex = stageOrder.indexOf(state.currentStage);
        
        // 後方移動は常に可能、前方移動は条件チェック
        if (targetIndex <= currentIndex || get().canProceedToNext()) {
          get().setStage(stage);
        }
      },
      
      resetWorkflow: () => {
        set({
          ...initialState,
          sessionId: generateSessionId(),
          startedAt: new Date().toISOString(),
          stageHistory: ['hearing']
        });
      },
      
      // データ更新
      updateHearingData: (data: Partial<HearingData>) => {
        set((state) => ({
          ...state,
          hearingData: {
            ...state.hearingData,
            ...data
          },
          lastUpdated: new Date().toISOString()
        }));
        get().updateProgress();
      },
      
      setConceptData: (concept: ConceptData) => {
        set((state) => ({
          ...state,
          conceptData: concept,
          lastUpdated: new Date().toISOString()
        }));
        get().updateProgress();
      },
      
      setStructureData: (structure: StructureData) => {
        set((state) => ({
          ...state,
          structureData: structure,
          lastUpdated: new Date().toISOString()
        }));
        get().updateProgress();
      },
      
      setGenerationResult: (result: GenerationResult) => {
        set((state) => ({
          ...state,
          generationResult: result,
          lastUpdated: new Date().toISOString()
        }));
        get().updateProgress();
      },
      
      // 進捗管理
      updateProgress: () => {
        const state = get();
        let progress = 0;
        
        // ヒアリング段階の進捗 (25%)
        const hearingCompletion = calculateHearingCompletion(state.hearingData);
        progress += (hearingCompletion / 100) * 25;
        
        // コンセプト段階の進捗 (25%)
        if (state.conceptData) {
          progress += 25;
        }
        
        // 構成設計段階の進捗 (25%)
        if (state.structureData) {
          progress += 25;
        }
        
        // LP生成段階の進捗 (25%)
        if (state.generationResult) {
          progress += 25;
        }
        
        set((state) => ({
          ...state,
          completionRate: Math.round(progress)
        }));
      },
      
      setProcessing: (isProcessing: boolean) => {
        set((state) => ({
          ...state,
          isProcessing,
          lastUpdated: new Date().toISOString()
        }));
      },
      
      setError: (error: string | null) => {
        set((state) => ({
          ...state,
          error,
          lastUpdated: new Date().toISOString()
        }));
      },
      
      // ユーティリティ
      canProceedToNext: () => {
        const state = get();
        
        switch (state.currentStage) {
          case 'hearing':
            return isHearingComplete(state.hearingData);
          case 'concept':
            return state.conceptData !== null;
          case 'structure':
            return state.structureData !== null;
          case 'generation':
            return state.generationResult !== null;
          default:
            return false;
        }
      },
      
      canGoBack: () => {
        const currentIndex = stageOrder.indexOf(get().currentStage);
        return currentIndex > 0;
      },
      
      getStageProgress: (stage: WorkflowStage) => {
        const state = get();
        
        switch (stage) {
          case 'hearing':
            return calculateHearingCompletion(state.hearingData);
          case 'concept':
            return state.conceptData ? 100 : 0;
          case 'structure':
            return state.structureData ? 100 : 0;
          case 'generation':
            return state.generationResult ? 100 : 0;
          case 'complete':
            return state.completionRate === 100 ? 100 : 0;
          default:
            return 0;
        }
      },
      
      getStageHistory: () => {
        return get().stageHistory;
      },
      
      exportWorkflowData: () => {
        const state = get();
        return {
          sessionId: state.sessionId,
          currentStage: state.currentStage,
          hearingData: state.hearingData,
          conceptData: state.conceptData,
          structureData: state.structureData,
          generationResult: state.generationResult,
          completionRate: state.completionRate,
          startedAt: state.startedAt,
          lastUpdated: state.lastUpdated,
          exportedAt: new Date().toISOString()
        };
      },
      
      importWorkflowData: (data: any) => {
        set({
          ...data,
          isProcessing: false,
          error: null,
          lastUpdated: new Date().toISOString()
        });
      }
    }),
    {
      name: 'lp-creator-workflow',
      partialize: (state) => ({
        currentStage: state.currentStage,
        hearingData: state.hearingData,
        conceptData: state.conceptData,
        structureData: state.structureData,
        generationResult: state.generationResult,
        stageHistory: state.stageHistory,
        sessionId: state.sessionId,
        startedAt: state.startedAt,
        lastUpdated: state.lastUpdated
      })
    }
  )
);

// ヘルパー関数

// ヒアリング完了度を計算
function calculateHearingCompletion(hearingData: HearingData): number {
  const requiredFields = [
    'serviceContent',
    'targetCustomerPain',
    'desiredConversion'
  ];
  
  const optionalFields = [
    'uniqueValueProposition',
    'budgetAndUrgency'
  ];
  
  const strategyFields = [
    'competitors',
    'currentChannels',
    'brandImage',
    'successMetrics'
  ];
  
  // 必須フィールドの完了度 (60%)
  const requiredCompletion = requiredFields.filter(field =>
    hearingData.essentialInfo?.[field as keyof typeof hearingData.essentialInfo]
  ).length / requiredFields.length;
  
  // オプションフィールドの完了度 (20%)
  const optionalCompletion = optionalFields.filter(field =>
    hearingData.essentialInfo?.[field as keyof typeof hearingData.essentialInfo]
  ).length / optionalFields.length;
  
  // 戦略フィールドの完了度 (20%)
  const strategyCompletion = strategyFields.filter(field =>
    hearingData.strategyInfo?.[field as keyof typeof hearingData.strategyInfo]
  ).length / strategyFields.length;
  
  return Math.round(
    (requiredCompletion * 60) + 
    (optionalCompletion * 20) + 
    (strategyCompletion * 20)
  );
}

// ヒアリングが完了しているかチェック
function isHearingComplete(hearingData: HearingData): boolean {
  const requiredFields = [
    'serviceContent',
    'targetCustomerPain',
    'desiredConversion'
  ];
  
  const hasAllRequired = requiredFields.every(field =>
    hearingData.essentialInfo?.[field as keyof typeof hearingData.essentialInfo]
  );
  
  // 戦略情報も最低1つは必要
  const hasStrategyInfo = !!(hearingData.strategyInfo && 
    Object.values(hearingData.strategyInfo).some(value => 
      value && (Array.isArray(value) ? value.length > 0 : true)
    ));
  
  return hasAllRequired && hasStrategyInfo;
}

// ワークフロー段階の表示名
export const stageLabels: Record<WorkflowStage, string> = {
  hearing: 'ヒアリング',
  concept: 'コンセプト提案',
  structure: '構成設計',
  generation: 'LP生成',
  complete: '完了'
};

// ワークフロー段階の説明
export const stageDescriptions: Record<WorkflowStage, string> = {
  hearing: '顧客要件の詳細なヒアリングを行います',
  concept: 'ヒアリング結果に基づいてコンセプトを提案します',
  structure: 'LPの構成とワイヤーフレームを設計します',
  generation: '最終的なLPを生成します',
  complete: 'ワークフローが完了しました'
};