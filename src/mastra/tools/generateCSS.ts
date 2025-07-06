import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const generateCSSSchema = z.object({
  html: z.string().describe('生成されたHTMLコード'),
  fileStructure: z.string().describe('ファイル構造設計'),
  technicalSpecs: z.string().describe('技術仕様'),
  designDirection: z.string().describe('デザイン方向性'),
});

const generateCSSOutputSchema = z.object({
  css: z.string().describe('完全なCSSコード'),
  cssModules: z.object({
    variables: z.string().describe('CSS変数'),
    base: z.string().describe('ベーススタイル'),
    components: z.string().describe('コンポーネントスタイル'),
    utilities: z.string().describe('ユーティリティクラス'),
  }).describe('モジュール化されたCSS'),
  performance: z.object({
    criticalCSS: z.string().describe('クリティカルCSS'),
    nonCriticalCSS: z.string().describe('非クリティカルCSS'),
  }).describe('パフォーマンス最適化'),
});

// CSS変数モジュール
const cssVariables = `
/* CSS変数による一元管理 */
:root {
  /* カラーシステム */
  --color-primary: #0066cc;
  --color-primary-dark: #0052a3;
  --color-primary-light: #4d94ff;
  --color-secondary: #ff6b35;
  --color-secondary-dark: #e55a2b;
  --color-accent: #00c851;
  --color-warning: #ffbb33;
  --color-danger: #ff4444;
  
  /* ニュートラルカラー */
  --color-white: #ffffff;
  --color-gray-50: #fafafa;
  --color-gray-100: #f5f5f5;
  --color-gray-200: #eeeeee;
  --color-gray-300: #e0e0e0;
  --color-gray-400: #bdbdbd;
  --color-gray-500: #9e9e9e;
  --color-gray-600: #757575;
  --color-gray-700: #616161;
  --color-gray-800: #424242;
  --color-gray-900: #212121;
  --color-black: #000000;
  
  /* テキストカラー */
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-700);
  --color-text-muted: var(--color-gray-500);
  --color-text-inverse: var(--color-white);
  
  /* タイポグラフィシステム */
  --font-family-primary: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
  --font-family-secondary: Georgia, 'Times New Roman', Times, serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  
  /* フォントサイズ（流体タイポグラフィ） */
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --font-size-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --font-size-3xl: clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem);
  --font-size-4xl: clamp(2.25rem, 1.8rem + 2.25vw, 3rem);
  --font-size-5xl: clamp(2.75rem, 2.2rem + 2.75vw, 3.75rem);
  
  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;
  
  /* フォントウェイト */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  
  /* スペーシングシステム（8pxベース） */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
  --space-32: 8rem;     /* 128px */
  
  /* シャドウシステム */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* 角丸 */
  --radius-none: 0;
  --radius-sm: 0.125rem;
  --radius-base: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  
  /* アニメーション */
  --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Z-index */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  
  /* ブレークポイント */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
  
  /* コンテナ幅 */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}`;

// ベーススタイルモジュール
const baseStyles = `
/* リセット・ベーススタイル */
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  line-height: 1.6;
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
}

body {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-white);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* フォーカス管理 */
:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}

/* スキップリンク */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary);
  color: var(--color-white);
  padding: 8px;
  text-decoration: none;
  border-radius: var(--radius-base);
  z-index: var(--z-tooltip);
  transition: var(--transition-fast);
}

.skip-link:focus {
  top: 6px;
}

/* 基本要素 */
h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
}

h1 { font-size: var(--font-size-4xl); }
h2 { font-size: var(--font-size-3xl); }
h3 { font-size: var(--font-size-2xl); }
h4 { font-size: var(--font-size-xl); }
h5 { font-size: var(--font-size-lg); }
h6 { font-size: var(--font-size-base); }

p {
  margin-bottom: var(--space-4);
  line-height: var(--line-height-relaxed);
}

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: var(--transition-fast);
}

a:hover, a:focus {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* コンテナ */
.container {
  width: 100%;
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 640px) {
  .container { padding: 0 var(--space-6); }
}

@media (min-width: 1024px) {
  .container { padding: 0 var(--space-8); }
}`;

