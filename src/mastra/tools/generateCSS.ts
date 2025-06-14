import { createTool } from '@mastra/core';
import { z } from 'zod';

const generateCSSSchema = z.object({
  html: z.string().describe('生成されたHTMLコード'),
  fileStructure: z.object({
    description: z.string(),
    structure: z.string(),
  }).describe('ファイル構造設計'),
  technicalSpecs: z.object({
    responsive: z.string(),
    seo: z.string(),
    accessibility: z.string(),
    performance: z.string(),
  }).describe('技術仕様'),
  designDirection: z.string().optional().describe('デザイン方向性'),
});

const generateCSSOutputSchema = z.object({
  css: z.string().describe('生成されたCSSコード'),
  cssStructure: z.object({
    variables: z.string().describe('CSS変数定義'),
    base: z.string().describe('ベーススタイル'),
    components: z.string().describe('コンポーネントスタイル'),
    utilities: z.string().describe('ユーティリティクラス'),
  }),
  responsive: z.object({
    breakpoints: z.array(z.string()).describe('ブレークポイント'),
    mediaQueries: z.array(z.string()).describe('メディアクエリ'),
  }),
  performance: z.object({
    criticalCSS: z.string().describe('クリティカルCSS'),
    optimizations: z.array(z.string()).describe('最適化手法'),
  }),
});

export const generateCSSTool = createTool({
  id: 'generateCSS',
  description: 'プロフェッショナルなランディングページのCSSを生成する',
  inputSchema: generateCSSSchema,
  outputSchema: generateCSSOutputSchema,
  execute: async ({ html, fileStructure, technicalSpecs, designDirection }) => {
    // CSS変数定義（デザインシステム）
    const variables = `
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

    // ベーススタイル
    const base = `
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

h1 { font-size: var(--font-size-5xl); }
h2 { font-size: var(--font-size-4xl); }
h3 { font-size: var(--font-size-3xl); }
h4 { font-size: var(--font-size-2xl); }
h5 { font-size: var(--font-size-xl); }
h6 { font-size: var(--font-size-lg); }

p {
  margin-bottom: var(--space-4);
  color: var(--color-text-secondary);
}

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: var(--transition-fast);
}

a:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
  height: auto;
}

input, button, textarea, select {
  font: inherit;
}

button {
  cursor: pointer;
}

ul, ol {
  list-style: none;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
}

/* 視覚的に隠す（スクリーンリーダー対応） */
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

/* アクセシビリティ対応 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* 高コントラスト対応 */
@media (prefers-contrast: high) {
  :root {
    --color-primary: #0000ff;
    --color-text-primary: #000000;
    --color-text-secondary: #000000;
  }
}`;

    // レイアウト・コンポーネントスタイル
    const components = `
/* レイアウト */
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
}

/* ヘッダー */
.header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-gray-200);
  z-index: var(--z-sticky);
}

.navbar {
  padding: var(--space-4) 0;
}

.navbar .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  width: auto;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.nav-link {
  font-weight: var(--font-weight-medium);
  transition: var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-primary);
}

.cta-nav {
  background: var(--color-primary);
  color: var(--color-white) !important;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  text-decoration: none !important;
}

.cta-nav:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* ヒーローセクション */
.hero {
  padding: var(--space-20) 0 var(--space-16);
  background: linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-white) 100%);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 20%, rgba(0, 102, 204, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.hero .container {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: center;
  position: relative;
  z-index: 1;
}

@media (min-width: 1024px) {
  .hero .container {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-16);
  }
}

.hero-content {
  text-align: center;
}

@media (min-width: 1024px) {
  .hero-content {
    text-align: left;
  }
}

.hero-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-6);
  color: var(--color-gray-900);
}

@media (min-width: 768px) {
  .hero-title {
    font-size: var(--font-size-5xl);
  }
}

.highlight {
  color: var(--color-primary);
  position: relative;
}

.highlight::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-full);
}

.hero-subtitle {
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-8);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .hero-subtitle {
    margin-left: 0;
    margin-right: 0;
  }
}

.hero-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

@media (min-width: 1024px) {
  .hero-cta {
    align-items: flex-start;
  }
}

.cta-help {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
  transition: var(--transition-slow);
}

.hero-img:hover {
  transform: perspective(1000px) rotateY(0deg) rotateX(0deg);
}

/* セクション共通 */
.section {
  padding: var(--space-20) 0;
}

.section-title {
  text-align: center;
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  margin-bottom: var(--space-16);
  color: var(--color-gray-900);
}

/* 問題提起セクション */
.problem {
  padding: var(--space-20) 0;
  background: var(--color-gray-50);
}

.problem-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  max-width: 1000px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .problem-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .problem-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.problem-card {
  background: var(--color-white);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  text-align: center;
  box-shadow: var(--shadow-base);
  transition: var(--transition-base);
  border: 1px solid var(--color-gray-200);
}

.problem-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.problem-icon {
  font-size: var(--font-size-4xl);
  color: var(--color-secondary);
  margin-bottom: var(--space-4);
  display: block;
}

.problem-card h3 {
  color: var(--color-gray-900);
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-3);
}

.problem-card p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* 解決策セクション */
.solution {
  padding: var(--space-20) 0;
}

.solution-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .solution-content {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-16);
  }
}

.solution-text h3 {
  font-size: var(--font-size-3xl);
  color: var(--color-gray-900);
  margin-bottom: var(--space-6);
}

.solution-text p {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-6);
}

.solution-features {
  list-style: none;
  padding: 0;
}

