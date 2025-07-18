/**
 * LP Creator Platform - Business Context Analyzer
 * 
 * ユーザー入力からビジネスタイプとターゲットオーディエンスを自動検出するユーティリティ
 */

import { BusinessContext } from '../../../types/lp-core';

/**
 * ビジネスコンテキスト分析クラス
 * ユーザー入力からビジネス情報を抽出する
 */
export class BusinessContextAnalyzer {
  // 業界キーワード辞書
  private industryKeywords = {
    saas: ['ソフトウェア', 'アプリ', 'プラットフォーム', 'ツール', 'システム', 'AI', 'クラウド', 'API', 'SaaS'],
    ecommerce: ['販売', '商品', 'ショップ', 'EC', '通販', 'オンライン', '商材', '店舗', 'Eコマース', '物販'],
    consulting: ['コンサル', 'アドバイス', '支援', '改善', '最適化', '戦略', 'サポート', '相談'],
    education: ['教育', '学習', 'スクール', '講座', 'セミナー', 'トレーニング', 'コース', '学校', '塾'],
    healthcare: ['健康', '医療', '治療', 'ヘルスケア', 'ウェルネス', 'メディカル', '病院', 'クリニック'],
    finance: ['金融', '投資', '保険', 'ファイナンス', '資産', '運用', 'ローン', '融資', '銀行'],
    realestate: ['不動産', '物件', 'マンション', '住宅', '土地', '賃貸', '売買', '仲介'],
    food: ['飲食', 'レストラン', 'カフェ', '食品', 'フード', '料理', 'デリバリー', 'ケータリング'],
    beauty: ['美容', 'サロン', 'エステ', 'ネイル', 'ヘアサロン', 'コスメ', 'スキンケア'],
    fitness: ['フィットネス', 'ジム', 'トレーニング', 'ヨガ', 'スポーツ', '運動', '健康'],
    travel: ['旅行', 'ツアー', 'ホテル', '観光', '宿泊', '予約', 'トラベル', '旅'],
    entertainment: ['エンタメ', '娯楽', 'ゲーム', '映画', '音楽', 'イベント', 'コンテンツ'],
    manufacturing: ['製造', '工場', '生産', '加工', '部品', '素材', '機械', '設備'],
    logistics: ['物流', '配送', '輸送', '倉庫', '在庫', 'サプライチェーン', '流通'],
    marketing: ['マーケティング', '広告', 'PR', 'ブランディング', 'プロモーション', 'SEO', 'SNS'],
    legal: ['法律', '弁護士', '法務', '特許', '商標', '契約', '訴訟'],
    hr: ['人事', '採用', '求人', '人材', 'リクルート', '転職', 'キャリア'],
    creative: ['クリエイティブ', 'デザイン', '制作', 'コンテンツ', 'メディア', 'アート'],
    construction: ['建設', '建築', '工事', 'リフォーム', '設計', '施工', '不動産開発'],
    agriculture: ['農業', '農産物', '栽培', '畜産', '食品加工', 'オーガニック'],
    energy: ['エネルギー', '電力', '再生可能', '太陽光', '風力', '省エネ'],
    automotive: ['自動車', '車', 'バイク', '整備', '修理', '販売', 'モビリティ'],
    nonprofit: ['NPO', '非営利', '社会貢献', 'ボランティア', '寄付', '支援活動']
  };

  // ターゲットオーディエンスキーワード辞書
  private audienceKeywords = {
    '個人事業主': ['フリーランス', '個人', 'ソロ', '起業家', '独立', '自営業', '個人事業主'],
    '中小企業': ['中小企業', 'SMB', '小規模', 'スモール', '中堅企業', '町工場'],
    'エンタープライズ': ['大企業', '法人', '企業向け', 'B2B', 'ビジネス', 'エンタープライズ', '上場企業'],
    '一般消費者': ['個人向け', 'B2C', '消費者', 'ユーザー', '顧客', '一般', '生活者'],
    '学生': ['学生', '大学生', '高校生', '受験生', '若者', '教育機関'],
    '保護者': ['親', '保護者', '子育て', '家族', '主婦', '主夫'],
    'シニア': ['シニア', '高齢者', '退職者', 'アクティブシニア', '50代', '60代'],
    '専門家': ['専門家', 'プロフェッショナル', '有資格者', '技術者', 'エンジニア'],
    '経営者': ['経営者', 'CEO', '役員', '創業者', '意思決定者', 'オーナー'],
    '富裕層': ['富裕層', 'ハイエンド', 'プレミアム', '高所得者', 'VIP'],
    '地域住民': ['地域', '地元', '近隣', '住民', 'コミュニティ', '町内'],
    '外国人': ['外国人', 'インバウンド', '観光客', '留学生', '駐在員', '海外']
  };

