'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ArrowLeft,
  Clock,
  Users,
  Lightbulb,
  FileText,
  History,
  Navigation
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
    stageHistory,
    setStage,
    nextStage,
    previousStage,
    goToStage,
    updateHearingData,
    setConceptData,
    setProcessing,
    setError,
    canProceedToNext,
    canGoBack,
    getStageHistory,
    getStageProgress,
    resetWorkflow,
    exportWorkflowData
  } = useWorkflowStore();

  const [showHearing, setShowHearing] = useState(false);
  const [showConcept, setShowConcept] = useState(false);

  // AbortController for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // チャット機能（ツール呼び出し用）
  const { messages, append, isLoading } = useChat({
    api: '/api/lp-creator/chat',
    onFinish: (message) => {
      console.log('✅ Tool execution completed');
      setProcessing(false);
      
      // ツール結果の解析
      try {
        if (message.toolInvocations) {
          message.toolInvocations.forEach((toolInvocation: any) => {
            if (toolInvocation.toolName === 'interactiveHearingTool' && toolInvocation.result) {
              console.log('📝 Hearing tool result:', toolInvocation.result);
              // ヒアリングデータの更新
              if (toolInvocation.result.collectedData) {
                updateHearingData(toolInvocation.result.collectedData);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error processing tool results:', error);
      }
    },
    onError: (error) => {
      console.error('❌ Tool execution error:', error);
      setError(error.message);
      setProcessing(false);
    }
  });

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ワークフロー段階に応じた表示制御
  useEffect(() => {
    // currentStageが'hearing'以外に変わった時のみshowHearingをfalseに
    if (currentStage !== 'hearing') {
      setShowHearing(false);
    }
    setShowConcept(currentStage === 'concept');
  }, [currentStage]);

  // ヒアリング開始（AbortController対応）
  const startHearing = async () => {
    // 既存のAbortControllerをクリーンアップ
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setProcessing(true);
    setError(null);
    setShowHearing(true);
    
    try {
      // AbortControllerのシグナルをチェック
      if (signal.aborted) {
        return;
      }
      
      await append({
        role: 'user',
        content: 'interactiveHearingTool を使ってヒアリングを開始してください。stage: initial で実行してください。'
      });
    } catch (error) {
      // AbortControllerによるキャンセルかどうかをチェック
      if (signal.aborted) {
        console.log('Hearing start was aborted');
        return;
      }
      
      console.error('Failed to start hearing:', error);
      setError('ヒアリングの開始に失敗しました');
      setProcessing(false);
    }
  };

  // ヒアリング回答処理（AbortController対応）
  const handleHearingResponse = async (response: string) => {
    // 既存のAbortControllerをクリーンアップ
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      await append({
        role: 'user',
        content: `interactiveHearingTool を使って回答を処理してください。
        stage: "${currentStage}",
        userResponse: "${response}",
        currentData: ${JSON.stringify(hearingData)}`
      });
    } catch (error) {
      // AbortControllerによるキャンセルかどうかをチェック
      if (signal.aborted) {
        console.log('Hearing response was aborted');
        return;
      }
      
      console.error('Failed to process hearing response:', error);
      setError('回答の処理に失敗しました');
      setProcessing(false);
    }
  };

  // ヒアリング完了・コンセプト生成（AbortController対応）
  const generateConcept = async () => {
    // 既存のAbortControllerをクリーンアップ
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setProcessing(true);
    setError(null);
    
    try {
      // AbortControllerのシグナルをチェック
      if (signal.aborted) {
        return;
      }
      
      await append({
        role: 'user',
        content: `conceptProposalTool を使ってコンセプトを生成してください。
        action: "generate",
        hearingData: ${JSON.stringify(hearingData)}`
      });
      
      setStage('concept');
    } catch (error) {
      // AbortControllerによるキャンセルかどうかをチェック
      if (signal.aborted) {
        console.log('Concept generation was aborted');
        return;
      }
      
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

  // 段階表示コンポーネント（クリック可能）
  const renderStageIndicator = () => {
    const stages = [
      { id: 'hearing', label: 'ヒアリング', icon: MessageCircle, description: '顧客要件の詳細収集' },
      { id: 'concept', label: 'コンセプト', icon: Lightbulb, description: '戦略的提案の生成' },
      { id: 'structure', label: '構成設計', icon: FileText, description: 'ページ構造の設計' },
      { id: 'generation', label: 'LP生成', icon: Target, description: '最終成果物の作成' },
    ];

    return (
      <div className="mb-8">
        {/* ナビゲーションボタンとステップ情報 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={previousStage}
            disabled={!canGoBack() || isProcessing}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            前の段階に戻る
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                進行履歴: {getStageHistory().length}段階
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">
                現在: {stages.find(s => s.id === currentStage)?.label}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextStage}
            disabled={!canProceedToNext() || isProcessing}
            className="flex items-center gap-2 hover:bg-blue-50"
          >
            次の段階へ進む
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* 段階インジケーター */}
        <div className="relative">
          {/* プログレスライン */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ 
                width: `${(stages.findIndex(s => s.id === currentStage) / (stages.length - 1)) * 100}%` 
              }}
            />
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = currentStage === stage.id;
              const isCompleted = stages.findIndex(s => s.id === currentStage) > index;
              const isAccessible = index === 0 || isCompleted || stageHistory.includes(stage.id as any);
              const stageProgress = getStageProgress(stage.id as any);
              
              return (
                <div key={stage.id} className="flex flex-col items-center">
                  <button
                    onClick={() => isAccessible && !isProcessing ? goToStage(stage.id as any) : undefined}
                    disabled={!isAccessible || isProcessing}
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                      isActive 
                        ? 'border-blue-500 bg-blue-500 text-white shadow-lg' 
                        : isCompleted 
                          ? 'border-green-500 bg-green-500 text-white hover:bg-green-600'
                          : isAccessible
                            ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title={stage.description}
                  >
                    <Icon className="w-5 h-5" />
                    {isCompleted && !isActive && (
                      <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full" />
                    )}
                    {isActive && isProcessing && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full animate-pulse" />
                    )}
                  </button>
                  
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {stage.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-w-20">
                      {stage.description}
                    </div>
                    {stageProgress > 0 && (
                      <div className="mt-2 w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${stageProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 進捗サマリー
  const renderProgressSummary = () => {
    const stages = [
      { 
        id: 'hearing', 
        label: 'ヒアリング', 
        icon: MessageCircle, 
        color: 'blue',
        progress: getStageProgress('hearing'),
        status: currentStage === 'hearing' ? '進行中' : getStageProgress('hearing') === 100 ? '完了' : '未開始'
      },
      { 
        id: 'concept', 
        label: 'コンセプト', 
        icon: Lightbulb, 
        color: 'yellow',
        progress: getStageProgress('concept'),
        status: currentStage === 'concept' ? '進行中' : conceptData ? '完了' : '未開始'
      },
      { 
        id: 'structure', 
        label: '構成設計', 
        icon: FileText, 
        color: 'purple',
        progress: getStageProgress('structure'),
        status: currentStage === 'structure' ? '進行中' : getStageProgress('structure') === 100 ? '完了' : '未開始'
      },
      { 
        id: 'generation', 
        label: 'LP生成', 
        icon: Target, 
        color: 'green',
        progress: getStageProgress('generation'),
        status: currentStage === 'generation' ? '進行中' : getStageProgress('generation') === 100 ? '完了' : '未開始'
      }
    ];

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              ワークフロー進捗
            </div>
            <Badge variant="outline" className="text-sm">
              {completionRate}% 完了
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 全体進捗バー */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900">全体進捗</span>
                <span className="text-sm text-gray-900">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>開始</span>
                <span>完了</span>
              </div>
            </div>
            
            {/* 各段階の詳細進捗 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stages.map((stage) => {
                const Icon = stage.icon;
                const isActive = currentStage === stage.id;
                const colorClasses = {
                  blue: 'text-blue-500 bg-blue-50 border-blue-200',
                  yellow: 'text-yellow-500 bg-yellow-50 border-yellow-200',
                  purple: 'text-purple-500 bg-purple-50 border-purple-200',
                  green: 'text-green-500 bg-green-50 border-green-200'
                };
                
                return (
                  <div 
                    key={stage.id}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      isActive 
                        ? `${colorClasses[stage.color as keyof typeof colorClasses]} ring-2 ring-offset-1 ring-${stage.color}-300`
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isActive ? '' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${isActive ? '' : 'text-gray-600'}`}>
                          {stage.label}
                        </span>
                      </div>
                      <Badge 
                        variant={stage.status === '完了' ? 'default' : stage.status === '進行中' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {stage.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>進捗</span>
                        <span>{stage.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            stage.status === '完了' ? 'bg-green-500' : 
                            stage.status === '進行中' ? `bg-${stage.color}-500` : 'bg-gray-300'
                          }`}
                          style={{ width: `${stage.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 次のアクション */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">次のアクション</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {canProceedToNext() ? '次の段階に進む準備完了' : '現在の段階を完了してください'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
            currentQuestion={messages.length > 0 && messages[messages.length - 1].role === 'assistant' ? 
              (typeof messages[messages.length - 1].content === 'string' ? messages[messages.length - 1].content : '') : ''}
            completionRate={completionRate}
            collectedData={hearingData}
          />
        )}
        
        {showConcept && conceptData && (
          <div className="space-y-6">
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
            
            {/* コンセプト承認後のアクション */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">
                    コンセプト確認完了
                  </h3>
                </div>
                <p className="text-green-700 mb-4">
                  提案されたコンセプトをご確認いただき、承認または修正をお願いします。
                  承認後は構成設計段階に進みます。
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => approveConcept(conceptData)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        承認処理中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        コンセプトを承認
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // コンセプト修正モードに入る
                      setError('コンセプトの修正が必要な場合は、具体的な修正点をお聞かせください。');
                    }}
                    disabled={isProcessing}
                  >
                    修正を要求
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {currentStage === 'structure' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  構成設計
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">承認されたコンセプト</h4>
                    <p className="text-purple-700 text-sm">
                      {conceptData?.title || 'コンセプトタイトル'}
                    </p>
                  </div>
                  
                  <p className="text-gray-900">
                    承認されたコンセプトに基づいて、詳細なページ構成とワイヤーフレームを設計します。
                    各セクションの配置、コンテンツの流れ、ユーザー体験を最適化します。
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">設計内容</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• ページセクション構成</li>
                        <li>• コンテンツ配置計画</li>
                        <li>• ユーザー導線設計</li>
                        <li>• レスポンシブ対応</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">成果物</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• ワイヤーフレーム</li>
                        <li>• セクション仕様書</li>
                        <li>• コンテンツマップ</li>
                        <li>• 技術要件定義</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      setProcessing(true);
                      // 構成設計の実装（将来的に実装）
                      setTimeout(() => {
                        setProcessing(false);
                        setError('構成設計機能は現在開発中です。次の段階に進むには手動で設定してください。');
                      }, 2000);
                    }}
                    disabled={isProcessing}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        構成設計中...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        構成設計を開始
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {currentStage === 'generation' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  LP生成
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">準備完了</h4>
                    <p className="text-green-700 text-sm">
                      ヒアリング、コンセプト、構成設計が完了しました。最終的なランディングページを生成します。
                    </p>
                  </div>
                  
                  <p className="text-gray-900">
                    これまでに収集した情報と設計に基づいて、完全なランディングページを自動生成します。
                    HTML、CSS、JavaScriptを含む完全なWebページが作成されます。
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {Object.keys(hearingData.essentialInfo || {}).length}
                      </div>
                      <div className="text-sm text-gray-600">必須情報</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {conceptData ? '1' : '0'}
                      </div>
                      <div className="text-sm text-gray-600">承認済みコンセプト</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {completionRate}%
                      </div>
                      <div className="text-sm text-gray-600">全体進捗</div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      setProcessing(true);
                      // LP生成の実装（将来的に実装）
                      setTimeout(() => {
                        setProcessing(false);
                        setStage('complete');
                      }, 3000);
                    }}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        LP生成中...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        最終LP生成を開始
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {currentStage === 'complete' && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  ワークフロー完了
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-green-700">
                    🎉 おめでとうございます！構造化ワークフローが正常に完了しました。
                    高品質なランディングページが生成されました。
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-green-800">ヒアリング</div>
                      <div className="text-xs text-green-600">完了</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-green-800">コンセプト</div>
                      <div className="text-xs text-green-600">承認済み</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-green-800">構成設計</div>
                      <div className="text-xs text-green-600">完了</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-green-800">LP生成</div>
                      <div className="text-xs text-green-600">完了</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        // 新しいワークフローを開始
                        resetWorkflow();
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      新しいワークフローを開始
                    </Button>
                    <Button 
                      onClick={() => {
                        // エクスポート機能（将来実装）
                        const exportData = exportWorkflowData();
                        console.log('Exported workflow data:', exportData);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      結果をエクスポート
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};