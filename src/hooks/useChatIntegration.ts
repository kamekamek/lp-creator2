'use client';

import { useChat } from '@ai-sdk/react';
import { useAppState, useLoadingState, useErrorState, usePerformanceTracking } from '../contexts/AppStateContext';
import { chatSessionManager } from '../utils/chatSessionManager';
import { useCallback, useEffect, useRef } from 'react';
import type { Message } from 'ai';

/**
 * Enhanced useChat integration with state management and session handling
 */
export function useChatIntegration() {
  const { state, dispatch } = useAppState();
  const { setLoading, setProgress } = useLoadingState();
  const { setError, clearError } = useErrorState();
  const { recordLPGeneration } = usePerformanceTracking();
  
  const generationStartTime = useRef<number>(0);
  const currentSession = state.sessions[state.currentSessionId];

  // Initialize chat hook with custom configuration
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error: chatError,
    reload,
    stop
  } = useChat({
    api: '/api/lp-creator/chat',
    maxRetries: 3,
    retryDelay: 1000,
    onResponse: (response) => {
      if (!response.ok) {
        setError({
          type: 'network',
          message: `サーバーエラーが発生しました: ${response.status}`,
          recoverable: true
        });
      }
    },
    onError: (error) => {
      const duration = Date.now() - generationStartTime.current;
      recordLPGeneration(duration);
      
      setError({
        type: 'ai',
        message: 'AIとの通信中にエラーが発生しました',
        details: error,
        recoverable: true
      });
      setLoading(false);
    },
    onFinish: (message) => {
      const duration = Date.now() - generationStartTime.current;
      recordLPGeneration(duration);
      setLoading(false);
      
      // Parse AI response for LP results
      const parseResult = chatSessionManager.parseAIMessage({
        ...message,
        parts: (message as any).parts
      });
      
      if (parseResult.hasLPGeneration) {
        // Update current LP with the latest result
        const latestResult = parseResult.lpResults[parseResult.lpResults.length - 1];
        dispatch({
          type: 'SET_CURRENT_LP',
          lp: {
            html: latestResult.html,
            css: latestResult.css,
            metadata: latestResult.metadata
          }
        });
        
        // Add variants if multiple results
        if (parseResult.lpResults.length > 1) {
          parseResult.lpResults.slice(0, -1).forEach((result, index) => {
            dispatch({
              type: 'ADD_LP_VARIANT',
              variant: {
                id: `variant-${Date.now()}-${index}`,
                html: result.html,
                css: result.css,
                score: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
                metadata: result.metadata
              }
            });
          });
        }
      }
      
      if (parseResult.hasError) {
        setError({
          type: 'generation',
          message: 'LP生成中にエラーが発生しました',
          details: parseResult.errorDetails,
          recoverable: true
        });
      }
    }
  });

  // Sync messages with session state
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // Add message to current session
      dispatch({
        type: 'ADD_MESSAGE',
        sessionId: state.currentSessionId,
        message: {
          ...latestMessage,
          sessionId: state.currentSessionId,
          timestamp: Date.now(),
          parts: (latestMessage as any).parts
        }
      });
      
      // Save to localStorage
      const sessionData = chatSessionManager.loadSessions();
      const updatedSession = chatSessionManager.updateSessionWithMessage(
        currentSession,
        {
          ...latestMessage,
          sessionId: state.currentSessionId,
          timestamp: Date.now(),
          parts: (latestMessage as any).parts
        }
      );
      
      sessionData.sessions[state.currentSessionId] = updatedSession;
      chatSessionManager.saveSessions(sessionData);
    }
  }, [messages, dispatch, state.currentSessionId, currentSession]);

  // Enhanced submit handler with loading states
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    clearError();
    setLoading(true, 'AI処理中...');
    setProgress(0);
    generationStartTime.current = Date.now();
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 85));
    }, 500);
    
    try {
      await originalHandleSubmit(e);
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [input, originalHandleSubmit, setLoading, setProgress, clearError]);

  // Send prompt programmatically
  const sendPrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setInput(prompt);
    clearError();
    setLoading(true, 'AI処理中...');
    generationStartTime.current = Date.now();
    
    try {
      // Create a synthetic form event
      const event = new Event('submit') as any;
      event.preventDefault = () => {};
      
      // Temporarily set input and submit
      const originalValue = input;
      setInput(prompt);
      
      await originalHandleSubmit({
        preventDefault: () => {},
        currentTarget: {
          elements: {
            message: { value: prompt }
          }
        }
      } as any);
      
      setInput(originalValue);
    } catch (error) {
      console.error('Error sending prompt:', error);
      setError({
        type: 'unknown',
        message: 'メッセージ送信中にエラーが発生しました',
        recoverable: true
      });
    }
  }, [input, setInput, originalHandleSubmit, setLoading, clearError]);

  // Retry last message
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      sendPrompt(lastUserMessage.content);
    }
  }, [messages, sendPrompt]);

  // Clear current conversation
  const clearConversation = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES', sessionId: state.currentSessionId });
    dispatch({ type: 'SET_CURRENT_LP', lp: null });
    dispatch({ type: 'CLEAR_LP_VARIANTS' });
    
    // Clear localStorage
    const sessionData = chatSessionManager.loadSessions();
    if (sessionData.sessions[state.currentSessionId]) {
      sessionData.sessions[state.currentSessionId].messages = [];
      sessionData.sessions[state.currentSessionId].metadata.messageCount = 0;
      sessionData.sessions[state.currentSessionId].metadata.lpCount = 0;
      chatSessionManager.saveSessions(sessionData);
    }
  }, [dispatch, state.currentSessionId]);

  // Switch to different session
  const switchSession = useCallback((sessionId: string) => {
    dispatch({ type: 'SET_SESSION', sessionId });
  }, [dispatch]);

  // Create new session
  const createNewSession = useCallback((name?: string) => {
    dispatch({ type: 'CREATE_SESSION', name });
  }, [dispatch]);

  // Delete session
  const deleteSession = useCallback((sessionId: string) => {
    if (sessionId === 'default') return; // Prevent deleting default session
    
    dispatch({ type: 'DELETE_SESSION', sessionId });
    
    // Remove from localStorage
    const sessionData = chatSessionManager.loadSessions();
    delete sessionData.sessions[sessionId];
    
    // Update current session if needed
    if (sessionData.currentSessionId === sessionId) {
      const remainingSessions = Object.keys(sessionData.sessions);
      sessionData.currentSessionId = remainingSessions[0] || 'default';
    }
    
    chatSessionManager.saveSessions(sessionData);
  }, [dispatch]);

  // Get session placeholder text
  const getPlaceholder = useCallback((): string => {
    const messageCount = currentSession?.messages?.length || 0;
    
    if (messageCount === 0) {
      return '例：AI写真編集アプリのランディングページを作成してください...';
    }
    
    return 'さらに詳細や変更点があれば教えてください...';
  }, [currentSession?.messages?.length]);

  return {
    // Chat state
    messages: currentSession?.messages || [],
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: isLoading || state.isLoading,
    error: chatError || state.error,
    
    // Session management
    currentSession,
    switchSession,
    createNewSession,
    deleteSession,
    
    // Actions
    sendPrompt,
    retryLastMessage,
    clearConversation,
    reload,
    stop,
    
    // Utilities
    getPlaceholder,
    
    // State
    loadingStage: state.loadingStage,
    progress: state.progress
  };
}