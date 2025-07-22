/**
 * Streaming and Progressive Loading Utilities for LP Generation
 * Handles chunked loading and progressive rendering of large content
 */

export interface StreamChunk {
  id: string;
  type: 'html' | 'css' | 'metadata' | 'complete';
  content: string;
  progress: number; // 0-100
  timestamp: number;
}

export interface ProgressiveLoadingConfig {
  chunkSize: number;
  delayMs: number;
  enableProgressiveRender: boolean;
  maxConcurrentChunks: number;
}

export class StreamingLoader {
  private config: ProgressiveLoadingConfig;
  private onProgress?: (chunk: StreamChunk) => void;
  private onComplete?: (result: { html: string; css: string; metadata: any }) => void;
  private onError?: (error: Error) => void;
  private abortController: AbortController | null = null;

  constructor(config?: Partial<ProgressiveLoadingConfig>) {
    this.config = {
      chunkSize: 8192, // 8KB chunks
      delayMs: 50,
      enableProgressiveRender: true,
      maxConcurrentChunks: 3,
      ...config
    };
  }

  /**
   * Set event handlers for streaming progress
   */
  public setHandlers(handlers: {
    onProgress?: (chunk: StreamChunk) => void;
    onComplete?: (result: { html: string; css: string; metadata: any }) => void;
    onError?: (error: Error) => void;
  }): void {
    this.onProgress = handlers.onProgress;
    this.onComplete = handlers.onComplete;
    this.onError = handlers.onError;
  }

