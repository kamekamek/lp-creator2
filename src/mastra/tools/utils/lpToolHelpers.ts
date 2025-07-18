/**
 * LP Creator Platform - Tool Helpers
 * 
 * This file contains helper functions for the LP Creator Platform tools.
 */

import { AIGenerationError, SecurityError, PerformanceError } from '../../../types/lp-core';

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
 * Node.js環境用の基本的なサニタイゼーション実装
 */
export const sanitizeHTML = (html: string): string => {
  // 危険なタグとスクリプトを除去
  let sanitized = html
    // スクリプトタグを除去
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // イベントハンドラーを除去
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // javascript: プロトコルを除去
    .replace(/javascript:/gi, '')
    // iframe, object, embed タグを除去
    .replace(/<(iframe|object|embed)\b[^>]*>.*?<\/\1>/gi, '')
    // 単体のiframe, object, embedタグを除去
    .replace(/<(iframe|object|embed)\b[^>]*\/?>/gi, '');

  // 基本的なHTMLタグのみを許可（より厳密な実装）
  const allowedTags = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'button', 'section', 'header', 'footer', 'nav',
    'ul', 'ol', 'li', 'strong', 'em', 'br', 'svg', 'path',
    'main', 'article', 'aside', 'figure', 'figcaption', 'blockquote',
    'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'form', 'input',
    'label', 'select', 'option', 'textarea'
  ];

  // 許可されていないタグを除去（基本的な実装）
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match;
    }
    return '';
  });

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
 * PASONA法則: Problem（問題）、Agitation（焦り）、Solution（解決策）、Offer（提案）、Narrow down（絞り込み）、Action（行動）
 */
export const applyPasonaFormula = (content: string, businessContext: any): string => {
  // 業界別の問題設定
  const industryProblems = {
    saas: '複雑なシステム管理や業務効率化の課題',
    ecommerce: '商品選びの難しさや購入の不安',
    consulting: '経営課題の解決や業績向上の難しさ',
    education: '効果的な学習方法や知識習得の課題',
    healthcare: '健康管理や医療アクセスの問題',
    finance: '資産運用や財務管理の複雑さ',
    realestate: '理想の物件探しや不動産取引の不安',
    food: '食の安全や品質への不安',
    beauty: '理想の美しさの追求や自己表現',
    general: '時間やコスト、品質に関する課題'
  };

  // 業界別の焦り要素
  const industryAgitations = {
    saas: '非効率なシステムは時間とコストの無駄を生み、競争力低下につながります',
    ecommerce: '選択を誤ると無駄な出費や後悔、さらには信頼の喪失を招きます',
    consulting: '適切な対策を講じなければ、市場シェアの低下や収益減少は避けられません',
    education: '効果的な学習法がなければ、時間を無駄にし、目標達成が遅れます',
    healthcare: '健康問題を放置すると、将来的に深刻な状態や高額な治療費につながります',
    finance: '適切な資産管理をしないと、将来の安定や目標達成が危うくなります',
    realestate: '不適切な物件選びは長期的な不満や資産価値の低下を招きます',
    food: '品質の低い食品は健康リスクや満足度の低下につながります',
    beauty: '適切なケアやサービスがなければ、理想の美しさは遠のくばかりです',
    general: '問題を放置すると、さらなるコスト増加や機会損失につながります'
  };

  // 業界別のソリューション
  const industrySolutions = {
    saas: '当社の直感的なソフトウェアは、複雑な業務を簡素化し、効率を劇的に向上させます',
    ecommerce: '厳選された高品質商品と充実の保証制度で、安心のショッピング体験を提供します',
    consulting: '実績豊富な専門家チームが、あなたのビジネス課題に合わせた最適な解決策を提案します',
    education: '革新的な学習メソッドと個別最適化されたカリキュラムで、効果的な知識習得を実現します',
    healthcare: '最新の医療技術と丁寧なケアで、あなたの健康と安心を守ります',
    finance: '専門知識と実績に基づいた資産運用戦略で、あなたの財務目標達成をサポートします',
    realestate: '豊富な物件情報と専門知識で、あなたにぴったりの不動産選びをサポートします',
    food: '厳選された食材と徹底した品質管理で、安全で美味しい食体験を提供します',
    beauty: '最新技術と熟練の技術者による、あなただけのビューティーソリューションを提供します',
    general: '当社の革新的なソリューションは、あなたの課題を効率的に解決します'
  };

  // 業界とターゲットに基づいた問題設定
  const problem = industryProblems[businessContext.industry as keyof typeof industryProblems] || industryProblems.general;
  const agitation = industryAgitations[businessContext.industry as keyof typeof industryAgitations] || industryAgitations.general;
  const solution = industrySolutions[businessContext.industry as keyof typeof industrySolutions] || industrySolutions.general;

  const pasonaTemplate = `
【PASONA法則に基づくランディングページ構成】

# Problem（問題提起）: ${businessContext.targetAudience}が抱える${problem}
${content}について、${businessContext.targetAudience}は以下のような問題を抱えています。

# Agitation（焦り）: この問題を放置するとどうなるか
${agitation}

# Solution（解決策）: 私たちの提供する解決策
${solution}

# Offer（提案）: 具体的な提案内容
${businessContext.competitiveAdvantage.length > 0 ? `特に${businessContext.competitiveAdvantage.join('、')}が強みです。` : ''}

# Narrow down（絞り込み）: なぜ今すぐ行動すべきか
期間限定の特別オファーや初回割引などの特典をご用意しています。

# Action（行動）: 今すぐ行動するための具体的なステップ
無料相談、資料請求、デモ体験などの明確なCTAを設置します。
  `;
  
  return pasonaTemplate;
};

