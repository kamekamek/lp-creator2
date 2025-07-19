/**
 * LP Creator Platform - Business Context Analyzer Tests
 */

import { BusinessContextAnalyzer, analyzeBusinessContext } from '../../src/mastra/tools/utils/businessContextAnalyzer';

describe('BusinessContextAnalyzer', () => {
    let analyzer: BusinessContextAnalyzer;

    beforeEach(() => {
        analyzer = new BusinessContextAnalyzer();
    });

    test('should detect SaaS industry from input', () => {
        const input = 'AIを活用したクラウドソフトウェアプラットフォームを提供しています。';
        const result = analyzer.analyzeInput(input);
        expect(result.industry).toBe('saas');
    });

    test('should detect ecommerce industry from input', () => {
        const input = 'オンラインショップで高級食材を販売しています。';
        const result = analyzer.analyzeInput(input);
        expect(result.industry).toBe('ecommerce');
    });

    test('should detect individual entrepreneurs as target audience', () => {
        const input = 'フリーランスや個人事業主向けの会計ツールです。';
        const result = analyzer.analyzeInput(input);
        expect(result.targetAudience).toBe('個人事業主');
    });

    test('should detect enterprise as target audience', () => {
        const input = '大企業向けのB2Bソリューションを提供しています。';
        const result = analyzer.analyzeInput(input);
        expect(result.targetAudience).toBe('エンタープライズ');
    });

    test('should detect lead generation as business goal', () => {
        const input = '資料請求やお問い合わせを増やしたいです。';
        const result = analyzer.analyzeInput(input);
        expect(result.businessGoal).toBe('リード獲得');
    });

    test('should detect sales increase as business goal', () => {
        const input = '商品の売上を向上させるランディングページが欲しいです。';
        const result = analyzer.analyzeInput(input);
        expect(result.businessGoal).toBe('売上向上');
    });

    test('should extract competitive advantages from input', () => {
        const input = '当社の強みは24時間対応のサポート体制です。他社との違いは使いやすいインターフェースです。';
        const result = analyzer.analyzeInput(input);
-       expect(result.competitiveAdvantage.some(adv => adv.includes('24時間対応のサポート体制'))).toBe(true);
-       expect(result.competitiveAdvantage.some(adv => adv.includes('使いやすいインターフェース'))).toBe(true);
+       expect(result.competitiveAdvantage).toContain('24時間対応のサポート体制');
+       expect(result.competitiveAdvantage).toContain('使いやすいインターフェース');
    });

    test('should detect professional tone from input', () => {
        const input = 'プロフェッショナルで信頼性の高いイメージを持つランディングページが必要です。';
        const result = analyzer.analyzeInput(input);
        expect(result.tone).toBe('professional');
    });

    test('should detect friendly tone from input', () => {
        const input = '親しみやすく、フレンドリーな雰囲気のランディングページを作りたいです。';
        const result = analyzer.analyzeInput(input);
        expect(result.tone).toBe('friendly');
    });

    test('should detect premium tone from input', () => {
        const input = '高級感のあるプレミアムなデザインのランディングページが欲しいです。';
        const result = analyzer.analyzeInput(input);
        expect(result.tone).toBe('premium');
    });

    test('should provide default values when no specific information is detected', () => {
        const input = 'ランディングページを作りたいです。';
        const result = analyzer.analyzeInput(input);
        expect(result.industry).toBe('general');
        expect(result.targetAudience).toBe('一般ユーザー');
        expect(result.businessGoal).toBe('コンバージョン向上');
        expect(result.competitiveAdvantage).toEqual([]);
        expect(result.tone).toBe('professional');
    });

    test('analyzeBusinessContext utility function should work correctly', () => {
        const input = 'AIを活用したクラウドソフトウェアを個人事業主向けに提供しています。強みは使いやすさです。';
        const result = analyzeBusinessContext(input);
        expect(result.industry).toBe('saas');
        expect(result.targetAudience).toBe('個人事業主');
        expect(result.competitiveAdvantage.some(adv => adv.includes('使いやすさ'))).toBe(true);
    });
});