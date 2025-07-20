'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle,
  Edit,
  Save,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Star,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { ConceptOverviewTab } from './ConceptOverviewTab';
import { ConceptPersonaTab } from './ConceptPersonaTab';
import { ConceptValuePropTab } from './ConceptValuePropTab';
import { ConceptDesignTab } from './ConceptDesignTab';

interface ValueProposition {
  headline: string;
  subheadline: string;
  keyBenefits: string[];
  proofPoints: string[];
  riskReversal?: string;
}

interface TargetPersona {
  name: string;
  demographics: string;
  painPoints: string[];
  goals: string[];
  behaviors: string[];
  preferredTone: string;
  decisionFactors?: string[];
}

interface DesignDirection {
  style: string;
  colorScheme: string[];
  typography: string;
  layoutApproach: string;
  visualElements?: string[];
}

interface ExpectedOutcome {
  metrics: Array<{
    name: string;
    description: string;
    target: string;
    timeframe: string;
  }>;
  businessImpact?: string;
  successIndicators?: string[];
}

interface Concept {
  id: string;
  title: string;
  overview: string;
  targetPersona: TargetPersona;
  valueProposition: ValueProposition;
  contentStrategy?: any;
  designDirection: DesignDirection;
  conversionStrategy?: any;
  uniqueElements?: string[];
  expectedOutcome: ExpectedOutcome;
  nextSteps?: string[];
}

interface ConceptReviewProps {
  concept: Concept;
  onApprove: (concept: Concept) => void;
  onEdit: (concept: Concept) => void;
  onSave: (concept: Concept) => void;
  onRequestRevision?: (feedback: string) => void;
  onGenerateAlternative?: () => void;
  isEditing?: boolean;
  isGenerating?: boolean;
}

interface ConceptFeedback {
  rating: number;
  category: 'content' | 'design' | 'strategy' | 'targeting';
  comment: string;
  suggestions?: string[];
}

