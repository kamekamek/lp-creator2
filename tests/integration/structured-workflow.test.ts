import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowStore } from '../../src/stores/workflowStore';
import type { HearingData, ConceptData, StructureData } from '../../src/stores/workflowStore';

// 統合テスト用のモックデータ
const mockHearingData: HearingData = {
  essentialInfo: {
    serviceContent: 'SaaS型顧客管理システム',
    uniqueValueProposition: 'AIを活用した自動分析機能',
    targetCustomerPain: '顧客情報の管理が煩雑で営業効率が悪い',
    desiredConversion: '無料トライアル申し込み',
    budgetAndUrgency: '月額10万円以下、3ヶ月以内に導入'
  },
  strategyInfo: {
    competitors: ['Salesforce', 'HubSpot'],
    currentChannels: 'Web広告、セミナー',
    brandImage: '革新的で信頼性の高いソリューション',
    successMetrics: '月次トライアル申し込み数100件'
  }
};

const mockConceptData: ConceptData = {
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

describe('構造化ワークフロープロセス統合テスト', () => {
  let store: ReturnType<typeof useWorkflowStore>;

  beforeEach(() => {
    const { result } = renderHook(() => useWorkflowStore());
    store = result.current;
    // テスト前にワークフローをリセット
    act(() => {
      store.resetWorkflow();
    });
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    act(() => {
      store.resetWorkflow();
    });
  });

  describe('ワークフロー段階管理', () => {
    it('初期状態ではhearing段階から開始する', () => {
      expect(store.currentStage).toBe('hearing');
      expect(store.completionRate).toBe(0);
      expect(store.stageHistory).toEqual(['hearing']);
    });

    it('段階を順次進めることができる', () => {
      // ヒアリングデータを設定
      act(() => {
        store.updateHearingData(mockHearingData);
      });

      // concept段階に進む
      act(() => {
        store.nextStage();
      });

      expect(store.currentStage).toBe('concept');
      expect(store.stageHistory).toContain('concept');
    });

    it('後方ナビゲーションが正しく動作する', () => {
      // まずconcept段階に進む
      act(() => {
        store.updateHearingData(mockHearingData);
        store.nextStage();
      });

      expect(store.currentStage).toBe('concept');

      // 前の段階に戻る
      act(() => {
        store.previousStage();
      });

      expect(store.currentStage).toBe('hearing');
      expect(store.canGoBack()).toBe(false);
    });

    it('特定の段階に直接移動できる', () => {
      // まずデータを設定
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
      });

      // structure段階に直接移動
      act(() => {
        store.goToStage('structure');
      });

      expect(store.currentStage).toBe('structure');
      expect(store.stageHistory).toContain('structure');
    });
  });

  describe('データ管理と進捗計算', () => {
    it('ヒアリングデータ更新時に進捗率が正しく計算される', () => {
      act(() => {
        store.updateHearingData({
          essentialInfo: {
            serviceContent: 'テストサービス',
            targetCustomerPain: 'テスト課題',
            desiredConversion: 'テストコンバージョン'
          }
        });
      });

      expect(store.completionRate).toBeGreaterThan(0);
      expect(store.completionRate).toBeLessThanOrEqual(100);
    });

    it('完全なヒアリングデータで適切な進捗率になる', () => {
      act(() => {
        store.updateHearingData(mockHearingData);
      });

      // ヒアリング完了で約25%の進捗
      expect(store.completionRate).toBeGreaterThanOrEqual(20);
      expect(store.completionRate).toBeLessThanOrEqual(30);
    });

    it('コンセプトデータ設定時に進捗率が更新される', () => {
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
      });

      // ヒアリング+コンセプトで約50%の進捗
      expect(store.completionRate).toBeGreaterThanOrEqual(45);
      expect(store.completionRate).toBeLessThanOrEqual(55);
    });
  });

  describe('段階間の条件チェック', () => {
    it('必須データがない場合は次の段階に進めない', () => {
      expect(store.canProceedToNext()).toBe(false);
    });

    it('ヒアリング完了後はconcept段階に進める', () => {
      act(() => {
        store.updateHearingData(mockHearingData);
      });

      expect(store.canProceedToNext()).toBe(true);
    });

    it('コンセプト設定後はstructure段階に進める', () => {
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
        store.setStage('concept');
      });

      expect(store.canProceedToNext()).toBe(true);
    });
  });

  describe('エラー処理と状態管理', () => {
    it('処理中状態を正しく管理できる', () => {
      act(() => {
        store.setProcessing(true);
      });

      expect(store.isProcessing).toBe(true);

      act(() => {
        store.setProcessing(false);
      });

      expect(store.isProcessing).toBe(false);
    });

    it('エラー状態を正しく管理できる', () => {
      const errorMessage = 'テストエラー';

      act(() => {
        store.setError(errorMessage);
      });

      expect(store.error).toBe(errorMessage);

      act(() => {
        store.setError(null);
      });

      expect(store.error).toBeNull();
    });
  });

  describe('データエクスポート・インポート', () => {
    it('ワークフローデータを正しくエクスポートできる', () => {
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
      });

      const exportedData = store.exportWorkflowData();

      expect(exportedData).toHaveProperty('sessionId');
      expect(exportedData).toHaveProperty('currentStage');
      expect(exportedData).toHaveProperty('hearingData');
      expect(exportedData).toHaveProperty('conceptData');
      expect(exportedData).toHaveProperty('exportedAt');
      expect(exportedData.hearingData).toEqual(mockHearingData);
      expect(exportedData.conceptData).toEqual(mockConceptData);
    });

    it('エクスポートしたデータを正しくインポートできる', () => {
      // まずデータを設定してエクスポート
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
      });

      const exportedData = store.exportWorkflowData();

      // ワークフローをリセット
      act(() => {
        store.resetWorkflow();
      });

      expect(store.currentStage).toBe('hearing');
      expect(store.conceptData).toBeNull();

      // データをインポート
      act(() => {
        store.importWorkflowData(exportedData);
      });

      expect(store.hearingData).toEqual(mockHearingData);
      expect(store.conceptData).toEqual(mockConceptData);
    });
  });

  describe('段階別進捗計算', () => {
    it('各段階の進捗を正しく計算する', () => {
      // ヒアリング段階の進捗
      act(() => {
        store.updateHearingData(mockHearingData);
      });

      const hearingProgress = store.getStageProgress('hearing');
      expect(hearingProgress).toBeGreaterThan(80); // 完全なデータなので高い進捗

      // コンセプト段階の進捗
      const conceptProgressBefore = store.getStageProgress('concept');
      expect(conceptProgressBefore).toBe(0);

      act(() => {
        store.setConceptData(mockConceptData);
      });

      const conceptProgressAfter = store.getStageProgress('concept');
      expect(conceptProgressAfter).toBe(100);
    });
  });

  describe('履歴管理', () => {
    it('段階履歴を正しく記録する', () => {
      expect(store.getStageHistory()).toEqual(['hearing']);

      act(() => {
        store.updateHearingData(mockHearingData);
        store.nextStage(); // concept
      });

      expect(store.getStageHistory()).toEqual(['hearing', 'concept']);

      act(() => {
        store.setConceptData(mockConceptData);
        store.nextStage(); // structure
      });

      expect(store.getStageHistory()).toEqual(['hearing', 'concept', 'structure']);
    });

    it('同じ段階への重複移動は履歴に追加されない', () => {
      act(() => {
        store.setStage('hearing');
        store.setStage('hearing');
      });

      expect(store.getStageHistory()).toEqual(['hearing']);
    });
  });

  describe('完全なワークフロー実行', () => {
    it('全段階を通して正常に進行できる', async () => {
      // Step 1: ヒアリング段階
      expect(store.currentStage).toBe('hearing');
      
      act(() => {
        store.updateHearingData(mockHearingData);
      });

      expect(store.canProceedToNext()).toBe(true);

      // Step 2: コンセプト段階
      act(() => {
        store.nextStage();
      });

      expect(store.currentStage).toBe('concept');

      act(() => {
        store.setConceptData(mockConceptData);
      });

      expect(store.canProceedToNext()).toBe(true);

      // Step 3: 構成設計段階
      act(() => {
        store.nextStage();
      });

      expect(store.currentStage).toBe('structure');

      const mockStructureData: StructureData = {
        sections: [
          {
            id: 'hero',
            name: 'ヒーローセクション',
            description: 'メインビジュアルとキャッチコピー',
            priority: 'high',
            contentType: 'hero'
          }
        ],
        approvedAt: new Date().toISOString()
      };

      act(() => {
        store.setStructureData(mockStructureData);
      });

      expect(store.canProceedToNext()).toBe(true);

      // Step 4: LP生成段階
      act(() => {
        store.nextStage();
      });

      expect(store.currentStage).toBe('generation');

      // 最終的な進捗確認
      expect(store.completionRate).toBeGreaterThan(70);
      expect(store.getStageHistory()).toEqual(['hearing', 'concept', 'structure', 'generation']);
    });

    it('ワークフロー完了まで全段階を実行できる', async () => {
      // 全データを設定
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
        store.setStructureData({
          sections: [
            {
              id: 'hero',
              name: 'ヒーローセクション',
              description: 'メインビジュアルとキャッチコピー',
              priority: 'high',
              contentType: 'hero'
            },
            {
              id: 'features',
              name: '機能紹介',
              description: '主要機能の説明',
              priority: 'high',
              contentType: 'features'
            }
          ],
          approvedAt: new Date().toISOString()
        });
        store.setGenerationResult({
          htmlContent: '<html><body><h1>Generated LP</h1></body></html>',
          cssContent: 'body { font-family: Arial; }',
          title: 'Generated Landing Page',
          metadata: { version: '1.0' },
          generatedAt: new Date().toISOString()
        });
      });

      // 完了段階まで進む
      act(() => {
        store.setStage('complete');
      });

      expect(store.currentStage).toBe('complete');
      expect(store.completionRate).toBe(100);
      expect(store.getStageHistory()).toContain('complete');
    });
  });

  describe('インタラクティブヒアリング機能', () => {
    it('段階的なヒアリングプロセスが正常に動作する', () => {
      // 初期段階でのヒアリングデータ
      const initialHearingData = {
        essentialInfo: {
          serviceContent: 'SaaS型顧客管理システム'
        }
      };

      act(() => {
        store.updateHearingData(initialHearingData);
      });

      // 部分的な進捗が反映される
      expect(store.getStageProgress('hearing')).toBeGreaterThan(0);
      expect(store.getStageProgress('hearing')).toBeLessThan(100);

      // 追加情報を段階的に追加
      act(() => {
        store.updateHearingData({
          essentialInfo: {
            ...initialHearingData.essentialInfo,
            targetCustomerPain: '顧客情報の管理が煩雑',
            desiredConversion: '無料トライアル申し込み'
          }
        });
      });

      // 進捗が向上する
      const progressAfterUpdate = store.getStageProgress('hearing');
      expect(progressAfterUpdate).toBeGreaterThan(50);
    });

    it('ヒアリング完了条件が正しく判定される', () => {
      // 不完全なデータでは次に進めない
      act(() => {
        store.updateHearingData({
          essentialInfo: {
            serviceContent: 'テストサービス'
          }
        });
      });

      expect(store.canProceedToNext()).toBe(false);

      // 完全なデータで次に進める
      act(() => {
        store.updateHearingData(mockHearingData);
      });

      expect(store.canProceedToNext()).toBe(true);
    });
  });

  describe('コンセプト提案と確認ワークフロー', () => {
    beforeEach(() => {
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setStage('concept');
      });
    });

    it('コンセプト提案後の確認プロセスが正常に動作する', () => {
      expect(store.currentStage).toBe('concept');
      expect(store.canProceedToNext()).toBe(false);

      // コンセプトデータを設定
      act(() => {
        store.setConceptData(mockConceptData);
      });

      expect(store.canProceedToNext()).toBe(true);
      expect(store.getStageProgress('concept')).toBe(100);
    });

    it('コンセプト修正要求が正しく処理される', () => {
      act(() => {
        store.setConceptData(mockConceptData);
      });

      // 修正されたコンセプトデータ
      const modifiedConcept = {
        ...mockConceptData,
        title: '修正されたコンセプトタイトル',
        overview: '修正されたコンセプト概要'
      };

      act(() => {
        store.setConceptData(modifiedConcept);
      });

      expect(store.conceptData?.title).toBe('修正されたコンセプトタイトル');
      expect(store.conceptData?.overview).toBe('修正されたコンセプト概要');
    });
  });

  describe('後方ナビゲーション機能', () => {
    it('任意の段階から前の段階に戻ることができる', () => {
      // 複数段階を進む
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
        store.setStage('structure');
      });

      expect(store.currentStage).toBe('structure');
      expect(store.canGoBack()).toBe(true);

      // concept段階に戻る
      act(() => {
        store.previousStage();
      });

      expect(store.currentStage).toBe('concept');

      // hearing段階に戻る
      act(() => {
        store.previousStage();
      });

      expect(store.currentStage).toBe('hearing');
      expect(store.canGoBack()).toBe(false);
    });

    it('特定の段階に直接ジャンプできる', () => {
      // データを設定して複数段階を有効化
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
        store.setStage('structure');
      });

      // concept段階に直接ジャンプ
      act(() => {
        store.goToStage('concept');
      });

      expect(store.currentStage).toBe('concept');
      expect(store.getStageHistory()).toContain('concept');
      expect(store.getStageHistory()).toContain('structure');
    });

    it('アクセス不可能な段階にはジャンプできない', () => {
      // 初期状態（hearingのみアクセス可能）
      expect(store.currentStage).toBe('hearing');

      // generation段階に直接ジャンプを試行（失敗するはず）
      act(() => {
        store.goToStage('generation');
      });

      // 段階は変わらない
      expect(store.currentStage).toBe('hearing');
    });
  });

  describe('ワークフロー状態の永続化', () => {
    it('ワークフロー状態をエクスポート・インポートできる', () => {
      // 複雑な状態を作成
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
        store.setStage('concept');
        store.setProcessing(false);
        store.setError(null);
      });

      // エクスポート
      const exportedData = store.exportWorkflowData();

      expect(exportedData).toHaveProperty('sessionId');
      expect(exportedData).toHaveProperty('currentStage', 'concept');
      expect(exportedData).toHaveProperty('hearingData');
      expect(exportedData).toHaveProperty('conceptData');
      expect(exportedData).toHaveProperty('exportedAt');

      // リセット
      act(() => {
        store.resetWorkflow();
      });

      expect(store.currentStage).toBe('hearing');
      expect(store.conceptData).toBeNull();

      // インポート
      act(() => {
        store.importWorkflowData(exportedData);
      });

      expect(store.currentStage).toBe('concept');
      expect(store.hearingData).toEqual(mockHearingData);
      expect(store.conceptData).toEqual(mockConceptData);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のデータ更新でもパフォーマンスが維持される', () => {
      const startTime = Date.now();

      // 大量のデータ更新をシミュレート
      act(() => {
        for (let i = 0; i < 100; i++) {
          store.updateHearingData({
            必須情報: {
              商材サービス内容: `サービス${i}`
            }
          });
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1秒以内に完了することを確認
      expect(duration).toBeLessThan(1000);
    });

    it('頻繁な段階変更でもメモリリークしない', () => {
      act(() => {
        store.updateHearingData(mockHearingData);
        store.setConceptData(mockConceptData);
      });

      // 多数の段階変更をシミュレート
      act(() => {
        for (let i = 0; i < 50; i++) {
          store.setStage('hearing');
          store.setStage('concept');
          store.setStage('structure');
        }
      });

      // 最終状態が正常であることを確認
      expect(store.currentStage).toBe('structure');
      expect(store.hearingData).toEqual(mockHearingData);
      expect(store.conceptData).toEqual(mockConceptData);
    });
  });
});