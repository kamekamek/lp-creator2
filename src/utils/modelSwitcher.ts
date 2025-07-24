/**
 * AI Model Switching and Recovery System
 * Provides automatic model fallback and manual model switching capabilities
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'google';
  endpoint?: string;
  maxTokens: number;
  temperature: number;
  isAvailable: boolean;
  priority: number; // Lower number = higher priority
  capabilities: {
    lpGeneration: boolean;
    codeGeneration: boolean;
    longContext: boolean;
    multimodal: boolean;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    lastChecked: number;
  };
}

export interface ModelSwitchResult {
  success: boolean;
  previousModel: string;
  newModel: string;
  reason: string;
  timestamp: number;
}

export class ModelSwitcher {
  private static instance: ModelSwitcher;
  private models: Map<string, ModelConfig> = new Map();
  private currentModel: string = 'claude-3-5-sonnet-20241022';
  private switchHistory: ModelSwitchResult[] = [];
  private maxHistorySize = 50;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeModels();
    this.startHealthCheck();
  }

  public static getInstance(): ModelSwitcher {
    if (!ModelSwitcher.instance) {
      ModelSwitcher.instance = new ModelSwitcher();
    }
    return ModelSwitcher.instance;
  }

  /**
   * Initialize available models
   */
  private initializeModels(): void {
    const defaultModels: ModelConfig[] = [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        maxTokens: 200000,
        temperature: 0.7,
        isAvailable: true,
        priority: 1,
        capabilities: {
          lpGeneration: true,
          codeGeneration: true,
          longContext: true,
          multimodal: true
        },
        performance: {
          averageResponseTime: 5000,
          successRate: 0.95,
          lastChecked: Date.now()
        }
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        maxTokens: 200000,
        temperature: 0.7,
        isAvailable: true,
        priority: 2,
        capabilities: {
          lpGeneration: true,
          codeGeneration: true,
          longContext: true,
          multimodal: true
        },
        performance: {
          averageResponseTime: 6000,
          successRate: 0.92,
          lastChecked: Date.now()
        }
      },
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        maxTokens: 128000,
        temperature: 0.7,
        isAvailable: true,
        priority: 3,
        capabilities: {
          lpGeneration: true,
          codeGeneration: true,
          longContext: true,
          multimodal: false
        },
        performance: {
          averageResponseTime: 7000,
          successRate: 0.90,
          lastChecked: Date.now()
        }
      },
      {
        id: 'gpt-3.5-turbo-0125',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        maxTokens: 16384,
        temperature: 0.7,
        isAvailable: true,
        priority: 4,
        capabilities: {
          lpGeneration: true,
          codeGeneration: true,
          longContext: false,
          multimodal: false
        },
        performance: {
          averageResponseTime: 3000,
          successRate: 0.88,
          lastChecked: Date.now()
        }
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        maxTokens: 32768,
        temperature: 0.7,
        isAvailable: true,
        priority: 5,
        capabilities: {
          lpGeneration: true,
          codeGeneration: true,
          longContext: false,
          multimodal: true
        },
        performance: {
          averageResponseTime: 4000,
          successRate: 0.85,
          lastChecked: Date.now()
        }
      }
    ];

    defaultModels.forEach(model => {
      this.models.set(model.id, model);
    });

    console.log('🤖 [ModelSwitcher] Initialized with models:', Array.from(this.models.keys()));
  }

  /**
   * Get current model
   */
  public getCurrentModel(): ModelConfig | null {
    return this.models.get(this.currentModel) || null;
  }

  /**
   * Get all available models
   */
  public getAvailableModels(): ModelConfig[] {
    return Array.from(this.models.values())
      .filter(model => model.isAvailable)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Switch to specific model
   */
  public async switchToModel(modelId: string, reason: string = 'Manual switch'): Promise<ModelSwitchResult> {
    const targetModel = this.models.get(modelId);
    
    if (!targetModel) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (!targetModel.isAvailable) {
      throw new Error(`Model ${modelId} is not available`);
    }

    const previousModel = this.currentModel;
    this.currentModel = modelId;

    const result: ModelSwitchResult = {
      success: true,
      previousModel,
      newModel: modelId,
      reason,
      timestamp: Date.now()
    };

    this.addToHistory(result);

    console.log(`🔄 [ModelSwitcher] Switched from ${previousModel} to ${modelId}: ${reason}`);

    return result;
  }

  /**
   * Automatically switch to best available model
   */
  public async switchToBestModel(capability?: keyof ModelConfig['capabilities']): Promise<ModelSwitchResult> {
    const availableModels = this.getAvailableModels();
    
    let candidateModels = availableModels;
    
    // Filter by capability if specified
    if (capability) {
      candidateModels = availableModels.filter(model => model.capabilities[capability]);
    }

    if (candidateModels.length === 0) {
      throw new Error('No suitable models available');
    }

    // Sort by performance score (success rate * inverse of response time)
    candidateModels.sort((a, b) => {
      const scoreA = a.performance.successRate / (a.performance.averageResponseTime / 1000);
      const scoreB = b.performance.successRate / (b.performance.averageResponseTime / 1000);
      return scoreB - scoreA;
    });

    const bestModel = candidateModels[0];
    
    if (bestModel.id === this.currentModel) {
      return {
        success: true,
        previousModel: this.currentModel,
        newModel: this.currentModel,
        reason: 'Already using best model',
        timestamp: Date.now()
      };
    }

    return this.switchToModel(bestModel.id, `Auto-switch to best model${capability ? ` for ${capability}` : ''}`);
  }

  /**
   * Handle model failure and switch to fallback
   */
  public async handleModelFailure(error: Error, context?: string): Promise<ModelSwitchResult> {
    const currentModel = this.getCurrentModel();
    
    if (!currentModel) {
      throw new Error('No current model to recover from');
    }

    console.warn(`🚨 [ModelSwitcher] Model failure detected: ${currentModel.name}`, error);

    // Update model performance
    this.updateModelPerformance(currentModel.id, false);

    // Get fallback options (exclude current failing model)
    const fallbackModels = this.getAvailableModels()
      .filter(model => model.id !== this.currentModel);

    if (fallbackModels.length === 0) {
      // Mark current model as unavailable and throw
      this.markModelUnavailable(this.currentModel, 'No fallback models available');
      throw new Error('No fallback models available');
    }

    // Choose best fallback based on priority and performance
    const bestFallback = fallbackModels[0];
    
    const reason = `Fallback from ${currentModel.name} failure${context ? ` (${context})` : ''}`;
    
    return this.switchToModel(bestFallback.id, reason);
  }

  /**
   * Update model performance metrics
   */
  public updateModelPerformance(modelId: string, success: boolean, responseTime?: number): void {
    const model = this.models.get(modelId);
    if (!model) return;

    // Update success rate (exponential moving average)
    const alpha = 0.1; // Smoothing factor
    model.performance.successRate = 
      alpha * (success ? 1 : 0) + (1 - alpha) * model.performance.successRate;

    // Update response time if provided
    if (responseTime !== undefined) {
      model.performance.averageResponseTime = 
        alpha * responseTime + (1 - alpha) * model.performance.averageResponseTime;
    }

    model.performance.lastChecked = Date.now();

    console.log(`📊 [ModelSwitcher] Updated performance for ${model.name}:`, {
      successRate: model.performance.successRate.toFixed(3),
      averageResponseTime: Math.round(model.performance.averageResponseTime)
    });
  }

  /**
   * Mark model as unavailable
   */
  public markModelUnavailable(modelId: string, reason: string): void {
    const model = this.models.get(modelId);
    if (!model) return;

    model.isAvailable = false;
    console.warn(`🚫 [ModelSwitcher] Marked ${model.name} as unavailable: ${reason}`);

    // If current model becomes unavailable, switch to fallback
    if (modelId === this.currentModel) {
      this.switchToBestModel().catch(error => {
        console.error('Failed to switch to fallback model:', error);
      });
    }
  }

  /**
   * Mark model as available
   */
  public markModelAvailable(modelId: string): void {
    const model = this.models.get(modelId);
    if (!model) return;

    model.isAvailable = true;
    console.log(`✅ [ModelSwitcher] Marked ${model.name} as available`);
  }

  /**
   * Get model switching history
   */
  public getSwitchHistory(): ModelSwitchResult[] {
    return [...this.switchHistory];
  }

  /**
   * Get model statistics
   */
  public getModelStats(): {
    totalSwitches: number;
    failureSwitches: number;
    manualSwitches: number;
    currentModelUptime: number;
    modelPerformance: Array<{
      id: string;
      name: string;
      successRate: number;
      averageResponseTime: number;
      isAvailable: boolean;
    }>;
  } {
    const totalSwitches = this.switchHistory.length;
    const failureSwitches = this.switchHistory.filter(s => s.reason.includes('failure') || s.reason.includes('Fallback')).length;
    const manualSwitches = this.switchHistory.filter(s => s.reason.includes('Manual')).length;
    
    const lastSwitch = this.switchHistory[this.switchHistory.length - 1];
    const currentModelUptime = lastSwitch ? Date.now() - lastSwitch.timestamp : Date.now();

    const modelPerformance = Array.from(this.models.values()).map(model => ({
      id: model.id,
      name: model.name,
      successRate: model.performance.successRate,
      averageResponseTime: model.performance.averageResponseTime,
      isAvailable: model.isAvailable
    }));

    return {
      totalSwitches,
      failureSwitches,
      manualSwitches,
      currentModelUptime,
      modelPerformance
    };
  }

  /**
   * Start health check for models
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log('🏥 [ModelSwitcher] Started model health check');
  }

  /**
   * Perform health check on all models
   */
  private async performHealthCheck(): Promise<void> {
    console.log('🏥 [ModelSwitcher] Performing model health check');

    for (const [modelId, model] of this.models) {
      try {
        // Simple health check - could be enhanced with actual API calls
        const timeSinceLastCheck = Date.now() - model.performance.lastChecked;
        
        // If model hasn't been checked recently and has low success rate, mark as potentially unavailable
        if (timeSinceLastCheck > 10 * 60 * 1000 && model.performance.successRate < 0.5) {
          console.warn(`🏥 [ModelSwitcher] Model ${model.name} may be unhealthy (success rate: ${model.performance.successRate.toFixed(3)})`);
        }
        
      } catch (error) {
        console.error(`🏥 [ModelSwitcher] Health check failed for ${model.name}:`, error);
        this.markModelUnavailable(modelId, 'Health check failed');
      }
    }
  }

  /**
   * Stop health check
   */
  public stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🛑 [ModelSwitcher] Stopped model health check');
    }
  }

  /**
   * Add custom model
   */
  public addCustomModel(model: ModelConfig): void {
    this.models.set(model.id, model);
    console.log(`➕ [ModelSwitcher] Added custom model: ${model.name}`);
  }

  /**
   * Remove model
   */
  public removeModel(modelId: string): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;

    this.models.delete(modelId);
    console.log(`➖ [ModelSwitcher] Removed model: ${model.name}`);

    // Switch to different model if this was current
    if (modelId === this.currentModel) {
      this.switchToBestModel().catch(error => {
        console.error('Failed to switch after model removal:', error);
      });
    }

    return true;
  }

  /**
   * Export configuration
   */
  public exportConfig(): {
    models: ModelConfig[];
    currentModel: string;
    switchHistory: ModelSwitchResult[];
  } {
    return {
      models: Array.from(this.models.values()),
      currentModel: this.currentModel,
      switchHistory: this.switchHistory
    };
  }

  // Private helper methods

  private addToHistory(result: ModelSwitchResult): void {
    this.switchHistory.push(result);

    // Keep history size manageable
    if (this.switchHistory.length > this.maxHistorySize) {
      this.switchHistory = this.switchHistory.slice(-this.maxHistorySize);
    }
  }
}

