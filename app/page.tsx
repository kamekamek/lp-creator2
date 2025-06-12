'use client';

import { useActions, useUIState } from 'ai/rsc';
import { AI } from './action';
import { useState, type ReactNode } from 'react';

// Define a more specific type for UI messages
interface Message {
  id: number;
  role: 'user' | 'assistant';
  display: ReactNode;
}

export default function Home() {
    const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useUIState<typeof AI>();
  const { displayGeneratedLp } = useActions<typeof AI>();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="p-4 border-b w-full shadow-sm bg-white">
        <h1 className="text-2xl font-bold text-gray-800 text-center">AI-Powered LP Creator</h1>
      </header>

      <main className="flex-grow p-6 overflow-auto">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message: Message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-3xl p-4 rounded-2xl shadow-md break-words ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}
              >
                {message.display}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-4 border-t w-full bg-white">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const topic = inputValue.trim();
            if (!topic) return;

            setInputValue('');

            // Add user message to UI state
            setMessages((currentMessages: Message[]) => [
              ...currentMessages,
              {
                id: Date.now(),
                role: 'user',
                display: <div>{topic}</div>,
              },
            ]);

            setIsGenerating(true);
            try {
              // Submit and get response
              const responseMessage = await displayGeneratedLp({ topic });
              setMessages((currentMessages: Message[]) => [...currentMessages, responseMessage]);
            } catch (error) {
              console.error('Error generating LP:', error);
              // Display an error message to the user in the UI
              setMessages((currentMessages: Message[]) => [
                ...currentMessages,
                {
                  id: Date.now(),
                  role: 'assistant',
                  display: <div className="text-red-500">Sorry, an error occurred while generating the page. Please try again.</div>,
                },
              ]);
            } finally {
              setIsGenerating(false);
            }
          }}
          className="flex max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g., A landing page for a new AI-powered fitness app"
            className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-gray-900"
            autoFocus
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-r-lg hover:bg-blue-600 active:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
            disabled={isGenerating || !inputValue.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </footer>
    </div>
  );
}