  // ビジネス目標キーワード辞書
  private goalKeywords = {
    'リード獲得': ['問い合わせ', 'リード', '資料請求', '相談', 'お問い合わせ', '見込み客'],
    '売上向上': ['販売', '売上', '収益', '購入', '買う', '注文', '売れる', '売り上げ'],
    'ブランド認知': ['認知', 'ブランディング', '知名度', 'PR', '宣伝', '露出', 'イメージ'],
    '会員登録': ['登録', 'サインアップ', '会員', 'メンバー', 'アカウント', 'ユーザー登録'],
    'アプリインストール': ['インストール', 'ダウンロード', 'アプリ', '導入', '使用'],
    'エンゲージメント': ['エンゲージ', '関与', '参加', '滞在時間', 'アクティブ', '継続'],
    '情報提供': ['情報', '知識', '教育', '啓蒙', '理解', '周知'],
    '採用': ['採用', '求人', '人材', '応募', '雇用', 'スカウト'],
    'コスト削減': ['コスト削減', '効率化', '省力化', '自動化', '最適化'],
    '顧客維持': ['リピート', '継続', '維持', 'LTV', '解約防止', '顧客満足']
  };

  // トーンキーワード辞書
  private toneKeywords = {
    'professional': ['プロフェッショナル', 'ビジネス', '専門的', '信頼', '実績', '堅実'],
    'friendly': ['親しみやすい', 'フレンドリー', '気軽', '親近感', 'カジュアル', '温かみ'],
    'casual': ['カジュアル', 'ラフ', 'リラックス', '自由', '柔らかい', '肩の力を抜いた'],
    'premium': ['高級', 'プレミアム', 'エグゼクティブ', 'ラグジュアリー', '上質', '洗練']
  };

  // 業界別のペルソナ特性
  private industryPersonas = {
    saas: {
      painPoints: ['複雑な業務プロセス', '非効率なシステム', '高いコスト', 'データ管理の課題'],
      motivations: ['効率化', '自動化', 'コスト削減', 'データ活用'],
      decisionFactors: ['使いやすさ', '導入のしやすさ', 'ROI', 'サポート品質']
    },
    ecommerce: {
      painPoints: ['商品選びの難しさ', '購入の不安', '配送の遅れ', '返品の手間'],
      motivations: ['お得な買い物', '時間節約', '品質保証', '特別な体験'],
      decisionFactors: ['価格', '品質', '配送速度', 'レビュー評価']
    },
    consulting: {
      painPoints: ['複雑な経営課題', '専門知識の不足', '時間的制約', '成果の不確実性'],
      motivations: ['業績向上', '問題解決', 'リスク軽減', '競争優位性'],
      decisionFactors: ['実績', '専門性', '信頼性', 'コストパフォーマンス']
    },
    general: {
      painPoints: ['時間不足', 'コスト', '品質の懸念', '選択の難しさ'],
      motivations: ['問題解決', '生活向上', '安心', '満足感'],
      decisionFactors: ['価格', '品質', '利便性', '信頼性']
    }
  };

  /**
   * ユーザー入力を分析してビジネスコンテキストを抽出する
   * @param input ユーザー入力テキスト
   * @returns ビジネスコンテキスト
   */
  analyzeInput(input: string): BusinessContext {
    const normalizedInput = input.toLowerCase();
    
    // 業界の推定
    const industry = this.detectIndustry(normalizedInput);
    
    // ターゲット層の推定
    const targetAudience = this.detectAudience(normalizedInput);
    
    // ビジネス目標の推定
    const businessGoal = this.detectGoal(normalizedInput);
    
    // 競合優位性の抽出
    const competitiveAdvantage = this.extractAdvantages(input);
    
    // トーンの推定
    const tone = this.detectTone(normalizedInput);

    return {
      industry,
      targetAudience,
      businessGoal,
      competitiveAdvantage,
      tone
    };
  }

