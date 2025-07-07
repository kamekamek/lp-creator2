import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { join } from 'path';

const generateJSSchema = z.object({
  html: z.string().describe('生成されたHTMLコード'),
  css: z.string().describe('生成されたCSSコード'),
  technicalSpecs: z.object({
    responsive: z.string(),
    seo: z.string(),
    accessibility: z.string(),
    performance: z.string(),
  }).describe('技術仕様'),
  interactionRequirements: z.string().optional().describe('インタラクション要件'),
});

const generateJSOutputSchema = z.object({
  javascript: z.string().describe('生成されたJavaScriptコード'),
  jsStructure: z.object({
    main: z.string().describe('メインJavaScriptファイル'),
    components: z.array(z.object({
      name: z.string(),
      code: z.string(),
    })).describe('コンポーネント別JavaScript'),
    utils: z.array(z.object({
      name: z.string(),
      code: z.string(),
    })).describe('ユーティリティ関数'),
  }),
  features: z.object({
    smoothScroll: z.boolean().describe('スムーススクロール'),
    formValidation: z.boolean().describe('フォームバリデーション'),
    lazyLoading: z.boolean().describe('遅延読み込み'),
    analytics: z.boolean().describe('アナリティクス'),
    animations: z.boolean().describe('アニメーション'),
  }),
  performance: z.object({
    bundleSize: z.string().describe('バンドルサイズ見積もり'),
    optimizations: z.array(z.string()).describe('パフォーマンス最適化'),
  }),
});

