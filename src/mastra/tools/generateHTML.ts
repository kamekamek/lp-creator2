import { createTool } from '@mastra/core';
import { z } from 'zod';

const generateHTMLSchema = z.object({
  fileStructure: z.object({
    description: z.string(),
    structure: z.string(),
  }).describe('ファイル構造設計'),
  copyContent: z.string().describe('作成されたコピー内容'),
  wireframe: z.string().describe('ワイヤーフレーム設計'),
  technicalSpecs: z.object({
    responsive: z.string(),
    seo: z.string(),
    accessibility: z.string(),
    performance: z.string(),
  }).describe('技術仕様'),
});

const generateHTMLOutputSchema = z.object({
  html: z.string().describe('生成されたHTMLコード'),
  htmlStructure: z.object({
    doctype: z.string().describe('DOCTYPE宣言'),
    head: z.string().describe('HEAD要素の内容'),
    body: z.string().describe('BODY要素の内容'),
  }),
  seoOptimization: z.object({
    metaTags: z.array(z.string()).describe('SEO最適化されたメタタグ'),
    structuredData: z.string().describe('構造化データ（JSON-LD）'),
    ogTags: z.array(z.string()).describe('Open Graphタグ'),
  }),
  accessibility: z.object({
    ariaLabels: z.array(z.string()).describe('ARIA属性'),
    landmarks: z.array(z.string()).describe('ランドマーク要素'),
    skipLinks: z.string().describe('スキップリンク'),
  }),
});