/**
 * マーケティング心理学の4U原則を適用するためのヘルパー関数
 * 4U原則: Useful（有用性）、Urgent（緊急性）、Unique（独自性）、Ultra-specific（具体性）
 */
export const apply4UPrinciple = (content: string, businessContext: any): string => {
  // 業界別の有用性メッセージ
  const industryUsefulness = {
    saas: '業務効率の大幅な向上と運用コストの削減',
    ecommerce: '時間と手間を省き、最適な商品を見つける',
    consulting: 'ビジネス課題の解決と業績の向上',
    education: '効率的な学習と確実なスキル習得',
    healthcare: '健康維持と生活の質の向上',
    finance: '資産の安定的な成長と将来の安心',
    realestate: '理想の住環境と資産価値の確保',
    food: '安全で美味しい食体験の提供',
    beauty: '理想の美しさの実現と自信の獲得',
    general: '時間とコストの節約、品質の向上'
  };

  // 業界別の緊急性メッセージ
  const industryUrgency = {
    saas: '競合他社が先行する中、今導入しないと競争力の差が広がります',
    ecommerce: '限定商品や特別価格は、在庫がなくなり次第終了します',
    consulting: '市場環境は刻々と変化し、対応が遅れるほど機会損失が増大します',
    education: '学習は早く始めるほど効果が高く、遅れるほど追いつくのが難しくなります',
    healthcare: '健康対策は早期に始めるほど効果的で、遅れるほどリスクが高まります',
    finance: '資産運用は早く始めるほど複利効果が大きく、遅れるほど目標達成が困難になります',
    realestate: '良い物件は早い者勝ちで、検討が遅れると機会を逃します',
    food: '期間限定メニューや季節商品は、提供期間が終了すると手に入りません',
    beauty: '美容ケアは早く始めるほど効果的で、遅れるほど改善が難しくなります',
    general: '今行動しないと、この特別な機会を逃してしまいます'
  };

  // 業界別の独自性メッセージ
  const industryUniqueness = {
    saas: '独自のAI技術と使いやすいインターフェースで他社と一線を画します',
    ecommerce: '厳選された商品と独自の品質基準で、他では手に入らない価値を提供します',
    consulting: '業界特化の専門知識と豊富な実績で、最適なソリューションを提案します',
    education: '革新的な学習メソッドと個別最適化されたカリキュラムで、効果的な学習を実現します',
    healthcare: '最新の医療技術と丁寧なケアの組み合わせで、総合的な健康サポートを提供します',
    finance: '独自の分析手法と個別最適化された戦略で、安定した資産成長を実現します',
    realestate: '独自のネットワークと専門知識で、市場に出回らない物件情報も提供します',
    food: '独自の仕入れルートと調理法で、他では味わえない食体験を提供します',
    beauty: '独自開発の技術と製品で、他では得られない美しさを実現します',
    general: '独自の技術とノウハウで、他社にはない価値を提供します'
  };

  // 業界別の具体性メッセージ
  const industrySpecificity = {
    saas: '導入企業の平均30%の業務効率向上と20%のコスト削減を実現',
    ecommerce: '顧客満足度98%、リピート率85%の実績',
    consulting: '支援企業の平均売上25%増加、利益率15%向上の実績',
    education: '受講者の90%が目標達成、資格取得率95%の実績',
    healthcare: '利用者の健康指標が平均20%改善、満足度96%の実績',
    finance: '運用資産の平均年間リターン8%、長期顧客の資産倍増率75%',
    realestate: '顧客満足度95%、物件紹介から契約までの平均期間30日短縮',
    food: '原材料の100%国内産使用、食品安全管理基準の完全準拠',
    beauty: '施術後の満足度97%、リピート率90%の実績',
    general: '顧客満足度95%以上、具体的な数値で効果を実証'
  };

  // 業界とターゲットに基づいたメッセージ
  const usefulness = industryUsefulness[businessContext.industry as keyof typeof industryUsefulness] || industryUsefulness.general;
  const urgency = industryUrgency[businessContext.industry as keyof typeof industryUrgency] || industryUrgency.general;
  const uniqueness = industryUniqueness[businessContext.industry as keyof typeof industryUniqueness] || industryUniqueness.general;
  const specificity = industrySpecificity[businessContext.industry as keyof typeof industrySpecificity] || industrySpecificity.general;

  const fourUTemplate = `
【4U原則に基づくランディングページ構成】

# Useful（有用性）: ${businessContext.targetAudience}にとっての価値
${content}は${usefulness}を実現します。

# Urgent（緊急性）: 今すぐ行動すべき理由
${urgency}

# Unique（独自性）: 他社にはない強み
${uniqueness}
${businessContext.competitiveAdvantage.length > 0 ? `特に${businessContext.competitiveAdvantage.join('、')}が強みです。` : ''}

# Ultra-specific（具体性）: 具体的な数値やケーススタディ
${specificity}
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