// Export singleton instance
export const modelSwitcher = ModelSwitcher.getInstance();

// React hook for model switching
export function useModelSwitcher() {
  const [currentModel, setCurrentModel] = React.useState<ModelConfig | null>(null);
  const [availableModels, setAvailableModels] = React.useState<ModelConfig[]>([]);
  const [switchHistory, setSwitchHistory] = React.useState<ModelSwitchResult[]>([]);

  React.useEffect(() => {
    // Update state with current model info
    const updateState = () => {
      setCurrentModel(modelSwitcher.getCurrentModel());
      setAvailableModels(modelSwitcher.getAvailableModels());
      setSwitchHistory(modelSwitcher.getSwitchHistory());
    };

    updateState();

    // Update periodically
    const interval = setInterval(updateState, 5000);

    return () => clearInterval(interval);
  }, []);

  const switchToModel = React.useCallback(async (modelId: string, reason?: string) => {
    try {
      const result = await modelSwitcher.switchToModel(modelId, reason);
      setCurrentModel(modelSwitcher.getCurrentModel());
      setSwitchHistory(modelSwitcher.getSwitchHistory());
      return result;
    } catch (error) {
      console.error('Failed to switch model:', error);
      throw error;
    }
  }, []);

  const switchToBestModel = React.useCallback(async (capability?: keyof ModelConfig['capabilities']) => {
    try {
      const result = await modelSwitcher.switchToBestModel(capability);
      setCurrentModel(modelSwitcher.getCurrentModel());
      setSwitchHistory(modelSwitcher.getSwitchHistory());
      return result;
    } catch (error) {
      console.error('Failed to switch to best model:', error);
      throw error;
    }
  }, []);

  const getModelStats = React.useCallback(() => {
    return modelSwitcher.getModelStats();
  }, []);

  return {
    currentModel,
    availableModels,
    switchHistory,
    switchToModel,
    switchToBestModel,
    getModelStats,
    hasMultipleModels: availableModels.length > 1
  };
}

// Add React import for hook
import React from 'react';