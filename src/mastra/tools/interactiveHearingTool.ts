import { tool } from 'ai';
import { z } from 'zod';

// PROMPT.mdのヒアリング項目に基づくツール
export const interactiveHearingTool = tool({
  description: 'PROMPT.mdベースの段階的ヒアリングシステム。顧客との対話を通じて必要な情報を収集する。',
  parameters: z.object({
    stage: z.enum(['initial', 'strategy', 'details', 'confirmation']).describe('ヒアリング段階'),
    userResponse: z.string().optional().describe('ユーザーの回答'),
    currentData: z.object({
      essentialInfo: z.object({
        serviceContent: z.string().optional().describe('商材サービス内容'),
        uniqueValueProposition: z.string().optional().describe('独自価値UVP'),
        targetCustomerPain: z.string().optional().describe('ターゲット顧客の悩み'),
        desiredConversion: z.string().optional().describe('希望コンバージョン'),
        budgetAndUrgency: z.string().optional().describe('予算感覚と緊急度')
      }).optional().describe('必須情報'),
      strategyInfo: z.object({
        competitors: z.array(z.string()).optional().describe('競合他社'),
        currentChannels: z.string().optional().describe('現在の集客チャネル'),
        brandImage: z.string().optional().describe('ブランドイメージ'),
        successMetrics: z.string().optional().describe('成功指標')
      }).optional().describe('戦略情報')
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
        error: error instanceof Error ? error.message : 'ヒアリング処理中にエラーが発生しました',
        currentStage: stage
      };
    }
  }
});

// ヒアリングエンジンクラス
class HearingEngine {
  private hearingItems = {
    essentialInfo: [
      {
        key: 'serviceContent',
        question: 'どのような商材・サービスを提供されていますか？具体的にお聞かせください。',
        followUp: 'そちらの独自価値（UVP）は何でしょうか？他社との違いを教えてください。'
      },
      {
        key: 'targetCustomerPain',
        question: 'お客様が抱えている最大の悩みや課題は何でしょうか？',
        followUp: 'その悩みを解決しないと、お客様にどのような問題が生じますか？'
      },
      {
        key: 'desiredConversion',
        question: 'このランディングページで、訪問者にどのような行動を取ってもらいたいですか？（申込み、問い合わせ、購入など）',
        followUp: 'そのコンバージョンの優先順位があれば教えてください。'
      },
      {
        key: 'budgetAndUrgency',
        question: 'プロジェクトの予算感と、いつまでに完成させたいかお聞かせください。',
        followUp: '緊急度が高い理由があれば教えてください。'
      }
    ],
    strategyInfo: [
      {
        key: 'competitors',
        question: '主要な競合他社を3社ほど教えてください。',
        followUp: 'それらの競合と比較した時の、御社の強みや差別化ポイントは何ですか？'
      },
      {
        key: 'currentChannels',
        question: '現在はどのような方法でお客様を集客されていますか？',
        followUp: 'その中で最も効果的なチャネルと課題があれば教えてください。'
      },
      {
        key: 'brandImage',
        question: 'ブランドとして、どのような印象を与えたいですか？（プロフェッショナル、親しみやすい、革新的など）',
        followUp: '希望する色合いやトーンがあれば教えてください。'
      },
      {
        key: 'successMetrics',
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
      nextQuestion: this.hearingItems.essentialInfo[0].question,
      totalSteps: this.getTotalSteps(),
      currentStep: 1
    };
  }

  async analyzeResponse(response: string, stage: string) {
    // 簡単な分析ロジック（実際にはより高度なNLP処理）
    const keywords = await this.extractKeywords(response);
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
    const requiredFields = this.hearingItems.essentialInfo;
    const strategyFields = this.hearingItems.strategyInfo;

    const requiredCount = requiredFields.filter(field =>
      data.essentialInfo?.[field.key as keyof typeof data.essentialInfo]
    ).length;

    const strategyCount = strategyFields.filter(field =>
      data.strategyInfo?.[field.key as keyof typeof data.strategyInfo]
    ).length;

    const totalPossible = requiredFields.length + strategyFields.length;
    const totalCompleted = requiredCount + strategyCount;

    return Math.round((totalCompleted / totalPossible) * 100);
  }

  isHearingComplete(data: any): boolean {
    const requiredComplete = this.hearingItems.essentialInfo.every(item =>
      data.essentialInfo?.[item.key as keyof typeof data.essentialInfo]
    );

    const strategyComplete = this.hearingItems.strategyInfo.some(item =>
      data.strategyInfo?.[item.key as keyof typeof data.strategyInfo]
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
    return this.hearingItems.essentialInfo.length + this.hearingItems.strategyInfo.length;
  }

  private async extractKeywords(text: string): Promise<string[]> {
    try {
      // kuromoji.jsで日本語テキストを解析
      const kuromoji = await import('kuromoji');
      
      return new Promise<string[]>((resolve, reject) => {
        kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
          if (err) {
            console.warn('Kuromoji tokenization failed, falling back to simple splitting:', err);
            // フォールバック: シンプルな分割処理
            const words = text.replace(/[、。！？]/g, ' ').split(/\s+/);
            resolve(words.filter(word => word.length > 1));
            return;
          }
          
          try {
            const tokens = tokenizer.tokenize(text);
            const keywords = tokens
              .filter(token => 
                token.pos === '名詞' && // 名詞のみ抽出
                token.surface_form.length > 1 && // 1文字より長い
                !token.surface_form.match(/^[0-9]+$/) // 数字のみは除外
              )
              .map(token => token.surface_form);
            
            resolve(keywords);
          } catch (error) {
            console.warn('Tokenization error, using fallback:', error);
            // フォールバック処理
            const words = text.replace(/[、。！？]/g, ' ').split(/\s+/);
            resolve(words.filter(word => word.length > 1));
          }
        });
      });
    } catch (error) {
      console.warn('Kuromoji import failed, using fallback:', error);
      // kuromoji.jsが利用できない場合のフォールバック
      const words = text.replace(/[、。！？]/g, ' ').split(/\s+/);
      return words.filter(word => word.length > 1);
    }
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
    const { keywords, sentiment, entities, originalResponse } = analyzedResponse;

    const mappedData: any = {
      essentialInfo: {},
      strategyInfo: {}
    };

    // キーワードベースのマッピング
    if (keywords.includes('サービス') || keywords.includes('商品')) {
      mappedData.essentialInfo.serviceContent = originalResponse;
    }

    if (keywords.includes('悩み') || keywords.includes('課題') || keywords.includes('問題')) {
      mappedData.essentialInfo.targetCustomerPain = originalResponse;
    }

    if (keywords.includes('目標') || keywords.includes('コンバージョン') || keywords.includes('成果')) {
      mappedData.essentialInfo.desiredConversion = originalResponse;
    }

    // エンティティベースのマッピング
    entities.forEach((entity: any) => {
      if (entity.type === 'industry') {
        mappedData.strategyInfo.industryCharacteristics = entity.value;
      }
      if (entity.type === 'number') {
        mappedData.strategyInfo.budgetScale = entity.value;
      }
    });

    // 感情分析に基づくトーン設定
    if (sentiment === 'positive') {
      mappedData.strategyInfo.desiredTone = 'friendly';
    } else if (sentiment === 'negative') {
      mappedData.strategyInfo.desiredTone = 'professional';
    }

    // 空の値を除去
    Object.keys(mappedData.essentialInfo).forEach(key => {
      if (!mappedData.essentialInfo[key]) {
        delete mappedData.essentialInfo[key];
      }
    });

    Object.keys(mappedData.strategyInfo).forEach(key => {
      if (!mappedData.strategyInfo[key]) {
        delete mappedData.strategyInfo[key];
      }
    });

    return mappedData;
  }

  private getNextRequiredQuestion(data: any): string {
    for (const item of this.hearingItems.essentialInfo) {
      if (!data.essentialInfo?.[item.key as keyof typeof data.essentialInfo]) {
        return item.question;
      }
    }
    return this.hearingItems.strategyInfo[0].question;
  }

  private getNextStrategyQuestion(data: any): string {
    for (const item of this.hearingItems.strategyInfo) {
      if (!data.strategyInfo?.[item.key as keyof typeof data.strategyInfo]) {
        return item.question;
      }
    }
    return 'ヒアリングの内容を確認させていただきます。追加で確認したいことがあれば教えてください。';
  }

  private getConfirmationQuestion(data: any): string {
    return `ヒアリングが完了しました。収集した情報に基づいてコンセプトを提案いたします。

**収集した主要情報：**
- サービス内容: ${data.essentialInfo?.serviceContent || '未回答'}
- ターゲットの悩み: ${data.essentialInfo?.targetCustomerPain || '未回答'}
- コンバージョン目標: ${data.essentialInfo?.desiredConversion || '未回答'}

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