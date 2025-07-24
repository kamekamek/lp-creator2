'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Message } from 'ai';
import { memoryManager } from '../utils/memoryManager';

// Extended message type for AI responses
export type ExtendedMessage = Message & {
  parts?: Array<{
    type: string;
    toolName?: string;
    result?: any;
    [key: string]: any;
  }>;
  sessionId?: string;
  timestamp?: number;
};

// Application state interface
export interface AppState {
  // Chat session management
  currentSessionId: string;
  sessions: Record<string, {
    id: string;
    name: string;
    messages: ExtendedMessage[];
    lastUsed: number;
    isActive: boolean;
  }>;
  
  // Edit mode state
  isEditMode: boolean;
  selectedElementId: string | null;
  editHistory: Array<{
    elementId: string;
    oldContent: string;
    newContent: string;
    timestamp: number;
  }>;
  
  // LP generation state
  currentLP: {
    html: string;
    css: string;
    metadata?: any;
  } | null;
  lpVariants: Array<{
    id: string;
    html: string;
    css: string;
    score: number;
    metadata?: any;
  }>;
  
  // UI state
  isLoading: boolean;
  loadingStage: string | null;
  progress: number;
  
  // Error state
  error: {
    type: 'network' | 'ai' | 'generation' | 'validation' | 'unknown';
    message: string;
    details?: any;
    recoverable: boolean;
  } | null;
  
  // Offline support
  isOnline: boolean;
  pendingActions: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: number;
  }>;
  
  // Performance tracking
  performanceMetrics: {
    lpGenerationTimes: number[];
    editOperationTimes: number[];
    lastCleanup: number;
  };
}

// Action types
export type AppAction =
  | { type: 'SET_SESSION'; sessionId: string }
  | { type: 'CREATE_SESSION'; name?: string }
  | { type: 'DELETE_SESSION'; sessionId: string }
  | { type: 'RENAME_SESSION'; sessionId: string; name: string }
  | { type: 'ADD_MESSAGE'; sessionId?: string; message: ExtendedMessage }
  | { type: 'UPDATE_MESSAGE'; sessionId?: string; messageId: string; updates: Partial<ExtendedMessage> }
  | { type: 'CLEAR_MESSAGES'; sessionId?: string }
  
  | { type: 'SET_EDIT_MODE'; isEditMode: boolean }
  | { type: 'SELECT_ELEMENT'; elementId: string | null }
  | { type: 'ADD_EDIT_HISTORY'; elementId: string; oldContent: string; newContent: string }
  | { type: 'CLEAR_EDIT_HISTORY' }
  
  | { type: 'SET_CURRENT_LP'; lp: AppState['currentLP'] }
  | { type: 'ADD_LP_VARIANT'; variant: AppState['lpVariants'][0] }
  | { type: 'REMOVE_LP_VARIANT'; variantId: string }
  | { type: 'CLEAR_LP_VARIANTS' }
  
  | { type: 'SET_LOADING'; isLoading: boolean; stage?: string }
  | { type: 'SET_PROGRESS'; progress: number }
  
  | { type: 'SET_ERROR'; error: AppState['error'] }
  | { type: 'CLEAR_ERROR' }
  
  | { type: 'SET_ONLINE'; isOnline: boolean }
  | { type: 'ADD_PENDING_ACTION'; action: AppState['pendingActions'][0] }
  | { type: 'REMOVE_PENDING_ACTION'; actionId: string }
  | { type: 'CLEAR_PENDING_ACTIONS' }
  
  | { type: 'RECORD_PERFORMANCE'; type: 'lpGeneration' | 'editOperation'; duration: number }
  | { type: 'FORCE_CLEANUP' };

// Initial state
const initialState: AppState = {
  currentSessionId: 'default',
  sessions: {
    default: {
      id: 'default',
      name: '新しいセッション',
      messages: [],
      lastUsed: Date.now(),
      isActive: true
    }
  },
  isEditMode: false,
  selectedElementId: null,
  editHistory: [],
  currentLP: null,
  lpVariants: [],
  isLoading: false,
  loadingStage: null,
  progress: 0,
  error: null,
  isOnline: true,
  pendingActions: [],
  performanceMetrics: {
    lpGenerationTimes: [],
    editOperationTimes: [],
    lastCleanup: Date.now()
  }
};

