import { tool } from 'ai';
import { z } from 'zod';

// PROMPT.mdのヒアリング項目に基づくツール
export const interactiveHearingTool = tool({
  description: 'PROMPT.mdベースの段階的ヒアリングシステム。顧客との対話を通じて必要な情報を収集する。',
  parameters: z.object({
    stage: z.enum(['initial', 'strategy', 'details', 'confirmation']).describe('ヒアリング段階'),
    userResponse: z.string().optional().describe('ユーザーの回答'),
    currentData: z.object({
      必須情報: z.object({
        商材サービス内容: z.string().optional(),
        独自価値UVP: z.string().optional(),
        ターゲット顧客の悩み: z.string().optional(),
        希望コンバージョン: z.string().optional(),
        予算感覚と緊急度: z.string().optional()
      }).optional(),
      戦略情報: z.object({
        競合他社: z.array(z.string()).optional(),
        現在の集客チャネル: z.string().optional(),
        ブランドイメージ: z.string().optional(),
        成功指標: z.string().optional()
      }).optional()
    }).optional().describe('これまでに収集済みの情報')
  }),
  execute: async ({ stage, userResponse, currentData = {} }) => {
    try {
      const hearingEngine = new HearingEngine();
      
      if (stage === 'initial') {
        return hearingEngine.startHearing();
      }
      
      if (userResponse) {
        // ユーザー回答を解析・記録
        const analyzedResponse = await hearingEngine.analyzeResponse(userResponse, stage);
        const updatedData = hearingEngine.updateData(currentData, analyzedResponse);
        
        // 次の質問を生成
        const nextQuestion = await hearingEngine.generateNextQuestion(updatedData, stage);
        
        return {
          success: true,
          currentStage: stage,
          collectedData: updatedData,
          nextQuestion,
          completionRate: hearingEngine.calculateCompletion(updatedData),
          isComplete: hearingEngine.isHearingComplete(updatedData),
          suggestedActions: hearingEngine.getSuggestedActions(updatedData)
        };
      }
      
      return hearingEngine.getCurrentStatus(currentData);
    } catch (error) {
      console.error('Hearing tool execution error:', error);
      return {
        success: false,
        error: error.message || 'ヒアリング処理中にエラーが発生しました',
        currentStage: stage
      };
    }
  }
    } catch (error) {
      console.error('Hearing tool execution error:', error);
      return {
        success: false,
        error: error.message || 'ヒアリング処理中にエラーが発生しました',
        currentStage: stage
      };
    }
  }
});

// ヒアリングエンジンクラス
class HearingEngine {
  private hearingItems = {
    必須情報: [
      {
        key: '商材サービス内容',
        question: 'どのような商材・サービスを提供されていますか？具体的にお聞かせください。',
        followUp: 'そちらの独自価値（UVP）は何でしょうか？他社との違いを教えてください。'
      },
      {
        key: 'ターゲット顧客の悩み',
        question: 'お客様が抱えている最大の悩みや課題は何でしょうか？',
        followUp: 'その悩みを解決しないと、お客様にどのような問題が生じますか？'
      },
      {
        key: '希望コンバージョン',
        question: 'このランディングページで、訪問者にどのような行動を取ってもらいたいですか？（申込み、問い合わせ、購入など）',
        followUp: 'そのコンバージョンの優先順位があれば教えてください。'
      },
      {
        key: '予算感覚と緊急度',
        question: 'プロジェクトの予算感と、いつまでに完成させたいかお聞かせください。',
        followUp: '緊急度が高い理由があれば教えてください。'
      }
    ],
    戦略情報: [
      {
        key: '競合他社',
        question: '主要な競合他社を3社ほど教えてください。',
        followUp: 'それらの競合と比較した時の、御社の強みや差別化ポイントは何ですか？'
      },
      {
        key: '現在の集客チャネル',
        question: '現在はどのような方法でお客様を集客されていますか？',
        followUp: 'その中で最も効果的なチャネルと課題があれば教えてください。'
      },
      {
        key: 'ブランドイメージ',
        question: 'ブランドとして、どのような印象を与えたいですか？（プロフェッショナル、親しみやすい、革新的など）',
        followUp: '希望する色合いやトーンがあれば教えてください。'
      },
      {
        key: '成功指標',
        question: 'このランディングページの成功をどのような数値で測りたいですか？',
        followUp: '現実的な目標値があれば教えてください。'
      }
    ]
  };
  
  startHearing() {
    return {
      success: true,
      currentStage: 'initial',
      message: '**LP作成のためのヒアリングを開始します** 🎯\n\n高品質なランディングページを作成するため、いくつか質問させていただきます。まずは基本的な情報から始めましょう。',
      nextQuestion: this.hearingItems.必須情報[0].question,
      totalSteps: this.getTotalSteps(),
      currentStep: 1
    };
  }
  
  async analyzeResponse(response: string, stage: string) {
    // 簡単な分析ロジック（実際にはより高度なNLP処理）
    const keywords = this.extractKeywords(response);
    const sentiment = this.analyzeSentiment(response);
    const entities = this.extractEntities(response);
    
    return {
      originalResponse: response,
      keywords,
      sentiment,
      entities,
      confidence: this.calculateConfidence(response)
    };
  }
  
  updateData(currentData: any, analyzedResponse: any) {
    // データ更新ロジック
    return { ...currentData, ...this.mapResponseToData(analyzedResponse) };
  }
  