export const ConceptReview: React.FC<ConceptReviewProps> = ({
  concept,
  onApprove,
  onEdit,
  onSave,
  onRequestRevision,
  onGenerateAlternative,
  isEditing = false,
  isGenerating = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editedConcept, setEditedConcept] = useState(concept);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [feedback, setFeedback] = useState<ConceptFeedback>({
    rating: 5,
    category: 'content',
    comment: '',
    suggestions: []
  });
  const [conceptScore, setConceptScore] = useState<number>(0);

  // 編集用ハンドラー
  const handleUpdateConcept = (updates: Partial<LPConcept>) => {
    setEditedConcept(prev => ({ ...prev, ...updates }));
  };

  // コンセプトスコア計算
  React.useEffect(() => {
    const calculateScore = () => {
      let score = 0;
      
      // 価値提案の完成度 (30%)
      if (editedConcept.valueProposition?.headline) score += 10;
      if (editedConcept.valueProposition?.keyBenefits?.length > 0) score += 10;
      if (editedConcept.valueProposition?.proofPoints?.length > 0) score += 10;
      
      // ターゲティングの明確性 (25%)
      if (editedConcept.targetPersona?.name) score += 8;
      if (editedConcept.targetPersona?.painPoints?.length > 0) score += 9;
      if (editedConcept.targetPersona?.goals?.length > 0) score += 8;
      
      // デザイン方向性 (20%)
      if (editedConcept.designDirection?.style) score += 7;
      if (editedConcept.designDirection?.colorScheme?.length > 0) score += 7;
      if (editedConcept.designDirection?.layoutApproach) score += 6;
      
      // 成果予測 (15%)
      if (editedConcept.expectedOutcome?.metrics?.length > 0) score += 15;
      
      // 実行可能性 (10%)
      if (editedConcept.nextSteps && editedConcept.nextSteps.length > 0) score += 10;
      
      setConceptScore(score);
    };
    
    calculateScore();
  }, [editedConcept]);

  // フィードバック送信
  const handleSubmitFeedback = () => {
    if (onRequestRevision && feedback.comment.trim()) {
      const feedbackText = `評価: ${feedback.rating}/5\nカテゴリ: ${feedback.category}\nコメント: ${feedback.comment}`;
      onRequestRevision(feedbackText);
      setShowFeedbackPanel(false);
    }
  };

  // フィードバックパネルのレンダリング
  const renderFeedbackPanel = () => (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <MessageSquare className="w-5 h-5" />
          フィードバックと改善要求
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-2">
              評価 (1-5)
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                  className={`p-1 ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-2">
              改善カテゴリ
            </label>
            <select
              value={feedback.category}
              onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full p-2 border border-orange-300 rounded-lg"
            >
              <option value="content">コンテンツ内容</option>
              <option value="design">デザイン方向性</option>
              <option value="strategy">戦略・アプローチ</option>
              <option value="targeting">ターゲティング</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-2">
              具体的な改善要求
            </label>
            <textarea
              value={feedback.comment}
              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="どの部分をどのように改善したいか具体的に教えてください..."
              className="w-full p-3 border border-orange-300 rounded-lg resize-none"
              rows={4}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitFeedback}
              disabled={!feedback.comment.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              改善要求を送信
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFeedbackPanel(false)}
            >
              キャンセル
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* コンセプトスコア */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              コンセプトスコア
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-900">{conceptScore}/100</span>
              <Badge variant="outline" className={`${
                conceptScore >= 80 ? 'bg-green-100 text-green-800' :
                conceptScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {conceptScore >= 80 ? '優秀' :
                 conceptScore >= 60 ? '良好' : '要改善'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="text-blue-700 font-medium">価値提案</div>
              <div className="text-blue-900 font-bold">30%</div>
            </div>
            <div className="text-center">
              <div className="text-blue-700 font-medium">ターゲティング</div>
              <div className="text-blue-900 font-bold">25%</div>
            </div>
            <div className="text-center">
              <div className="text-blue-700 font-medium">デザイン</div>
              <div className="text-blue-900 font-bold">20%</div>
            </div>
            <div className="text-center">
              <div className="text-blue-700 font-medium">成果予測</div>
              <div className="text-blue-900 font-bold">15%</div>
            </div>
            <div className="text-center">
              <div className="text-blue-700 font-medium">実行可能性</div>
              <div className="text-blue-900 font-bold">10%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* コンセプトタイトル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            コンセプトタイトル
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {editedConcept.title}
          </h2>
          <div className="prose prose-sm text-gray-600">
            {editedConcept.overview.split('\n').map((line, index) => (
              <p key={index} className="mb-2">{line}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 期待される成果 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            期待される成果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editedConcept.expectedOutcome?.metrics?.map((metric, index) => (
              <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <BarChart3 className="w-4 h-4 text-green-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">{metric.name}</h4>
                    <p className="text-green-700 text-sm mt-1">{metric.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-green-800 font-bold">{metric.target}</span>
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                        {metric.timeframe}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 次のステップ */}
      {editedConcept.nextSteps && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              次のステップ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {editedConcept.nextSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPersonaTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          ターゲットペルソナ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">基本情報</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ペルソナ名:</span>
                    <span className="font-medium">{editedConcept.targetPersona?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">属性:</span>
                    <span className="font-medium">{editedConcept.targetPersona?.demographics}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">好みのトーン:</span>
                    <Badge variant="secondary">{editedConcept.targetPersona?.preferredTone}</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">行動パターン</h3>
                <div className="space-y-2">
                  {editedConcept.targetPersona?.behaviors?.map((behavior, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">{behavior}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 課題と目標 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                主な課題
              </h3>
              <div className="space-y-2">
                {editedConcept.targetPersona?.painPoints?.map((pain, index) => (
                  <div key={index} className="p-2 bg-red-50 rounded border-l-4 border-red-500">
                    <span className="text-sm text-red-700">{pain}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                目標
              </h3>
              <div className="space-y-2">
                {editedConcept.targetPersona?.goals?.map((goal, index) => (
                  <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                    <span className="text-sm text-green-700">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 意思決定要因 */}
          {editedConcept.targetPersona?.decisionFactors && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">意思決定要因</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {editedConcept.targetPersona.decisionFactors.map((factor, index) => (
                  <Badge key={index} variant="outline" className="justify-center py-2">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderValuePropTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          価値提案
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* メインヘッドライン */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">メインヘッドライン</h3>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xl font-bold text-gray-900">
                {editedConcept.valueProposition?.headline}
              </p>
            </div>
          </div>
          
          {/* サブヘッドライン */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">サブヘッドライン</h3>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-700">
                {editedConcept.valueProposition?.subheadline}
              </p>
            </div>
          </div>
          
          {/* 主要メリット */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">主要メリット</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {editedConcept.valueProposition?.keyBenefits?.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-blue-900 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 実績・証拠 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">実績・証拠</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {editedConcept.valueProposition?.proofPoints?.map((proof, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded border border-green-200">
                  <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-green-900 text-sm">{proof}</span>
                </div>
              ))}
            </div>
          </div>

          {/* リスクリバーサル */}
          {editedConcept.valueProposition?.riskReversal && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">保証・リスク軽減</h3>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-purple-900 text-sm">
                  {editedConcept.valueProposition.riskReversal}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDesignTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-600" />
          デザイン方向性
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* スタイルとカラー */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">デザインスタイル</h3>
              <Badge variant="outline" className="text-sm py-2 px-4">
                {editedConcept.designDirection?.style}
              </Badge>
              
              <h3 className="font-medium text-gray-900 mb-3 mt-4">レイアウト</h3>
              <p className="text-sm text-gray-600">
                {editedConcept.designDirection?.layoutApproach}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">カラースキーム</h3>
              <div className="flex gap-2 mb-4">
                {editedConcept.designDirection?.colorScheme?.map((color, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              <h3 className="font-medium text-gray-900 mb-3">タイポグラフィ</h3>
              <Badge variant="outline" className="text-sm py-2 px-4">
                {editedConcept.designDirection?.typography}
              </Badge>
            </div>
          </div>
          
          {/* ビジュアル要素 */}
          {editedConcept.designDirection?.visualElements && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">ビジュアル要素</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {editedConcept.designDirection.visualElements.map((element, index) => (
                  <Badge key={index} variant="secondary" className="justify-center py-2">
                    {element}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          コンセプト確認
        </h1>
        <p className="text-gray-600">
          生成されたコンセプトをご確認ください。承認後、構成設計に進みます。
        </p>
      </div>

      {/* フィードバックパネル */}
      {showFeedbackPanel && renderFeedbackPanel()}

      {/* タブナビゲーション */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="persona">ペルソナ</TabsTrigger>
          <TabsTrigger value="value">価値提案</TabsTrigger>
          <TabsTrigger value="design">デザイン</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
        <TabsContent value="persona">{renderPersonaTab()}</TabsContent>
        <TabsContent value="value">{renderValuePropTab()}</TabsContent>
        <TabsContent value="design">{renderDesignTab()}</TabsContent>
      </Tabs>

      {/* アクションボタン */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowFeedbackPanel(!showFeedbackPanel)}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              改善要求
            </Button>
            {onGenerateAlternative && (
              <Button 
                variant="outline"
                onClick={onGenerateAlternative}
                disabled={isGenerating}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    別案生成
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onSave(editedConcept)}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
            <Button variant="outline" onClick={() => onEdit(editedConcept)}>
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
            <Button 
              onClick={() => onApprove(editedConcept)} 
              className="bg-green-600 hover:bg-green-700"
              disabled={conceptScore < 60}
            >
              {conceptScore < 60 ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  スコア要改善
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  承認して次へ
                </>
              )}
            </Button>
          </div>
        </div>
        
        {conceptScore < 60 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                コンセプトスコアが60未満です。改善要求またはフィードバックを送信してください。
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};