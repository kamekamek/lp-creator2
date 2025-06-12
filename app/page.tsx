'use client';

import { useChat } from '@ai-sdk/react';
import React, { useState, FormEvent, ChangeEvent, useMemo, useEffect } from 'react';
import { useEditMode } from './contexts/EditModeContext';
import type { Message } from 'ai';
import { LPTool } from './components/LPTool';
import { LPViewer } from './components/LPViewer';

// --- Prop Types ---
interface InitialViewProps {
  inputValue: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

interface MainViewProps {
  messages: any[]; // Consider a more specific type if available from useUIState
  inputValue: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  selectedElementId: string | null;
  selectElement: (id: string | null) => void;
  getPlaceholder: () => string;
}

// --- Standalone Components ---

const InitialView = ({ inputValue, handleInputChange, handleSubmit }: InitialViewProps) => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-50">
    <div className="w-full max-w-2xl p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">今日は何をデザインしますか？</h1>
            <p className="text-lg text-gray-800 mb-8">作成したいページについて、スタイル、機能、目的などを詳しく教えてください。</p>
      <form onSubmit={handleSubmit} className="w-full flex">
        <input
          className="flex-grow p-4 border border-gray-300 rounded-l-lg text-black text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
          placeholder="例：AI写真編集アプリのランディングページ..."
          value={inputValue}
          onChange={handleInputChange}
          autoFocus
        />
        <button
          type="submit"
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-r-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-400"
          disabled={!inputValue.trim()}
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
  title: string;
  forcePanelOpen?: boolean;
}

const MainView = ({
  messages,
  inputValue,
  handleInputChange,
  handleSubmit,
  isEditMode,
  toggleEditMode,
  selectedElementId,
  selectElement,
  getPlaceholder
}: MainViewProps) => {
  const [lpToolState, setLpToolState] = useState<LPToolState>({
    isActive: false,
    htmlContent: '',
    title: '生成されたランディングページ',
    forcePanelOpen: false
  });

  // LPツール検出とコンテンツ抽出
  useEffect(() => {
    if (messages.length === 0) {
      setLpToolState({
        isActive: false,
        htmlContent: '',
        title: '生成されたランディングページ',
        forcePanelOpen: false
      });
      return;
    }

    // メッセージからLP生成結果を検出
    const lpMessages = messages.filter(message => 
      message.role === 'assistant' && 
      message.content && 
      typeof message.content === 'string' &&
      (message.content.includes('htmlLPTool') || 
       message.content.includes('<section') ||
       message.content.includes('lpPreviewTool'))
    );

    if (lpMessages.length > 0) {
      const latestLpMessage = lpMessages[lpMessages.length - 1];
      let htmlContent = '';
      let title = 'ランディングページ';

      // HTMLコンテンツを抽出
      if (typeof latestLpMessage.content === 'string') {
        // ツール結果からHTMLを抽出する簡単なパーシング
        const htmlMatch = latestLpMessage.content.match(/<section[\s\S]*?<\/section>/g);
        if (htmlMatch) {
          htmlContent = htmlMatch.join('\n\n');
        } else if (latestLpMessage.content.includes('<div') || latestLpMessage.content.includes('<main')) {
          // フォールバック: div や main タグを含む場合
          htmlContent = latestLpMessage.content.replace(/```html\n?/g, '').replace(/```\n?/g, '');
        }
      }

      if (htmlContent) {
        setLpToolState({
          isActive: true,
          htmlContent: htmlContent,
          title: title,
          forcePanelOpen: true
        });
      }
    }
  }, [messages]);

  // プレビュー判定（レガシー互換性）
  const isPreviewMessage = (msg: any) => false; // 新システムでは使用しない
  const latestPreviewMessage = null; // 新システムでは使用しない

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左側: チャットエリア */}
      <main className="w-1/2 flex flex-col overflow-hidden bg-white border-r border-gray-200">
        {/* LPツールがアクティブな場合に表示 */}
        {lpToolState.isActive && (
          <LPTool 
            htmlContent={lpToolState.htmlContent}
            title={lpToolState.title}
            autoOpenPreview={lpToolState.htmlContent !== ''} // HTMLコンテンツがある場合に自動的に開く
            forcePanelOpen={lpToolState.forcePanelOpen} // 強制的にパネルを開くフラグ
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
          {messages.map((message) => (
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
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">
                      {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              value={inputValue}
              onChange={handleInputChange}
              disabled={isEditMode && !selectedElementId}
            />
          </form>
        </div>
      </main>
      
      {/* 右側: LPプレビューエリア */}
      <div className="w-1/2 flex flex-col bg-white">
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">プレビュー</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          {lpToolState.isActive && lpToolState.htmlContent ? (
            <div className="h-full overflow-y-auto">
              <LPViewer htmlContent={lpToolState.htmlContent} />
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function Page() {
  const [inputValue, setInputValue] = useState('');
  const { isEditMode, toggleEditMode, selectedElementId, selectElement } = useEditMode();

  // 新しいMastraベースのチャットシステムを使用
  const { 
    messages, 
    input, 
    handleInputChange: originalHandleInputChange, 
    handleSubmit: originalHandleSubmit, 
    isLoading, 
    error,
    setInput
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // useChatの入力を更新
    setInput(inputValue);
    setInputValue('');
    
    // 少し遅らせてからsubmitを実行（入力が更新されるのを待つ）
    setTimeout(() => {
      originalHandleSubmit(e);
    }, 0);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const getPlaceholder = () => {
    if (!isEditMode) {
        return '新しいLPのテーマを入力...';
    }
    if (selectedElementId) {
        return `${selectedElementId} への変更内容を記述...`;
    }
    return '編集する要素を選択してください...';
  }

  return (
    <div className="h-screen">
      {showMainView ? (
        <MainView 
          messages={messages}
          inputValue={inputValue}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isEditMode={isEditMode}
          toggleEditMode={toggleEditMode}
          selectedElementId={selectedElementId}
          selectElement={selectElement}
          getPlaceholder={getPlaceholder}
        />
      ) : (
        <InitialView 
          inputValue={inputValue}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
