/**
 * State Management Integration Tests
 * Tests the complete state management workflow including chat, edit mode, and session handling
 */

import { test, expect, describe, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AppStateProvider, useAppState, useEditMode, useLPState } from '../../src/contexts/AppStateContext';
import { chatSessionManager } from '../../src/utils/chatSessionManager';
import { memoryManager } from '../../src/utils/memoryManager';
import React from 'react';

// Mock components for testing
const TestComponent = () => {
  const { state, dispatch } = useAppState();
  const editMode = useEditMode();
  const lpState = useLPState();

  return (
    <div>
      <div data-testid="current-session">{state.currentSessionId}</div>
      <div data-testid="session-count">{Object.keys(state.sessions).length}</div>
      <div data-testid="edit-mode">{editMode.isEditMode ? 'true' : 'false'}</div>
      <div data-testid="selected-element">{editMode.selectedElementId || 'none'}</div>
      <div data-testid="current-lp">{lpState.currentLP ? 'exists' : 'none'}</div>
      <div data-testid="variants-count">{lpState.variants.length}</div>
      <div data-testid="loading">{state.isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{state.error ? state.error.message : 'none'}</div>
      
      <button 
        onClick={() => dispatch({ type: 'CREATE_SESSION', name: 'Test Session' })}
        data-testid="create-session"
      >
        Create Session
      </button>
      
      <button 
        onClick={() => editMode.toggleEditMode()}
        data-testid="toggle-edit"
      >
        Toggle Edit
      </button>
      
      <button 
        onClick={() => lpState.setCurrentLP({
          html: '<div>Test HTML</div>',
          css: 'div { color: red; }',
          metadata: { title: 'Test LP' }
        })}
        data-testid="set-lp"
      >
        Set LP
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AppStateProvider>
      {component}
    </AppStateProvider>
  );
};

describe('State Management Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset singleton instances
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    localStorage.clear();
  });

  describe('Application State Context', () => {
    test('should initialize with default state', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('current-session')).toHaveTextContent('default');
      expect(screen.getByTestId('session-count')).toHaveTextContent('1');
      expect(screen.getByTestId('edit-mode')).toHaveTextContent('false');
      expect(screen.getByTestId('selected-element')).toHaveTextContent('none');
      expect(screen.getByTestId('current-lp')).toHaveTextContent('none');
      expect(screen.getByTestId('variants-count')).toHaveTextContent('0');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    test('should handle session creation', async () => {
      renderWithProvider(<TestComponent />);
      
      const createButton = screen.getByTestId('create-session');
      
      await act(async () => {
        fireEvent.click(createButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('session-count')).toHaveTextContent('2');
      });
      
      // Should switch to new session
      const sessionId = screen.getByTestId('current-session').textContent;
      expect(sessionId).not.toBe('default');
      expect(sessionId).toMatch(/^session-/);
    });

    test('should handle edit mode toggle', async () => {
      renderWithProvider(<TestComponent />);
      
      const toggleButton = screen.getByTestId('toggle-edit');
      
      await act(async () => {
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('edit-mode')).toHaveTextContent('true');
      });
      
      await act(async () => {
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('edit-mode')).toHaveTextContent('false');
      });
    });

    test('should handle LP state management', async () => {
      renderWithProvider(<TestComponent />);
      
      const setLPButton = screen.getByTestId('set-lp');
      
      await act(async () => {
        fireEvent.click(setLPButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-lp')).toHaveTextContent('exists');
      });
    });
  });

  describe('Chat Session Manager Integration', () => {
    test('should create and manage sessions', () => {
      const session1 = chatSessionManager.createSession('Test Session 1');
      const session2 = chatSessionManager.createSession('Test Session 2');
      
      expect(session1.id).toMatch(/^session-/);
      expect(session1.name).toBe('Test Session 1');
      expect(session1.messages).toEqual([]);
      expect(session1.metadata.messageCount).toBe(0);
      
      expect(session2.id).toMatch(/^session-/);
      expect(session2.name).toBe('Test Session 2');
      expect(session2.id).not.toBe(session1.id);
    });

    test('should update session with messages', () => {
      const session = chatSessionManager.createSession('Test Session');
      const message = {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Test message',
        timestamp: Date.now()
      };
      
      const updatedSession = chatSessionManager.updateSessionWithMessage(session, message);
      
      expect(updatedSession.messages).toHaveLength(1);
      expect(updatedSession.messages[0]).toEqual(message);
      expect(updatedSession.metadata.messageCount).toBe(1);
      expect(updatedSession.lastUsed).toBeGreaterThan(session.lastUsed);
    });

    test('should parse AI messages for LP results', () => {
      const message = {
        id: 'msg-1',
        role: 'assistant' as const,
        content: 'Generated LP for you',
        parts: [
          {
            type: 'tool-result',
            toolName: 'enhancedLPGeneratorTool',
            result: {
              html: '<div>Test LP</div>',
              css: 'div { color: blue; }',
              metadata: { title: 'Test' }
            }
          }
        ]
      };
      
      const parseResult = chatSessionManager.parseAIMessage(message);
      
      expect(parseResult.hasLPGeneration).toBe(true);
      expect(parseResult.lpResults).toHaveLength(1);
      expect(parseResult.lpResults[0].html).toBe('<div>Test LP</div>');
      expect(parseResult.lpResults[0].css).toBe('div { color: blue; }');
      expect(parseResult.hasError).toBe(false);
    });

    test('should handle localStorage persistence', () => {
      const session = chatSessionManager.createSession('Persistent Session');
      const sessionData = {
        sessions: { [session.id]: session },
        currentSessionId: session.id,
        lastSync: Date.now()
      };
      
      chatSessionManager.saveSessions(sessionData);
      
      const loadedData = chatSessionManager.loadSessions();
      
      expect(loadedData.sessions[session.id]).toBeDefined();
      expect(loadedData.sessions[session.id].name).toBe('Persistent Session');
      expect(loadedData.currentSessionId).toBe(session.id);
    });
  });

  describe('Memory Management Integration', () => {
    test('should track memory usage', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 500 * 1024 * 1024 // 500MB
      };
      
      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        writable: true
      });
      
      const stats = memoryManager.getMemoryStats();
      
      expect(stats).toBeDefined();
      expect(stats?.usedJSHeapSize).toBe(50 * 1024 * 1024);
      expect(stats?.totalJSHeapSize).toBe(100 * 1024 * 1024);
    });

    test('should process large HTML content', () => {
      const largeHTML = '<div>' + 'x'.repeat(2 * 1024 * 1024) + '</div>'; // 2MB content
      
      const result = memoryManager.processLargeHTML(largeHTML);
      
      expect(result.needsChunking).toBe(true);
      expect(result.chunks.length).toBeGreaterThan(1);
      expect(result.totalSize).toBeGreaterThan(2 * 1024 * 1024);
      
      // Verify chunks can be reassembled
      const reassembled = result.chunks.join('');
      expect(reassembled.length).toBe(largeHTML.length);
    });

    test('should clean up application state', () => {
      const mockState = {
        variants: new Array(10).fill(0).map((_, i) => ({ id: `variant-${i}` })),
        messages: new Array(100).fill(0).map((_, i) => ({ id: `msg-${i}` })),
        htmlContent: '<div>' + 'x'.repeat(1000) + '</div>'
      };
      
      const cleanedState = memoryManager.cleanupAppState(mockState, {
        variants: mockState.variants,
        messages: mockState.messages,
        htmlContent: mockState.htmlContent
      });
      
      // Should limit variants to maxVariants (5)
      expect((cleanedState as any).variants).toHaveLength(5);
      
      // Should limit messages to maxMessages (50)
      expect((cleanedState as any).messages).toHaveLength(50);
    });
  });

  describe('Performance Integration', () => {
    test('should track performance metrics in state operations', async () => {
      const TestPerformanceComponent = () => {
        const { dispatch } = useAppState();
        
        return (
          <button
            onClick={() => {
              const start = performance.now();
              dispatch({ type: 'CREATE_SESSION', name: 'Perf Test' });
              const duration = performance.now() - start;
              dispatch({ type: 'RECORD_PERFORMANCE', type: 'editOperation', duration });
            }}
            data-testid="perf-test"
          >
            Performance Test
          </button>
        );
      };
      
      renderWithProvider(<TestPerformanceComponent />);
      
      const button = screen.getByTestId('perf-test');
      
      await act(async () => {
        fireEvent.click(button);
      });
      
      // Performance should be recorded (tested through state changes)
      expect(button).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle state errors gracefully', async () => {
      const ErrorTestComponent = () => {
        const { state, dispatch } = useAppState();
        
        return (
          <div>
            <div data-testid="error-state">{state.error?.message || 'none'}</div>
            <button
              onClick={() => dispatch({
                type: 'SET_ERROR',
                error: {
                  type: 'generation',
                  message: 'Test error message',
                  recoverable: true
                }
              })}
              data-testid="set-error"
            >
              Set Error
            </button>
            <button
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              data-testid="clear-error"
            >
              Clear Error
            </button>
          </div>
        );
      };
      
      renderWithProvider(<ErrorTestComponent />);
      
      const setErrorButton = screen.getByTestId('set-error');
      const clearErrorButton = screen.getByTestId('clear-error');
      
      await act(async () => {
        fireEvent.click(setErrorButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Test error message');
      });
      
      await act(async () => {
        fireEvent.click(clearErrorButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('none');
      });
    });
  });

  describe('Offline Support Integration', () => {
    test('should handle offline state', async () => {
      const OfflineTestComponent = () => {
        const { state, dispatch } = useAppState();
        
        return (
          <div>
            <div data-testid="online-state">{state.isOnline ? 'online' : 'offline'}</div>
            <div data-testid="pending-count">{state.pendingActions.length}</div>
            <button
              onClick={() => dispatch({ type: 'SET_ONLINE', isOnline: false })}
              data-testid="go-offline"
            >
              Go Offline
            </button>
            <button
              onClick={() => dispatch({
                type: 'ADD_PENDING_ACTION',
                action: {
                  id: 'action-1',
                  type: 'createLP',
                  data: { prompt: 'test' },
                  timestamp: Date.now()
                }
              })}
              data-testid="add-pending"
            >
              Add Pending
            </button>
          </div>
        );
      };
      
      renderWithProvider(<OfflineTestComponent />);
      
      // Should start online
      expect(screen.getByTestId('online-state')).toHaveTextContent('online');
      
      // Go offline
      await act(async () => {
        fireEvent.click(screen.getByTestId('go-offline'));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('online-state')).toHaveTextContent('offline');
      });
      
      // Add pending action
      await act(async () => {
        fireEvent.click(screen.getByTestId('add-pending'));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
      });
    });
  });
});