'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Target, 
  CheckCircle, 
  ArrowRight, 
  Clock,
  Users,
  Lightbulb,
  FileText
} from 'lucide-react';

import { HearingInterface } from './HearingInterface';
import { ConceptReview } from './ConceptReview';
import { useWorkflowStore } from '../stores/workflowStore';

export const StructuredWorkflowPanel: React.FC = () => {
  const {
    currentStage,
    hearingData,
    conceptData,
    completionRate,
    isProcessing,
    error,
    setStage,
    nextStage,
    updateHearingData,
    setConceptData,
    setProcessing,
    setError,
    canProceedToNext
  } = useWorkflowStore();

  const [showHearing, setShowHearing] = useState(false);
  const [showConcept, setShowConcept] = useState(false);

  // チャット機能（ツール呼び出し用）
  const { messages, append, isLoading } = useChat({
    api: '/api/lp-creator/chat',
    onFinish: (message) => {
      setProcessing(false);
    },
    onError: (error) => {
      console.error('Tool execution error:', error);
      setError(error.message);
      setProcessing(false);
    }
  });

  // ワークフロー段階に応じた表示制御
  useEffect(() => {
    // currentStageが'hearing'以外に変わった時のみshowHearingをfalseに
    if (currentStage !== 'hearing') {
      setShowHearing(false);
    }
    setShowConcept(currentStage === 'concept');
  }, [currentStage]);

  // ヒアリング開始
  const startHearing = async () => {
    setProcessing(true);
    setError(null);
    setShowHearing(true); // ヒアリング画面を表示
    
    try {
      await append({
        role: 'user',
        content: 'interactiveHearingTool を使ってヒアリングを開始してください。stage: initial で実行してください。'
      });
    } catch (error) {
      console.error('Failed to start hearing:', error);
      setError('ヒアリングの開始に失敗しました');
      setProcessing(false);
    }
  };

  // ヒアリング回答処理
  const handleHearingResponse = async (response: string) => {
    setProcessing(true);
    
    try {
      await append({
        role: 'user',
        content: `interactiveHearingTool を使って回答を処理してください。
        stage: "${currentStage}",
        userResponse: "${response}",
        currentData: ${JSON.stringify(hearingData)}`
      });
    } catch (error) {
      console.error('Failed to process hearing response:', error);
      setError('回答の処理に失敗しました');
      setProcessing(false);
    }
  };

  // ヒアリング完了・コンセプト生成
  const generateConcept = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      await append({
        role: 'user',
        content: `conceptProposalTool を使ってコンセプトを生成してください。
        action: "generate",
        hearingData: ${JSON.stringify(hearingData)}`
      });
      
      setStage('concept');
    } catch (error) {
      console.error('Failed to generate concept:', error);
      setError('コンセプト生成に失敗しました');
      setProcessing(false);
    }
  };

  // コンセプト承認
  const approveConcept = (concept: any) => {
    setConceptData(concept);
    nextStage();
  };

  // 段階表示コンポーネント
  const renderStageIndicator = () => {
    const stages = [
      { id: 'hearing', label: 'ヒアリング', icon: MessageCircle },
      { id: 'concept', label: 'コンセプト', icon: Lightbulb },
      { id: 'structure', label: '構成設計', icon: FileText },
      { id: 'generation', label: 'LP生成', icon: Target },
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id;
          const isCompleted = stages.findIndex(s => s.id === currentStage) > index;
          
          return (
            <div key={stage.id} className="flex items-center">
              <div className={`flex items-center gap-2 p-3 rounded-lg border-2 ${
                isActive 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{stage.label}</span>
                {isCompleted && <CheckCircle className="w-4 h-4" />}
              </div>
              
              {index < stages.length - 1 && (
                <ArrowRight className={`w-5 h-5 mx-3 ${
                  isCompleted ? 'text-green-500' : 'text-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 進捗サマリー
  const renderProgressSummary = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          ワークフロー進捗
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900">全体進捗</span>
              <span className="text-sm text-gray-900">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-900">ヒアリング</span>
              <Badge variant={Object.keys(hearingData).length > 0 ? 'default' : 'secondary'}>
                {currentStage === 'hearing' ? '進行中' : Object.keys(hearingData).length > 0 ? '完了' : '未開始'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-900">コンセプト</span>
              <Badge variant={conceptData ? 'default' : 'secondary'}>
                {currentStage === 'concept' ? '進行中' : conceptData ? '完了' : '未開始'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // エラー表示
  const renderError = () => {
    if (!error) return null;
    
    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">エラー</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setError(null)}
            className="mt-2 text-red-600 border-red-300"
          >
            閉じる
          </Button>
        </CardContent>
      </Card>
    );
  };

  // 初期画面
  const renderInitialScreen = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          構造化ワークフロー
        </h2>
        <p className="text-gray-900">
          段階的なヒアリングとコンセプト提案を通じて、
          高品質なランディングページを作成します
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              ヒアリング
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-900">
              PROMPT.mdベースの詳細なヒアリングで、
              ビジネス要件を正確に把握します
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              コンセプト提案
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-900">
              収集した情報を基に、戦略的な
              LPコンセプトを提案・保存します
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Target className="w-5 h-5 text-green-600" />
              LP生成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-900">
              承認されたコンセプトに基づいて、
              最終的なLPを生成します
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Button 
        onClick={startHearing} 
        size="lg"
        disabled={isProcessing}
        className="px-8"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            初期化中...
          </>
        ) : (
          <>
            <MessageCircle className="w-5 h-5 mr-2" />
            ヒアリングを開始
          </>
        )}
      </Button>
    </div>
  );

  // デバッグログを削除（本番環境のため）

  return (
    <div className="h-full bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* 段階インジケーター */}
        {currentStage !== 'hearing' && renderStageIndicator()}
        
        {/* 進捗サマリー */}
        {currentStage !== 'hearing' && renderProgressSummary()}
        
        {/* エラー表示 */}
        {renderError()}
        
        {/* メインコンテンツ */}
        {currentStage === 'hearing' && !showHearing && renderInitialScreen()}
        
        {showHearing && (
          <HearingInterface
            onResponse={handleHearingResponse}
            onComplete={() => generateConcept()}
            isProcessing={isLoading || isProcessing}
            currentQuestion={messages.length > 0 ? messages[messages.length - 1].content : ''}
            completionRate={completionRate}
            collectedData={hearingData}
          />
        )}
        
        {showConcept && conceptData && (
          <ConceptReview
            concept={conceptData}
            onApprove={approveConcept}
            onEdit={(concept) => {
              const updatedConceptData = {
                ...concept,
                createdAt: conceptData?.createdAt || new Date().toISOString()
              };
              setConceptData(updatedConceptData);
            }}
            onSave={(concept) => {
              const updatedConceptData = {
                ...concept,
                createdAt: conceptData?.createdAt || new Date().toISOString()
              };
              setConceptData(updatedConceptData);
              // 保存処理（実装）
            }}
          />
        )}
        
        {currentStage === 'structure' && (
          <Card>
            <CardHeader>
              <CardTitle>構成設計</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 mb-4">
                コンセプトが承認されました。次に詳細な構成設計を行います。
              </p>
              <Button disabled>
                構成設計を開始（実装予定）
              </Button>
            </CardContent>
          </Card>
        )}
        
        {currentStage === 'generation' && (
          <Card>
            <CardHeader>
              <CardTitle>LP生成</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 mb-4">
                最終的なランディングページを生成します。
              </p>
              <Button disabled>
                LP生成を開始（実装予定）
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};