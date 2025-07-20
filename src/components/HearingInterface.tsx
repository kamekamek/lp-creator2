'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCircle, Clock, Target, Send, Lightbulb, AlertCircle, Bookmark, HelpCircle } from 'lucide-react';

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
    if (question.includes('サービス') || question.includes('商材') || question.includes('業界')) {
      return {
        category: 'essential',
        importance: 'high',
        tips: [
          '具体的なサービス名や業界を教えてください',
          '解決する問題やニーズを明確にしてください',
          '競合他社との違いがあれば教えてください'
        ],
        examples: [
          'SaaS型の顧客管理システム',
          'EC事業者向けマーケティング支援',
          '中小企業向け経理自動化ツール'
        ]
      };
    }
    
    if (question.includes('ターゲット') || question.includes('顧客') || question.includes('悩み')) {
      return {
        category: 'essential',
        importance: 'high',
        tips: [
          '具体的な顧客像を描いてください',
          '年齢層、職業、企業規模などを教えてください',
          '顧客が抱えている具体的な課題を教えてください'
        ],
        examples: [
          '30-50代の中小企業経営者',
          '売上管理に悩むEC事業者',
          '人事業務の効率化を求める企業'
        ]
      };
    }

    if (question.includes('競合') || question.includes('チャネル') || question.includes('ブランド')) {
      return {
        category: 'strategy',
        importance: 'medium',
        tips: [
          '直接・間接的な競合企業を教えてください',
          '現在使用している集客方法を教えてください',
          'ブランドの印象や目指したいイメージを教えてください'
        ],
        examples: [
          '競合：○○社、△△社など',
          'チャネル：SEO、広告、SNSなど',
          'ブランド：革新的、信頼性、親しみやすさなど'
        ]
      };
    }

    return {
      category: 'details',
      importance: 'low',
      tips: ['できるだけ具体的にお答えください'],
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
    <div className="space-y-4 max-h-64 overflow-y-auto">
      {conversationHistory.map((entry, index) => (
        <div
          key={index}
          className={`flex gap-3 ${
            entry.type === 'question' ? 'justify-start' : 'justify-end'
          }`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-lg ${
              entry.type === 'question'
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <MessageCircle className={`w-4 h-4 mt-1 ${
                entry.type === 'question' ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <div className="flex-1">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{entry.content}</p>
                <span className="text-xs text-gray-500 mt-1 block">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCollectedDataSummary = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">収集済み情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 必須情報 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">必須情報</h4>
            <div className="space-y-2">
              {[
                { key: 'serviceContent', label: 'サービス内容' },
                { key: 'targetCustomerPain', label: '顧客の悩み' },
                { key: 'desiredConversion', label: 'コンバージョン' },
                { key: 'budgetAndUrgency', label: '予算・緊急度' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${
                    collectedData.essentialInfo?.[item.key as keyof typeof collectedData.essentialInfo]
                      ? 'text-green-500'
                      : 'text-gray-300'
                  }`} />
                  <span className="text-sm text-gray-900">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 戦略情報 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">戦略情報</h4>
            <div className="space-y-2">
              {[
                { key: 'competitors', label: '競合分析' },
                { key: 'currentChannels', label: '集客チャネル' },
                { key: 'brandImage', label: 'ブランド' },
                { key: 'successMetrics', label: '成功指標' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${
                    collectedData.strategyInfo?.[item.key as keyof typeof collectedData.strategyInfo]
                      ? 'text-green-500'
                      : 'text-gray-300'
                  }`} />
                  <span className="text-sm text-gray-900">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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