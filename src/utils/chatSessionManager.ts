/**
 * Chat Session Management and Persistence Utilities
 * Handles multi-session chat management with local storage and sync
 */

import type { ExtendedMessage } from '../contexts/AppStateContext';

export interface ChatSession {
  id: string;
  name: string;
  messages: ExtendedMessage[];
  lastUsed: number;
  isActive: boolean;
  metadata: {
    messageCount: number;
    lpCount: number; // Number of LPs generated in this session
    totalTokens?: number;
    createdAt: number;
    updatedAt: number;
  };
}

export interface SessionSyncData {
  sessions: Record<string, ChatSession>;
  currentSessionId: string;
  lastSync: number;
}

export class ChatSessionManager {
  private static instance: ChatSessionManager;
  private storageKey = 'lp-creator-sessions';
  private syncInterval: NodeJS.Timeout | null = null;
  private maxSessions = 10;
  private maxMessagesPerSession = 100;

  private constructor() {}

  public static getInstance(): ChatSessionManager {
    if (!ChatSessionManager.instance) {
      ChatSessionManager.instance = new ChatSessionManager();
    }
    return ChatSessionManager.instance;
  }

  /**
   * Load sessions from local storage
   */
  public loadSessions(): SessionSyncData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.getDefaultSessionData();
      }

      const data: SessionSyncData = JSON.parse(stored);
      
      // Validate and clean up old sessions
      const validSessions = this.validateAndCleanSessions(data.sessions);
      
      return {
        sessions: validSessions,
        currentSessionId: data.currentSessionId || Object.keys(validSessions)[0] || 'default',
        lastSync: data.lastSync || Date.now()
      };
    } catch (error) {
      console.warn('Failed to load sessions from storage:', error);
      return this.getDefaultSessionData();
    }
  }

  /**
   * Save sessions to local storage
   */
  public saveSessions(data: SessionSyncData): void {
    try {
      const dataToSave = {
        ...data,
        lastSync: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
      console.log('💾 [SessionManager] Sessions saved to storage');
    } catch (error) {
      console.error('Failed to save sessions to storage:', error);
    }
  }

  /**
   * Create a new session
   */
  public createSession(name?: string): ChatSession {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sessionName = name || this.generateSessionName();
    
    const newSession: ChatSession = {
      id: sessionId,
      name: sessionName,
      messages: [],
      lastUsed: Date.now(),
      isActive: true,
      metadata: {
        messageCount: 0,
        lpCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };
    
    console.log('🆕 [SessionManager] Created new session:', sessionName);
    return newSession;
  }

  /**
   * Update session with new message
   */
  public updateSessionWithMessage(session: ChatSession, message: ExtendedMessage): ChatSession {
    const updatedMessages = [...session.messages, message];
    
    // Check if message contains LP generation result
    const hasLPResult = message.parts?.some(part => 
      part.toolName === 'enhancedLPGeneratorTool' || 
      part.toolName === 'intelligentLPGeneratorTool'
    );
    
    const updatedSession = {
      ...session,
      messages: updatedMessages.slice(-this.maxMessagesPerSession), // Keep max messages
      lastUsed: Date.now(),
      metadata: {
        ...session.metadata,
        messageCount: updatedMessages.length,
        lpCount: session.metadata.lpCount + (hasLPResult ? 1 : 0),
        updatedAt: Date.now()
      }
    };
    
    return updatedSession;
  }

  /**
   * Parse AI response messages and extract tool results
   */
  public parseAIMessage(message: ExtendedMessage): {
    hasLPGeneration: boolean;
    lpResults: Array<{
      toolName: string;
      html: string;
      css: string;
      metadata?: any;
    }>;
    hasError: boolean;
    errorDetails?: any;
  } {
    const parseResult = {
      hasLPGeneration: false,
      lpResults: [] as Array<{ toolName: string; html: string; css: string; metadata?: any }>,
      hasError: false,
      errorDetails: undefined
    };

    if (!message.parts || !Array.isArray(message.parts)) {
      return parseResult;
    }

    for (const part of message.parts) {
      // Check for LP generation tool results
      if (part.toolName === 'enhancedLPGeneratorTool' || 
          part.toolName === 'intelligentLPGeneratorTool' ||
          part.toolName === 'htmlLPTool') {
        
        if (part.result && typeof part.result === 'object') {
          const result = part.result;
          
          if (result.html && result.css) {
            parseResult.hasLPGeneration = true;
            parseResult.lpResults.push({
              toolName: part.toolName,
              html: result.html,
              css: result.css,
              metadata: result.metadata
            });
          }
          
          // Check for errors in tool results
          if (result.error) {
            parseResult.hasError = true;
            parseResult.errorDetails = result.error;
          }
        }
      }
      
      // Check for general errors
      if (part.type === 'error' || part.result?.error) {
        parseResult.hasError = true;
        parseResult.errorDetails = part.result?.error || part;
      }
    }

    return parseResult;
  }

  /**
   * Get session statistics
   */
  public getSessionStats(session: ChatSession): {
    totalMessages: number;
    lpGenerations: number;
    averageResponseTime?: number;
    lastActivity: string;
    sessionDuration: string;
  } {
    const now = Date.now();
    const sessionDuration = now - session.metadata.createdAt;
    const lastActivity = this.formatTimeAgo(now - session.lastUsed);
    
    return {
      totalMessages: session.metadata.messageCount,
      lpGenerations: session.metadata.lpCount,
      lastActivity,
      sessionDuration: this.formatDuration(sessionDuration)
    };
  }

  /**
   * Search sessions by content
   */
  public searchSessions(sessions: Record<string, ChatSession>, query: string): ChatSession[] {
    const lowerQuery = query.toLowerCase();
    
    return Object.values(sessions).filter(session => {
      // Search in session name
      if (session.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Search in message content
      return session.messages.some(message => 
        message.content && message.content.toLowerCase().includes(lowerQuery)
      );
    }).sort((a, b) => b.lastUsed - a.lastUsed);
  }

  /**
   * Export session data
   */
  public exportSession(session: ChatSession): string {
    const exportData = {
      name: session.name,
      createdAt: new Date(session.metadata.createdAt).toISOString(),
      messages: session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
        parts: msg.parts
      })),
      stats: this.getSessionStats(session)
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import session data
   */
  public importSession(jsonData: string): ChatSession {
    try {
      const data = JSON.parse(jsonData);
      const session = this.createSession(data.name || 'Imported Session');
      
      // Process imported messages
      if (data.messages && Array.isArray(data.messages)) {
        session.messages = data.messages.map((msg: any) => ({
          id: `imported-${Math.random().toString(36)}`,
          role: msg.role || 'user',
          content: msg.content || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
          parts: msg.parts
        }));
        
        session.metadata.messageCount = session.messages.length;
      }
      
      return session;
    } catch (error) {
      throw new Error(`Failed to import session: ${error}`);
    }
  }

  /**
   * Start auto-sync for session persistence
   */
  public startAutoSync(saveCallback: (data: SessionSyncData) => void): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      const data = this.loadSessions();
      saveCallback(data);
    }, 30000); // Sync every 30 seconds

    console.log('🔄 [SessionManager] Auto-sync started');
  }

  /**
   * Stop auto-sync
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 [SessionManager] Auto-sync stopped');
    }
  }

  /**
   * Get default session data
   */
  private getDefaultSessionData(): SessionSyncData {
    const defaultSession = this.createSession('新しいセッション');
    
    return {
      sessions: {
        [defaultSession.id]: defaultSession
      },
      currentSessionId: defaultSession.id,
      lastSync: Date.now()
    };
  }

  /**
   * Validate and clean up old sessions
   */
  private validateAndCleanSessions(sessions: Record<string, ChatSession>): Record<string, ChatSession> {
    const validSessions: Record<string, ChatSession> = {};
    const sessionList = Object.values(sessions);
    
    // Sort by last used time (most recent first)
    sessionList.sort((a, b) => b.lastUsed - a.lastUsed);
    
    // Keep only the most recent sessions
    const recentSessions = sessionList.slice(0, this.maxSessions);
    
    for (const session of recentSessions) {
      // Validate session structure
      if (session.id && session.name && Array.isArray(session.messages)) {
        // Ensure metadata exists
        if (!session.metadata) {
          session.metadata = {
            messageCount: session.messages.length,
            lpCount: 0,
            createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000), // Default to 1 week ago
            updatedAt: session.lastUsed || Date.now()
          };
        }
        
        validSessions[session.id] = session;
      }
    }

    return validSessions;
  }

  /**
   * Generate a session name based on context
   */
  private generateSessionName(): string {
    const adjectives = ['新しい', '快適な', '効率的な', '創造的な', '革新的な', '実用的な'];
    const nouns = ['プロジェクト', 'デザイン', 'アイデア', '作業', 'セッション'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}`;
  }

  /**
   * Format time ago string
   */
  private formatTimeAgo(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}日前`;
    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    return '今';
  }

  /**
   * Format duration string
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}日`;
    if (hours > 0) return `${hours}時間`;
    if (minutes > 0) return `${minutes}分`;
    return `${seconds}秒`;
  }
}

// Export singleton instance
export const chatSessionManager = ChatSessionManager.getInstance();