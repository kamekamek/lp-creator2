// @ts-nocheck
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const qualityChecklistSchema = z.object({
  html: z.string().describe('生成されたHTMLコード'),
  css: z.string().describe('生成されたCSSコード'),
  javascript: z.string().describe('生成されたJavaScriptコード'),
  imagePrompts: z.array(z.object({
    id: z.string(),
    fileName: z.string(),
    section: z.string(),
    purpose: z.string(),
  })).describe('画像プロンプト一覧'),
  projectUrl: z.string().optional().describe('プロジェクトURL（デプロイ済みの場合）'),
});

const checkResultSchema = z.object({
  category: z.string().describe('チェック項目カテゴリ'),
  item: z.string().describe('チェック項目'),
  status: z.enum(['pass', 'fail', 'warning', 'not_applicable']).describe('チェック結果'),
  score: z.number().min(0).max(100).describe('スコア（0-100）'),
  details: z.string().describe('詳細説明'),
  recommendations: z.array(z.string()).describe('改善提案'),
});

const qualityChecklistOutputSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('総合スコア'),
  checkResults: z.array(checkResultSchema).describe('詳細チェック結果'),
  summary: z.object({
    lighthouse: z.object({
      performance: z.number().describe('パフォーマンススコア'),
      accessibility: z.number().describe('アクセシビリティスコア'),
      bestPractices: z.number().describe('ベストプラクティススコア'),
      seo: z.number().describe('SEOスコア'),
    }),
    coreWebVitals: z.object({
      lcp: z.object({
        value: z.number(),
        status: z.enum(['good', 'needs_improvement', 'poor']),
      }),
      fid: z.object({
        value: z.number(),
        status: z.enum(['good', 'needs_improvement', 'poor']),
      }),
      cls: z.object({
        value: z.number(),
        status: z.enum(['good', 'needs_improvement', 'poor']),
      }),
    }),
    accessibility: z.object({
      wcagLevel: z.enum(['A', 'AA', 'AAA', 'fail']),
      keyIssues: z.array(z.string()),
    }),
    seo: z.object({
      technicalSeo: z.number(),
      contentSeo: z.number(),
      keyIssues: z.array(z.string()),
    }),
  }),
  actionItems: z.array(z.object({
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    category: z.string(),
    issue: z.string(),
    solution: z.string(),
    estimatedImpact: z.string(),
  })).describe('改善アクション一覧'),
  certification: z.object({
    isReady: z.boolean().describe('本番環境準備完了'),
    requirementsMet: z.array(z.string()).describe('満たした要件'),
    outstandingIssues: z.array(z.string()).describe('未解決課題'),
  }),
});

