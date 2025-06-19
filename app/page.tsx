'use client';

import { useChat } from '@ai-sdk/react';
import type { Message } from 'ai';
import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useEditMode } from './contexts/EditModeContext';
import { LPTool } from './components/LPTool';
import { LPViewer } from './components/LPViewer';
import { EditModal } from './components/EditModal';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { ProHPWorkflowPanel } from './components/ProHPWorkflowPanel';
import { VariantSelector } from '@/components/VariantSelector';
import { AISuggestionPanel, AISuggestionGenerator } from '@/components/AISuggestionPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

// --- Prop Types ---
interface InitialViewProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

interface MainViewProps {
  messages: Message[]; // Using Message type from ai package
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  selectedElementId: string | null;
  selectElement: (id: string | null) => void;
  getPlaceholder: () => string;
  sendPrompt: (prompt: string) => void;
  isLoading?: boolean;
  status?: string;
  error?: Error | undefined; // エラーオブジェクトを追加
}

// --- Standalone Components ---

const InitialView = ({ input, handleInputChange, handleSubmit }: InitialViewProps) => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-50">
    <div className="w-full max-w-2xl p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">今日は何をデザインしますか？</h1>
            <p className="text-lg text-gray-800 mb-8">作成したいページについて、スタイル、機能、目的などを詳しく教えてください。</p>
      <form onSubmit={handleSubmit} className="w-full flex">
        <input
          className="flex-grow p-4 border border-gray-300 rounded-l-lg text-black text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
          placeholder="例：AI写真編集アプリのランディングページ..."
          value={input}
          onChange={handleInputChange}
          autoFocus
        />
        <button
          type="submit"
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-r-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-400"
          disabled={!input.trim()}
        >
          生成
        </button>
      </form>
    </div>
  </div>
);

// LP Tool 状態管理
interface LPToolState {
  isActive: boolean;
  htmlContent: string;
  cssContent: string;
  title: string;
  forcePanelOpen?: boolean;
}