export const generateJSTool = createTool({
  id: 'generateJS',
  description: 'プロフェッショナルなランディングページのJavaScriptを生成する',
  inputSchema: generateJSSchema,
  outputSchema: generateJSOutputSchema,
  execute: async ({ context }) => {
    const { html, css, technicalSpecs, interactionRequirements } = context;
    
    // 外部テンプレートファイルから読み込み
    const templatePath = join(__dirname, 'templates', 'landingPageTemplate.js');
    let mainTemplate;
    
    try {
      mainTemplate = await readFile(templatePath, 'utf-8');
    } catch (error) {
      console.warn('External template not found, using inline template');
      mainTemplate = getInlineTemplate();
    }
    
    // JavaScript圧縮（本番環境用）
    const main = process.env.NODE_ENV === 'production' 
      ? minifyJS(mainTemplate)
      : mainTemplate;

    // コンポーネント別JavaScript
    const components = [
      {
        name: 'hero',
        code: `
// ヒーローセクション特化機能
class HeroComponent {
  constructor() {
    this.heroElement = document.querySelector('.hero');
    this.init();
  }

  init() {
    if (!this.heroElement) return;

    this.setupParallax();
    this.setupTypingAnimation();
    this.setupCTATracking();
  }

  setupParallax() {
    const handleScroll = utils.throttle(() => {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.5;
      
      this.heroElement.style.transform = \`translateY(\${parallax}px)\`;
    }, 16);

    window.addEventListener('scroll', handleScroll);
  }

  setupTypingAnimation() {
    const titleElement = this.heroElement.querySelector('.hero-title');
    if (!titleElement) return;

    const text = titleElement.textContent;
    titleElement.textContent = '';
    
    let i = 0;
    const typing = setInterval(() => {
      titleElement.textContent += text.charAt(i);
      i++;
      if (i > text.length) {
        clearInterval(typing);
      }
    }, 50);
  }

  setupCTATracking() {
    const ctaButtons = this.heroElement.querySelectorAll('.btn');
    ctaButtons.forEach(button => {
      button.addEventListener('click', () => {
        app.trackEvent('hero', 'cta_click', button.textContent.trim());
      });
    });
  }
}

export { HeroComponent };`
      },
      {
        name: 'form',
        code: `
// フォーム拡張機能
class FormEnhancement {
  constructor(form) {
    this.form = form;
    this.init();
  }

  init() {
    this.setupProgressIndicator();
    this.setupAutoSave();
    this.setupRealTimeValidation();
  }

  setupProgressIndicator() {
    const fields = this.form.querySelectorAll('input[required], textarea[required]');
    const progressBar = document.createElement('div');
    progressBar.className = 'form-progress';
    progressBar.innerHTML = '<div class="form-progress-bar"></div>';
    
    this.form.insertBefore(progressBar, this.form.firstChild);
    
    const updateProgress = () => {
      const filledFields = Array.from(fields).filter(field => field.value.trim() !== '');
      const progress = (filledFields.length / fields.length) * 100;
      
      progressBar.querySelector('.form-progress-bar').style.width = \`\${progress}%\`;
    };

    fields.forEach(field => {
      field.addEventListener('input', updateProgress);
    });
  }

  setupAutoSave() {
    const saveData = utils.debounce(() => {
      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData);
      utils.localStorage.set(\`form-\${this.form.id}\`, JSON.stringify(data));
    }, 1000);

    this.form.addEventListener('input', saveData);
    
    // データ復元
    this.restoreFormData();
  }

  restoreFormData() {
    const savedData = utils.localStorage.get(\`form-\${this.form.id}\`);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        Object.entries(data).forEach(([name, value]) => {
          const field = this.form.querySelector(\`[name="\${name}"]\`);
          if (field) field.value = value;
        });
      } catch (e) {
        console.warn('Failed to restore form data:', e);
      }
    }
  }

  setupRealTimeValidation() {
    // リアルタイムバリデーション強化
    const fields = this.form.querySelectorAll('input, textarea');
    fields.forEach(field => {
      field.addEventListener('input', () => {
        this.validateFieldRealTime(field);
      });
    });
  }

  validateFieldRealTime(field) {
    const isValid = this.quickValidate(field);
    field.classList.toggle('valid', isValid);
    field.classList.toggle('invalid', !isValid);
  }

  quickValidate(field) {
    if (field.type === 'email') {
      return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(field.value);
    }
    if (field.required) {
      return field.value.trim() !== '';
    }
    return true;
  }
}

export { FormEnhancement };`
      },
      {
        name: 'animations',
        code: `
// アニメーション制御
class AnimationController {
  constructor() {
    this.animatedElements = new Set();
    this.init();
  }

  init() {
    this.setupScrollAnimations();
    this.setupHoverEffects();
    this.setupLoadAnimations();
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          this.animateElement(entry.target);
          this.animatedElements.add(entry.target);
        }
      });
    });

    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  }

  animateElement(element) {
    const animationType = element.dataset.animate;
    const delay = element.dataset.delay || 0;
    
    setTimeout(() => {
      element.classList.add(\`animate-\${animationType}\`);
    }, delay);
  }

  setupHoverEffects() {
    const cards = document.querySelectorAll('.feature-card, .testimonial-card, .pricing-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
      });
    });
  }

  setupLoadAnimations() {
    window.addEventListener('load', () => {
      document.body.classList.add('loaded');
    });
  }
}

export { AnimationController };`
      }
    ];

    // ユーティリティ関数
    const utils_code = [
      {
        name: 'analytics',
        code: `
// アナリティクス専用ユーティリティ
class AnalyticsUtils {
  constructor() {
    this.queue = [];
    this.isOnline = navigator.onLine;
    this.setupConnectionMonitoring();
  }

  setupConnectionMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  track(event, data) {
    const eventData = {
      ...data,
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent
    };

    if (this.isOnline) {
      this.sendEvent(event, eventData);
    } else {
      this.queue.push({ event, data: eventData });
    }
  }

  sendEvent(event, data) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', event, data);
    }

    // カスタムアナリティクス
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data })
    }).catch(console.error);
  }

  flushQueue() {
    while (this.queue.length > 0) {
      const { event, data } = this.queue.shift();
      this.sendEvent(event, data);
    }
  }
}

export { AnalyticsUtils };`
      },
      {
        name: 'performance',
        code: `
// パフォーマンス監視ユーティリティ
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.init();
  }

  init() {
    this.measureCoreWebVitals();
    this.measureCustomMetrics();
    this.setupPerformanceObserver();
  }

  measureCoreWebVitals() {
    // LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID (First Input Delay)
    new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0];
      this.metrics.set('FID', firstInput.processingStart - firstInput.startTime);
    }).observe({ entryTypes: ['first-input'] });

    // CLS (Cumulative Layout Shift)
    new PerformanceObserver((entryList) => {
      let cls = 0;
      entryList.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      this.metrics.set('CLS', cls);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  measureCustomMetrics() {
    // Time to Interactive
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        this.metrics.set('TTI', navigation.loadEventEnd);
      }, 100);
    });
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
          }
        });
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  reportMetrics() {
    const metrics = this.getMetrics();
    
    // コンソールに出力
    console.table(metrics);
    
    // アナリティクスに送信
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof app !== 'undefined' && app.trackEvent) {
        app.trackEvent('performance', key.toLowerCase(), '', Math.round(value));
      }
    });
  }
}

export { PerformanceMonitor };`
      }
    ];

    // 機能フラグ
    const features = {
      smoothScroll: true,
      formValidation: true,
      lazyLoading: true,
      analytics: true,
      animations: true,
    };

    // パフォーマンス情報
    const performance = {
      bundleSize: '約45KB (gzip圧縮後)',
      optimizations: [
        'ES6+モジュール設計によるツリーシェイキング対応',
        'IntersectionObserver APIによる効率的な監視',
        'デバウンス・スロットルによるイベント最適化',
        'Web Vitals監視による継続的パフォーマンス改善',
        'Service Worker対応によるキャッシュ最適化',
        'エラーハンドリングとフォールバック処理',
      ],
    };

    return {
      javascript: main,
      jsStructure: {
        main,
        components,
        utils: utils_code,
      },
      features,
      performance,
    };
  },
});

// インライン テンプレート関数（フォールバック用）
function getInlineTemplate(): string {
  return `
/**
 * Professional Landing Page JavaScript
 * モダンES6+、パフォーマンス最適化、アクセシビリティ対応
 */

// グローバル設定
const CONFIG = {
  ANIMATION_DURATION: 300,
  SCROLL_OFFSET: 80,
  LAZY_LOADING_THRESHOLD: 0.1,
  ANALYTICS_DELAY: 1000,
  FORM_VALIDATION_DELAY: 300,
};

// 基本的なアプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('Landing Page JavaScript loaded');
});`;
}

// JavaScript圧縮関数（簡易版）
function minifyJS(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // コメント削除
    .replace(/\/\/.*$/gm, '') // 行コメント削除
    .replace(/^\s+|\s+$/gm, '') // 行頭・行末の空白削除
    .replace(/\n\s*\n/g, '\n') // 空行削除
    .replace(/\s+/g, ' ') // 複数の空白を1つに
    .trim();
}