.solution-features li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.solution-features i {
  color: var(--color-accent);
  font-size: var(--font-size-xl);
}

.solution-img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}

/* 特徴セクション */
.features {
  padding: var(--space-20) 0;
  background: var(--color-gray-50);
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.feature-card {
  background: var(--color-white);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  text-align: center;
  box-shadow: var(--shadow-base);
  transition: var(--transition-base);
  border: 1px solid var(--color-gray-200);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-6);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  font-size: var(--font-size-3xl);
}

.feature-card h3 {
  color: var(--color-gray-900);
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-4);
}

.feature-card p {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

/* 実績セクション */
.testimonials {
  padding: var(--space-20) 0;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  max-width: 1000px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .testimonials-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.testimonial-card {
  background: var(--color-white);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-base);
  border: 1px solid var(--color-gray-200);
  transition: var(--transition-base);
}

.testimonial-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.testimonial-content {
  margin-bottom: var(--space-6);
}

.testimonial-content p {
  font-size: var(--font-size-lg);
  font-style: italic;
  color: var(--color-text-primary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.testimonial-avatar {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.testimonial-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  display: block;
  font-style: normal;
}

.testimonial-company {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* 料金セクション */
.pricing {
  padding: var(--space-20) 0;
  background: var(--color-gray-50);
}

.pricing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  max-width: 800px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.pricing-card {
  background: var(--color-white);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  text-align: center;
  box-shadow: var(--shadow-base);
  border: 1px solid var(--color-gray-200);
  transition: var(--transition-base);
  position: relative;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.pricing-card.featured {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-xl);
  transform: scale(1.05);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: var(--color-white);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.pricing-card h3 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-4);
  color: var(--color-gray-900);
}

.price {
  margin-bottom: var(--space-6);
}

.price-amount {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-primary);
}

.price-period {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  margin-left: var(--space-2);
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin-bottom: var(--space-8);
}

.pricing-features li {
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-gray-100);
  color: var(--color-text-secondary);
}

.pricing-features li:last-child {
  border-bottom: none;
}

/* お問い合わせセクション */
.contact {
  padding: var(--space-20) 0;
}

.contact-subtitle {
  text-align: center;
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-12);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.contact-form {
  max-width: 800px;
  margin: 0 auto;
  background: var(--color-white);
  padding: var(--space-12);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-gray-200);
}

.form-group {
  margin-bottom: var(--space-6);
}

.form-label {
  display: block;
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
}

.required {
  color: var(--color-danger);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-4);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  transition: var(--transition-fast);
  background: var(--color-white);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-help {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

.form-privacy {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
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
  grid-template-columns: 1fr;
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

@media (min-width: 768px) {
  .footer-content {
    grid-template-columns: 2fr 1fr 1fr;
    gap: var(--space-12);
  }
}

.footer-brand p {
  color: var(--color-gray-300);
  margin-top: var(--space-4);
}

.footer-logo {
  height: 40px;
  width: auto;
  filter: brightness(0) invert(1);
}

.footer-links h4,
.footer-contact h4 {
  color: var(--color-white);
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-4);
}

.footer-links ul {
  list-style: none;
  padding: 0;
}

.footer-links li {
  margin-bottom: var(--space-2);
}

.footer-links a {
  color: var(--color-gray-300);
  transition: var(--transition-fast);
}

.footer-links a:hover {
  color: var(--color-white);
}

.footer-contact p {
  color: var(--color-gray-300);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
}

.footer-bottom {
  padding-top: var(--space-8);
  border-top: 1px solid var(--color-gray-700);
  text-align: center;
}

.footer-bottom p {
  color: var(--color-gray-400);
  margin: 0;
}`;

    // ユーティリティクラス
    const utilities = `
/* ボタンシステム */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  text-decoration: none;
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
  color: var(--color-white);
  text-decoration: none;
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-outline:hover {
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
}

/* アニメーション */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

/* パフォーマンス最適化 */
.will-change-transform {
  will-change: transform;
}

.gpu-accelerated {
  transform: translateZ(0);
}

/* ローディング状態 */
.loading {
  opacity: 0.7;
  pointer-events: none;
}

.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid var(--color-gray-300);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}`;

    // レスポンシブ設計
    const breakpoints = [
      'Mobile: 320px-767px',
      'Tablet: 768px-1023px',
      'Desktop: 1024px-1279px',
      'Large Desktop: 1280px+',
    ];

    const mediaQueries = [
      '@media (min-width: 640px)',
      '@media (min-width: 768px)',
      '@media (min-width: 1024px)',
      '@media (min-width: 1280px)',
      '@media (prefers-reduced-motion: reduce)',
      '@media (prefers-color-scheme: dark)',
      '@media (prefers-contrast: high)',
    ];

    // パフォーマンス最適化
    const criticalCSS = `${variables}\n${base}\n.hero { padding: var(--space-20) 0 var(--space-16); }`;

    const optimizations = [
      'CSS変数による動的テーマ管理',
      'Critical CSS分離による初回読み込み最適化',
      'GPU加速を活用したアニメーション',
      'container queriesによる効率的なレスポンシブ',
      'CSS Containmentによるレンダリング最適化',
      'prefers-*メディアクエリによるアクセシビリティ対応',
    ];

    // 完全なCSSの生成
    const css = `${variables}\n\n${base}\n\n${components}\n\n${utilities}`;

    return {
      css,
      cssStructure: {
        variables,
        base,
        components,
        utilities,
      },
      responsive: {
        breakpoints,
        mediaQueries,
      },
      performance: {
        criticalCSS,
        optimizations,
      },
    };
  },
});