// コンポーネントスタイルモジュール
const componentStyles = `
/* ヘッダー・ナビゲーション */
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  transition: var(--transition-base);
}

.navbar {
  padding: var(--space-4) 0;
}

.navbar.scrolled {
  box-shadow: var(--shadow-md);
}

.navbar.hidden {
  transform: translateY(-100%);
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand .logo {
  height: 40px;
  width: auto;
}

.navbar-nav {
  display: flex;
  list-style: none;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
}

.nav-link {
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-base);
  transition: var(--transition-fast);
}

.nav-link:hover, .nav-link:focus {
  background: var(--color-gray-100);
  text-decoration: none;
}

.cta-nav {
  background: var(--color-primary);
  color: var(--color-white);
}

.cta-nav:hover, .cta-nav:focus {
  background: var(--color-primary-dark);
  color: var(--color-white);
}

/* ボタン */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  text-align: center;
  text-decoration: none;
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover, .btn-primary:focus {
  background: var(--color-primary-dark);
  color: var(--color-white);
  text-decoration: none;
}

.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-outline:hover, .btn-outline:focus {
  background: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
}

.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--font-size-lg);
}

.btn-full {
  width: 100%;
  justify-content: center;
}

/* セクション */
section {
  padding: var(--space-20) 0;
}

.section-title {
  text-align: center;
  margin-bottom: var(--space-12);
  font-size: var(--font-size-3xl);
}

/* ヒーロー */
.hero {
  padding: var(--space-24) 0;
  background: linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-white) 100%);
}

.hero .container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  align-items: center;
}

.hero-title {
  font-size: var(--font-size-5xl);
  margin-bottom: var(--space-6);
}

.hero-subtitle {
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-8);
}

.hero-cta {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cta-help {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.hero-img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}

/* カード */
.card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  padding: var(--space-6);
  transition: var(--transition-base);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* グリッドレイアウト */
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.problem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

.problem-card {
  text-align: center;
  padding: var(--space-8);
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  transition: var(--transition-base);
}

.problem-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.problem-icon {
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: var(--space-4);
}

/* フォーム */
.form-group {
  margin-bottom: var(--space-6);
}

.form-label {
  display: block;
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
}

.required {
  color: var(--color-danger);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-3);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-base);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: var(--transition-fast);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-input:invalid,
.form-textarea:invalid {
  border-color: var(--color-danger);
}

.form-help {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.form-privacy {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

/* フッター */
.footer {
  background: var(--color-gray-900);
  color: var(--color-white);
  padding: var(--space-16) 0 var(--space-8);
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

.footer-logo {
  height: 40px;
  width: auto;
  margin-bottom: var(--space-4);
}

.footer-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: var(--space-2);
}

.footer-links a {
  color: var(--color-gray-300);
  transition: var(--transition-fast);
}

.footer-links a:hover, .footer-links a:focus {
  color: var(--color-white);
}

.footer-bottom {
  text-align: center;
  padding-top: var(--space-8);
  border-top: 1px solid var(--color-gray-700);
  color: var(--color-gray-400);
}`;

