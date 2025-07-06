'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';



interface WorkflowWizardProps {
  onStartWorkflow: (input: WorkflowInput) => void;
  onResumeWorkflow: (runId: string, feedback: { approved: boolean; feedback?: string }) => void;
  workflowState?: {
    runId: string;
    status: string;
    currentStep: string;
    output?: any;
    needsUserInput?: boolean;
    confirmationRequest?: string;
    progress?: {
      percentage: number;
      step: number;
      totalSteps: number;
      stepName: string;
    };
  };
}

interface WorkflowInput {
  initialQuery: string;
  businessType?: string;
  targetAudience?: string;
  goals?: string;
}

export function WorkflowWizard({ onStartWorkflow, onResumeWorkflow, workflowState }: WorkflowWizardProps) {
  const [formData, setFormData] = useState<WorkflowInput>({
    initialQuery: '',
    businessType: '',
    targetAudience: '',
    goals: '',
  });
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: keyof WorkflowInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleStartWorkflow = useCallback(async () => {
    if (!formData.initialQuery.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onStartWorkflow(formData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onStartWorkflow]);

  const handleApprove = useCallback(async () => {
    if (!workflowState?.runId) return;
    
    setIsSubmitting(true);
    try {
      await onResumeWorkflow(workflowState.runId, { approved: true });
    } finally {
      setIsSubmitting(false);
    }
  }, [workflowState?.runId, onResumeWorkflow]);

  const handleRequestChanges = useCallback(async () => {
    if (!workflowState?.runId || !feedback.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onResumeWorkflow(workflowState.runId, { 
        approved: false, 
        feedback: feedback.trim() 
      });
      setFeedback('');
    } finally {
      setIsSubmitting(false);
    }
  }, [workflowState?.runId, feedback, onResumeWorkflow]);

  // ワークフローが開始されていない場合の初期フォーム
  if (!workflowState) {
    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              プロフェッショナルHP作成ワークフロー
            </h2>
            <p className="text-gray-600">
              マーケティング心理学と最新Web技術を活用した高品質なランディングページを作成します
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="initialQuery" className="text-gray-900 font-medium">
                作成したいランディングページについて教えてください *
              </Label>
              <Textarea
                id="initialQuery"
                placeholder="例：ECサイト向けのコンバージョン率の高いランディングページを作りたい。ターゲットは30-40代の女性で、化粧品を販売している。"
                value={formData.initialQuery}
                onChange={(e) => handleInputChange('initialQuery', e.target.value)}
                className="mt-2 text-gray-900 placeholder:text-gray-500 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessType" className="text-gray-900 font-medium">
                  ビジネスタイプ
                </Label>
                <Input
                  id="businessType"
                  placeholder="例：ECサイト、SaaS、コンサルティング"
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="mt-2 text-gray-900 placeholder:text-gray-500 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="targetAudience" className="text-gray-900 font-medium">
                  ターゲットオーディエンス
                </Label>
                <Input
                  id="targetAudience"
                  placeholder="例：30-40代の働く女性"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="mt-2 text-gray-900 placeholder:text-gray-500 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="goals" className="text-gray-900 font-medium">
                ビジネス目標
              </Label>
              <Input
                id="goals"
                placeholder="例：月間コンバージョン率を3%向上、売上20%増加"
                value={formData.goals}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                className="mt-2 text-gray-900 placeholder:text-gray-500 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <Button 
            onClick={handleStartWorkflow}
            disabled={!formData.initialQuery.trim() || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isSubmitting ? 'ワークフロー開始中...' : 'プロフェッショナルHP作成を開始'}
          </Button>
        </div>
      </Card>
    );
  }

  // ワークフロー進行中の表示
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 進捗表示 */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              プロフェッショナルHP作成ワークフロー
            </h2>
            <Badge variant={workflowState.status === 'completed' ? 'default' : 'secondary'}>
              {workflowState.status === 'completed' ? '完了' : 
               workflowState.status === 'suspended' ? '確認待ち' : '実行中'}
            </Badge>
          </div>

          {workflowState.progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>ステップ {workflowState.progress.step} / {workflowState.progress.totalSteps}</span>
                <span>{workflowState.progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${workflowState.progress.percentage}%` }}
                />
              </div>
              <p className="text-sm font-medium text-gray-900">
                現在のステップ: {workflowState.progress.stepName}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ユーザー確認が必要な場合 */}
      {workflowState.needsUserInput && workflowState.confirmationRequest && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              <h3 className="text-lg font-semibold text-gray-900">確認が必要です</h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-800">
                  {workflowState.confirmationRequest}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex space-x-3">
                <Button 
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? '処理中...' : 'OK - 次のステップに進む'}
                </Button>
                
                <Button 
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => {
                    // 修正要求用のフォームを展開
                    const feedbackForm = document.getElementById('feedback-form');
                    if (feedbackForm) {
                      feedbackForm.style.display = feedbackForm.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                >
                  修正を要求
                </Button>
              </div>

              <div id="feedback-form" style={{ display: 'none' }} className="space-y-3">
                <Label htmlFor="feedback" className="text-gray-900 font-medium">
                  修正内容を詳しく説明してください
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="どのような修正が必要か具体的に説明してください..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="text-gray-900 placeholder:text-gray-500 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
                <Button 
                  onClick={handleRequestChanges}
                  disabled={!feedback.trim() || isSubmitting}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isSubmitting ? '修正要求中...' : '修正を要求して再実行'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ワークフロー完了時の表示 */}
      {workflowState.status === 'completed' && workflowState.output && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <h3 className="text-lg font-semibold text-gray-900">ワークフロー完了</h3>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">プロフェッショナルHPが完成しました！</h4>
              <p className="text-green-800 text-sm">
                高品質なHTML、CSS、JavaScriptファイルと画像生成プロンプトが生成されました。
                品質チェックも完了しています。
              </p>
            </div>

            {workflowState.output.downloadUrl && (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.open(workflowState.output.downloadUrl, '_blank')}
              >
                プロジェクトファイルをダウンロード
              </Button>
            )}

            {workflowState.output.qualityReport && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {workflowState.output.qualityReport.lighthouse.performance}
                  </div>
                  <div className="text-sm text-gray-600">パフォーマンス</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {workflowState.output.qualityReport.lighthouse.accessibility}
                  </div>
                  <div className="text-sm text-gray-600">アクセシビリティ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {workflowState.output.qualityReport.lighthouse.seo}
                  </div>
                  <div className="text-sm text-gray-600">SEO</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {workflowState.output.qualityReport.overallScore}
                  </div>
                  <div className="text-sm text-gray-600">総合スコア</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 現在のステップ出力（デバッグ用） */}
      {process.env.NODE_ENV === 'development' && workflowState.output && (
        <Card className="p-6">
          <details className="space-y-2">
            <summary className="cursor-pointer text-sm font-medium text-gray-600">
              デバッグ情報 (開発環境のみ)
            </summary>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(workflowState.output, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}