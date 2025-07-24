/**
 * CDN Optimization and Caching Strategy
 * Optimizes static assets and generated content for CDN delivery
 */

export interface CDNConfig {
  provider: 'vercel' | 'cloudflare' | 'aws' | 'generic';
  baseUrl: string;
  regions: string[];
  cacheRules: CacheRule[];
}

export interface CacheRule {
  pattern: string;
  maxAge: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
  public?: boolean;
}

export interface AssetOptimization {
  compression: boolean;
  minification: boolean;
  bundling: boolean;
  lazyLoading: boolean;
  webp: boolean;
  avif: boolean;
}

export class CDNOptimizer {
  private static instance: CDNOptimizer;
  private config: CDNConfig;
  private optimization: AssetOptimization;

  private constructor() {
    this.config = {
      provider: 'vercel', // Default to Vercel
      baseUrl: process.env.CDN_BASE_URL || '',
      regions: ['us-east', 'eu-west', 'ap-southeast'],
      cacheRules: [
        // Static assets (long cache)
        {
          pattern: '/assets/**/*',
          maxAge: 31536000, // 1 year
          public: true
        },
        // Generated LP HTML (medium cache with revalidation)
        {
          pattern: '/generated/**/*.html',
          maxAge: 3600, // 1 hour
          staleWhileRevalidate: 86400, // 24 hours
          public: true
        },
        // API responses (short cache)
        {
          pattern: '/api/**/*',
          maxAge: 300, // 5 minutes
          mustRevalidate: true,
          public: false
        },
        // Next.js static files (long cache)
        {
          pattern: '/_next/static/**/*',
          maxAge: 31536000, // 1 year
          public: true
        },
        // Images (long cache)
        {
          pattern: '/**/*.{jpg,jpeg,png,gif,webp,avif,svg}',
          maxAge: 86400, // 24 hours
          public: true
        },
        // CSS and JS (medium cache)
        {
          pattern: '/**/*.{css,js}',
          maxAge: 86400, // 24 hours
          staleWhileRevalidate: 604800, // 7 days
          public: true
        }
      ]
    };

    this.optimization = {
      compression: true,
      minification: true,
      bundling: true,
      lazyLoading: true,
      webp: true,
      avif: false // Not widely supported yet
    };
  }

  public static getInstance(): CDNOptimizer {
    if (!CDNOptimizer.instance) {
      CDNOptimizer.instance = new CDNOptimizer();
    }
    return CDNOptimizer.instance;
  }

  /**
   * Get cache headers for a given path
   */
  public getCacheHeaders(path: string): Record<string, string> {
    const rule = this.findMatchingRule(path);
    const headers: Record<string, string> = {};

    if (rule) {
      // Build Cache-Control header
      const cacheControl = [];
      
      if (rule.public) {
        cacheControl.push('public');
      } else {
        cacheControl.push('private');
      }

      cacheControl.push(`max-age=${rule.maxAge}`);

      if (rule.staleWhileRevalidate) {
        cacheControl.push(`stale-while-revalidate=${rule.staleWhileRevalidate}`);
      }

      if (rule.mustRevalidate) {
        cacheControl.push('must-revalidate');
      }

      headers['Cache-Control'] = cacheControl.join(', ');

      // Add Expires header for better compatibility
      const expiresDate = new Date(Date.now() + rule.maxAge * 1000);
      headers['Expires'] = expiresDate.toUTCString();

      // Add ETag for better caching
      headers['ETag'] = `"${this.generateETag(path)}"`;

      // Add Vary header for content negotiation
      headers['Vary'] = 'Accept, Accept-Encoding';

      console.log(`📦 [CDN] Cache headers for ${path}:`, headers);
    }

    return headers;
  }