// ユーティリティクラスモジュール
const utilityStyles = `
/* レスポンシブ対応 */
@media (max-width: 767px) {
  .hero .container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .hero-image {
    order: -1;
  }
  
  .navbar-nav {
    display: none;
  }
  
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }
  
  .hero-title {
    font-size: var(--font-size-3xl);
  }
  
  .section-title {
    font-size: var(--font-size-2xl);
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 var(--space-3);
  }
  
  section {
    padding: var(--space-12) 0;
  }
  
  .hero {
    padding: var(--space-16) 0;
  }
  
  .btn {
    padding: var(--space-3) var(--space-4);
  }
  
  .btn-lg {
    padding: var(--space-4) var(--space-6);
  }
}

/* アニメーション */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.6s ease-out;
}

/* アクセシビリティ */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.keyboard-navigation *:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* プリント対応 */
@media print {
  .navbar,
  .footer,
  .btn {
    display: none;
  }
  
  body {
    font-size: 12pt;
    line-height: 1.4;
  }
  
  h1, h2, h3 {
    page-break-after: avoid;
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: var(--color-gray-100);
    --color-text-secondary: var(--color-gray-300);
    --color-text-muted: var(--color-gray-400);
    --color-white: var(--color-gray-900);
    --color-gray-50: var(--color-gray-800);
    --color-gray-100: var(--color-gray-700);
    --color-gray-200: var(--color-gray-600);
  }
  
  .hero {
    background: linear-gradient(135deg, var(--color-gray-800) 0%, var(--color-gray-900) 100%);
  }
  
  .card {
    background: var(--color-gray-800);
  }
  
  .form-input,
  .form-textarea {
    background: var(--color-gray-800);
    border-color: var(--color-gray-600);
    color: var(--color-text-primary);
  }
}`;

// CSS結合関数
function combineCSSModules(modules: string[], options: { minify?: boolean } = {}): string {
  const combined = modules.join('\n\n');
  
  if (options.minify) {
    // 簡単な圧縮処理
    return combined
      .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '') // コメント削除
      .replace(/\s+/g, ' ') // 空白文字の圧縮
      .replace(/;\s*}/g, '}') // セミコロン最適化
      .trim();
  }
  
  return combined;
}

// クリティカルCSS抽出関数
function extractCriticalCSS(fullCSS: string): { critical: string; nonCritical: string } {
  const criticalSelectors = [
    'html', 'body', ':root',
    '.container', '.header', '.navbar', '.hero',
    '.btn', '.btn-primary', '.skip-link',
    'h1', 'h2', 'h3', 'p', 'a'
  ];
  
  const lines = fullCSS.split('\n');
  const criticalLines: string[] = [];
  const nonCriticalLines: string[] = [];
  
  let inCriticalBlock = false;
  let braceCount = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('{')) {
      const selector = trimmedLine.substring(0, trimmedLine.indexOf('{')).trim();
      inCriticalBlock = criticalSelectors.some(cs => selector.includes(cs));
      braceCount = 1;
    } else if (trimmedLine.includes('}')) {
      braceCount--;
      if (braceCount === 0) {
        inCriticalBlock = false;
      }
    } else if (trimmedLine.includes('{') && trimmedLine.includes('}')) {
      // 単行ルール
      const selector = trimmedLine.substring(0, trimmedLine.indexOf('{')).trim();
      inCriticalBlock = criticalSelectors.some(cs => selector.includes(cs));
    }
    
    if (inCriticalBlock || braceCount > 0 && inCriticalBlock) {
      criticalLines.push(line);
    } else {
      nonCriticalLines.push(line);
    }
  }
  
  return {
    critical: criticalLines.join('\n'),
    nonCritical: nonCriticalLines.join('\n')
  };
}

export const generateCSSTool = createTool({
  id: 'generateCSS',
  description: 'プロフェッショナルなランディングページのCSSを生成する（モジュール化対応）',
  inputSchema: generateCSSSchema,
  outputSchema: generateCSSOutputSchema,
  execute: async ({ context }) => {
    const { html, fileStructure, technicalSpecs, designDirection } = context;
    
    // モジュール化されたCSS
    const cssModules = {
      variables: cssVariables,
      base: baseStyles,
      components: componentStyles,
      utilities: utilityStyles,
    };
    
    // 完全なCSSを生成
    const fullCSS = combineCSSModules([
      cssModules.variables,
      cssModules.base,
      cssModules.components,
      cssModules.utilities
    ]);
    
    // クリティカルCSS抽出
    const { critical, nonCritical } = extractCriticalCSS(fullCSS);
    
    return {
      css: fullCSS,
      cssModules,
      performance: {
        criticalCSS: critical,
        nonCriticalCSS: nonCritical,
      },
    };
  },
});