'use client';

import { useUIState, useActions } from 'ai/rsc';
import { AI } from './action';
import { useState, FormEvent, ChangeEvent } from 'react';
import { useEditMode } from './contexts/EditModeContext';

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
  // 最新のLPメッセージを取得
  const latestLpMessage = [...messages]
    .reverse()
    .find(message => 
      message.role === 'assistant' && 
      message.display && 
      typeof message.display === 'object' && 
      'props' in message.display && (
        message.display.props?.className?.includes('lp-preview-message') ||
        message.display.props?.lpObject
      )
    );

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左側: チャットエリア */}
      <main className="w-1/2 flex flex-col overflow-hidden bg-white border-r border-gray-200">
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
          {messages.filter(message => {
            // LPプレビューはチャットエリアに表示しない
            if (message.role === 'assistant' && 
                message.display && 
                typeof message.display === 'object' && 
                'props' in message.display && (
                  message.display.props?.className?.includes('lp-preview-message') ||
                  message.display.props?.lpObject
                )) {
              return false;
            }
            return true;
          }).map((message) => (
            <div key={message.id}>{message.display}</div>
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
          {latestLpMessage ? (
            <div className="h-full overflow-y-auto p-4">
              {latestLpMessage.display}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">プレビューエリア</p>
                <p className="text-sm">LPを生成すると、こちらに表示されます</p>
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
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const { isEditMode, toggleEditMode, selectedElementId, selectElement } = useEditMode();

  const isLpGenerated = messages.some(msg => msg.role === 'assistant' && msg.display);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages(currentMessages => [
        ...currentMessages,
        {
            id: Date.now(),
            role: 'user',
            display: <div className="p-2 text-right text-black"><strong>あなた:</strong> {inputValue}</div>
        }
    ]);

    const message = await submitUserMessage(inputValue, selectedElementId);
    
    setMessages(currentMessages => [...currentMessages, message]);
    setInputValue('');
    if (selectedElementId) {
        selectElement(null);
    }
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
      {isLpGenerated ? (
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
