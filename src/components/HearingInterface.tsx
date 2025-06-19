'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCircle, Clock, Target, Send } from 'lucide-react';

interface HearingData {
  必須情報?: {
    商材サービス内容?: string;
    独自価値UVP?: string;
    ターゲット顧客の悩み?: string;
    希望コンバージョン?: string;
    予算感覚と緊急度?: string;
  };
  戦略情報?: {
    競合他社?: string[];
    現在の集客チャネル?: string;
    ブランドイメージ?: string;
    成功指標?: string;
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

export const HearingInterface: React.FC<HearingInterfaceProps> = ({
  onResponse,
  onComplete,
  isProcessing = false,
  currentQuestion = '',
  completionRate = 0,
  collectedData = {}
}) => {
  console.log('🎤 HearingInterface rendered:', { isProcessing, currentQuestion, completionRate });
  
  const [currentStage, setCurrentStage] = useState<'initial' | 'progress' | 'complete'>('initial');
  const [userInput, setUserInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);

  // 初期質問を会話履歴に追加
  useEffect(() => {
    if (conversationHistory.length === 0) {
      const initialQuestion = currentQuestion || 'まず、あなたのサービスや商材について教えてください。どのような業界で、どんな課題を解決するものですか？';
      setConversationHistory([{
        type: 'question',
        content: initialQuestion,
        timestamp: new Date()
      }]);
      setCurrentStage('progress');
    }
  }, [currentQuestion, conversationHistory.length]);

  // 新しい質問が来た時に会話履歴に追加
  useEffect(() => {
    if (currentQuestion && conversationHistory.length > 0) {
      const lastEntry = conversationHistory[conversationHistory.length - 1];
      if (lastEntry.content !== currentQuestion) {
        setConversationHistory(prev => [
          ...prev,
          {
            type: 'question',
            content: currentQuestion,
            timestamp: new Date()
          }
        ]);
      }
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
              <span className="text-sm font-medium">全体進捗</span>
              <span className="text-sm text-gray-600">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">必須情報</span>
              <Badge variant={Object.keys(collectedData.必須情報 || {}).length > 2 ? 'default' : 'secondary'}>
                {Object.keys(collectedData.必須情報 || {}).length}/5
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">戦略情報</span>
              <Badge variant={Object.keys(collectedData.戦略情報 || {}).length > 1 ? 'default' : 'secondary'}>
                {Object.keys(collectedData.戦略情報 || {}).length}/4
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
        <CardTitle className="text-lg">収集済み情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 必須情報 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">必須情報</h4>
            <div className="space-y-2">
              {[
                { key: '商材サービス内容', label: 'サービス内容' },
                { key: 'ターゲット顧客の悩み', label: '顧客の悩み' },
                { key: '希望コンバージョン', label: 'コンバージョン' },
                { key: '予算感覚と緊急度', label: '予算・緊急度' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${
                    collectedData.必須情報?.[item.key as keyof typeof collectedData.必須情報]
                      ? 'text-green-500'
                      : 'text-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    collectedData.必須情報?.[item.key as keyof typeof collectedData.必須情報]
                      ? 'text-gray-900'
                      : 'text-gray-900'
                  }`}>
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
                { key: '競合他社', label: '競合分析' },
                { key: '現在の集客チャネル', label: '集客チャネル' },
                { key: 'ブランドイメージ', label: 'ブランド' },
                { key: '成功指標', label: '成功指標' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${
                    collectedData.戦略情報?.[item.key as keyof typeof collectedData.戦略情報]
                      ? 'text-green-500'
                      : 'text-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    collectedData.戦略情報?.[item.key as keyof typeof collectedData.戦略情報]
                      ? 'text-gray-900'
                      : 'text-gray-900'
                  }`}>
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
    <div className="max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="text-center mb-8">
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                対話
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
                        回答する
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
  );
};