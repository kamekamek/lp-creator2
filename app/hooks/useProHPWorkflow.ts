'use client';

import { useState, useCallback } from 'react';

interface WorkflowInput {
  initialQuery: string;
  businessType?: string;
  targetAudience?: string;
  goals?: string;
}

interface WorkflowState {
  runId: string;
  status: string;
  currentStep: string;
  output?: any;
  needsUserInput?: boolean;
  confirmationRequest?: string;
  progress?: {
    percentage: number;
    step: number;
    totalSteps: number;
    stepName: string;
  };
}

interface UseProHPWorkflowReturn {
  workflowState: WorkflowState | null;
  isLoading: boolean;
  error: string | null;
  startWorkflow: (input: WorkflowInput) => Promise<void>;
  resumeWorkflow: (runId: string, feedback: { approved: boolean; feedback?: string }) => Promise<void>;
  getWorkflowStatus: (runId: string) => Promise<void>;
  resetWorkflow: () => void;
}

export function useProHPWorkflow(): UseProHPWorkflowReturn {
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = useCallback(async (apiCall: () => Promise<Response>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API call failed');
      }

      setWorkflowState(data.data);
      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Workflow API error:', err);
      throw err;

    } finally {
      setIsLoading(false);
    }
  }, []);

  const startWorkflow = useCallback(async (input: WorkflowInput) => {
    console.log('Starting workflow with input:', input);
    
    return handleApiCall(async () => {
      return fetch('/api/pro-hp-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          input,
        }),
      });
    });
  }, [handleApiCall]);

  const resumeWorkflow = useCallback(async (runId: string, feedback: { approved: boolean; feedback?: string }) => {
    console.log('Resuming workflow:', runId, 'with feedback:', feedback);
    
    return handleApiCall(async () => {
      return fetch('/api/pro-hp-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resume',
          runId,
          stepData: feedback,
        }),
      });
    });
  }, [handleApiCall]);

  const getWorkflowStatus = useCallback(async (runId: string) => {
    console.log('Getting workflow status for:', runId);
    
    return handleApiCall(async () => {
      return fetch(`/api/pro-hp-workflow?runId=${encodeURIComponent(runId)}`, {
        method: 'GET',
      });
    });
  }, [handleApiCall]);

  const resetWorkflow = useCallback(() => {
    setWorkflowState(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    workflowState,
    isLoading,
    error,
    startWorkflow,
    resumeWorkflow,
    getWorkflowStatus,
    resetWorkflow,
  };
}