const MainView = ({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isEditMode,
  toggleEditMode,
  selectedElementId,
  selectElement,
  getPlaceholder,
  sendPrompt,
  isLoading: propsIsLoading,
  status,
  error,
}: MainViewProps) => {
  const [lpToolState, setLpToolState] = useState<LPToolState>({
    isActive: false,
    htmlContent: '',
    cssContent: '',
    title: '生成されたランディングページ',
    forcePanelOpen: false
  });

  // 編集機能の状態管理
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 新機能の状態管理
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // 選択された要素からテキストを抽出
  const extractTextFromElement = (elementId: string): string => {
    if (!lpToolState.htmlContent) return '';

    try {
      // DOMParserを使ってHTMLを解析
      const parser = new DOMParser();
      const doc = parser.parseFromString(lpToolState.htmlContent, 'text/html');
      
      // data-editable-id属性で要素を検索
      const element = doc.querySelector(`[data-editable-id="${elementId}"]`);
      
      if (element) {
        // 要素内のテキストコンテンツを取得
        return element.textContent?.trim() || '';
      }
    } catch (error) {
      console.error('Error extracting text from element:', error);
    }
    
    return '';
  };

  // 要素が選択された時にモーダルを開く
  useEffect(() => {
    if (selectedElementId && isEditMode) {
      const text = extractTextFromElement(selectedElementId);
      setEditingText(text);
      setIsEditModalOpen(true);
    } else {
      setIsEditModalOpen(false);
    }
  }, [selectedElementId, isEditMode, lpToolState.htmlContent]);

  // 編集モーダルを閉じる
  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    selectElement(null);
  };

  // テキスト更新処理（AI連携）
  const handleTextUpdate = async (newText: string) => {
    if (!selectedElementId) return;

    setIsUpdating(true);
    try {
      console.log('🔄 Updating element via AI:', selectedElementId, 'with text:', newText);
      
      // AI経由で更新を実行
      const updatePrompt = `要素「${selectedElementId}」のテキストを「${newText}」に更新してください。`;
      
      // チャット経由でAIに更新を依頼
      sendPrompt(updatePrompt);
      
      handleEditModalClose();
    } catch (error) {
      console.error('Error updating text via AI:', error);
      
      // フォールバック: 直接HTML更新
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(lpToolState.htmlContent, 'text/html');
        const element = doc.querySelector(`[data-editable-id="${selectedElementId}"]`);
        
        if (element) {
          element.textContent = newText;
          const updatedHTML = doc.body?.innerHTML || doc.documentElement.outerHTML;
          
          setLpToolState(prev => ({
            ...prev,
            htmlContent: updatedHTML
          }));
        }
        
        handleEditModalClose();
      } catch (fallbackError) {
        console.error('Fallback update also failed:', fallbackError);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // 新機能のハンドラー関数
  const handleSelectVariant = (variant: any) => {
    setSelectedVariant(variant);
    setLpToolState(prev => ({
      ...prev,
      htmlContent: variant.htmlContent,
      cssContent: variant.cssContent,
      title: variant.title
    }));
    setShowVariantSelector(false);
  };

  const handleApplyAISuggestion = async (suggestion: any) => {
    // AI提案の適用ロジック
    console.log('Applying AI suggestion:', suggestion);
    
    // 簡単な実装例（実際にはより複雑な処理が必要）
    if (suggestion.action.type === 'replace' && lpToolState.htmlContent) {
      const updatedContent = lpToolState.htmlContent.replace(
        suggestion.action.target,
        suggestion.action.value
      );
      
      setLpToolState(prev => ({
        ...prev,
        htmlContent: updatedContent
      }));
    }
  };

  const generateAISuggestions = () => {
    if (lpToolState.htmlContent) {
      const suggestions = AISuggestionGenerator.analyzeContent(
        lpToolState.htmlContent, 
        lpToolState.cssContent
      );
      setAiSuggestions(suggestions);
      setShowAISuggestions(true);
    }
  };

  // LPツール検出とコンテンツ抽出
  useEffect(() => {
    console.log('[LP Detection] Messages array:', messages);
    console.log('[LP Detection] Messages length:', messages.length);
    
    if (messages.length === 0) {
      setLpToolState({
        isActive: false,
        htmlContent: '',
        cssContent: '',
        title: '生成されたランディングページ',
        forcePanelOpen: false
      });
      return;
    }

    // メッセージからLP生成結果を検出（ツール結果を含む）
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    // すべてのassistantメッセージの構造をログ出力
    assistantMessages.forEach((msg, index) => {
      console.log(`[LP Detection] Assistant message ${index}:`, {
        role: msg.role,
        contentType: typeof msg.content,
        contentSnippet: typeof msg.content === 'string' ? msg.content.substring(0, 200) + '...' : msg.content,
        hasParts: !!msg.parts,
        partsCount: msg.parts?.length || 0,
        parts: msg.parts
      });
    });

    // ツール結果からLP生成結果を検出
    let htmlContent = '';
    let cssContent = '';
    let title = 'ランディングページ';
    let foundLPResult = false;

    // 最新のassistantメッセージから逆順で検索
    for (let i = assistantMessages.length - 1; i >= 0; i--) {
      const message = assistantMessages[i];
      
      if (message.parts && message.parts.length > 0) {
        for (const part of message.parts) {
          if (part.type === 'tool-invocation') {
            const toolInvocation = part.toolInvocation;
            console.log('[LP Detection] Tool invocation part:', {
              toolName: toolInvocation.toolName,
              state: toolInvocation.state,
              // fullObject: toolInvocation // デバッグ用に残しても良い
            });
            
            // ツール実行結果があり、かつそれが成功(result)している場合
            if (toolInvocation.state === 'result' && toolInvocation.result) {
              const result = toolInvocation.result as any; // 適切な型にキャストすることが望ましい
              
              // LP生成関連ツールの結果かどうかを確認
              if (toolInvocation.toolName === 'enhancedLPGeneratorTool' || 
                  toolInvocation.toolName === 'htmlLPTool' ||
                  toolInvocation.toolName === 'lpPreviewTool' ||
                  toolInvocation.toolName === 'intelligentLPGeneratorTool') {
                
                // インテリジェントLPジェネレーターの場合、バリエーションを処理
                if (toolInvocation.toolName === 'intelligentLPGeneratorTool' && result && result.variants) {
                  setVariants(result.variants);
                  setShowVariantSelector(true);
                  
                  // 推奨バリエーションを自動選択
                  const recommendedVariant = result.variants[result.recommendedVariant || 0];
                  if (recommendedVariant) {
                    htmlContent = recommendedVariant.htmlContent;
                    cssContent = recommendedVariant.cssContent || '';
                    title = recommendedVariant.title || 'Generated Landing Page';
                    setSelectedVariant(recommendedVariant);
                  }
                  foundLPResult = true;
                  console.log(`[LP Detection] Found variants in intelligentLPGeneratorTool, count: ${result.variants.length}`);
                  break;
                }
                
                // HTMLコンテンツが存在する場合
                if (result && result.htmlContent) {
                  htmlContent = result.htmlContent;
                  cssContent = result.cssContent || ''; // cssContentも取得 (存在しない場合は空文字)
                  title = result.title || 'Generated Landing Page'; // titleも取得 (存在しない場合はデフォルト値)
                  foundLPResult = true;
                  console.log(`[LP Detection] Found HTML in ${toolInvocation.toolName} result, length: ${htmlContent.length}`);
                  break; // LP関連ツールの結果が見つかったら内部ループを抜ける
                }
              }
            }
          }
        }
        if (foundLPResult) break; // LP関連ツールの結果が見つかったら外部ループも抜ける
      }
      
      // フォールバック: message.content からのHTML検索 (tool-invocation がない場合や result がない場合)
      // このロジックは、toolInvocation.result が優先されるため、基本的には不要になるか、限定的な状況でのみ動作する
      if (!foundLPResult && message.content && typeof message.content === 'string') {
        const content = message.content;
        const fullHtmlMatch = content.match(/<!DOCTYPE html>[\s\S]*?<\/html>/);
        if (fullHtmlMatch) {
          htmlContent = fullHtmlMatch[0];
          const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
          if (titleMatch) {
            title = titleMatch[1];
          }
          foundLPResult = true;
          console.log('[LP Detection] Found HTML in message content (fallback)');
          break; 
        }
        
        const sectionMatches = content.match(/<section[\s\S]*?<\/section>/g);
        if (sectionMatches && sectionMatches.length > 0) {
          htmlContent = sectionMatches.join('\n\n');
          foundLPResult = true;
          console.log('[LP Detection] Found sections in message content (fallback)');
          break;
        }
      }
    }

    // LP結果が見つかった場合は状態を更新
    if (foundLPResult && htmlContent) {
      console.log('[LP Detection] Setting LP tool state with HTML content');
      console.log('[LP Detection] HTML content length:', htmlContent.length);
      console.log('[LP Detection] Title:', title);
      setLpToolState({
        isActive: true,
        htmlContent: htmlContent,
        cssContent: cssContent,
        title: title,
        forcePanelOpen: true
      });

      // AI提案を自動生成
      setTimeout(() => {
        const suggestions = AISuggestionGenerator.analyzeContent(htmlContent, cssContent);
        if (suggestions.length > 0) {
          setAiSuggestions(suggestions);
          setShowAISuggestions(true);
        }
      }, 1000); // 1秒後に提案を表示
    } else {
      console.log('[LP Detection] No LP result found, keeping current state');
      console.log('[LP Detection] foundLPResult:', foundLPResult);
      console.log('[LP Detection] htmlContent length:', htmlContent?.length || 0);
    }
  }, [messages]);

  // プレビュー判定はもう使用しない（レガシーコードを削除）

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左側: チャットエリア */}
      <main className="w-1/2 flex flex-col overflow-hidden bg-white border-r border-gray-200">
        {/* LPツールがアクティブで、HTMLコンテンツがない場合のみ表示 */}
        {lpToolState.isActive && !lpToolState.htmlContent && (
          <LPTool 
            htmlContent={lpToolState.htmlContent}
            cssContent={lpToolState.cssContent}
            title={lpToolState.title}
            autoOpenPreview={false}
            forcePanelOpen={false}
            onCreateLP={() => {
              // LP編集機能を開く
              console.log("Edit LP clicked");
            }}
          />
        )}

        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">LPクリエーター</h1>
            <button
              onClick={() => {
                toggleEditMode();
                selectElement(null);
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold text-white transition-colors ${
                isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              {isEditMode ? '編集モード: ON' : '編集モード: OFF'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ローディング表示とエラー表示 */} 
          {propsIsLoading && (
            <div className="flex items-center justify-center p-4 my-2 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-blue-700">
                {status || 'AIがコンテンツを生成中です...'}
              </p>
            </div>
          )}
          {error && (
            <div className="p-4 my-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                エラーが発生しました: {error.message || '不明なエラーです。もう一度お試しください。'}
              </p>
            </div>
          )}
          {messages.map((message) => {
            // 構造提案メッセージかどうかを判定
            const isStructureProposal = message.role === 'assistant' && 
              typeof message.content === 'string' && 
              (message.content.includes('lpStructureTool') || 
               message.content.includes('構造を提案させていただきます') ||
               message.content.includes('**全体的なデザインコンセプト**'));

            return (
              <div key={message.id} className="mb-4">
                <div className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-50 border border-blue-200 ml-8' 
                    : 'bg-gray-50 border border-gray-200 mr-8'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      message.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      {message.role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900">
                        {typeof message.content === 'string' ? (
                          <MarkdownRenderer content={message.content} />
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {JSON.stringify(message.content)}
                          </div>
                        )}
                      </div>
                      
                      {/* 構造提案の場合、確認ボタンを表示 */}
                      {isStructureProposal && (
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => {
                              // 構造を編集する機能（今回は簡単に実装）
                              console.log('Edit structure clicked');
                            }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={async () => {
                              console.log('Create LP clicked');
                              const prompt = 'この構造でランディングページを作成してください';
                              sendPrompt(prompt);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            作成開始
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* ローディング状態表示 */}
          {propsIsLoading && (
            <div className="mb-4 mr-8">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    AI
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-sm text-blue-800 font-medium">
                        {status === 'submitted' && 'リクエストを処理しています...'}
                        {status === 'streaming' && 'AIが作成中です...'}
                        {(!status || status === 'loading') && 'ランディングページを生成中...'}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600">
                      <div className="mb-1">🔍 戦略とコンセプトを分析中</div>
                      <div className="mb-1">✏️ コピーとUXを設計中</div>
                      <div className="mb-1">🛠️ HTML/CSS/JSを生成中</div>
                      <div className="text-blue-500">💡 高品質なLP作成まで少々お待ちください</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-3">
            {selectedElementId && isEditMode && (
              <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg text-sm text-blue-800 flex justify-between items-center">
                <span>編集中: <strong className="font-mono">{selectedElementId}</strong></span>
                <button type="button" onClick={() => selectElement(null)} className="font-bold text-xl text-blue-600 hover:text-blue-800">&times;</button>
              </div>
            )}
            <input
              className="w-full p-3 border border-gray-300 rounded-l-lg text-lg text-black focus:ring-2 focus:ring-blue-500 outline-none transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={propsIsLoading ? 'AIが応答中です...' : getPlaceholder()}
              value={input}
              onChange={handleInputChange}
              disabled={isEditMode || propsIsLoading} // propsIsLoading時も無効化
            />
            <button
              type="submit"
              className="px-6 py-4 bg-blue-600 text-white font-semibold rounded-r-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ minWidth: '100px' }} // ボタン幅を確保
              disabled={!input.trim() || isEditMode || propsIsLoading} // propsIsLoading時も無効化
            >
              {propsIsLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                '送信'
              )}
            </button>
            {/* デバッグ情報 */}
            <div className="text-xs text-gray-500 mt-1">
              Debug: EditMode={isEditMode ? 'ON' : 'OFF'}, SelectedElement={selectedElementId || 'none'}, Disabled={isEditMode && !selectedElementId ? 'YES' : 'NO'}
            </div>
          </form>
        </div>
      </main>
      
      {/* 右側: LPプレビューエリア */}
      <div className="w-1/2 flex flex-col bg-white">
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">プレビュー</h2>
            {lpToolState.isActive && lpToolState.htmlContent && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([lpToolState.htmlContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${lpToolState.title.replace(/[^a-z0-9]/gi, '_')}.html`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  HTMLダウンロード
                </button>

                {/* バリエーション表示ボタン */}
                {variants.length > 0 && (
                  <button
                    onClick={() => setShowVariantSelector(true)}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                  >
                    バリエーション ({variants.length})
                  </button>
                )}

                {/* AI提案表示ボタン */}
                <button
                  onClick={generateAISuggestions}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  AI改善提案
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {lpToolState.isActive && lpToolState.htmlContent ? (
            <div className="h-full overflow-y-auto">
              <LPViewer 
                htmlContent={lpToolState.htmlContent} 
                cssContent={lpToolState.cssContent}
                onTextUpdate={handleTextUpdate}
                onAIImprove={(elementId, currentText) => {
                  const prompt = `要素「${elementId}」のテキスト「${currentText}」をAIで改善してください。`;
                  sendPrompt(prompt);
                }}
                isModalOpen={isEditModalOpen}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">プレビューエリア</p>
                <p className="text-sm">LPを生成すると、こちらに表示されます</p>
                <div className="mt-4 text-xs text-gray-400">
                  <div>• フルスクリーン表示対応</div>
                  <div>• HTML/PDF出力機能</div>
                  <div>• リアルタイムプレビュー</div>
                </div>
                {/* デバッグ情報 */}
                <div className="mt-4 text-xs text-red-500">
                  <div>Debug: lpToolState.isActive = {lpToolState.isActive.toString()}</div>
                  <div>Debug: htmlContent length = {lpToolState.htmlContent?.length || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 編集モーダル */}
      <EditModal
        isOpen={isEditModalOpen}
        elementId={selectedElementId}
        currentText={editingText}
        onSave={handleTextUpdate}
        onClose={handleEditModalClose}
        isLoading={isUpdating}
      />

      {/* バリエーションセレクター */}
      {showVariantSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <VariantSelector
            variants={variants}
            selectedVariantId={selectedVariant?.id}
            onSelectVariant={handleSelectVariant}
          />
          <button
            onClick={() => setShowVariantSelector(false)}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* AI提案パネル */}
      <AISuggestionPanel
        suggestions={aiSuggestions}
        onApplySuggestion={handleApplyAISuggestion}
        onDismissSuggestion={(id) => setAiSuggestions(prev => prev.filter(s => s.id !== id))}
        isVisible={showAISuggestions}
        onClose={() => setShowAISuggestions(false)}
      />
    </div>
  );
};

// --- Main Page Component ---

export default function Page() {
  const { isEditMode, toggleEditMode, selectedElementId, selectElement } = useEditMode();
  const [activeTab, setActiveTab] = useState('quick');

  // 新しいMastraベースのチャットシステムを使用
  const { 
    messages, 
    input, 
    handleInputChange: originalHandleInputChange, 
    handleSubmit: originalHandleSubmit, 
    isLoading, 
    error,
    setInput,
    status,
  } = useChat({
    api: '/api/lp-creator/chat', // 新しいMastraベースのAPI
    onFinish: (message) => {
      console.log('[Page] LP Creation completed:', message);
    },
    onResponse: (response) => {
      console.log('[Page] Response status:', response.status);
    },
    onError: (error) => {
      console.error('[Page] LP Creation error:', error);
    }
  });

  // メッセージが存在すればMainViewを表示
  const showMainView = messages.length > 0;
  
  // デバッグ: メッセージの状態をログ出力
  console.log('[Page] Messages length:', messages.length);
  console.log('[Page] Messages:', messages);
  console.log('[Page] Show main view:', showMainView);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    console.log('[Page] Submitting message via sendPrompt:', input);
    console.log('[Page] Messages before submit:', messages.length);
    
    // sendPrompt ensures setInput is committed before triggering originalHandleSubmit
    sendPrompt(input);
  };

  const handleInputChange = originalHandleInputChange;

  const getPlaceholder = () => {
    if (!isEditMode) {
        return '新しいLPのテーマを入力...';
    }
    if (selectedElementId) {
        return `${selectedElementId} への変更内容を記述...`;
    }
    return '編集する要素を選択してください...';
  }

  // 任意のプロンプトを即座に送信するユーティリティ
  const sendPrompt = (prompt: string) => {
    // flushSync で setInput を同期的に反映させてから submit を実行する
    flushSync(() => {
      setInput(prompt);
    });
    const fakeEvt = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;
    originalHandleSubmit(fakeEvt);
  };

  return (
    <div className="h-screen bg-gray-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        {/* タブヘッダー */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">LP Creator</h1>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="quick">クイック作成</TabsTrigger>
              <TabsTrigger value="professional">プロフェッショナル</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="quick" className="h-full m-0">
            <div className="h-full">
              {showMainView ? (
                <MainView 
                  messages={messages}
                  input={input}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  isEditMode={isEditMode}
                  toggleEditMode={toggleEditMode}
                  selectedElementId={selectedElementId}
                  selectElement={selectElement}
                  getPlaceholder={getPlaceholder}
                  sendPrompt={sendPrompt}
                  isLoading={isLoading}
                  status={status}
                  error={error}
                />
              ) : (
                <InitialView 
                  input={input}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="professional" className="h-full m-0">
            <div className="h-full overflow-auto bg-gray-50">
              <ProHPWorkflowPanel />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
