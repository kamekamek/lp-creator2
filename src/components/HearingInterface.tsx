'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCircle, Clock, Target, Send, Lightbulb, AlertCircle, Bookmark, HelpCircle, Users, Navigation } from 'lucide-react';

interface HearingData {
  essentialInfo?: {
    serviceContent?: string;
    uniqueValueProposition?: string;
    targetCustomerPain?: string;
    desiredConversion?: string;
    budgetAndUrgency?: string;
  };
  strategyInfo?: {
    competitors?: string[];
    currentChannels?: string;
    brandImage?: string;
    successMetrics?: string;
  };
}

interface ConversationEntry {
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
}

interface HearingInterfaceProps {
  onResponse: (response: string) => void;
  onComplete: (data: HearingData) => void;
  isProcessing?: boolean;
  currentQuestion?: string;
  completionRate?: number;
  collectedData?: HearingData;
}

interface QuestionContext {
  category: 'essential' | 'strategy' | 'details';
  importance: 'high' | 'medium' | 'low';
  tips?: string[];
  examples?: string[];
}

export const HearingInterface: React.FC<HearingInterfaceProps> = ({
  onResponse,
  onComplete,
  isProcessing = false,
  currentQuestion = '',
  completionRate = 0,
  collectedData = {}
}) => {
  // 状態管理
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [currentStage, setCurrentStage] = useState<'initial' | 'progress' | 'completed'>('initial');
  const [userInput, setUserInput] = useState('');
  const [questionContext, setQuestionContext] = useState<QuestionContext | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // 質問コンテキストを分析する関数
  const analyzeQuestionContext = (question: string): QuestionContext => {
    // サービス・商材関連
    if (question.includes('サービス') || question.includes('商材') || question.includes('業界') || question.includes('提供')) {
      return {
        category: 'essential',
        importance: 'high',
        tips: [
          '具体的なサービス名や業界を教えてください',
          '解決する問題やニーズを明確にしてください',
          '競合他社との違いがあれば教えてください',
          '技術的な特徴や独自性があれば含めてください'
        ],
        examples: [
          'SaaS型の顧客管理システム（CRM）',
          'EC事業者向けマーケティング自動化ツール',
          '中小企業向け経理・会計自動化ソフト',
          'AI搭載の画像解析サービス'
        ]
      };
    }
    
    // ターゲット・顧客関連
    if (question.includes('ターゲット') || question.includes('顧客') || question.includes('悩み') || question.includes('課題')) {
      return {
        category: 'essential',
        importance: 'high',
        tips: [
          '具体的な顧客像（ペルソナ）を描いてください',
          '年齢層、職業、企業規模、業界などを教えてください',
          '顧客が抱えている具体的な課題や痛みを教えてください',
          'その課題が解決されないとどんな問題が生じるかも含めてください'
        ],
        examples: [
          '30-50代の中小企業経営者（従業員10-100名）',
          '売上管理と在庫管理に悩むEC事業者',
          '人事業務の効率化を求める成長企業の人事担当者',
          'デジタル化に遅れを感じている製造業の管理職'
        ]
      };
    }

    // コンバージョン・目標関連
    if (question.includes('コンバージョン') || question.includes('行動') || question.includes('目標') || question.includes('申込')) {
      return {
        category: 'essential',
        importance: 'high',
        tips: [
          '訪問者に最も取ってもらいたい行動を明確にしてください',
          '複数の目標がある場合は優先順位をつけてください',
          '現実的で測定可能な目標を設定してください'
        ],
        examples: [
          '無料トライアル申し込み（14日間）',
          '資料ダウンロードと問い合わせ',
          'デモ予約・相談会申し込み',
          '商品購入・サービス契約'
        ]
      };
    }

    // 競合・戦略関連
    if (question.includes('競合') || question.includes('チャネル') || question.includes('ブランド') || question.includes('集客')) {
      return {
        category: 'strategy',
        importance: 'medium',
        tips: [
          '直接・間接的な競合企業を具体的に教えてください',
          '現在使用している集客方法とその効果を教えてください',
          'ブランドの印象や目指したいイメージを教えてください',
          '競合との差別化ポイントを明確にしてください'
        ],
        examples: [
          '競合：Salesforce、HubSpot、kintone など',
          'チャネル：Google広告、SEO、展示会、紹介など',
          'ブランド：革新的、信頼性、親しみやすさ、専門性',
          '差別化：価格、機能、サポート、業界特化など'
        ]
      };
    }

    // 予算・緊急度関連
    if (question.includes('予算') || question.includes('緊急') || question.includes('いつ') || question.includes('期限')) {
      return {
        category: 'strategy',
        importance: 'medium',
        tips: [
          '概算の予算感を教えてください（範囲でも構いません）',
          'プロジェクトの緊急度や希望完了時期を教えてください',
          '予算や時期に制約がある理由があれば教えてください'
        ],
        examples: [
          '月額10万円以下、初期費用50万円以内',
          '3ヶ月以内に導入、来年度予算で検討',
          '展示会に合わせて急ぎ、新サービス発表に合わせて'
        ]
      };
    }

    // 成功指標関連
    if (question.includes('成功') || question.includes('指標') || question.includes('測定') || question.includes('KPI')) {
      return {
        category: 'strategy',
        importance: 'medium',
        tips: [
          '具体的で測定可能な指標を教えてください',
          '現在の数値と目標数値があれば教えてください',
          '成功の定義を明確にしてください'
        ],
        examples: [
          '月間リード数100件、コンバージョン率3%',
          '売上20%向上、顧客獲得コスト50%削減',
          'サイト滞在時間2分以上、離脱率40%以下'
        ]
      };
    }

    return {
      category: 'details',
      importance: 'low',
      tips: ['できるだけ具体的で詳細な情報をお答えください'],
      examples: []
    };
  };

  // 初期化処理
  useEffect(() => {
    if (conversationHistory.length === 0 && currentStage === 'initial') {
      const initialQuestion = currentQuestion || 'まず、あなたのサービスや商材について教えてください。どのような業界で、どんな課題を解決するものですか？';
      setConversationHistory([{
        type: 'question',
        content: initialQuestion,
        timestamp: new Date()
      }]);
      setCurrentStage('progress');
    }
  }, [currentQuestion, conversationHistory.length, currentStage]);

  // 初期質問を会話履歴に追加
  useEffect(() => {
    if (conversationHistory.length === 0) {
      const initialQuestion = currentQuestion || 'まず、あなたのサービスや商材について教えてください。どのような業界で、どんな課題を解決するものですか？';
      setConversationHistory([{
        type: 'question',
        content: initialQuestion,
        timestamp: new Date()
      }]);
    }
  }, [conversationHistory.length, currentQuestion]);

  // 新しい質問が来た時の処理
  useEffect(() => {
    if (currentQuestion && conversationHistory.length > 0) {
      console.log('🆕 New question received:', currentQuestion.substring(0, 100) + '...');
      setConversationHistory(prev => [
        ...prev,
        {
          type: 'question',
          content: currentQuestion,
          timestamp: new Date()
        }
      ]);
      
      // 質問のコンテキストを分析
      const context = analyzeQuestionContext(currentQuestion);
      setQuestionContext(context);
    }
  }, [currentQuestion]);

  const handleSubmitResponse = () => {
    if (!userInput.trim()) return;
    
    // 会話履歴に回答を追加
    setConversationHistory(prev => [
      ...prev,
      {
        type: 'answer',
        content: userInput,
        timestamp: new Date()
      }
    ]);
    
    // 親コンポーネントに回答を送信
    onResponse(userInput);
    setUserInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  // ヘルプパネルのレンダリング
  const renderHelpPanel = () => {
    if (!questionContext) return null;

    return (
      <Card className="mb-4 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Lightbulb className="w-5 h-5" />
            回答のヒント
            <Badge variant="outline" className={`text-xs ${
              questionContext.importance === 'high' ? 'bg-red-100 text-red-800' :
              questionContext.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {questionContext.importance === 'high' ? '重要' :
               questionContext.importance === 'medium' ? '標準' : '参考'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questionContext.tips && questionContext.tips.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  回答のポイント
                </h4>
                <ul className="space-y-1">
                  {questionContext.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-yellow-700">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {questionContext.examples && questionContext.examples.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-1">
                  <Bookmark className="w-4 h-4" />
                  回答例
                </h4>
                <ul className="space-y-1">
                  {questionContext.examples.map((example, index) => (
                    <li key={index} className="text-sm text-yellow-700 italic">
                      「{example}」
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProgressSummary = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          ヒアリング進捗
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900">完了率</span>
              <span className="text-sm text-gray-900">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-900">必須情報</span>
              <Badge variant="secondary">
                {Object.keys(collectedData.essentialInfo || {}).length}/4
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-900">戦略情報</span>
              <Badge variant="secondary">
                {Object.keys(collectedData.strategyInfo || {}).length}/4
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderConversationHistory = () => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {conversationHistory.map((entry, index) => (
        <div
          key={index}
          className={`flex gap-3 ${
            entry.type === 'question' ? 'justify-start' : 'justify-end'
          }`}
        >
          <div
            className={`max-w-[85%] p-4 rounded-lg shadow-sm ${
              entry.type === 'question'
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-green-50 border border-green-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {entry.type === 'question' ? (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${
                    entry.type === 'question' ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    {entry.type === 'question' ? 'AI アシスタント' : 'あなた'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {entry.timestamp.toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className={`text-sm whitespace-pre-wrap ${
                  entry.type === 'question' ? 'text-blue-900' : 'text-green-900'
                }`}>
                  {entry.content}
                </p>
                {entry.type === 'question' && questionContext && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        questionContext.importance === 'high' ? 'border-red-300 text-red-700' :
                        questionContext.importance === 'medium' ? 'border-yellow-300 text-yellow-700' :
                        'border-blue-300 text-blue-700'
                      }`}
                    >
                      {questionContext.importance === 'high' ? '重要' :
                       questionContext.importance === 'medium' ? '標準' : '参考'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {questionContext.category === 'essential' ? '必須情報' :
                       questionContext.category === 'strategy' ? '戦略情報' : '詳細情報'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* 入力中インジケーター */}
      {isProcessing && (
        <div className="flex gap-3 justify-start">
          <div className="max-w-[85%] p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-700">AI アシスタント</span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
                <p className="text-sm text-blue-700">回答を分析中...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCollectedDataSummary = () => {
    const essentialItems = [
      { key: 'serviceContent', label: 'サービス内容', icon: Target },
      { key: 'targetCustomerPain', label: '顧客の悩み', icon: AlertCircle },
      { key: 'desiredConversion', label: 'コンバージョン', icon: CheckCircle },
      { key: 'budgetAndUrgency', label: '予算・緊急度', icon: Clock }
    ];

    const strategyItems = [
      { key: 'competitors', label: '競合分析', icon: Users },
      { key: 'currentChannels', label: '集客チャネル', icon: Navigation },
      { key: 'brandImage', label: 'ブランド', icon: Bookmark },
      { key: 'successMetrics', label: '成功指標', icon: Target }
    ];

    const essentialCompleted = essentialItems.filter(item =>
      collectedData.essentialInfo?.[item.key as keyof typeof collectedData.essentialInfo]
    ).length;

    const strategyCompleted = strategyItems.filter(item =>
      collectedData.strategyInfo?.[item.key as keyof typeof collectedData.strategyInfo]
    ).length;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg text-gray-900">収集済み情報</span>
            <Badge variant="outline" className="text-sm">
              {Math.round(((essentialCompleted + strategyCompleted) / (essentialItems.length + strategyItems.length)) * 100)}% 完了
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 必須情報セクション */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  必須情報
                </h4>
                <Badge variant={essentialCompleted === essentialItems.length ? 'default' : 'secondary'}>
                  {essentialCompleted}/{essentialItems.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {essentialItems.map(item => {
                  const Icon = item.icon;
                  const isCompleted = !!collectedData.essentialInfo?.[item.key as keyof typeof collectedData.essentialInfo];
                  const value = collectedData.essentialInfo?.[item.key as keyof typeof collectedData.essentialInfo];
                  
                  return (
                    <div key={item.key} className={`p-3 rounded-lg border ${
                      isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${isCompleted ? 'text-green-900' : 'text-gray-600'}`}>
                          {item.label}
                        </span>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                      </div>
                      {isCompleted && value && (
                        <p className="text-xs text-green-700 ml-6 truncate" title={value}>
                          {value}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 戦略情報セクション */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  戦略情報
                </h4>
                <Badge variant={strategyCompleted > 0 ? 'default' : 'secondary'}>
                  {strategyCompleted}/{strategyItems.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {strategyItems.map(item => {
                  const Icon = item.icon;
                  const isCompleted = !!collectedData.strategyInfo?.[item.key as keyof typeof collectedData.strategyInfo];
                  const value = collectedData.strategyInfo?.[item.key as keyof typeof collectedData.strategyInfo];
                  
                  return (
                    <div key={item.key} className={`p-3 rounded-lg border ${
                      isCompleted ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isCompleted ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${isCompleted ? 'text-blue-900' : 'text-gray-600'}`}>
                          {item.label}
                        </span>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-blue-500 ml-auto" />}
                      </div>
                      {isCompleted && value && (
                        <p className="text-xs text-blue-700 ml-6 truncate" title={Array.isArray(value) ? value.join(', ') : value}>
                          {Array.isArray(value) ? value.join(', ') : value}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 進捗サマリー */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">ヒアリング進捗</span>
                <span className="font-medium text-gray-900">{completionRate}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>開始</span>
                <span>完了</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (currentStage === 'initial') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LP作成ヒアリング
          </h1>
          <p className="text-gray-900 mb-8">
            効果的なランディングページを作成するため、いくつか質問させていただきます
          </p>
          <Button onClick={() => onResponse('start')} size="lg">
            ヒアリングを開始
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LP作成ヒアリング
          </h1>
          <p className="text-gray-900">
            効果的なランディングページを作成するため、いくつか質問させていただきます
          </p>
        </div>

        {/* 進捗サマリー */}
        {currentStage === 'progress' && renderProgressSummary()}

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 会話エリア */}
          <div className="lg:col-span-2 space-y-4">
            {/* ヘルプパネル */}
            {renderHelpPanel()}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    対話
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex items-center gap-1"
                  >
                    <HelpCircle className="w-4 h-4" />
                    ヘルプ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 会話履歴 */}
                {renderConversationHistory()}
                
                {/* 入力エリア */}
                <div className="mt-6 space-y-3">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="こちらにご回答ください..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={4}
                    disabled={isProcessing}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-900">
                      Enterで送信（Shift+Enterで改行）
                    </span>
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={!userInput.trim() || isProcessing}
                      className="px-6"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          処理中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          送信
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* サイドバー：収集済み情報 */}
          <div>
            {renderCollectedDataSummary()}
          </div>
        </div>
      </div>
    </div>
  );
};