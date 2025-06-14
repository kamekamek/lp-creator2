'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        components={{
        // ヘッダーのスタイリング
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-gray-900 mb-2 mt-3 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-gray-900 mb-1 mt-2 first:mt-0">
            {children}
          </h3>
        ),
        // パラグラフのスタイリング
        p: ({ children }) => (
          <p className="text-sm text-gray-700 mb-2 leading-relaxed">
            {children}
          </p>
        ),
        // リストのスタイリング
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-sm text-gray-700 mb-3 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside text-sm text-gray-700 mb-3 space-y-3 ml-6">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-gray-700 leading-relaxed">
            {children}
          </li>
        ),
        // コードブロックのスタイリング
        code: ({ children, ...props }) => {
          const isInline = !props.className;
          if (isInline) {
            return (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-800">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-gray-100 p-2 rounded text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-800 overflow-x-auto mb-2">
            {children}
          </pre>
        ),
        // 引用のスタイリング
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-3 text-sm text-gray-600 italic mb-2">
            {children}
          </blockquote>
        ),
        // 強調のスタイリング
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-700">
            {children}
          </em>
        ),
        // リンクのスタイリング
        a: ({ children, href }) => (
          <a 
            href={href} 
            className="text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        // 区切り線のスタイリング
        hr: () => (
          <hr className="border-gray-300 my-3" />
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};