  async generateNextQuestion(data: any, stage: string) {
    const completion = this.calculateCompletion(data);
    
    if (completion < 50) {
      return this.getNextRequiredQuestion(data);
    } else if (completion < 80) {
      return this.getNextStrategyQuestion(data);
    } else {
      return this.getConfirmationQuestion(data);
    }
  }
  
  calculateCompletion(data: any): number {
    const requiredFields = Object.keys(this.hearingItems.必須情報);
    const strategyFields = Object.keys(this.hearingItems.戦略情報);
    
    const requiredCount = requiredFields.filter(field => 
      data.必須情報?.[field as keyof typeof data.必須情報]
    ).length;
    
    const strategyCount = strategyFields.filter(field => 
      data.戦略情報?.[field as keyof typeof data.戦略情報]
    ).length;
    
    const totalPossible = requiredFields.length + strategyFields.length;
    const totalCompleted = requiredCount + strategyCount;
    
    return Math.round((totalCompleted / totalPossible) * 100);
  }
  
  isHearingComplete(data: any): boolean {
    const requiredComplete = this.hearingItems.必須情報.every(item =>
      data.必須情報?.[item.key as keyof typeof data.必須情報]
    );
    
    const strategyComplete = this.hearingItems.戦略情報.some(item =>
      data.戦略情報?.[item.key as keyof typeof data.戦略情報]
    );
    
    return requiredComplete && strategyComplete;
  }
  
  getSuggestedActions(data: any): string[] {
    const actions: string[] = [];
    
    if (this.isHearingComplete(data)) {
      actions.push('コンセプト提案の生成');
      actions.push('構成設計への移行');
    } else {
      const completion = this.calculateCompletion(data);
      if (completion > 60) {
        actions.push('戦略情報の追加収集');
        actions.push('部分的なコンセプト提案');
      } else {
        actions.push('必須情報の完成');
      }
    }
    
    return actions;
  }
  
  getCurrentStatus(data: any) {
    const completion = this.calculateCompletion(data);
    const isComplete = this.isHearingComplete(data);
    
    return {
      success: true,
      completionRate: completion,
      isComplete,
      collectedData: data,
      nextQuestion: isComplete ? null : this.getNextQuestion(data),
      suggestedActions: this.getSuggestedActions(data)
    };
  }
  
  private getTotalSteps(): number {
    return this.hearingItems.必須情報.length + this.hearingItems.戦略情報.length;
  }
  
  private extractKeywords(text: string): string[] {
    // キーワード抽出ロジック
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 2);
  }
  
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // 感情分析ロジック（簡易版）
    const positiveWords = ['良い', '素晴らしい', '最高', '効果的'];
    const negativeWords = ['悪い', '問題', '困難', '課題'];
    
    const hasPositive = positiveWords.some(word => text.includes(word));
    const hasNegative = negativeWords.some(word => text.includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  }
  
  private extractEntities(text: string): any[] {
    // エンティティ抽出ロジック（簡易版）
    const entities: any[] = [];
    
    // 業界キーワード
    const industries = ['SaaS', 'EC', 'コンサル', '教育', 'AI', 'フィンテック'];
    industries.forEach(industry => {
      if (text.includes(industry)) {
        entities.push({ type: 'industry', value: industry });
      }
    });
    
    // 数値
    const numbers = text.match(/\d+/g);
    if (numbers) {
      numbers.forEach(num => {
        entities.push({ type: 'number', value: num });
      });
    }
    
    return entities;
  }
  
  private calculateConfidence(response: string): number {
    // 回答の信頼度を計算
    const length = response.length;
    const hasSpecifics = /\d/.test(response) || response.includes('例えば') || response.includes('具体的');
    
    let confidence = Math.min(length / 100, 1) * 0.7;
    if (hasSpecifics) confidence += 0.3;
    
    return Math.round(confidence * 100) / 100;
  }
  
  private mapResponseToData(analyzedResponse: any): any {
    // 解析された回答をデータ構造にマッピング
    // 実際にはより高度な処理が必要
    return {};
  }
  
  private getNextRequiredQuestion(data: any): string {
    for (const item of this.hearingItems.必須情報) {
      if (!data.必須情報?.[item.key as keyof typeof data.必須情報]) {
        return item.question;
      }
    }
    return this.hearingItems.戦略情報[0].question;
  }
  
  private getNextStrategyQuestion(data: any): string {
    for (const item of this.hearingItems.戦略情報) {
      if (!data.戦略情報?.[item.key as keyof typeof data.戦略情報]) {
        return item.question;
      }
    }
    return 'ヒアリングの内容を確認させていただきます。追加で確認したいことがあれば教えてください。';
  }
  
  private getConfirmationQuestion(data: any): string {
    return `ヒアリングが完了しました。収集した情報に基づいてコンセプトを提案いたします。

**収集した主要情報：**
- サービス内容: ${data.必須情報?.商材サービス内容 || '未回答'}
- ターゲットの悩み: ${data.必須情報?.ターゲット顧客の悩み || '未回答'}
- コンバージョン目標: ${data.必須情報?.希望コンバージョン || '未回答'}

コンセプト提案に進みますか？`;
  }
  
  private getNextQuestion(data: any): string {
    const completion = this.calculateCompletion(data);
    
    if (completion < 50) {
      return this.getNextRequiredQuestion(data);
    } else if (completion < 80) {
      return this.getNextStrategyQuestion(data);
    } else {
      return this.getConfirmationQuestion(data);
    }
  }
}