  /**
   * Optimize static asset URL
   */
  public optimizeAssetUrl(originalUrl: string, options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: number;
  } = {}): string {
    if (!this.config.baseUrl) {
      return originalUrl;
    }

    const url = new URL(originalUrl, this.config.baseUrl);
    
    // Add optimization parameters
    if (options.width) url.searchParams.set('w', options.width.toString());
    if (options.height) url.searchParams.set('h', options.height.toString());
    if (options.format) url.searchParams.set('f', options.format);
    if (options.quality) url.searchParams.set('q', options.quality.toString());

    // Add auto format if supported
    if (this.optimization.webp) {
      url.searchParams.set('auto', 'format');
    }

    return url.toString();
  }

  /**
   * Generate optimized HTML with CDN URLs
   */
  public optimizeGeneratedHTML(html: string): string {
    let optimizedHtml = html;

    // Replace image URLs with CDN-optimized versions
    optimizedHtml = optimizedHtml.replace(
      /<img\s+([^>]*\s+)?src="([^"]+)"([^>]*)>/gi,
      (match, prefix = '', src, suffix = '') => {
        const optimizedSrc = this.optimizeAssetUrl(src, {
          format: 'webp',
          quality: 85
        });
        
        // Add loading="lazy" for performance
        const lazyLoading = this.optimization.lazyLoading && !suffix.includes('loading=') 
          ? ' loading="lazy"' 
          : '';

        return `<img ${prefix}src="${optimizedSrc}"${suffix}${lazyLoading}>`;
      }
    );

    // Optimize CSS URLs
    optimizedHtml = optimizedHtml.replace(
      /url\(["']?([^"')]+)["']?\)/gi,
      (match, url) => {
        if (url.startsWith('data:') || url.startsWith('http')) {
          return match;
        }
        const optimizedUrl = this.optimizeAssetUrl(url);
        return `url("${optimizedUrl}")`;
      }
    );

    // Add resource hints for critical resources
    optimizedHtml = this.addResourceHints(optimizedHtml);

    // Add CSP meta tag
    optimizedHtml = this.addSecurityHeaders(optimizedHtml);

    console.log('🎨 [CDN] HTML optimized for CDN delivery');
    return optimizedHtml;
  }

  /**
   * Optimize LP for CDN caching
   */
  public optimizeLPForCDN(lpData: {
    html: string;
    css: string;
    metadata?: any;
  }): {
    html: string;
    css: string;
    metadata?: any;
    cacheKey: string;
    headers: Record<string, string>;
  } {
    const startTime = Date.now();

    // Optimize HTML
    const optimizedHtml = this.optimizeGeneratedHTML(lpData.html);

    // Optimize CSS
    const optimizedCss = this.optimizeCSS(lpData.css);

    // Generate cache key
    const cacheKey = this.generateCacheKey(optimizedHtml + optimizedCss);

    // Get appropriate cache headers
    const headers = this.getCacheHeaders('/generated/lp.html');

    // Add performance metadata
    const metadata = {
      ...lpData.metadata,
      optimization: {
        processingTime: Date.now() - startTime,
        originalSize: lpData.html.length + lpData.css.length,
        optimizedSize: optimizedHtml.length + optimizedCss.length,
        compressionRatio: ((lpData.html.length + lpData.css.length) - (optimizedHtml.length + optimizedCss.length)) / (lpData.html.length + lpData.css.length),
        cacheKey,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`⚡ [CDN] LP optimized in ${Date.now() - startTime}ms, cache key: ${cacheKey}`);

    return {
      html: optimizedHtml,
      css: optimizedCss,
      metadata,
      cacheKey,
      headers
    };
  }

  /**
   * Preload critical resources
   */
  public generatePreloadLinks(criticalResources: string[]): string {
    const preloadLinks = criticalResources.map(resource => {
      const optimizedUrl = this.optimizeAssetUrl(resource);
      const type = this.getResourceType(resource);
      
      return `<link rel="preload" href="${optimizedUrl}" as="${type}">`;
    }).join('\n');

    console.log(`🚀 [CDN] Generated ${criticalResources.length} preload links`);
    return preloadLinks;
  }

  /**
   * Generate service worker for offline caching
   */
  public generateServiceWorkerConfig(): {
    cacheStrategies: Array<{
      pattern: string;
      strategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate';
      maxAge: number;
    }>;
    precacheUrls: string[];
  } {
    const cacheStrategies = [
      {
        pattern: '/assets/**/*',
        strategy: 'cacheFirst' as const,
        maxAge: 86400 * 30 // 30 days
      },
      {
        pattern: '/api/**/*',
        strategy: 'networkFirst' as const,
        maxAge: 300 // 5 minutes
      },
      {
        pattern: '/generated/**/*',
        strategy: 'staleWhileRevalidate' as const,
        maxAge: 3600 // 1 hour
      }
    ];

    const precacheUrls = [
      '/',
      '/manifest.json',
      '/_next/static/css/**/*',
      '/_next/static/js/**/*'
    ];

    return { cacheStrategies, precacheUrls };
  }

  // Private helper methods

  private findMatchingRule(path: string): CacheRule | null {
    for (const rule of this.config.cacheRules) {
      if (this.matchesPattern(path, rule.pattern)) {
        return rule;
      }
    }
    return null;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  private generateETag(path: string): string {
    // Simple ETag generation based on path and timestamp
    const hash = this.simpleHash(path + Date.now().toString());
    return hash.toString(16);
  }

  private generateCacheKey(content: string): string {
    return this.simpleHash(content).toString(16);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private optimizeCSS(css: string): string {
    if (!this.optimization.minification) {
      return css;
    }

    // Basic CSS minification
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s{2,}/g, ' ') // Reduce multiple spaces
      .replace(/\s*{\s*/g, '{') // Remove spaces around braces
      .replace(/;\s*}/g, '}') // Remove last semicolon before closing brace
      .replace(/\s*,\s*/g, ',') // Remove spaces around commas
      .trim();
  }

  private addResourceHints(html: string): string {
    // Add DNS prefetch and preconnect hints
    const hints = [
      '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
      '<link rel="dns-prefetch" href="//fonts.gstatic.com">',
      '<link rel="preconnect" href="//fonts.googleapis.com" crossorigin>',
      '<link rel="preconnect" href="//fonts.gstatic.com" crossorigin>'
    ];

    const hintsHtml = hints.join('\n');
    
    return html.replace(
      /<head>/i,
      `<head>\n${hintsHtml}`
    );
  }

  private addSecurityHeaders(html: string): string {
    const cspContent = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self'"
    ].join('; ');

    const securityMeta = `<meta http-equiv="Content-Security-Policy" content="${cspContent}">`;

    return html.replace(
      /<head>/i,
      `<head>\n${securityMeta}`
    );
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'css':
        return 'style';
      case 'js':
        return 'script';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'avif':
        return 'image';
      default:
        return 'fetch';
    }
  }
}

// Export singleton instance
export const cdnOptimizer = CDNOptimizer.getInstance();

// Next.js specific optimization utilities
export const optimizeForVercel = (html: string) => {
  return cdnOptimizer.optimizeGeneratedHTML(html);
};

export const generateVercelHeaders = () => {
  const optimizer = CDNOptimizer.getInstance();
  
  return [
    {
      source: '/assets/(.*)',
      headers: Object.entries(optimizer.getCacheHeaders('/assets/test')).map(([key, value]) => ({
        key,
        value
      }))
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300, must-revalidate'
        }
      ]
    }
  ];
};