export const generateHTMLTool = createTool({
  id: 'generateHTML',
  description: 'プロフェッショナルなランディングページのHTMLを生成する',
  inputSchema: generateHTMLSchema,
  outputSchema: generateHTMLOutputSchema,
  execute: async ({ fileStructure, copyContent, wireframe, technicalSpecs }) => {
    // SEO最適化されたメタタグの生成
    const metaTags = [
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<meta name="description" content="プロフェッショナルなランディングページ - 高いコンバージョン率を実現">',
      '<meta name="keywords" content="ランディングページ, LP, マーケティング, コンバージョン">',
      '<meta name="author" content="Professional LP Creator">',
      '<meta name="robots" content="index, follow">',
      '<link rel="canonical" href="https://example.com">',
    ];

    // Open Graphタグの生成
    const ogTags = [
      '<meta property="og:type" content="website">',
      '<meta property="og:title" content="プロフェッショナルランディングページ">',
      '<meta property="og:description" content="高いコンバージョン率を実現するプロフェッショナルなランディングページ">',
      '<meta property="og:url" content="https://example.com">',
      '<meta property="og:image" content="https://example.com/assets/images/og-image.jpg">',
      '<meta property="og:site_name" content="Professional LP">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="プロフェッショナルランディングページ">',
      '<meta name="twitter:description" content="高いコンバージョン率を実現するプロフェッショナルなランディングページ">',
      '<meta name="twitter:image" content="https://example.com/assets/images/twitter-image.jpg">',
    ];

    // 構造化データ（JSON-LD）
    const structuredData = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Professional LP Creator",
  "url": "https://example.com",
  "description": "プロフェッショナルなランディングページ作成サービス",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "JP"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "Japanese"
  }
}
</script>`;

    // ARIA属性とアクセシビリティ
    const ariaLabels = [
      'aria-label="メインナビゲーション"',
      'aria-label="お問い合わせフォーム"', 
      'aria-label="サービス詳細"',
      'aria-describedby="form-help"',
      'role="banner"',
      'role="main"',
      'role="contentinfo"',
    ];

    const landmarks = [
      '<header role="banner">',
      '<main role="main">',
      '<nav role="navigation">',
      '<section role="region">',
      '<aside role="complementary">',
      '<footer role="contentinfo">',
    ];

    const skipLinks = '<a href="#main" class="skip-link">メインコンテンツへスキップ</a>';

    // HEAD要素の生成
    const head = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="プロフェッショナルなランディングページ - 高いコンバージョン率を実現">
    <meta name="keywords" content="ランディングページ, LP, マーケティング, コンバージョン">
    <meta name="author" content="Professional LP Creator">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://example.com">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="プロフェッショナルランディングページ">
    <meta property="og:description" content="高いコンバージョン率を実現するプロフェッショナルなランディングページ">
    <meta property="og:url" content="https://example.com">
    <meta property="og:image" content="https://example.com/assets/images/og-image.jpg">
    <meta property="og:site_name" content="Professional LP">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="プロフェッショナルランディングページ">
    <meta name="twitter:description" content="高いコンバージョン率を実現するプロフェッショナルなランディングページ">
    <meta name="twitter:image" content="https://example.com/assets/images/twitter-image.jpg">
    
    <title>プロフェッショナルランディングページ | 高コンバージョン率を実現</title>
    
    <!-- パフォーマンス最適化 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="/css/style.css" as="style">
    <link rel="preload" href="/assets/images/hero-bg.webp" as="image">
    
    <!-- スタイルシート -->
    <link rel="stylesheet" href="/css/style.css">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    
    ${structuredData}`;

    // BODY要素の生成
    const body = `
    <!-- スキップリンク -->
    <a href="#main" class="skip-link">メインコンテンツへスキップ</a>
    
    <!-- ヘッダー -->
    <header role="banner" class="header">
        <nav role="navigation" class="navbar" aria-label="メインナビゲーション">
            <div class="container">
                <div class="navbar-brand">
                    <img src="/assets/images/logo.svg" alt="Professional LP Creator" class="logo">
                </div>
                <ul class="navbar-nav">
                    <li><a href="#features" class="nav-link">特徴</a></li>
                    <li><a href="#testimonials" class="nav-link">お客様の声</a></li>
                    <li><a href="#pricing" class="nav-link">料金</a></li>
                    <li><a href="#contact" class="nav-link cta-nav">お問い合わせ</a></li>
                </ul>
            </div>
        </nav>
    </header>

    <!-- メインコンテンツ -->
    <main role="main" id="main">
        <!-- ヒーローセクション -->
        <section class="hero" role="region" aria-labelledby="hero-title">
            <div class="container">
                <div class="hero-content">
                    <h1 id="hero-title" class="hero-title">
                        プロフェッショナルな<br>
                        <span class="highlight">ランディングページ</span>で<br>
                        コンバージョン率を最大化
                    </h1>
                    <p class="hero-subtitle">
                        マーケティング心理学と最新Web技術を融合した、
                        結果にコミットするランディングページ作成サービス
                    </p>
                    <div class="hero-cta">
                        <a href="#contact" class="btn btn-primary btn-lg" aria-describedby="cta-help">
                            <i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i>
                            無料相談を予約する
                        </a>
                        <p id="cta-help" class="cta-help">
                            <i class="bi bi-shield-check" aria-hidden="true"></i>
                            30日間返金保証付き
                        </p>
                    </div>
                </div>
                <div class="hero-image">
                    <img src="/assets/images/hero-main.webp" alt="プロフェッショナルなランディングページのイメージ" 
                         class="hero-img" loading="eager">
                </div>
            </div>
        </section>

        <!-- 問題提起セクション -->
        <section class="problem" role="region" aria-labelledby="problem-title">
            <div class="container">
                <h2 id="problem-title" class="section-title">
                    こんなお悩みはありませんか？
                </h2>
                <div class="problem-grid">
                    <div class="problem-card">
                        <i class="bi bi-graph-down-arrow problem-icon" aria-hidden="true"></i>
                        <h3>コンバージョン率が低い</h3>
                        <p>アクセスはあるのに、なかなか成果に繋がらない</p>
                    </div>
                    <div class="problem-card">
                        <i class="bi bi-clock problem-icon" aria-hidden="true"></i>
                        <h3>制作に時間がかかる</h3>
                        <p>デザインやコピーで悩んで、リリースが遅れてしまう</p>
                    </div>
                    <div class="problem-card">
                        <i class="bi bi-currency-yen problem-icon" aria-hidden="true"></i>
                        <h3>予算が限られている</h3>
                        <p>高額な制作費は払えないが、品質は妥協したくない</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 解決策セクション -->
        <section class="solution" role="region" aria-labelledby="solution-title">
            <div class="container">
                <h2 id="solution-title" class="section-title">
                    その悩み、すべて解決します
                </h2>
                <div class="solution-content">
                    <div class="solution-text">
                        <h3>マーケティング心理学 × 最新Web技術</h3>
                        <p>
                            当サービスは、マーケティング心理学の知見と最新のWeb技術を組み合わせ、
                            <strong>科学的根拠に基づいた高コンバージョン率のランディングページ</strong>を提供します。
                        </p>
                        <ul class="solution-features">
                            <li>
                                <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                                コンバージョン率平均2.5倍向上
                            </li>
                            <li>
                                <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                                最短3日でリリース可能
                            </li>
                            <li>
                                <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                                業界最安値の料金設定
                            </li>
                        </ul>
                    </div>
                    <div class="solution-image">
                        <img src="/assets/images/solution-chart.webp" alt="コンバージョン率向上グラフ" 
                             class="solution-img" loading="lazy">
                    </div>
                </div>
            </div>
        </section>

        <!-- 特徴セクション -->
        <section id="features" class="features" role="region" aria-labelledby="features-title">
            <div class="container">
                <h2 id="features-title" class="section-title">
                    選ばれる3つの理由
                </h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="bi bi-brain" aria-hidden="true"></i>
                        </div>
                        <h3>心理学に基づく設計</h3>
                        <p>
                            PASONA法則、4U原則などの実証済みマーケティング心理学を活用し、
                            ユーザーの行動を促進する構成を設計します。
                        </p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="bi bi-speedometer2" aria-hidden="true"></i>
                        </div>
                        <h3>最新技術による高速化</h3>
                        <p>
                            Core Web Vitals対応、SEO最適化、アクセシビリティ準拠など、
                            検索エンジンとユーザーの両方から評価される技術を実装。
                        </p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="bi bi-graph-up-arrow" aria-hidden="true"></i>
                        </div>
                        <h3>データ分析と改善</h3>
                        <p>
                            Google Analytics 4、ヒートマップツールを活用した
                            継続的な分析と改善提案で、長期的な成果を保証します。
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 実績セクション -->
        <section id="testimonials" class="testimonials" role="region" aria-labelledby="testimonials-title">
            <div class="container">
                <h2 id="testimonials-title" class="section-title">
                    お客様の声
                </h2>
                <div class="testimonials-grid">
                    <div class="testimonial-card">
                        <div class="testimonial-content">
                            <p>
                                「コンバージョン率が3倍になりました！プロの知見と技術力の高さに驚いています。」
                            </p>
                        </div>
                        <div class="testimonial-author">
                            <img src="/assets/images/testimonial-1.webp" alt="田中様" 
                                 class="testimonial-avatar" loading="lazy">
                            <div class="testimonial-info">
                                <cite class="testimonial-name">田中様</cite>
                                <span class="testimonial-company">EC事業</span>
                            </div>
                        </div>
                    </div>
                    <div class="testimonial-card">
                        <div class="testimonial-content">
                            <p>
                                「技術的な説明も分かりやすく、安心してお任せできました。結果も大満足です！」
                            </p>
                        </div>
                        <div class="testimonial-author">
                            <img src="/assets/images/testimonial-2.webp" alt="佐藤様" 
                                 class="testimonial-avatar" loading="lazy">
                            <div class="testimonial-info">
                                <cite class="testimonial-name">佐藤様</cite>
                                <span class="testimonial-company">コンサルティング</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 料金セクション -->
        <section id="pricing" class="pricing" role="region" aria-labelledby="pricing-title">
            <div class="container">
                <h2 id="pricing-title" class="section-title">
                    料金プラン
                </h2>
                <div class="pricing-grid">
                    <div class="pricing-card">
                        <h3>スタンダード</h3>
                        <div class="price">
                            <span class="price-amount">¥98,000</span>
                            <span class="price-period">一式</span>
                        </div>
                        <ul class="pricing-features">
                            <li>LP設計・制作</li>
                            <li>レスポンシブ対応</li>
                            <li>基本SEO対策</li>
                            <li>30日間サポート</li>
                        </ul>
                        <a href="#contact" class="btn btn-outline">
                            詳細を見る
                        </a>
                    </div>
                    <div class="pricing-card featured">
                        <div class="pricing-badge">おすすめ</div>
                        <h3>プレミアム</h3>
                        <div class="price">
                            <span class="price-amount">¥168,000</span>
                            <span class="price-period">一式</span>
                        </div>
                        <ul class="pricing-features">
                            <li>LP設計・制作</li>
                            <li>レスポンシブ対応</li>
                            <li>高度SEO対策</li>
                            <li>アナリティクス設定</li>
                            <li>90日間サポート</li>
                            <li>A/Bテスト設計</li>
                        </ul>
                        <a href="#contact" class="btn btn-primary">
                            今すぐ申し込む
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- お問い合わせセクション -->
        <section id="contact" class="contact" role="region" aria-labelledby="contact-title">
            <div class="container">
                <h2 id="contact-title" class="section-title">
                    無料相談のお申し込み
                </h2>
                <p class="contact-subtitle">
                    まずはお気軽にご相談ください<br>
                    30分の無料相談で、あなたのビジネスに最適な提案をいたします
                </p>
                <form class="contact-form" aria-label="お問い合わせフォーム">
                    <div class="form-group">
                        <label for="name" class="form-label">お名前 <span class="required">*</span></label>
                        <input type="text" id="name" name="name" class="form-input" required 
                               aria-describedby="name-help">
                        <div id="name-help" class="form-help">フルネームでご入力ください</div>
                    </div>
                    <div class="form-group">
                        <label for="email" class="form-label">メールアドレス <span class="required">*</span></label>
                        <input type="email" id="email" name="email" class="form-input" required 
                               aria-describedby="email-help">
                        <div id="email-help" class="form-help">連絡可能なメールアドレスをご入力ください</div>
                    </div>
                    <div class="form-group">
                        <label for="company" class="form-label">会社名</label>
                        <input type="text" id="company" name="company" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="message" class="form-label">ご相談内容 <span class="required">*</span></label>
                        <textarea id="message" name="message" class="form-textarea" rows="5" required 
                                  aria-describedby="message-help"></textarea>
                        <div id="message-help" class="form-help">現在の課題や目標をお聞かせください</div>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary btn-lg btn-full">
                            <i class="bi bi-send-fill" aria-hidden="true"></i>
                            無料相談を申し込む
                        </button>
                    </div>
                    <p class="form-privacy">
                        <i class="bi bi-shield-lock" aria-hidden="true"></i>
                        お客様の個人情報は厳重に管理し、営業目的以外での使用は一切いたしません
                    </p>
                </form>
            </div>
        </section>
    </main>

    <!-- フッター -->
    <footer role="contentinfo" class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <img src="/assets/images/logo.svg" alt="Professional LP Creator" class="footer-logo">
                    <p>プロフェッショナルなランディングページで<br>あなたのビジネスを成功に導きます</p>
                </div>
                <div class="footer-links">
                    <h4>サービス</h4>
                    <ul>
                        <li><a href="#features">特徴</a></li>
                        <li><a href="#pricing">料金</a></li>
                        <li><a href="#contact">お問い合わせ</a></li>
                    </ul>
                </div>
                <div class="footer-contact">
                    <h4>お問い合わせ</h4>
                    <p>
                        <i class="bi bi-envelope" aria-hidden="true"></i>
                        info@professional-lp.com
                    </p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 Professional LP Creator. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- JavaScript -->
    <script src="/js/main.js"></script>`;

    // 完全なHTMLドキュメントの生成
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
${head}
</head>
<body>
${body}
</body>
</html>`;

    return {
      html,
      htmlStructure: {
        doctype: '<!DOCTYPE html>',
        head,
        body,
      },
      seoOptimization: {
        metaTags,
        structuredData,
        ogTags,
      },
      accessibility: {
        ariaLabels,
        landmarks,
        skipLinks,
      },
    };
  },
});