// State reducer
function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SESSION': {
      if (!state.sessions[action.sessionId]) {
        return state;
      }
      return {
        ...state,
        currentSessionId: action.sessionId,
        sessions: {
          ...state.sessions,
          [action.sessionId]: {
            ...state.sessions[action.sessionId],
            lastUsed: Date.now(),
            isActive: true
          }
        }
      };
    }
    
    case 'CREATE_SESSION': {
      const newSessionId = `session-${Date.now()}`;
      const sessionName = action.name || `セッション ${Object.keys(state.sessions).length + 1}`;
      
      return {
        ...state,
        currentSessionId: newSessionId,
        sessions: {
          ...state.sessions,
          [newSessionId]: {
            id: newSessionId,
            name: sessionName,
            messages: [],
            lastUsed: Date.now(),
            isActive: true
          }
        }
      };
    }
    
    case 'DELETE_SESSION': {
      if (action.sessionId === 'default' || !state.sessions[action.sessionId]) {
        return state;
      }
      
      const newSessions = { ...state.sessions };
      delete newSessions[action.sessionId];
      
      const remainingSessions = Object.keys(newSessions);
      const newCurrentSessionId = state.currentSessionId === action.sessionId
        ? remainingSessions[0] || 'default'
        : state.currentSessionId;
      
      return {
        ...state,
        currentSessionId: newCurrentSessionId,
        sessions: newSessions
      };
    }
    
    case 'RENAME_SESSION': {
      if (!state.sessions[action.sessionId]) {
        return state;
      }
      
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [action.sessionId]: {
            ...state.sessions[action.sessionId],
            name: action.name
          }
        }
      };
    }
    
    case 'ADD_MESSAGE': {
      const sessionId = action.sessionId || state.currentSessionId;
      const enhancedMessage = {
        ...action.message,
        sessionId,
        timestamp: action.message.timestamp || Date.now()
      };
      
      const session = state.sessions[sessionId];
      if (!session) {
        return state;
      }
      
      const updatedMessages = [...session.messages, enhancedMessage];
      
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages: updatedMessages,
            lastUsed: Date.now()
          }
        }
      };
    }
    
    case 'UPDATE_MESSAGE': {
      const sessionId = action.sessionId || state.currentSessionId;
      const session = state.sessions[sessionId];
      
      if (!session) {
        return state;
      }
      
      const updatedMessages = session.messages.map(msg =>
        msg.id === action.messageId ? { ...msg, ...action.updates } : msg
      );
      
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages: updatedMessages
          }
        }
      };
    }
    
    case 'CLEAR_MESSAGES': {
      const sessionId = action.sessionId || state.currentSessionId;
      const session = state.sessions[sessionId];
      
      if (!session) {
        return state;
      }
      
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages: []
          }
        }
      };
    }
    
    case 'SET_EDIT_MODE':
      return {
        ...state,
        isEditMode: action.isEditMode,
        selectedElementId: action.isEditMode ? state.selectedElementId : null
      };
    
    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElementId: action.elementId
      };
    
    case 'ADD_EDIT_HISTORY':
      return {
        ...state,
        editHistory: [...state.editHistory.slice(-19), {
          elementId: action.elementId,
          oldContent: action.oldContent,
          newContent: action.newContent,
          timestamp: Date.now()
        }]
      };
    
    case 'CLEAR_EDIT_HISTORY':
      return {
        ...state,
        editHistory: []
      };
    
    case 'SET_CURRENT_LP':
      return {
        ...state,
        currentLP: action.lp
      };
    
    case 'ADD_LP_VARIANT':
      return {
        ...state,
        lpVariants: [...state.lpVariants, action.variant].slice(-5) // Keep max 5 variants
      };
    
    case 'REMOVE_LP_VARIANT':
      return {
        ...state,
        lpVariants: state.lpVariants.filter(variant => variant.id !== action.variantId)
      };
    
    case 'CLEAR_LP_VARIANTS':
      return {
        ...state,
        lpVariants: []
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
        loadingStage: action.stage || null
      };
    
    case 'SET_PROGRESS':
      return {
        ...state,
        progress: Math.max(0, Math.min(100, action.progress))
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'SET_ONLINE':
      return {
        ...state,
        isOnline: action.isOnline
      };
    
    case 'ADD_PENDING_ACTION':
      return {
        ...state,
        pendingActions: [...state.pendingActions, action.action]
      };
    
    case 'REMOVE_PENDING_ACTION':
      return {
        ...state,
        pendingActions: state.pendingActions.filter(a => a.id !== action.actionId)
      };
    
    case 'CLEAR_PENDING_ACTIONS':
      return {
        ...state,
        pendingActions: []
      };
    
    case 'RECORD_PERFORMANCE': {
      const { type, duration } = action;
      const metrics = { ...state.performanceMetrics };
      
      if (type === 'lpGeneration') {
        metrics.lpGenerationTimes = [...metrics.lpGenerationTimes, duration].slice(-10);
      } else if (type === 'editOperation') {
        metrics.editOperationTimes = [...metrics.editOperationTimes, duration].slice(-20);
      }
      
      return {
        ...state,
        performanceMetrics: metrics
      };
    }
    
    case 'FORCE_CLEANUP': {
      // Clean up old data using memory manager
      const cleanedState = memoryManager.cleanupAppState(state, {
        variants: state.lpVariants,
        messages: state.sessions[state.currentSessionId]?.messages || [],
        htmlContent: state.currentLP?.html || ''
      });
      
      return {
        ...cleanedState,
        performanceMetrics: {
          ...cleanedState.performanceMetrics,
          lastCleanup: Date.now()
        }
      };
    }
    
    default:
      return state;
  }
}

