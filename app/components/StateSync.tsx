'use client';

import React, { useEffect, useRef } from 'react';
import { useAppState, useLPState, useEditMode } from '../../src/contexts/AppStateContext';
import { useChatIntegration } from '../../src/hooks/useChatIntegration';
import { performanceMonitor } from '../../src/utils/performanceMonitor';

/**
 * StateSync Component - Handles synchronization between chat, edit, and preview components
 * This component ensures state consistency across the application
 */
export function StateSync() {
  const { state } = useAppState();
  const { currentLP } = useLPState();
  const { isEditMode, selectedElementId } = useEditMode();
  const { currentSession } = useChatIntegration();
  
  const lastSyncRef = useRef<{
    lpContent?: string;
    sessionId?: string;
    editMode?: boolean;
    elementId?: string | null;
  }>({});

  // Sync LP content changes with iframe
  useEffect(() => {
    if (currentLP && currentLP.html !== lastSyncRef.current.lpContent) {
      performanceMonitor.startMeasure('state-sync-lp-update');
      
      // Broadcast LP update to iframe
      const iframe = document.querySelector('iframe[title*="LP Preview"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage({
            type: 'LP_UPDATE',
            payload: {
              html: currentLP.html,
              css: currentLP.css,
              metadata: currentLP.metadata
            }
          }, '*');
          
          console.log('🔄 [StateSync] LP content updated in preview');
        } catch (error) {
          console.warn('Failed to update iframe content:', error);
        }
      }
      
      lastSyncRef.current.lpContent = currentLP.html;
      performanceMonitor.endMeasure('state-sync-lp-update');
    }
  }, [currentLP]);

  // Sync session changes
  useEffect(() => {
    if (currentSession && currentSession.id !== lastSyncRef.current.sessionId) {
      performanceMonitor.startMeasure('state-sync-session-switch');
      
      console.log('🔄 [StateSync] Session switched to:', currentSession.name);
      
      // Update document title
      if (typeof document !== 'undefined') {
        const baseTitle = 'LP Creator';
        document.title = currentSession.name !== '新しいセッション' 
          ? `${baseTitle} - ${currentSession.name}`
          : baseTitle;
      }
      
      // Emit session change event for other components
      window.dispatchEvent(new CustomEvent('session-changed', {
        detail: {
          sessionId: currentSession.id,
          sessionName: currentSession.name,
          messageCount: currentSession.messages.length
        }
      }));
      
      lastSyncRef.current.sessionId = currentSession.id;
      performanceMonitor.endMeasure('state-sync-session-switch');
    }
  }, [currentSession]);

  // Sync edit mode changes with iframe
  useEffect(() => {
    const editModeChanged = isEditMode !== lastSyncRef.current.editMode;
    const elementChanged = selectedElementId !== lastSyncRef.current.elementId;
    
    if (editModeChanged || elementChanged) {
      performanceMonitor.startMeasure('state-sync-edit-mode');
      
      const iframe = document.querySelector('iframe[title*="LP Preview"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage({
            type: 'EDIT_MODE_UPDATE',
            payload: {
              isEditMode,
              selectedElementId
            }
          }, '*');
          
          console.log('🔄 [StateSync] Edit mode synced:', { isEditMode, selectedElementId });
        } catch (error) {
          console.warn('Failed to sync edit mode with iframe:', error);
        }
      }
      
      // Update page-level edit indicators
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('edit-mode-active', isEditMode);
        
        if (isEditMode && selectedElementId) {
          document.body.setAttribute('data-selected-element', selectedElementId);
        } else {
          document.body.removeAttribute('data-selected-element');
        }
      }
      
      lastSyncRef.current.editMode = isEditMode;
      lastSyncRef.current.elementId = selectedElementId;
      performanceMonitor.endMeasure('state-sync-edit-mode');
    }
  }, [isEditMode, selectedElementId]);

  // Handle iframe messages for two-way sync
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return; // Security check
      }
      
      const { type, payload } = event.data;
      
      switch (type) {
        case 'ELEMENT_SELECTED':
          // Update selected element from iframe
          if (payload.elementId && isEditMode) {
            console.log('🔄 [StateSync] Element selected from iframe:', payload.elementId);
            // This would be handled by the edit mode context
            window.dispatchEvent(new CustomEvent('iframe-element-selected', {
              detail: { elementId: payload.elementId }
            }));
          }
          break;
          
        case 'CONTENT_CHANGED':
          // Handle direct content changes from iframe
          if (payload.elementId && payload.newContent) {
            console.log('🔄 [StateSync] Content changed in iframe:', {
              elementId: payload.elementId,
              newContent: payload.newContent.substring(0, 50) + '...'
            });
            
            window.dispatchEvent(new CustomEvent('iframe-content-changed', {
              detail: {
                elementId: payload.elementId,
                oldContent: payload.oldContent,
                newContent: payload.newContent
              }
            }));
          }
          break;
          
        case 'PERFORMANCE_METRIC':
          // Receive performance metrics from iframe
          if (payload.name && payload.duration) {
            performanceMonitor.startMeasure(payload.name);
            setTimeout(() => {
              performanceMonitor.endMeasure(payload.name);
            }, payload.duration);
          }
          break;
          
        default:
          // Unknown message type - ignore
          break;
      }
    };
    
    window.addEventListener('message', handleIframeMessage);
    
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [isEditMode]);

  // Periodic sync health check
  useEffect(() => {
    const healthCheck = () => {
      const iframe = document.querySelector('iframe[title*="LP Preview"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage({
            type: 'HEALTH_CHECK',
            payload: {
              timestamp: Date.now(),
              currentLP: !!currentLP,
              editMode: isEditMode,
              sessionId: currentSession?.id
            }
          }, '*');
        } catch (error) {
          console.warn('Health check failed:', error);
        }
      }
    };
    
    const healthInterval = setInterval(healthCheck, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(healthInterval);
    };
  }, [currentLP, isEditMode, currentSession?.id]);

  // Performance monitoring for state sync
  useEffect(() => {
    const reportMetrics = () => {
      const report = performanceMonitor.getReport();
      
      if (report.totalMetrics > 0) {
        console.log('📊 [StateSync] Performance Report:', {
          totalMetrics: report.totalMetrics,
          averageTime: `${report.averageTime.toFixed(2)}ms`,
          slowestOperation: report.slowestOperation?.name,
          failedBenchmarks: report.failedBenchmarks.length
        });
      }
    };
    
    const reportInterval = setInterval(reportMetrics, 5 * 60 * 1000); // Every 5 minutes
    
    return () => {
      clearInterval(reportInterval);
    };
  }, []);

  // Error boundary for state sync issues
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message.includes('StateSync') || error.filename?.includes('StateSync')) {
        console.error('🚨 [StateSync] Error detected:', error);
        
        // Reset sync state on errors
        lastSyncRef.current = {};
        
        // Emit error event for error boundary
        window.dispatchEvent(new CustomEvent('state-sync-error', {
          detail: {
            error: error.error,
            message: error.message,
            timestamp: Date.now()
          }
        }));
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Debug mode logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [StateSync] Current state:', {
        hasCurrentLP: !!currentLP,
        isEditMode,
        selectedElementId,
        sessionId: currentSession?.id,
        messageCount: currentSession?.messages.length || 0
      });
    }
  }, [currentLP, isEditMode, selectedElementId, currentSession]);

  // This component doesn't render anything - it's purely for state synchronization
  return null;
}