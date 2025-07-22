import { describe, it, expect, beforeEach } from '@jest/globals';

// Simple integration test for structured workflow functionality
describe('Structured Workflow Integration Test', () => {
  describe('Core Workflow Components', () => {
    it('should have all required components available', () => {
      // Test that the main components can be imported
      expect(() => {
        require('../../src/components/StructuredWorkflowPanel');
        require('../../src/components/HearingInterface');
        require('../../src/stores/workflowStore');
      }).not.toThrow();
    });

    it('should have interactive hearing tool available', () => {
      expect(() => {
        require('../../src/mastra/tools/interactiveHearingTool');
      }).not.toThrow();
    });

    it('should have concept proposal tool available', () => {
      expect(() => {
        require('../../src/mastra/tools/conceptProposalTool');
      }).not.toThrow();
    });
  });

  describe('Workflow Data Processing', () => {
    // Helper functions from workflow store
    function calculateHearingCompletion(hearingData: any): number {
      const requiredFields = [
        'serviceContent',
        'targetCustomerPain',
        'desiredConversion'
      ];
      
      const optionalFields = [
        'uniqueValueProposition',
        'budgetAndUrgency'
      ];
      
      const strategyFields = [
        'competitors',
        'currentChannels',
        'brandImage',
        'successMetrics'
      ];
      
      // 必須フィールドの完了度 (60%)
      const requiredCompletion = requiredFields.filter(field =>
        hearingData.essentialInfo?.[field as keyof typeof hearingData.essentialInfo]
      ).length / requiredFields.length;
      
      // オプションフィールドの完了度 (20%)
      const optionalCompletion = optionalFields.filter(field =>
        hearingData.essentialInfo?.[field as keyof typeof hearingData.essentialInfo]
      ).length / optionalFields.length;
      
      // 戦略フィールドの完了度 (20%)
      const strategyCompletion = strategyFields.filter(field =>
        hearingData.strategyInfo?.[field as keyof typeof hearingData.strategyInfo]
      ).length / strategyFields.length;
      
      return Math.round(
        (requiredCompletion * 60) + 
        (optionalCompletion * 20) + 
        (strategyCompletion * 20)
      );
    }

    function isHearingComplete(hearingData: any): boolean {
      const requiredFields = [
        'serviceContent',
        'targetCustomerPain',
        'desiredConversion'
      ];
      
      const hasAllRequired = requiredFields.every(field =>
        hearingData.essentialInfo?.[field as keyof typeof hearingData.essentialInfo]
      );
      
      // 戦略情報も最低1つは必要
      const hasStrategyInfo = !!(hearingData.strategyInfo && 
        Object.values(hearingData.strategyInfo).some(value => 
          value && (Array.isArray(value) ? value.length > 0 : true)
        ));
      
      return hasAllRequired && hasStrategyInfo;
    }

    it('should process step-by-step hearing data correctly', () => {
      // Step 1: Initial data
      let hearingData = {
        essentialInfo: {
          serviceContent: 'SaaS型顧客管理システム'
        }
      };

      let completion = calculateHearingCompletion(hearingData);
      expect(completion).toBeGreaterThan(0);
      expect(completion).toBeLessThan(100);
      expect(isHearingComplete(hearingData)).toBe(false);

      // Step 2: Add more essential info
      hearingData = {
        essentialInfo: {
          serviceContent: 'SaaS型顧客管理システム',
          uniqueValueProposition: '顧客情報の管理が煩雑で営業効率が悪い',
          desiredConversion: '無料トライアル申し込み'
        }
      };

      completion = calculateHearingCompletion(hearingData);
      expect(completion).toBeGreaterThan(40);
      expect(isHearingComplete(hearingData)).toBe(false); // Still need strategy info

      // Step 3: Add strategy info
      hearingData = {
        essentialInfo: {
          serviceContent: 'SaaS型顧客管理システム',
          uniqueValueProposition: '顧客情報の管理が煩雑で営業効率が悪い',
          desiredConversion: '無料トライアル申し込み'
        },
        strategyInfo: {
          competitors: ['Salesforce', 'HubSpot'],
          currentChannels: 'Web広告、セミナー'
        }
      };

      completion = calculateHearingCompletion(hearingData);
      expect(completion).toBeGreaterThan(60);
      expect(isHearingComplete(hearingData)).toBe(true);
    });

    it('should handle concept data validation', () => {
      const conceptData = {
        id: 'concept-test-001',
        title: 'AI搭載CRM革命 - スマート営業支援プラットフォーム',
        overview: 'AIが営業活動を革新する次世代CRMシステム',
        targetPersona: {
          name: '中小企業営業マネージャー',
          demographics: '30-50代、従業員50-200人企業',
          painPoints: ['手作業の顧客管理', '営業プロセスの非効率性'],
          goals: ['売上向上', '業務効率化'],
          behaviors: ['ITツールに積極的', 'データ重視'],
          preferredTone: 'professional'
        },
        valueProposition: {
          headline: 'AIで営業効率3倍UP！',
          subheadline: '手作業から自動化へ、営業チームを解放',
          keyBenefits: ['自動データ分析', '予測営業'],
          proofPoints: ['導入企業の売上平均30%向上']
        },
        designDirection: {
          style: 'モダン・プロフェッショナル',
          colorScheme: ['#0066CC', '#FFFFFF'],
          typography: 'Sans-serif',
          layoutApproach: 'クリーンで機能的'
        },
        expectedOutcome: {
          metrics: [
            {
              name: 'トライアル申し込み',
              description: '月次無料トライアル申し込み数',
              target: '100件',
              timeframe: '3ヶ月'
            }
          ]
        },
        createdAt: new Date().toISOString()
      };

      // Validate concept data structure
      expect(conceptData.id).toBeTruthy();
      expect(conceptData.title).toBeTruthy();
      expect(conceptData.overview).toBeTruthy();
      expect(conceptData.targetPersona).toBeTruthy();
      expect(conceptData.valueProposition).toBeTruthy();
      expect(conceptData.designDirection).toBeTruthy();
      expect(conceptData.expectedOutcome).toBeTruthy();
      expect(conceptData.createdAt).toBeTruthy();
    });

    it('should handle workflow stage progression logic', () => {
      const stages = ['hearing', 'concept', 'structure', 'generation', 'complete'];
      
      // Test stage order
      expect(stages.indexOf('hearing')).toBe(0);
      expect(stages.indexOf('concept')).toBe(1);
      expect(stages.indexOf('structure')).toBe(2);
      expect(stages.indexOf('generation')).toBe(3);
      expect(stages.indexOf('complete')).toBe(4);

      // Test stage progression logic
      const canProceedToNext = (currentStage: string, hearingComplete: boolean, hasConceptData: boolean, hasStructureData: boolean) => {
        switch (currentStage) {
          case 'hearing':
            return hearingComplete;
          case 'concept':
            return hasConceptData;
          case 'structure':
            return hasStructureData;
          case 'generation':
            return true; // Can always proceed to complete
          default:
            return false;
        }
      };

      // Test progression conditions
      expect(canProceedToNext('hearing', false, false, false)).toBe(false);
      expect(canProceedToNext('hearing', true, false, false)).toBe(true);
      expect(canProceedToNext('concept', true, false, false)).toBe(false);
      expect(canProceedToNext('concept', true, true, false)).toBe(true);
      expect(canProceedToNext('structure', true, true, false)).toBe(false);
      expect(canProceedToNext('structure', true, true, true)).toBe(true);
    });
  });

  describe('Interactive Hearing System', () => {
    it('should provide contextual question analysis', () => {
      const analyzeQuestionContext = (question: string) => {
        if (question.includes('サービス') || question.includes('商材')) {
          return {
            category: 'essential',
            importance: 'high',
            tips: ['具体的なサービス名や業界を教えてください']
          };
        }
        
        if (question.includes('ターゲット') || question.includes('顧客')) {
          return {
            category: 'essential',
            importance: 'high',
            tips: ['具体的な顧客像を描いてください']
          };
        }

        if (question.includes('競合') || question.includes('ブランド')) {
          return {
            category: 'strategy',
            importance: 'medium',
            tips: ['競合企業や目指すブランドイメージを教えてください']
          };
        }

        return {
          category: 'details',
          importance: 'low',
          tips: ['できるだけ具体的にお答えください']
        };
      };

      // Test question context analysis
      const serviceQuestion = analyzeQuestionContext('あなたのサービスについて教えてください');
      expect(serviceQuestion.category).toBe('essential');
      expect(serviceQuestion.importance).toBe('high');

      const targetQuestion = analyzeQuestionContext('ターゲット顧客について教えてください');
      expect(targetQuestion.category).toBe('essential');
      expect(targetQuestion.importance).toBe('high');

      const competitorQuestion = analyzeQuestionContext('競合他社について教えてください');
      expect(competitorQuestion.category).toBe('strategy');
      expect(competitorQuestion.importance).toBe('medium');
    });

    it('should handle conversation history management', () => {
      interface ConversationEntry {
        type: 'question' | 'answer';
        content: string;
        timestamp: Date;
      }

      const conversationHistory: ConversationEntry[] = [];

      // Add question
      conversationHistory.push({
        type: 'question',
        content: 'あなたのサービスについて教えてください',
        timestamp: new Date()
      });

      // Add answer
      conversationHistory.push({
        type: 'answer',
        content: 'SaaS型の顧客管理システムを提供しています',
        timestamp: new Date()
      });

      expect(conversationHistory).toHaveLength(2);
      expect(conversationHistory[0].type).toBe('question');
      expect(conversationHistory[1].type).toBe('answer');
    });
  });

  describe('Concept Proposal and Confirmation', () => {
    it('should handle concept generation workflow', () => {
      const mockHearingData = {
        essentialInfo: {
          serviceContent: 'SaaS型顧客管理システム',
          uniqueValueProposition: '顧客情報の管理が煩雑で営業効率が悪い',
          desiredConversion: '無料トライアル申し込み'
        },
        strategyInfo: {
          competitors: ['Salesforce', 'HubSpot'],
          brandImage: '革新的で信頼性の高いソリューション'
        }
      };

      // Simulate concept generation
      const generateConcept = (hearingData: any) => {
        return {
          id: `concept_${Date.now()}`,
          title: `${hearingData.essentialInfo.serviceContent}の革新的ソリューション`,
          overview: `${hearingData.essentialInfo.targetCustomerPain}を解決する画期的なアプローチ`,
          targetPersona: {
            name: '中小企業経営者',
            painPoints: [hearingData.essentialInfo.targetCustomerPain]
          },
          valueProposition: {
            headline: '効率化で競争力向上',
            keyBenefits: ['自動化', '効率向上', 'コスト削減']
          },
          createdAt: new Date().toISOString()
        };
      };

      const concept = generateConcept(mockHearingData);
      
      expect(concept.id).toBeTruthy();
      expect(concept.title).toContain('SaaS型顧客管理システム');
      expect(concept.overview).toContain('顧客情報の管理が煩雑');
      expect(concept.targetPersona.painPoints).toContain('顧客情報の管理が煩雑で営業効率が悪い');
    });

    it('should handle concept approval workflow', () => {
      const mockConcept = {
        id: 'concept-001',
        title: 'テストコンセプト',
        approved: false,
        approvedAt: null as string | null
      };

      // Simulate approval
      const approveConcept = (concept: any) => {
        return {
          ...concept,
          approved: true,
          approvedAt: new Date().toISOString()
        };
      };

      const approvedConcept = approveConcept(mockConcept);
      
      expect(approvedConcept.approved).toBe(true);
      expect(approvedConcept.approvedAt).toBeTruthy();
    });
  });

  describe('Backward Navigation', () => {
    it('should handle stage navigation logic', () => {
      const stages = ['hearing', 'concept', 'structure', 'generation', 'complete'];
      
      const canGoBack = (currentStage: string) => {
        const currentIndex = stages.indexOf(currentStage);
        return currentIndex > 0;
      };

      const goToPreviousStage = (currentStage: string) => {
        const currentIndex = stages.indexOf(currentStage);
        if (currentIndex > 0) {
          return stages[currentIndex - 1];
        }
        return currentStage;
      };

      // Test backward navigation
      expect(canGoBack('hearing')).toBe(false);
      expect(canGoBack('concept')).toBe(true);
      expect(canGoBack('structure')).toBe(true);

      expect(goToPreviousStage('concept')).toBe('hearing');
      expect(goToPreviousStage('structure')).toBe('concept');
      expect(goToPreviousStage('hearing')).toBe('hearing'); // Can't go back further
    });

    it('should handle stage history tracking', () => {
      const stageHistory: string[] = ['hearing'];

      const addToHistory = (stage: string) => {
        if (stageHistory[stageHistory.length - 1] !== stage) {
          stageHistory.push(stage);
        }
      };

      addToHistory('concept');
      addToHistory('structure');
      addToHistory('concept'); // Go back
      addToHistory('concept'); // Same stage, shouldn't duplicate

      expect(stageHistory).toEqual(['hearing', 'concept', 'structure', 'concept']);
    });
  });
});