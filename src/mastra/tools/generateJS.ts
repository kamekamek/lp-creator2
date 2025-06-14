import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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
    // メインJavaScriptファイル
    const main = `
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

// ユーティリティ関数
const utils = {
  // デバウンス関数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // スロットル関数
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // 要素の可視性チェック
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // スムーズスクロール
  smoothScrollTo(target, offset = 0) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetElement) return;

    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  },

  // ローカルストレージ操作（エラーハンドリング付き）
  localStorage: {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('LocalStorage get error:', e);
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.warn('LocalStorage set error:', e);
        return false;
      }
    }
  },

  // パフォーマンス測定
  performance: {
    mark(name) {
      if (window.performance && window.performance.mark) {
        window.performance.mark(name);
      }
    },
    measure(name, startMark, endMark) {
      if (window.performance && window.performance.measure) {
        window.performance.measure(name, startMark, endMark);
      }
    }
  }
};

// メインアプリケーションクラス
class LandingPageApp {
  constructor() {
    this.isInitialized = false;
    this.components = new Map();
    this.observers = new Map();
    
    this.init();
  }

  async init() {
    try {
      utils.performance.mark('app-init-start');
      
      // DOM準備完了を待つ
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        await this.setup();
      }
      
    } catch (error) {
      console.error('App initialization error:', error);
    }
  }

  async setup() {
    try {
      // コンポーネントの初期化
      await this.initializeComponents();
      
      // イベントリスナーの設定
      this.setupEventListeners();
      
      // パフォーマンス監視
      this.setupPerformanceMonitoring();
      
      // アクセシビリティ強化
      this.enhanceAccessibility();
      
      this.isInitialized = true;
      
      utils.performance.mark('app-init-end');
      utils.performance.measure('app-init-duration', 'app-init-start', 'app-init-end');
      
      // カスタムイベント発火
      this.dispatchEvent('app:initialized');
      
    } catch (error) {
      console.error('App setup error:', error);
    }
  }

  async initializeComponents() {
    const componentPromises = [
      this.initSmoothScroll(),
      this.initFormValidation(),
      this.initLazyLoading(),
      this.initAnimations(),
      this.initAnalytics(),
      this.initNavigation(),
      this.initModalHandlers(),
    ];

    await Promise.allSettled(componentPromises);
  }

  // スムーススクロール初期化
  initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          utils.smoothScrollTo(targetElement, CONFIG.SCROLL_OFFSET);
          
          // フォーカス管理
          targetElement.focus({ preventScroll: true });
          
          // アナリティクストラッキング
          this.trackEvent('scroll', 'smooth_scroll', targetId);
        }
      });
    });

    this.components.set('smoothScroll', { initialized: true });
  }

  // フォームバリデーション初期化
  initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      const validator = new FormValidator(form);
      validator.init();
      this.components.set(\`form-\${form.getAttribute('class') || 'default'}\`, validator);
    });
  }

  // 遅延読み込み初期化
  initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // フォールバック: 全画像を即座に読み込み
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
      });
      return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // 画像読み込み
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // ソースセット対応
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      threshold: CONFIG.LAZY_LOADING_THRESHOLD,
      rootMargin: '50px'
    });

    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => imageObserver.observe(img));
    
    this.observers.set('lazyLoading', imageObserver);
  }

  // アニメーション初期化
  initAnimations() {
    // Intersection Observer for animations
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
          
          // アニメーション完了後のクリーンアップ
          entry.target.addEventListener('animationend', () => {
            entry.target.style.willChange = 'auto';
          }, { once: true });
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    });

    // アニメーション対象要素
    const animationTargets = document.querySelectorAll(
      '.hero-content, .problem-card, .feature-card, .testimonial-card, .pricing-card'
    );
    
    animationTargets.forEach(target => {
      target.style.willChange = 'transform, opacity';
      animationObserver.observe(target);
    });

    this.observers.set('animations', animationObserver);
  }

  // アナリティクス初期化
  initAnalytics() {
    // Google Analytics 4 対応
    if (typeof gtag !== 'undefined') {
      this.setupGA4Tracking();
    }
    
    // カスタムアナリティクス
    this.setupCustomAnalytics();
  }

  setupGA4Tracking() {
    // CTA クリック追跡
    document.querySelectorAll('.btn-primary, .cta-nav').forEach(button => {
      button.addEventListener('click', () => {
        this.trackEvent('engagement', 'cta_click', button.textContent.trim());
      });
    });

    // フォーム送信追跡
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', () => {
        this.trackEvent('conversion', 'form_submit', form.getAttribute('class'));
      });
    });

    // セクション到達追跡
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionName = entry.target.id || entry.target.className;
          this.trackEvent('engagement', 'section_view', sectionName);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('section[role="region"]').forEach(section => {
      sectionObserver.observe(section);
    });

    this.observers.set('analytics', sectionObserver);
  }

  setupCustomAnalytics() {
    // ページパフォーマンス追跡
    if ('performance' in window && 'navigation' in window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.getEntriesByType('navigation')[0];
          this.trackEvent('performance', 'page_load', '', Math.round(perfData.loadEventEnd));
        }, CONFIG.ANALYTICS_DELAY);
      });
    }

    // ユーザー行動追跡
    let scrollDepth = 0;
    const trackScrollDepth = utils.throttle(() => {
      const currentScroll = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      
      if (currentScroll > scrollDepth && currentScroll % 25 === 0) {
        scrollDepth = currentScroll;
        this.trackEvent('engagement', 'scroll_depth', \`\${scrollDepth}%\`);
      }
    }, 1000);

    window.addEventListener('scroll', trackScrollDepth);
  }

  // ナビゲーション初期化
  initNavigation() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    
    const handleScroll = utils.throttle(() => {
      const currentScrollY = window.scrollY;
      
      // スクロール方向に応じてナビゲーションを表示/非表示
      if (currentScrollY > 100) {
        navbar.classList.add('scrolled');
        
        if (currentScrollY > lastScrollY) {
          navbar.classList.add('hidden');
        } else {
          navbar.classList.remove('hidden');
        }
      } else {
        navbar.classList.remove('scrolled', 'hidden');
      }
      
      lastScrollY = currentScrollY;
    }, 10);

    window.addEventListener('scroll', handleScroll);
  }

  // モーダルハンドラー初期化
  initModalHandlers() {
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => this.closeModal(modal));
      }
    });
  }

  // イベントリスナー設定
  setupEventListeners() {
    // リサイズハンドラー
    window.addEventListener('resize', utils.debounce(() => {
      this.handleResize();
    }, 250));

    // エラーハンドリング
    window.addEventListener('error', (e) => {
      console.error('JavaScript error:', e.error);
      this.trackEvent('error', 'javascript_error', e.error.message);
    });

    // パフォーマンス警告
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint' && entry.startTime > 2500) {
            console.warn('LCP slow:', entry.startTime);
          }
        });
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  // パフォーマンス監視
  setupPerformanceMonitoring() {
    // Core Web Vitals
    if ('web-vitals' in window) {
      window.webVitals.getCLS(this.onVitalMetric.bind(this));
      window.webVitals.getFID(this.onVitalMetric.bind(this));
      window.webVitals.getLCP(this.onVitalMetric.bind(this));
    }
  }

  onVitalMetric(metric) {
    this.trackEvent('performance', metric.name.toLowerCase(), '', Math.round(metric.value));
  }

  // アクセシビリティ強化
  enhanceAccessibility() {
    // キーボードナビゲーション改善
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // ARIA属性の動的更新
    this.updateAriaAttributes();
  }

  updateAriaAttributes() {
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
      if (!button.getAttribute('aria-label') && button.textContent) {
        button.setAttribute('aria-label', button.textContent.trim());
      }
    });
  }

  // ユーティリティメソッド
  handleResize() {
    // レスポンシブ対応処理
    this.dispatchEvent('app:resize', { 
      width: window.innerWidth, 
      height: window.innerHeight 
    });
  }

  trackEvent(category, action, label, value) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }

    // カスタムアナリティクス
    console.log('Track:', { category, action, label, value });
  }

  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      
      // フォーカストラップ
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }

  closeModal(modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  // コンポーネント取得
  getComponent(name) {
    return this.components.get(name);
  }

  // クリーンアップ
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.components.clear();
    this.observers.clear();
  }
}

// フォームバリデーションクラス
class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = new Map();
    this.rules = {
      required: (value) => value.trim() !== '',
      email: (value) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value),
      minLength: (value, min) => value.length >= min,
      maxLength: (value, max) => value.length <= max,
    };
  }

  init() {
    this.setupValidation();
    this.setupSubmission();
  }

  setupValidation() {
    const inputs = this.form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', utils.debounce(() => {
        if (this.errors.has(input.name)) {
          this.validateField(input);
        }
      }, CONFIG.FORM_VALIDATION_DELAY));
    });
  }

  setupSubmission() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  validateField(field) {
    const value = field.value;
    const fieldName = field.name;
    const isRequired = field.hasAttribute('required');
    const fieldType = field.type;

    this.clearFieldError(field);

    // 必須チェック
    if (isRequired && !this.rules.required(value)) {
      this.setFieldError(field, 'この項目は必須です');
      return false;
    }

    // 型別バリデーション
    if (value && fieldType === 'email' && !this.rules.email(value)) {
      this.setFieldError(field, '正しいメールアドレスを入力してください');
      return false;
    }

    // カスタムバリデーション
    const customValidation = field.dataset.validation;
    if (customValidation && value) {
      const isValid = this.runCustomValidation(value, customValidation);
      if (!isValid) {
        this.setFieldError(field, field.dataset.validationMessage || 'エラーがあります');
        return false;
      }
    }

    this.errors.delete(fieldName);
    return true;
  }

  setFieldError(field, message) {
    this.errors.set(field.name, message);
    
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.id = \`\${field.name}-error\`;
    field.setAttribute('aria-describedby', errorElement.id);
  }

  clearFieldError(field) {
    field.classList.remove('error');
    field.setAttribute('aria-invalid', 'false');
    
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.remove();
      field.removeAttribute('aria-describedby');
    }
  }

  runCustomValidation(value, validation) {
    // カスタムバリデーションロジック
    try {
      return new Function('value', \`return \${validation}\`)(value);
    } catch (e) {
      console.error('Custom validation error:', e);
      return true; // エラー時は通す
    }
  }

  async handleSubmit() {
    const formData = new FormData(this.form);
    const isValid = this.validateForm();

    if (!isValid) {
      this.focusFirstError();
      return;
    }

    try {
      this.setSubmitting(true);
      
      // フォーム送信処理
      const response = await this.submitForm(formData);
      
      if (response.ok) {
        this.showSuccess('送信が完了しました');
        this.form.reset();
      } else {
        throw new Error('送信に失敗しました');
      }
      
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setSubmitting(false);
    }
  }

  validateForm() {
    const inputs = this.form.querySelectorAll('input, textarea, select');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  async submitForm(formData) {
    const action = this.form.action || '/api/contact';
    const method = this.form.method || 'POST';

    return fetch(action, {
      method,
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  }

  setSubmitting(isSubmitting) {
    const submitButton = this.form.querySelector('button[type="submit"]');
    
    if (isSubmitting) {
      submitButton.disabled = true;
      submitButton.classList.add('loading');
      submitButton.textContent = '送信中...';
    } else {
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
      submitButton.textContent = submitButton.dataset.originalText || '送信する';
    }
  }

  focusFirstError() {
    const firstErrorField = this.form.querySelector('.error');
    if (firstErrorField) {
      firstErrorField.focus();
    }
  }

  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = \`form-message form-message--\${type}\`;
    messageElement.textContent = message;
    messageElement.setAttribute('role', 'alert');
    
    this.form.insertBefore(messageElement, this.form.firstChild);
    
    setTimeout(() => {
      messageElement.remove();
    }, 5000);
  }
}

// アプリケーション初期化
let app;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new LandingPageApp();
  });
} else {
  app = new LandingPageApp();
}

// グローバルに公開（デバッグ用）
window.LPApp = app;
window.utils = utils;

// Service Worker登録（PWA対応）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(registrationError => console.log('SW registration failed'));
  });
}

export { LandingPageApp, FormValidator, utils };`;

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