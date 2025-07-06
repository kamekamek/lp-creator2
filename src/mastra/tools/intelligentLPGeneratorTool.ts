import { tool } from 'ai';
import { z } from 'zod';
import { generateUnifiedLP } from './lpGeneratorTool';
import type { BusinessContext, Variant, GenerationResult } from '../../types/lp-generator';

// ビジネスコンテキスト分析器
class BusinessContextAnalyzer {
  private industryKeywords = {
    saas: ['ソフトウェア', 'アプリ', 'プラットフォーム', 'ツール', 'システム', 'AI', 'クラウド', 'API'],
    ecommerce: ['販売', '商品', 'ショップ', 'EC', '通販', 'オンライン', '商材', '店舗'],
    consulting: ['コンサル', 'アドバイス', '支援', '改善', '最適化', '戦略', 'サポート'],
    education: ['教育', '学習', 'スクール', '講座', 'セミナー', 'トレーニング', 'コース'],
    healthcare: ['健康', '医療', '治療', 'ヘルスケア', 'ウェルネス', 'メディカル'],
    finance: ['金融', '投資', '保険', 'ファイナンス', '資産', '運用', 'ローン'],
    realestate: ['不動産', '物件', 'マンション', '住宅', '土地', '賃貸', '売買']
  };

  private audienceKeywords = {
    '個人事業主': ['フリーランス', '個人', 'ソロ', '起業家', '独立'],
    '中小企業': ['中小企業', 'SMB', '小規模', 'スモール'],
    'エンタープライズ': ['大企業', '法人', '企業向け', 'B2B', 'ビジネス'],
    '一般消費者': ['個人向け', 'B2C', '消費者', 'ユーザー', '顧客']
  };

  private goalKeywords = {
    'リード獲得': ['問い合わせ', 'リード', '資料請求', '相談', 'お問い合わせ'],
    '売上向上': ['販売', '売上', '収益', '購入', '買う', '注文'],
    'ブランド認知': ['認知', 'ブランディング', '知名度', 'PR', '宣伝'],
    '会員登録': ['登録', 'サインアップ', '会員', 'メンバー', 'アカウント']
  };

  analyzeInput(input: string): {
    industry: string;
    targetAudience: string;
    businessGoal: string;
    competitiveAdvantage: string[];
    tone: 'professional' | 'friendly' | 'casual' | 'premium';
  } {
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

  private detectIndustry(input: string): string {
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return industry;
      }
    }
    return 'general';
  }

  private detectAudience(input: string): string {
    for (const [audience, keywords] of Object.entries(this.audienceKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return audience;
      }
    }
    return '一般ユーザー';
  }

  private detectGoal(input: string): string {
    for (const [goal, keywords] of Object.entries(this.goalKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return goal;
      }
    }
    return 'コンバージョン向上';
  }

  private extractAdvantages(input: string): string[] {
    const advantagePatterns = [
      /(?:特徴|強み|メリット|優位性)(?:は|：)(.+?)(?:[。、]|$)/g,
      /(?:他社との違い|差別化)(?:は|：)(.+?)(?:[。、]|$)/g,
      /(?:独自の|オリジナル|特別な)(.+?)(?:[。、]|$)/g
    ];

    const advantages: string[] = [];
    for (const pattern of advantagePatterns) {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        advantages.push(match[1].trim());
      }
    }

    return advantages;
  }

  private detectTone(input: string): 'professional' | 'friendly' | 'casual' | 'premium' {
    if (input.includes('高級') || input.includes('プレミアム') || input.includes('エグゼクティブ')) {
      return 'premium';
    }
    if (input.includes('親しみやすい') || input.includes('フレンドリー') || input.includes('気軽')) {
      return 'friendly';
    }
    if (input.includes('カジュアル') || input.includes('ラフ') || input.includes('リラックス')) {
      return 'casual';
    }
    return 'professional';
  }
}

// コンテンツ生成戦略
class ContentStrategy {
  generatePromptStrategy(context: any): any {
    const { industry, targetAudience, businessGoal, tone } = context;

    const strategies = {
      saas: {
        hero: '効率性と生産性向上を前面に出し、具体的な数値やROIを示す',
        features: '機能の技術的な詳細よりも、ユーザーが得る価値に焦点を当てる',
        cta: '無料トライアルやデモの提供を強調'
      },
      ecommerce: {
        hero: '商品の魅力と顧客の課題解決を強調',
        features: '商品の品質、配送、サポートの安心感を訴求',
        cta: '限定性や緊急性を演出（在庫限り、期間限定など）'
      },
      consulting: {
        hero: '専門性と実績を前面に出し、信頼性を重視',
        features: 'サービスプロセスと成功事例を具体的に説明',
        cta: '無料相談や診断の提供'
      }
    };

    return strategies[industry as keyof typeof strategies] || strategies.saas;
  }
}

