'use client';

import React, { useState } from 'react';
// import { WorkflowWizard } from './WorkflowWizard';
// import { useProHPWorkflow } from '../hooks/useProHPWorkflow';
import { Card } from './ui/card';
import { Button } from './ui/button';
// import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function ProHPWorkflowPanel() {
  const [activeTab, setActiveTab] = useState('wizard');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LP Creator - プロフェッショナルHP作成
          </h1>
          <p className="text-gray-600 mb-6">
            マーケティング心理学と最新Web技術を活用した高品質なランディングページ作成ツール
          </p>
          
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="wizard">ワークフロー</TabsTrigger>
            <TabsTrigger value="about">機能説明</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="wizard" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  プロフェッショナルHP作成ワークフロー
                </h2>
                <p className="text-gray-600">
                  マーケティング心理学と最新Web技術を活用した高品質なランディングページを作成します
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 mb-4">
                  🚧 <strong>開発中</strong>: プロフェッショナルワークフロー機能は現在実装中です。
                </p>
                <p className="text-blue-700 text-sm">
                  完成予定機能: 戦略設計 → コンセプト設計 → コピーライティング → 実装 → 品質チェック
                </p>
              </div>

              <Button 
                disabled
                className="w-full bg-gray-400 cursor-not-allowed"
                size="lg"
              >
                プロフェッショナルHP作成を開始 (開発中)
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* プロフェッショナルワークフローの特徴 */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🎯 プロフェッショナルワークフローの特徴
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>段階確認付き</strong>: 各ステップでユーザーが内容を確認・修正可能</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>マーケティング心理学</strong>: PASONA法則、4U原則などの実証済み手法</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>最新Web技術</strong>: SEO最適化、アクセシビリティ、Core Web Vitals対応</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>分離ファイル</strong>: HTML、CSS、JavaScriptを最適化して分離</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>品質保証</strong>: Lighthouse評価、WCAG準拠チェック</span>
                </li>
              </ul>
            </Card>

            {/* ワークフロー手順 */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                📋 ワークフロー手順
              </h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  <span><strong>戦略設計</strong>: ビジネス理解、ペルソナ分析、競合調査</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  <span><strong>コンセプト設計</strong>: サイトマップ、ワイヤーフレーム作成</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  <span><strong>コピーライティング</strong>: 心理学ベースの説得力のあるコピー</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                  <span><strong>実装</strong>: HTML/CSS/JavaScript並列生成</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
                  <span><strong>アセット</strong>: 画像生成プロンプト作成</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</span>
                  <span><strong>品質チェック</strong>: 包括的な品質評価</span>
                </li>
              </ol>
            </Card>

            {/* 技術仕様 */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ⚙️ 技術仕様
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">HTML</h4>
                  <p className="text-sm text-gray-600">セマンティックHTML5、構造化データ、アクセシビリティ対応</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">CSS</h4>
                  <p className="text-sm text-gray-600">CSS Grid/Flexbox、レスポンシブ、CSS変数、モダンCSS</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">JavaScript</h4>
                  <p className="text-sm text-gray-600">ES6+、非同期処理、パフォーマンス最適化、アナリティクス</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">画像</h4>
                  <p className="text-sm text-gray-600">WebP対応、遅延読み込み、詳細な生成プロンプト</p>
                </div>
              </div>
            </Card>

            {/* 品質保証 */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ✅ 品質保証
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Lighthouse パフォーマンススコア 90+</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>WCAG 2.1 AA準拠のアクセシビリティ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Core Web Vitals最適化</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>SEO技術仕様完全対応</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>モバイルファースト設計</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>セキュリティベストプラクティス</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🚀 今すぐ始める
              </h3>
              <p className="text-blue-800 mb-4">
                プロフェッショナルレベルのランディングページを作成しましょう
              </p>
              <Button 
                onClick={() => setActiveTab('wizard')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                ワークフローを開始
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}