  /**
   * Simulate streaming LP generation (for development/testing)
   */
  public async simulateStreaming(content: {
    html: string;
    css: string;
    metadata?: any;
  }): Promise<void> {
    try {
      this.abortController = new AbortController();
      const { html, css, metadata } = content;
      
      // Calculate total chunks
      const htmlChunks = this.chunkContent(html, this.config.chunkSize);
      const cssChunks = this.chunkContent(css, this.config.chunkSize);
      const totalChunks = htmlChunks.length + cssChunks.length + 1; // +1 for metadata
      
      let processedChunks = 0;

      // Stream metadata first
      await this.delay(this.config.delayMs);
      this.emitProgress({
        id: `metadata-0`,
        type: 'metadata',
        content: JSON.stringify(metadata || {}),
        progress: (++processedChunks / totalChunks) * 100,
        timestamp: Date.now()
      });

      // Stream HTML chunks
      for (let i = 0; i < htmlChunks.length; i++) {
        if (this.abortController.signal.aborted) break;
        
        await this.delay(this.config.delayMs);
        this.emitProgress({
          id: `html-${i}`,
          type: 'html',
          content: htmlChunks[i],
          progress: (++processedChunks / totalChunks) * 100,
          timestamp: Date.now()
        });
      }

      // Stream CSS chunks
      for (let i = 0; i < cssChunks.length; i++) {
        if (this.abortController.signal.aborted) break;
        
        await this.delay(this.config.delayMs);
        this.emitProgress({
          id: `css-${i}`,
          type: 'css',
          content: cssChunks[i],
          progress: (++processedChunks / totalChunks) * 100,
          timestamp: Date.now()
        });
      }

      // Emit completion
      if (!this.abortController.signal.aborted) {
        this.emitProgress({
          id: 'complete',
          type: 'complete',
          content: '',
          progress: 100,
          timestamp: Date.now()
        });

        if (this.onComplete) {
          this.onComplete({ html, css, metadata });
        }
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error);
      }
    }
  }

  /**
   * Process real streaming response
   */
  public async processStream(response: Response): Promise<void> {
    if (!response.body) {
      throw new Error('Response body is not available for streaming');
    }

    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;
      
      const result = {
        html: '',
        css: '',
        metadata: null as any
      };

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines/chunks
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = this.parseStreamChunk(line, chunkCount++);
              
              // Accumulate content
              switch (chunk.type) {
                case 'html':
                  result.html += chunk.content;
                  break;
                case 'css':
                  result.css += chunk.content;
                  break;
                case 'metadata':
                  result.metadata = JSON.parse(chunk.content);
                  break;
              }
              
              this.emitProgress(chunk);
              
              if (chunk.type === 'complete') {
                if (this.onComplete) {
                  this.onComplete(result);
                }
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse stream chunk:', line, parseError);
            }
          }
        }
      }
      
      // Process any remaining buffer content
      if (buffer.trim()) {
        const finalChunk = this.parseStreamChunk(buffer, chunkCount);
        this.emitProgress(finalChunk);
      }
      
      if (this.onComplete) {
        this.onComplete(result);
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error);
      }
    }
  }

  /**
   * Parse a stream chunk from server response
   */
  private parseStreamChunk(line: string, index: number): StreamChunk {
    try {
      // Try to parse as JSON first (structured chunk)
      const parsed = JSON.parse(line);
      return {
        id: parsed.id || `chunk-${index}`,
        type: parsed.type || 'html',
        content: parsed.content || '',
        progress: parsed.progress || 0,
        timestamp: parsed.timestamp || Date.now()
      };
    } catch {
      // Fallback: treat as plain content
      return {
        id: `chunk-${index}`,
        type: 'html',
        content: line,
        progress: 0,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Chunk content into smaller pieces
   */
  private chunkContent(content: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Emit progress event
   */
  private emitProgress(chunk: StreamChunk): void {
    if (this.onProgress) {
      this.onProgress(chunk);
    }
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Abort current streaming operation
   */
  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

/**
 * Progressive HTML renderer that updates content incrementally
 */
export class ProgressiveRenderer {
  private container: HTMLElement | null = null;
  private htmlBuffer = '';
  private cssBuffer = '';
  private metadata: any = null;
  private renderingPaused = false;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
  }

  /**
   * Process streaming chunks and render progressively
   */
  public processChunk(chunk: StreamChunk): void {
    if (this.renderingPaused) return;

    switch (chunk.type) {
      case 'metadata':
        try {
          this.metadata = JSON.parse(chunk.content);
          this.updateMetadata();
        } catch (error) {
          console.warn('Failed to parse metadata chunk:', error);
        }
        break;
        
      case 'html':
        this.htmlBuffer += chunk.content;
        this.renderHTML();
        break;
        
      case 'css':
        this.cssBuffer += chunk.content;
        this.renderCSS();
        break;
        
      case 'complete':
        this.finalizeRender();
        break;
    }
  }

  /**
   * Render accumulated HTML content
   */
  private renderHTML(): void {
    if (!this.container) return;
    
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      if (this.container) {
        // Create a temporary container to parse partial HTML safely
        const temp = document.createElement('div');
        temp.innerHTML = this.htmlBuffer;
        
        // Move parsed nodes to main container
        while (temp.firstChild) {
          this.container.appendChild(temp.firstChild);
        }
      }
    });
  }

  /**
   * Render accumulated CSS content
   */
  private renderCSS(): void {
    let styleElement = document.getElementById('progressive-css');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'progressive-css';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = this.cssBuffer;
  }

  /**
   * Update metadata (title, etc.)
   */
  private updateMetadata(): void {
    if (!this.metadata) return;
    
    if (this.metadata.title) {
      document.title = this.metadata.title;
    }
  }

  /**
   * Finalize rendering and cleanup
   */
  private finalizeRender(): void {
    if (!this.container) return;
    
    // Add completion class for any final styling
    this.container.classList.add('progressive-render-complete');
    
    console.log('🎉 Progressive rendering completed');
  }

  /**
   * Pause/resume rendering
   */
  public pauseRendering(): void {
    this.renderingPaused = true;
  }

  public resumeRendering(): void {
    this.renderingPaused = false;
  }

  /**
   * Clear all rendered content
   */
  public clear(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.htmlBuffer = '';
    this.cssBuffer = '';
    this.metadata = null;
    
    const styleElement = document.getElementById('progressive-css');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

/**
 * React hook for streaming LP generation
 */
export function useStreamingLP(config?: Partial<ProgressiveLoadingConfig>) {
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentChunk, setCurrentChunk] = React.useState<StreamChunk | null>(null);
  const [result, setResult] = React.useState<{
    html: string;
    css: string;
    metadata: any;
  } | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  
  const streamingLoader = React.useMemo(() => new StreamingLoader(config), [config]);

  const startStreaming = React.useCallback(async (content: {
    html: string;
    css: string;
    metadata?: any;
  }) => {
    setIsStreaming(true);
    setProgress(0);
    setError(null);
    setResult(null);

    streamingLoader.setHandlers({
      onProgress: (chunk) => {
        setCurrentChunk(chunk);
        setProgress(chunk.progress);
      },
      onComplete: (finalResult) => {
        setResult(finalResult);
        setIsStreaming(false);
        setProgress(100);
      },
      onError: (streamError) => {
        setError(streamError);
        setIsStreaming(false);
      }
    });

    try {
      await streamingLoader.simulateStreaming(content);
    } catch (streamError) {
      setError(streamError as Error);
      setIsStreaming(false);
    }
  }, [streamingLoader]);

  const abortStreaming = React.useCallback(() => {
    streamingLoader.abort();
    setIsStreaming(false);
  }, [streamingLoader]);

  return {
    isStreaming,
    progress,
    currentChunk,
    result,
    error,
    startStreaming,
    abortStreaming
  };
}

// Add React import for hook
import React from 'react';