// ヘルパー関数
function generateEnhancedPrompt(userInput: string, context: any, strategy: any, focusAreas: string[]): string {
  return `
【ビジネス要件】
原文: ${userInput}

【分析結果】
- 業界: ${context.industry}
- ターゲット: ${context.targetAudience}
- 目標: ${context.businessGoal}
- トーン: ${context.tone}
- 競合優位性: ${context.competitiveAdvantage.join(', ')}

【重点領域】
${focusAreas.join(', ')}

【コンテンツ戦略】
${JSON.stringify(strategy, null, 2)}

上記の分析結果に基づいて、ターゲットユーザーに響く高品質なランディングページを生成してください。
特に${context.tone}なトーンで、${context.businessGoal}を達成するための構成にしてください。
  `.trim();
}

function addVariationSeed(basePrompt: string, seedIndex: number): string {
  const variations = [
    '（レイアウト重視：視覚的に洗練されたデザイン）',
    '（コンバージョン重視：CTA最適化とフォーム配置）',
    '（コンテンツ重視：詳細な説明と信頼性構築）'
  ];

  return `${basePrompt}\n\n【デザインバリエーション】\n${variations[seedIndex] || variations[0]}`;
}

function extractTopicName(input: string): string {
  // 簡単なトピック名抽出ロジック
  const sentences = input.split(/[。．]/);
  const firstSentence = sentences[0];
  
  // サービス名やプロダクト名を推定
  const serviceMatch = firstSentence.match(/(.+?)(?:の|を|について|に関して)/);
  if (serviceMatch) {
    return serviceMatch[1].trim();
  }
  
  return firstSentence.substring(0, 30) + '...';
}

function getDesignFocus(variantIndex: number): string {
  const focuses = ['modern-clean', 'conversion-optimized', 'content-rich'];
  return focuses[variantIndex] || focuses[0];
}

// メインツール
export const intelligentLPGeneratorTool = tool({
  description: 'readdy.ai風の自然言語理解機能を持つインテリジェントなランディングページ生成ツール。ユーザーの自由な記述から業界、ターゲット、目標を自動推定し、最適化されたLPを生成します。',
  parameters: z.object({
    userInput: z.string().describe('ユーザーの自然言語による要望（例：「AI画像生成ツールのサービスを個人クリエイター向けに販売したい。月額制で、他社より高品質な画像が生成できることが強み」）'),
    designVariants: z.number().optional().default(2).describe('生成するデザインバリエーション数（1-3）'),
    focusAreas: z.array(z.enum(['conversion', 'branding', 'information', 'engagement'])).optional().describe('重点を置く要素')
  }),
  execute: async ({ userInput, designVariants = 2, focusAreas = ['conversion'] }) => {
    console.log(`🧠 Intelligent LP Generator: Analyzing input - "${userInput.substring(0, 100)}..."`);
    
    try {
      // 1. ビジネスコンテキストの分析
      const analyzer = new BusinessContextAnalyzer();
      const context = analyzer.analyzeInput(userInput);
      
      console.log('📊 Analyzed context:', context);

      // 2. コンテンツ戦略の決定
      const strategy = new ContentStrategy();
      const promptStrategy = strategy.generatePromptStrategy(context);

      // 3. 強化されたプロンプトの生成
      const enhancedPrompt = generateEnhancedPrompt(userInput, context, promptStrategy, focusAreas);

      // 4. 複数バリエーションの生成
      const variants = [];
      for (let i = 0; i < Math.min(designVariants, 3); i++) {
        const variantPrompt = addVariationSeed(enhancedPrompt, i);
        const result = await generateUnifiedLP({ topic: variantPrompt });
        
        variants.push({
          id: `variant_${i + 1}`,
          title: `${extractTopicName(userInput)} - バリエーション${i + 1}`,
          ...result,
          variantSeed: i,
          designFocus: getDesignFocus(i)
        });
      }

      console.log(`✅ Generated ${variants.length} variants successfully`);

      return {
        success: true,
        analysisResult: context,
        variants,
        recommendedVariant: 0, // 最初のバリエーションを推奨
        metadata: {
          originalInput: userInput,
          analyzedContext: context,
          contentStrategy: promptStrategy,
          focusAreas,
          generatedAt: new Date().toISOString(),
          version: '3.0-intelligent'
        }
      };

    } catch (error) {
      console.error('❌ Intelligent LP Generator failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorDetails: {
          type: error?.constructor?.name || 'UnknownError',
          stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
          timestamp: new Date().toISOString()
        },
        analysisResult: null,
        variants: [],
        metadata: {
          originalInput: userInput,
          error: true,
          generatedAt: new Date().toISOString(),
          version: '3.0-intelligent'
        }
      };
    }
  }
});