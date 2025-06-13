'use client';

import { useChat } from '@ai-sdk/react';
import React, { useState, FormEvent, ChangeEvent, useMemo, useEffect } from 'react';
import { useEditMode } from './contexts/EditModeContext';
import type { Message } from 'ai';
import { LPTool } from './components/LPTool';
import { LPViewer } from './components/LPViewer';
import { EditModal } from './components/EditModal';
import { MarkdownRenderer } from './components/MarkdownRenderer';

// --- Prop Types ---
interface InitialViewProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

interface MainViewProps {
  messages: any[]; // Consider a more specific type if available from useUIState
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  selectedElementId: string | null;
  selectElement: (id: string | null) => void;
  getPlaceholder: () => string;
  setInput: (value: string) => void;
  sendPrompt: (prompt: string) => void;
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
  setInput,
  sendPrompt,
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
      await sendPrompt(updatePrompt);
      
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
        hasToolCalls: !!msg.toolInvocations,
        toolCallsCount: msg.toolInvocations?.length || 0,
        toolInvocations: msg.toolInvocations
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
      
      // ツール結果を確認
      if (message.toolInvocations && message.toolInvocations.length > 0) {
        for (const toolInvocation of message.toolInvocations) {
          console.log('[LP Detection] Tool invocation:', {
            toolName: toolInvocation.toolName,
            state: toolInvocation.state,
            hasResult: !!toolInvocation.result
          });
          
          // enhancedLPGeneratorToolまたはhtmlLPToolの結果を検索
          if ((toolInvocation.toolName === 'enhancedLPGeneratorTool' || 
               toolInvocation.toolName === 'htmlLPTool') && 
              toolInvocation.state === 'result' && 
              toolInvocation.result) {
            
            console.log('[LP Detection] Found LP tool result:', toolInvocation.result);
            
            // enhancedLPGeneratorToolの結果からHTMLとCSSを抽出
            if (toolInvocation.result.htmlContent) {
              htmlContent = toolInvocation.result.htmlContent;
              cssContent = toolInvocation.result.cssContent || '';
              title = toolInvocation.result.title || title;
              foundLPResult = true;
              console.log('[LP Detection] Extracted HTML content length:', htmlContent.length);
              console.log('[LP Detection] Extracted CSS content length:', cssContent.length);
              break;
            }
          }
        }
        
        if (foundLPResult) break;
      }
      
      // フォールバック: メッセージコンテンツからHTMLを検索
      if (!foundLPResult && message.content && typeof message.content === 'string') {
        const content = message.content;
        
        // 完全なHTMLドキュメントを検索
        const fullHtmlMatch = content.match(/<!DOCTYPE html>[\s\S]*?<\/html>/);
        if (fullHtmlMatch) {
          htmlContent = fullHtmlMatch[0];
          const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
          if (titleMatch) {
            title = titleMatch[1];
          }
          foundLPResult = true;
          console.log('[LP Detection] Found HTML in message content');
          break;
        }
        
        // セクション単位のHTMLを検索
        const sectionMatches = content.match(/<section[\s\S]*?<\/section>/g);
        if (sectionMatches && sectionMatches.length > 0) {
          htmlContent = sectionMatches.join('\n\n');
          foundLPResult = true;
          console.log('[LP Detection] Found sections in message content');
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
    } else {
      console.log('[LP Detection] No LP result found, keeping current state');
      console.log('[LP Detection] foundLPResult:', foundLPResult);
      console.log('[LP Detection] htmlContent length:', htmlContent?.length || 0);
    }
  }, [messages]);

  // プレビュー判定（レガシー互換性）
  const isPreviewMessage = (msg: any) => false; // 新システムでは使用しない
  const latestPreviewMessage = null; // 新システムでは使用しない

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
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              placeholder={getPlaceholder()}
              value={input}
              onChange={handleInputChange}
              disabled={isEditMode && !selectedElementId}
            />
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
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {lpToolState.isActive && lpToolState.htmlContent ? (
            <div className="h-full overflow-y-auto">
              <LPViewer htmlContent={lpToolState.htmlContent} cssContent={lpToolState.cssContent} />
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
    </div>
  );
};

// --- Main Page Component ---

export default function Page() {
  const { isEditMode, toggleEditMode, selectedElementId, selectElement } = useEditMode();

  // 新しいMastraベースのチャットシステムを使用
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    error,
    setInput,
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
    // Chat input を直接設定し、そのまま submit
    setInput(prompt);
    setTimeout(() => {
      // handleSubmit は current form event が必要ない実装なのでダミーを渡す
      const fakeEvt = { preventDefault: () => {} } as any;
      handleSubmit(fakeEvt);
    }, 0);
  };

  return (
    <div className="h-screen">
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
          setInput={setInput}
          sendPrompt={sendPrompt}
        />
      ) : (
        <InitialView 
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