  /**
   * 業界を検出する
   * @param input 正規化されたユーザー入力
   * @returns 検出された業界
   */
  private detectIndustry(input: string): string {
    let bestMatch = { industry: 'general', count: 0 };
    
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      const matchCount = keywords.filter(keyword => input.includes(keyword)).length;
      if (matchCount > bestMatch.count) {
        bestMatch = { industry, count: matchCount };
      }
    }
    
    return bestMatch.industry;
  }

  /**
   * ターゲットオーディエンスを検出する
   * @param input 正規化されたユーザー入力
   * @returns 検出されたターゲットオーディエンス
   */
  private detectAudience(input: string): string {
    let bestMatch = { audience: '一般ユーザー', count: 0 };
    
    for (const [audience, keywords] of Object.entries(this.audienceKeywords)) {
      const matchCount = keywords.filter(keyword => input.includes(keyword)).length;
      if (matchCount > bestMatch.count) {
        bestMatch = { audience, count: matchCount };
      }
    }
    
    return bestMatch.audience;
  }

  /**
   * ビジネス目標を検出する
   * @param input 正規化されたユーザー入力
   * @returns 検出されたビジネス目標
   */
  private detectGoal(input: string): string {
    let bestMatch = { goal: 'コンバージョン向上', count: 0 };
    
    for (const [goal, keywords] of Object.entries(this.goalKeywords)) {
      const matchCount = keywords.filter(keyword => input.includes(keyword)).length;
      if (matchCount > bestMatch.count) {
        bestMatch = { goal, count: matchCount };
      }
    }
    
    return bestMatch.goal;
  }

  /**
   * 競合優位性を抽出する
   * @param input ユーザー入力
   * @returns 抽出された競合優位性の配列
   */
  private extractAdvantages(input: string): string[] {
    // ReDoS脆弱性を修正：より具体的で制限されたパターンを使用
    const advantagePatterns = [
      /(?:特徴|強み|メリット|優位性)(?:は|：)([^。、\n]{1,100}?)(?:[。、]|$)/g,
      /(?:他社との違い|差別化)(?:は|：)([^。、\n]{1,100}?)(?:[。、]|$)/g,
      /(?:独自の|オリジナル|特別な)([^。、\n]{1,100}?)(?:[。、]|$)/g
    ];

    const advantages: string[] = [];
    
    // 処理する文字列の長さを制限してReDoS攻撃を防止
    const limitedInput = input.substring(0, 5000);
    
    for (const pattern of advantagePatterns) {
      let match;
      let matchCount = 0;
      const maxMatches = 20; // マッチ数の制限
      
      while ((match = pattern.exec(limitedInput)) !== null && matchCount < maxMatches) {
        const advantage = match[1].trim();
        if (advantage.length > 0 && advantage.length <= 100) {
          advantages.push(advantage);
        }
        matchCount++;
      }
      
      // 正規表現の状態をリセット
      pattern.lastIndex = 0;
    }

    // キーワードベースの競合優位性抽出（パターンマッチングで見つからない場合のバックアップ）
    if (advantages.length === 0) {
      const advantageKeywords = [
        '最安', '最速', '最高品質', '特許', '独自技術', '実績', '経験', 
        '専門', '24時間', '無料', '保証', '安心', '信頼', '実績No.1'
      ];
      
      for (const keyword of advantageKeywords) {
        if (limitedInput.includes(keyword)) {
          // キーワードの前後のコンテキストを抽出
          const index = limitedInput.indexOf(keyword);
          const start = Math.max(0, index - 20);
          const end = Math.min(limitedInput.length, index + 30);
          const context = limitedInput.substring(start, end);
          
          advantages.push(context);
          if (advantages.length >= 3) break; // 最大3つまで
        }
      }
    }

    return advantages.slice(0, 10); // 結果も制限
  }

  /**
   * トーンを検出する
   * @param input 正規化されたユーザー入力
   * @returns 検出されたトーン
   */
  private detectTone(input: string): 'professional' | 'friendly' | 'casual' | 'premium' {
    let bestMatch: { tone: 'professional' | 'friendly' | 'casual' | 'premium', count: number } = { 
      tone: 'professional', 
      count: 0 
    };
    
    for (const [tone, keywords] of Object.entries(this.toneKeywords)) {
      const matchCount = keywords.filter(keyword => input.includes(keyword)).length;
      if (matchCount > bestMatch.count) {
        bestMatch = { 
          tone: tone as 'professional' | 'friendly' | 'casual' | 'premium', 
          count: matchCount 
        };
      }
    }
    
    return bestMatch.tone;
  }

  /**
   * 業界に基づいたペルソナ特性を取得する
   * @param industry 業界
   * @returns ペルソナ特性
   */
  getPersonaTraits(industry: string): {
    painPoints: string[];
    motivations: string[];
    decisionFactors: string[];
  } {
    return this.industryPersonas[industry as keyof typeof this.industryPersonas] || 
           this.industryPersonas.general;
  }

  /**
   * 業界とターゲットに基づいたマーケティングメッセージを生成する
   * @param industry 業界
   * @param targetAudience ターゲットオーディエンス
   * @param businessGoal ビジネス目標
   * @returns マーケティングメッセージ
   */
  generateMarketingMessage(industry: string, targetAudience: string, businessGoal: string): string {
    const persona = this.getPersonaTraits(industry);
    
    // 業界別のメッセージテンプレート
    const messageTemplates = {
      saas: `${targetAudience}の${persona.painPoints[0]}を解決し、${persona.motivations[0]}を実現する革新的なソリューション。`,
      ecommerce: `${targetAudience}に${persona.motivations[0]}と${persona.motivations[1]}を提供する、厳選された商品ラインナップ。`,
      consulting: `${targetAudience}の${persona.painPoints[0]}を解決し、${businessGoal}を達成するための専門的なサポート。`,
      general: `${targetAudience}の${persona.painPoints[0]}を解決し、${businessGoal}を実現します。`
    };
    
    return messageTemplates[industry as keyof typeof messageTemplates] || messageTemplates.general;
  }

  /**
   * 業界とターゲットに基づいたCTAを生成する
   * @param industry 業界
   * @param businessGoal ビジネス目標
   * @returns CTA
   */
  generateCTA(industry: string, businessGoal: string): string {
    // 目標別のCTAテンプレート
    const ctaTemplates: Record<string, Record<string, string>> = {
      'リード獲得': {
        saas: '無料デモを今すぐ体験',
        ecommerce: '今すぐショッピングを始める',
        consulting: '無料相談を予約する',
        general: '今すぐ問い合わせる'
      },
      '売上向上': {
        saas: '今すぐ始める',
        ecommerce: '今すぐ購入する',
        consulting: '詳細を見る',
        general: '今すぐ注文する'
      },
      'ブランド認知': {
        saas: '詳細を見る',
        ecommerce: 'コレクションを見る',
        consulting: '事例を見る',
        general: '詳しく知る'
      },
      '会員登録': {
        saas: '無料アカウントを作成',
        ecommerce: '会員登録して特典を受ける',
        consulting: 'メンバーシップに登録',
        general: '今すぐ登録'
      }
    };
    
    const goalTemplates = ctaTemplates[businessGoal] || ctaTemplates['リード獲得'];
    return goalTemplates[industry] || goalTemplates.general;
  }
}

/**
 * ビジネスコンテキスト分析のシングルトンインスタンス
 */
export const businessContextAnalyzer = new BusinessContextAnalyzer();

/**
 * ユーザー入力からビジネスコンテキストを抽出する関数
 * @param input ユーザー入力テキスト
 * @returns ビジネスコンテキスト
 */
export function analyzeBusinessContext(input: string): BusinessContext {
  return businessContextAnalyzer.analyzeInput(input);
}

/**
 * 業界とターゲットに基づいたマーケティングメッセージを生成する関数
 * @param industry 業界
 * @param targetAudience ターゲットオーディエンス
 * @param businessGoal ビジネス目標
 * @returns マーケティングメッセージ
 */
export function generateMarketingMessage(industry: string, targetAudience: string, businessGoal: string): string {
  return businessContextAnalyzer.generateMarketingMessage(industry, targetAudience, businessGoal);
}

/**
 * 業界とターゲットに基づいたCTAを生成する関数
 * @param industry 業界
 * @param businessGoal ビジネス目標
 * @returns CTA
 */
export function generateCTA(industry: string, businessGoal: string): string {
  return businessContextAnalyzer.generateCTA(industry, businessGoal);
}