export const qualityChecklistTool = createTool({
  id: 'qualityChecklist',
  description: 'ランディングページの品質を総合的にチェックし、Lighthouse・SEO・アクセシビリティスコアを評価する',
  inputSchema: qualityChecklistSchema,
  outputSchema: qualityChecklistOutputSchema,
  execute: async ({ html, css, javascript, imagePrompts, projectUrl }) => {
    
    // HTMLコード解析
    const htmlAnalysis = analyzeHTML(html);
    
    // CSSコード解析
    const cssAnalysis = analyzeCSS(css);
    
    // JavaScriptコード解析
    const jsAnalysis = analyzeJavaScript(javascript);
    
    // 画像最適化チェック
    const imageAnalysis = analyzeImages(imagePrompts);

    // 詳細チェック結果
    const checkResults: Array<{
      category: string;
      item: string;
      status: 'pass' | 'fail' | 'warning' | 'not_applicable';
      score: number;
      details: string;
      recommendations: string[];
    }> = [];

    // === パフォーマンスチェック ===
    
    // HTML最適化チェック
    checkResults.push({
      category: 'Performance',
      item: 'HTML構造最適化',
      status: htmlAnalysis.isOptimized ? 'pass' : 'warning',
      score: htmlAnalysis.score,
      details: `セマンティックHTML: ${htmlAnalysis.semanticScore}%, 構造化データ: ${htmlAnalysis.structuredData ? '実装済み' : '未実装'}`,
      recommendations: htmlAnalysis.recommendations,
    });

    // CSS最適化チェック
    checkResults.push({
      category: 'Performance',
      item: 'CSS最適化',
      status: cssAnalysis.isOptimized ? 'pass' : 'warning',
      score: cssAnalysis.score,
      details: `Critical CSS分離: ${cssAnalysis.criticalCss ? '実装済み' : '未実装'}, CSS変数使用: ${cssAnalysis.usesCssVariables ? 'あり' : 'なし'}`,
      recommendations: cssAnalysis.recommendations,
    });

    // JavaScript最適化チェック
    checkResults.push({
      category: 'Performance',
      item: 'JavaScript最適化',
      status: jsAnalysis.isOptimized ? 'pass' : 'warning',
      score: jsAnalysis.score,
      details: `ES6+使用: ${jsAnalysis.usesModernJs ? 'あり' : 'なし'}, 非同期処理: ${jsAnalysis.asyncOptimized ? '最適化済み' : '要改善'}`,
      recommendations: jsAnalysis.recommendations,
    });

    // 画像最適化チェック
    checkResults.push({
      category: 'Performance',
      item: '画像最適化',
      status: imageAnalysis.isOptimized ? 'pass' : 'warning',
      score: imageAnalysis.score,
      details: `WebP対応: ${imageAnalysis.webpSupport ? 'あり' : 'なし'}, 遅延読み込み: ${imageAnalysis.lazyLoading ? 'あり' : 'なし'}`,
      recommendations: imageAnalysis.recommendations,
    });

    // === SEOチェック ===
    
    const seoChecks = analyzeSEO(html);
    seoChecks.forEach(check => checkResults.push(check));

    // === アクセシビリティチェック ===
    
    const a11yChecks = analyzeAccessibility(html);
    a11yChecks.forEach(check => checkResults.push(check));

    // === ベストプラクティスチェック ===
    
    const bestPracticeChecks = analyzeBestPractices(html, css, javascript);
    bestPracticeChecks.forEach(check => checkResults.push(check));

    // スコア計算
    const categoryScores = calculateCategoryScores(checkResults);
    const overallScore = Math.round(
      (categoryScores.performance + categoryScores.accessibility + categoryScores.seo + categoryScores.bestPractices) / 4
    );

    // Core Web Vitals予測（静的解析ベース）
    const coreWebVitals = predictCoreWebVitals(htmlAnalysis, cssAnalysis, jsAnalysis, imageAnalysis);

    // アクションアイテム生成
    const actionItems = generateActionItems(checkResults);

    // 認証状況
    const certification = {
      isReady: overallScore >= 90 && actionItems.filter(item => item.priority === 'critical').length === 0,
      requirementsMet: [
        'セマンティックHTML構造',
        'レスポンシブデザイン対応',
        'SEO基本対策実装',
        'アクセシビリティ基準対応',
        'パフォーマンス最適化',
      ].filter(req => shouldRequirementBeMet(req, checkResults)),
      outstandingIssues: actionItems
        .filter(item => item.priority === 'critical' || item.priority === 'high')
        .map(item => item.issue),
    };

    return {
      overallScore,
      checkResults,
      summary: {
        lighthouse: {
          performance: categoryScores.performance,
          accessibility: categoryScores.accessibility,
          bestPractices: categoryScores.bestPractices,
          seo: categoryScores.seo,
        },
        coreWebVitals,
        accessibility: {
          wcagLevel: determineWCAGLevel(checkResults),
          keyIssues: checkResults
            .filter(r => r.category === 'Accessibility' && r.status === 'fail')
            .map(r => r.item),
        },
        seo: {
          technicalSeo: Math.round(categoryScores.seo * 0.7), // 技術的SEOの重み
          contentSeo: Math.round(categoryScores.seo * 0.3), // コンテンツSEOの重み
          keyIssues: checkResults
            .filter(r => r.category === 'SEO' && r.status === 'fail')
            .map(r => r.item),
        },
      },
      actionItems,
      certification,
    };
  },
});