// Context
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  
  // Auto cleanup on memory pressure
  useEffect(() => {
    const cleanup = () => {
      const timeSinceLastCleanup = Date.now() - state.performanceMetrics.lastCleanup;
      if (timeSinceLastCleanup > 5 * 60 * 1000) { // 5 minutes
        dispatch({ type: 'FORCE_CLEANUP' });
      }
    };
    
    const interval = setInterval(cleanup, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.performanceMetrics.lastCleanup]);
  
  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', isOnline: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', isOnline: false });
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Process pending actions when coming back online
  useEffect(() => {
    if (state.isOnline && state.pendingActions.length > 0) {
      console.log('🔄 [StateManager] Processing pending actions:', state.pendingActions.length);
      // Here you would implement the logic to process pending actions
      // For now, we'll just clear them
      setTimeout(() => {
        dispatch({ type: 'CLEAR_PENDING_ACTIONS' });
      }, 1000);
    }
  }, [state.isOnline, state.pendingActions.length]);
  
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Custom hook
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// Selector hooks for performance
export function useCurrentSession() {
  const { state } = useAppState();
  return state.sessions[state.currentSessionId];
}

export function useEditMode() {
  const { state, dispatch } = useAppState();
  return {
    isEditMode: state.isEditMode,
    selectedElementId: state.selectedElementId,
    toggleEditMode: () => dispatch({ type: 'SET_EDIT_MODE', isEditMode: !state.isEditMode }),
    selectElement: (elementId: string | null) => dispatch({ type: 'SELECT_ELEMENT', elementId }),
    addEditHistory: (elementId: string, oldContent: string, newContent: string) =>
      dispatch({ type: 'ADD_EDIT_HISTORY', elementId, oldContent, newContent })
  };
}

export function useLPState() {
  const { state, dispatch } = useAppState();
  return {
    currentLP: state.currentLP,
    variants: state.lpVariants,
    setCurrentLP: (lp: AppState['currentLP']) => dispatch({ type: 'SET_CURRENT_LP', lp }),
    addVariant: (variant: AppState['lpVariants'][0]) => dispatch({ type: 'ADD_LP_VARIANT', variant }),
    removeVariant: (variantId: string) => dispatch({ type: 'REMOVE_LP_VARIANT', variantId }),
    clearVariants: () => dispatch({ type: 'CLEAR_LP_VARIANTS' })
  };
}

export function useLoadingState() {
  const { state, dispatch } = useAppState();
  return {
    isLoading: state.isLoading,
    loadingStage: state.loadingStage,
    progress: state.progress,
    setLoading: (isLoading: boolean, stage?: string) =>
      dispatch({ type: 'SET_LOADING', isLoading, stage }),
    setProgress: (progress: number) => dispatch({ type: 'SET_PROGRESS', progress })
  };
}

export function useErrorState() {
  const { state, dispatch } = useAppState();
  return {
    error: state.error,
    setError: (error: AppState['error']) => dispatch({ type: 'SET_ERROR', error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' })
  };
}

// Performance tracking hooks
export function usePerformanceTracking() {
  const { dispatch } = useAppState();
  
  const recordLPGeneration = (duration: number) => {
    dispatch({ type: 'RECORD_PERFORMANCE', type: 'lpGeneration', duration });
  };
  
  const recordEditOperation = (duration: number) => {
    dispatch({ type: 'RECORD_PERFORMANCE', type: 'editOperation', duration });
  };
  
  const forceCleanup = () => {
    dispatch({ type: 'FORCE_CLEANUP' });
  };
  
  return {
    recordLPGeneration,
    recordEditOperation,
    forceCleanup
  };
}