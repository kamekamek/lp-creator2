/**
 * LP Creator Platform - Tool Helpers
 * 
 * This file contains helper functions for the LP Creator Platform tools.
 */

import { AIGenerationError, SecurityError, PerformanceError } from '../../../types/lp-core';
import DOMPurify from 'dompurify';

/**
 * AIエラーハンドリング関数
 * AIモデルからのエラーを適切に処理する
 */
export const handleAIError = (error: AIGenerationError) => {
  console.error(`AI Generation Error: ${error.type} - ${error.message}`);
  
  switch (error.type) {
    case 'model_timeout':
      return { 
        action: 'retry', 
        delay: 2000,
        fallbackModel: 'gpt-3.5-turbo' 
      };
    case 'rate_limit':
      return { 
        action: 'queue', 
        delay: error.retryAfter || 60000 
      };
    case 'content_policy':
      return { 
        action: 'sanitize_and_retry',
        message: 'コンテンツを調整して再試行します' 
      };
    default:
      return { 
        action: 'user_notification',
        message: error.message 
      };
  }
};

/**
 * HTMLサニタイゼーション関数
 * 生成されたHTMLを安全に処理する
 */
export const sanitizeHTML = (html: string): string => {
  // DOMPurify設定
  const purifyConfig = {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'button', 'section', 'header', 'footer', 'nav',
      'ul', 'ol', 'li', 'strong', 'em', 'br', 'svg', 'path',
      'main', 'article', 'aside', 'figure', 'figcaption', 'blockquote',
      'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'form', 'input',
      'label', 'select', 'option', 'textarea'
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'src', 'alt', 'href', 'target', 'rel',
      'width', 'height', 'type', 'placeholder', 'value', 'data-editable-id',
      'viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
      'stroke-linejoin', 'aria-label', 'aria-hidden', 'role', 'tabindex',
      'disabled', 'checked', 'selected', 'required', 'readonly'
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup'],
    ADD_ATTR: ['target'], // リンクに target="_blank" を許可
    ADD_DATA_URI_TAGS: ['img', 'svg'], // data URI を許可するタグ
  };

  // DOMPurifyを使用してHTMLをサニタイズ
  const sanitized = DOMPurify.sanitize(html, purifyConfig);
  
  return sanitized;
};

/**
 * パフォーマンスエラーハンドリング関数
 * パフォーマンス関連のエラーを適切に処理する
 */
export const handlePerformanceError = (error: PerformanceError) => {
  console.error(`Performance Error: ${error.type} - Current: ${error.current}, Threshold: ${error.threshold}`);
  
  if (error.type === 'large_content') {
    return {
      action: 'chunk_processing',
      chunkSize: 50000 // 50KB chunks
    };
  } else if (error.type === 'memory_limit') {
    return {
      action: 'cleanup_and_retry',
      message: 'メモリ使用量を最適化して再試行します'
    };
  } else if (error.type === 'processing_timeout') {
    return {
      action: 'timeout_notification',
      message: '処理時間が長すぎます。シンプルな要求に変更してください'
    };
  }
  
  return {
    action: 'user_notification',
    message: 'パフォーマンスの問題が発生しました。しばらく待ってから再試行してください'
  };
};

/**
 * セキュリティエラーハンドリング関数
 * セキュリティ関連のエラーを適切に処理する
 */
export const handleSecurityError = (error: SecurityError) => {
  console.error(`Security Error: ${error.type} - Severity: ${error.severity}, Element: ${error.element}`);
  
  if (error.severity === 'high') {
    return {
      action: 'block',
      message: '危険なコンテンツが検出されました。処理を中止します'
    };
  } else if (error.severity === 'medium') {
    return {
      action: 'sanitize_and_continue',
      message: '潜在的に危険なコンテンツを除去しました'
    };
  } else {
    return {
      action: 'warn_and_continue',
      message: '安全でない可能性のあるコンテンツが含まれています'
    };
  }
};

/**
 * HTMLからdata-editable-id属性を持つ要素を抽出する関数
 */
export const extractEditableElements = (html: string): { id: string, content: string }[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const editableElements = doc.querySelectorAll('[data-editable-id]');
  
  return Array.from(editableElements).map(element => ({
    id: element.getAttribute('data-editable-id') || '',
    content: element.textContent || ''
  }));
};

/**
 * HTMLの特定の要素のテキストを更新する関数
 */
export const updateElementText = (html: string, elementId: string, newText: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const element = doc.querySelector(`[data-editable-id="${elementId}"]`);
  
  if (element) {
    element.textContent = newText;
    return doc.documentElement.outerHTML;
  }
  
  return html;
};

/**
 * マーケティング心理学のPASONA法則を適用するためのヘルパー関数
 */
export const applyPasonaFormula = (content: string, businessContext: any): string => {
  // PASONA法則: Problem（問題）、Agitation（焦り）、Solution（解決策）、Offer（提案）、Narrow down（絞り込み）、Action（行動）
  const pasonaTemplate = `
# ${businessContext.industry}業界の${businessContext.targetAudience}が抱える問題

${content}

# この問題を放置するとどうなるか

# 私たちの解決策

# 具体的な提案内容

# なぜ今すぐ行動すべきか

# 今すぐ行動するための具体的なステップ
  `;
  
  return pasonaTemplate;
};

/**
 * マーケティング心理学の4U原則を適用するためのヘルパー関数
 */
export const apply4UPrinciple = (content: string, businessContext: any): string => {
  // 4U原則: Useful（有用性）、Urgent（緊急性）、Unique（独自性）、Ultra-specific（具体性）
  const fourUTemplate = `
# ${businessContext.industry}業界の${businessContext.targetAudience}にとって有用な価値

${content}

# 今すぐ行動すべき理由（緊急性）

# 他社にはない独自の強み

# 具体的な数値やケーススタディ
  `;
  
  return fourUTemplate;
};

/**
 * 生成されたHTMLにアクセシビリティ機能を追加する関数
 */
export const enhanceAccessibility = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 画像にalt属性がない場合は追加
  const images = doc.querySelectorAll('img:not([alt])');
  images.forEach(img => {
    img.setAttribute('alt', '画像の説明');
  });
  
  // リンクにaria-labelがない場合は追加
  const links = doc.querySelectorAll('a:not([aria-label])');
  links.forEach(link => {
    if (link.textContent) {
      link.setAttribute('aria-label', link.textContent);
    }
  });
  
  // フォーム要素にlabelがない場合は追加
  const formElements = doc.querySelectorAll('input, select, textarea');
  formElements.forEach(element => {
    const id = element.getAttribute('id');
    if (id && !doc.querySelector(`label[for="${id}"]`)) {
      const label = doc.createElement('label');
      label.setAttribute('for', id);
      label.textContent = `${element.getAttribute('placeholder') || 'ラベル'}`;
      element.parentNode?.insertBefore(label, element);
    }
  });
  
  return doc.documentElement.outerHTML;
};

/**
 * パフォーマンスモニタリング関数
 */
export const monitorPerformance = () => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      return {
        duration,
        isWithinThreshold: (threshold: number) => duration < threshold
      };
    }
  };
};