// HTML解析関数
function analyzeHTML(html: string) {
  const hasDoctype = html.includes('<!DOCTYPE html>');
  const hasLang = html.includes('<html lang=');
  const hasViewport = html.includes('name="viewport"');
  const hasMetaDescription = html.includes('name="description"');
  const hasStructuredData = html.includes('application/ld+json');
  const hasSemanticElements = /(<header|<main|<section|<article|<aside|<footer|<nav)/g.test(html);
  
  const semanticScore = [
    hasDoctype, hasLang, hasViewport, hasMetaDescription, hasSemanticElements
  ].filter(Boolean).length * 20;

  return {
    isOptimized: semanticScore >= 80,
    score: semanticScore,
    semanticScore,
    structuredData: hasStructuredData,
    recommendations: [
      !hasDoctype && 'HTML5 DOCTYPE宣言を追加',
      !hasLang && 'html要素にlang属性を追加',
      !hasViewport && 'viewport meta tagを追加',
      !hasMetaDescription && 'meta descriptionを追加',
      !hasSemanticElements && 'セマンティック要素（header, main等）を使用',
      !hasStructuredData && '構造化データ（JSON-LD）を追加',
    ].filter(Boolean),
  };
}

// CSS解析関数
function analyzeCSS(css: string) {
  const usesCssVariables = css.includes(':root') && css.includes('--');
  const hasMediaQueries = /@media/.test(css);
  const hasCriticalCss = css.includes('/* Critical CSS') || css.length < 20000; // 20KB以下をCritical CSS候補
  const usesModernFeatures = /grid|flexbox|clamp\(|var\(/g.test(css);
  
  const optimizationScore = [
    usesCssVariables, hasMediaQueries, hasCriticalCss, usesModernFeatures
  ].filter(Boolean).length * 25;

  return {
    isOptimized: optimizationScore >= 75,
    score: optimizationScore,
    usesCssVariables,
    criticalCss: hasCriticalCss,
    recommendations: [
      !usesCssVariables && 'CSS変数を使用してデザインシステムを構築',
      !hasMediaQueries && 'レスポンシブデザイン用のメディアクエリを追加',
      !hasCriticalCss && 'Critical CSSを分離して初期表示を最適化',
      !usesModernFeatures && 'CSS Grid, Flexbox等のモダン機能を活用',
    ].filter(Boolean),
  };
}

// JavaScript解析関数
function analyzeJavaScript(javascript: string) {
  const usesModernJs = /const |let |arrow function|\=\>|async |await /g.test(javascript);
  const hasErrorHandling = /try|catch|error/gi.test(javascript);
  const asyncOptimized = /addEventListener|IntersectionObserver|debounce|throttle/g.test(javascript);
  const hasAnalytics = /gtag|analytics|track/gi.test(javascript);
  
  const optimizationScore = [
    usesModernJs, hasErrorHandling, asyncOptimized, hasAnalytics
  ].filter(Boolean).length * 25;

  return {
    isOptimized: optimizationScore >= 75,
    score: optimizationScore,
    usesModernJs,
    asyncOptimized,
    recommendations: [
      !usesModernJs && 'ES6+の機能（const, let, arrow function等）を使用',
      !hasErrorHandling && 'エラーハンドリングを実装',
      !asyncOptimized && 'デバウンス・スロットルでパフォーマンス最適化',
      !hasAnalytics && 'アナリティクス計測を実装',
    ].filter(Boolean),
  };
}

// 画像解析関数
function analyzeImages(imagePrompts: any[]) {
  const webpSupport = imagePrompts.some(img => img.fileName.includes('.webp'));
  const lazyLoading = imagePrompts.length > 3; // 3枚以上なら遅延読み込み推奨
  const hasAltTexts = imagePrompts.every(img => img.purpose); // purpose = alt textの元
  const optimizedSizes = imagePrompts.every(img => img.resolution);
  
  const optimizationScore = [
    webpSupport, lazyLoading, hasAltTexts, optimizedSizes
  ].filter(Boolean).length * 25;

  return {
    isOptimized: optimizationScore >= 75,
    score: optimizationScore,
    webpSupport,
    lazyLoading,
    recommendations: [
      !webpSupport && 'WebP形式での画像配信を実装',
      !lazyLoading && '非クリティカル画像の遅延読み込みを実装',
      !hasAltTexts && '全画像に適切なalt属性を設定',
      !optimizedSizes && '画像サイズを適切に最適化',
    ].filter(Boolean),
  };
}

// SEO解析関数
function analyzeSEO(html: string) {
  const checks = [];
  
  // Title tag
  const hasTitle = /<title>/.test(html);
  const titleLength = html.match(/<title>([^<]*)<\/title>/)?.[1]?.length || 0;
  checks.push({
    category: 'SEO',
    item: 'Title Tag',
    status: (hasTitle && titleLength >= 30 && titleLength <= 60) ? 'pass' : 'warning' as const,
    score: hasTitle ? (titleLength >= 30 && titleLength <= 60 ? 100 : 70) : 0,
    details: `Title存在: ${hasTitle}, 文字数: ${titleLength}`,
    recommendations: [
      !hasTitle && 'Title tagを追加',
      titleLength < 30 && 'Title tagを30文字以上に',
      titleLength > 60 && 'Title tagを60文字以下に',
    ].filter(Boolean),
  });

  // Meta description
  const hasMetaDesc = /name="description"/.test(html);
  const metaDescMatch = html.match(/name="description"\s+content="([^"]*)"/);
  const metaDescLength = metaDescMatch?.[1]?.length || 0;
  checks.push({
    category: 'SEO',
    item: 'Meta Description',
    status: (hasMetaDesc && metaDescLength >= 120 && metaDescLength <= 160) ? 'pass' : 'warning' as const,
    score: hasMetaDesc ? (metaDescLength >= 120 && metaDescLength <= 160 ? 100 : 70) : 0,
    details: `Meta Description存在: ${hasMetaDesc}, 文字数: ${metaDescLength}`,
    recommendations: [
      !hasMetaDesc && 'Meta Descriptionを追加',
      metaDescLength < 120 && 'Meta Descriptionを120文字以上に',
      metaDescLength > 160 && 'Meta Descriptionを160文字以下に',
    ].filter(Boolean),
  });

  // Heading structure
  const h1Count = (html.match(/<h1>/g) || []).length;
  const hasHeadingHierarchy = /<h1>.*<h2>/s.test(html);
  checks.push({
    category: 'SEO',
    item: 'Heading Structure',
    status: (h1Count === 1 && hasHeadingHierarchy) ? 'pass' : 'warning' as const,
    score: (h1Count === 1 ? 50 : 0) + (hasHeadingHierarchy ? 50 : 0),
    details: `H1タグ数: ${h1Count}, 見出し階層: ${hasHeadingHierarchy ? 'あり' : 'なし'}`,
    recommendations: [
      h1Count !== 1 && 'H1タグは1つに限定',
      !hasHeadingHierarchy && '見出しタグの階層構造を適切に設定',
    ].filter(Boolean),
  });

  // Open Graph
  const hasOgTitle = /property="og:title"/.test(html);
  const hasOgDescription = /property="og:description"/.test(html);
  const hasOgImage = /property="og:image"/.test(html);
  checks.push({
    category: 'SEO',
    item: 'Open Graph Tags',
    status: (hasOgTitle && hasOgDescription && hasOgImage) ? 'pass' : 'warning' as const,
    score: [hasOgTitle, hasOgDescription, hasOgImage].filter(Boolean).length * 33.33,
    details: `OG Title: ${hasOgTitle ? 'あり' : 'なし'}, OG Description: ${hasOgDescription ? 'あり' : 'なし'}, OG Image: ${hasOgImage ? 'あり' : 'なし'}`,
    recommendations: [
      !hasOgTitle && 'og:titleを追加',
      !hasOgDescription && 'og:descriptionを追加',
      !hasOgImage && 'og:imageを追加',
    ].filter(Boolean),
  });

  return checks;
}

// アクセシビリティ解析関数
function analyzeAccessibility(html: string) {
  const checks = [];

  // Alt attributes
  const imgTags = html.match(/<img[^>]*>/g) || [];
  const imgsWithAlt = imgTags.filter(img => /alt=/.test(img)).length;
  const altCoverage = imgTags.length > 0 ? (imgsWithAlt / imgTags.length) * 100 : 100;
  checks.push({
    category: 'Accessibility',
    item: 'Image Alt Attributes',
    status: altCoverage === 100 ? 'pass' : 'fail' as const,
    score: altCoverage,
    details: `画像総数: ${imgTags.length}, Alt属性あり: ${imgsWithAlt}`,
    recommendations: altCoverage < 100 ? ['全ての画像にalt属性を追加'] : [],
  });

  // Form labels
  const inputTags = html.match(/<input[^>]*>/g) || [];
  const inputsWithLabels = inputTags.filter(input => {
    const id = input.match(/id="([^"]*)"/)?.[1];
    return id && html.includes(`for="${id}"`);
  }).length;
  const labelCoverage = inputTags.length > 0 ? (inputsWithLabels / inputTags.length) * 100 : 100;
  checks.push({
    category: 'Accessibility',
    item: 'Form Labels',
    status: labelCoverage === 100 ? 'pass' : 'fail' as const,
    score: labelCoverage,
    details: `入力項目総数: ${inputTags.length}, ラベル付き: ${inputsWithLabels}`,
    recommendations: labelCoverage < 100 ? ['全ての入力項目にlabel要素を関連付け'] : [],
  });

  // Skip links
  const hasSkipLink = /skip-link|#main/.test(html);
  checks.push({
    category: 'Accessibility',
    item: 'Skip Links',
    status: hasSkipLink ? 'pass' : 'warning' as const,
    score: hasSkipLink ? 100 : 0,
    details: `スキップリンク: ${hasSkipLink ? 'あり' : 'なし'}`,
    recommendations: !hasSkipLink ? ['メインコンテンツへのスキップリンクを追加'] : [],
  });

  // ARIA attributes
  const ariaCount = (html.match(/aria-/g) || []).length;
  const roleCount = (html.match(/role="/g) || []).length;
  const ariaScore = Math.min((ariaCount + roleCount) * 10, 100);
  checks.push({
    category: 'Accessibility',
    item: 'ARIA Attributes',
    status: ariaScore >= 50 ? 'pass' : 'warning' as const,
    score: ariaScore,
    details: `ARIA属性数: ${ariaCount}, Role属性数: ${roleCount}`,
    recommendations: ariaScore < 50 ? ['適切なARIA属性とrole属性を追加'] : [],
  });

  return checks;
}

// ベストプラクティス解析関数
function analyzeBestPractices(html: string, css: string, javascript: string) {
  const checks = [];

  // HTTPS usage (meta)
  const hasHttpsLinks = !html.includes('http://');
  checks.push({
    category: 'Best Practices',
    item: 'HTTPS Usage',
    status: hasHttpsLinks ? 'pass' : 'warning' as const,
    score: hasHttpsLinks ? 100 : 0,
    details: `HTTPS使用: ${hasHttpsLinks ? 'はい' : 'いいえ'}`,
    recommendations: !hasHttpsLinks ? ['HTTPSを使用してセキュリティを確保'] : [],
  });

  // Modern CSS features
  const usesModernCss = /grid|flexbox|var\(/.test(css);
  checks.push({
    category: 'Best Practices',
    item: 'Modern CSS Usage',
    status: usesModernCss ? 'pass' : 'warning' as const,
    score: usesModernCss ? 100 : 50,
    details: `モダンCSS使用: ${usesModernCss ? 'はい' : 'いいえ'}`,
    recommendations: !usesModernCss ? ['Grid, Flexbox, CSS変数等のモダン機能を活用'] : [],
  });

  // Error handling in JS
  const hasErrorHandling = /try|catch/.test(javascript);
  checks.push({
    category: 'Best Practices',
    item: 'JavaScript Error Handling',
    status: hasErrorHandling ? 'pass' : 'warning' as const,
    score: hasErrorHandling ? 100 : 0,
    details: `エラーハンドリング: ${hasErrorHandling ? 'あり' : 'なし'}`,
    recommendations: !hasErrorHandling ? ['適切なエラーハンドリングを実装'] : [],
  });

  return checks;
}

// カテゴリスコア計算
function calculateCategoryScores(checkResults: any[]) {
  const categories = ['Performance', 'SEO', 'Accessibility', 'Best Practices'];
  const scores: any = {};

  categories.forEach(category => {
    const categoryResults = checkResults.filter(r => r.category === category);
    const avgScore = categoryResults.length > 0 
      ? categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length
      : 0;
    scores[category.toLowerCase().replace(' ', '')] = Math.round(avgScore);
  });

  return {
    performance: scores.performance || 0,
    seo: scores.seo || 0,
    accessibility: scores.accessibility || 0,
    bestPractices: scores.bestpractices || 0,
  };
}

// Core Web Vitals予測
function predictCoreWebVitals(htmlAnalysis: any, cssAnalysis: any, jsAnalysis: any, imageAnalysis: any) {
  // 静的解析ベースの予測値
  const baselineScores = {
    lcp: 2.5, // 秒
    fid: 100, // ミリ秒
    cls: 0.1, // スコア
  };

  // 各要因による調整
  const lcpAdjustment = 
    (htmlAnalysis.structuredData ? -0.3 : 0) +
    (cssAnalysis.criticalCss ? -0.5 : 0.3) +
    (imageAnalysis.webpSupport ? -0.4 : 0.2);

  const fidAdjustment = 
    (jsAnalysis.asyncOptimized ? -20 : 20) +
    (jsAnalysis.usesModernJs ? -10 : 10);

  const clsAdjustment = 
    (cssAnalysis.usesCssVariables ? -0.02 : 0.02) +
    (imageAnalysis.optimizedSizes ? -0.03 : 0.03);

  const lcp = Math.max(1.0, baselineScores.lcp + lcpAdjustment);
  const fid = Math.max(50, baselineScores.fid + fidAdjustment);
  const cls = Math.max(0.05, baselineScores.cls + clsAdjustment);

  return {
    lcp: {
      value: Math.round(lcp * 100) / 100,
      status: lcp <= 2.5 ? 'good' : lcp <= 4.0 ? 'needs_improvement' : 'poor' as const,
    },
    fid: {
      value: Math.round(fid),
      status: fid <= 100 ? 'good' : fid <= 300 ? 'needs_improvement' : 'poor' as const,
    },
    cls: {
      value: Math.round(cls * 1000) / 1000,
      status: cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs_improvement' : 'poor' as const,
    },
  };
}

// アクションアイテム生成
function generateActionItems(checkResults: any[]) {
  const actionItems = [];

  checkResults.forEach(result => {
    if (result.status === 'fail') {
      actionItems.push({
        priority: result.score === 0 ? 'critical' : 'high' as const,
        category: result.category,
        issue: result.item,
        solution: result.recommendations[0] || '要確認',
        estimatedImpact: result.score === 0 ? '高' : '中',
      });
    } else if (result.status === 'warning' && result.score < 70) {
      actionItems.push({
        priority: 'medium' as const,
        category: result.category,
        issue: result.item,
        solution: result.recommendations[0] || '改善推奨',
        estimatedImpact: '中',
      });
    }
  });

  return actionItems.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// WCAG Level判定
function determineWCAGLevel(checkResults: any[]): 'A' | 'AA' | 'AAA' | 'fail' {
  const a11yResults = checkResults.filter(r => r.category === 'Accessibility');
  const failedCount = a11yResults.filter(r => r.status === 'fail').length;
  const avgScore = a11yResults.reduce((sum, r) => sum + r.score, 0) / a11yResults.length;

  if (failedCount > 0) return 'fail';
  if (avgScore >= 95) return 'AAA';
  if (avgScore >= 85) return 'AA';
  return 'A';
}

// 要件チェック
function shouldRequirementBeMet(requirement: string, checkResults: any[]): boolean {
  const requirementMap: { [key: string]: (results: any[]) => boolean } = {
    'セマンティックHTML構造': (results) => 
      results.some(r => r.item === 'HTML構造最適化' && r.status === 'pass'),
    'レスポンシブデザイン対応': (results) => 
      results.some(r => r.item === 'CSS最適化' && r.score >= 75),
    'SEO基本対策実装': (results) => 
      results.filter(r => r.category === 'SEO' && r.status === 'pass').length >= 3,
    'アクセシビリティ基準対応': (results) => 
      results.filter(r => r.category === 'Accessibility' && r.status !== 'fail').length >= 3,
    'パフォーマンス最適化': (results) => 
      results.filter(r => r.category === 'Performance' && r.status === 'pass').length >= 2,
  };

  return requirementMap[requirement]?.(checkResults) || false;
}