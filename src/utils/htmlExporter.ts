/**
 * HTML Export Utility
 * Handles the generation and download of complete HTML files with integrated CSS
 */

export interface ExportOptions {
  includeInlineCSS?: boolean;
  includeExternalCSS?: boolean;
  minifyHTML?: boolean;
  addMetaTags?: boolean;
  responsive?: boolean;
}

export interface ExportResult {
  htmlContent: string;
  filename: string;
  size: number;
  timestamp: Date;
}

/**
 * Generates a complete standalone HTML file with integrated CSS
 */
export function generateCompleteHTML(
  htmlContent: string,
  cssContent: string = '',
  title: string = 'Generated Landing Page',
  options: ExportOptions = {}
): string {
  const {
    includeInlineCSS = true,
    includeExternalCSS = true,
    addMetaTags = true,
    responsive = true
  } = options;

  // Extract body content if full HTML is provided
  let bodyContent = htmlContent;
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1];
  }

  // Extract existing head content
  let existingHeadContent = '';
  const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    existingHeadContent = headMatch[1];
  }

  // Generate meta tags
  const metaTags = addMetaTags ? `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Generated landing page">
    <meta name="generator" content="LP Creator Platform">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ` : '';

  // Generate responsive CSS if needed
  const responsiveCSS = responsive ? `
    /* Responsive Design */
    @media (max-width: 768px) {
      body { font-size: 14px; }
      .container { padding: 10px; }
      h1 { font-size: 24px; }
      h2 { font-size: 20px; }
      h3 { font-size: 18px; }
      .btn { padding: 8px 16px; font-size: 14px; }
    }
    
    @media (max-width: 480px) {
      body { font-size: 12px; }
      .container { padding: 5px; }
      h1 { font-size: 20px; }
      h2 { font-size: 18px; }
      h3 { font-size: 16px; }
      .btn { padding: 6px 12px; font-size: 12px; }
    }
    
    /* Base responsive utilities */
    * { box-sizing: border-box; }
    img { max-width: 100%; height: auto; }
    .responsive-table { overflow-x: auto; }
    .responsive-table table { min-width: 600px; }
  ` : '';

  // Base CSS for better standalone functionality
  const baseSafeCSS = `
    /* Base styles for standalone HTML */
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #fff;
    }
    
    /* Ensure proper box model */
    *, *::before, *::after {
      box-sizing: border-box;
    }
    
    /* Basic typography */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 0;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.2;
    }
    
    p {
      margin-top: 0;
      margin-bottom: 1em;
    }
    
    /* Button styles */
    button, .btn {
      display: inline-block;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    
    /* Image optimization */
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    /* Container utilities */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    /* Flexbox utilities */
    .flex {
      display: flex;
    }
    
    .flex-col {
      flex-direction: column;
    }
    
    .items-center {
      align-items: center;
    }
    
    .justify-center {
      justify-content: center;
    }
    
    .text-center {
      text-align: center;
    }
    
    /* Print styles */
    @media print {
      body {
        font-size: 12pt;
        line-height: 1.4;
      }
      
      .no-print {
        display: none !important;
      }
      
      a {
        text-decoration: none;
        color: #000;
      }
      
      a[href]:after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: #666;
      }
    }
  `;

  // Combine CSS content
  const combinedCSS = [
    baseSafeCSS,
    cssContent,
    responsiveCSS
  ].filter(Boolean).join('\n\n');

  // Generate style tag
  const styleTag = includeInlineCSS && combinedCSS ? `
    <style>
      ${combinedCSS}
    </style>
  ` : '';

  // External CSS links (TailwindCSS, etc.)
  const externalCSS = includeExternalCSS ? `
    <link href="https://cdn.tailwindcss.com" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js" rel="preload" as="script">
  ` : '';

  // Generate complete HTML
  const completeHTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  ${metaTags}
  <title>${escapeHtml(title)}</title>
  ${existingHeadContent}
  ${externalCSS}
  ${styleTag}
</head>
<body>
  ${bodyContent}
</body>
</html>`;

  return completeHTML;
}

/**
 * Generates an appropriate filename based on the page title
 */
export function generateFilename(title: string): string {
  // Remove HTML tags and clean up the title
  let cleanTitle = title
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
    .replace(/[^\w\s\-\.]/g, '') // Remove special characters except spaces, hyphens, and dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();

  // Handle Japanese and other non-ASCII characters
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanTitle)) {
    // If contains non-ASCII characters, use a more generic approach
    const words = title.match(/[a-zA-Z0-9]+/g);
    if (words && words.length > 0) {
      cleanTitle = words.slice(0, 3).join('_').toLowerCase();
    } else {
      cleanTitle = 'landing_page';
    }
  }

  // Ensure filename is not too long
  if (cleanTitle.length > 50) {
    cleanTitle = cleanTitle.substring(0, 50).replace(/_[^_]*$/, '');
  }

  // Fallback to default name if title is empty
  const filename = cleanTitle || 'landing_page';
  
  // Add timestamp to ensure uniqueness
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  
  return `${filename}_${timestamp}.html`;
}

/**
 * Downloads the HTML content as a file
 */
export function downloadHTML(
  htmlContent: string,
  cssContent: string = '',
  title: string = 'Generated Landing Page',
  options: ExportOptions = {}
): ExportResult {
  try {
    // Generate complete HTML
    const completeHTML = generateCompleteHTML(htmlContent, cssContent, title, options);
    
    // Generate filename
    const filename = generateFilename(title);
    
    // Create blob and download
    const blob = new Blob([completeHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return {
      htmlContent: completeHTML,
      filename,
      size: blob.size,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Failed to download HTML:', error);
    throw new Error(`HTML download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates HTML content before export
 */
export function validateHTMLForExport(htmlContent: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if content is empty
  if (!htmlContent || htmlContent.trim().length === 0) {
    errors.push('HTML content is empty');
  }

  // Check for basic HTML structure
  if (!htmlContent.includes('<') || !htmlContent.includes('>')) {
    errors.push('Invalid HTML structure');
  }

  // Check for potentially problematic content
  if (htmlContent.includes('<script>')) {
    warnings.push('Script tags detected - may not work in exported file');
  }

  if (htmlContent.includes('data:image/')) {
    warnings.push('Data URLs detected - file size may be large');
  }

  // Check for external dependencies
  if (htmlContent.includes('src="http') || htmlContent.includes('href="http')) {
    warnings.push('External resources detected - may not work offline');
  }

  // Check for malformed HTML tags
  const openTags = (htmlContent.match(/</g) || []).length;
  const closeTags = (htmlContent.match(/>/g) || []).length;
  if (openTags !== closeTags) {
    warnings.push('Potentially malformed HTML tags detected');
  }

  // More sophisticated malformed HTML detection
  const tagMatches = htmlContent.match(/<\/?[a-zA-Z][^>]*>/g) || [];
  const openTagStack: string[] = [];
  let hasMalformedTags = false;

  for (const tag of tagMatches) {
    if (tag.startsWith('</')) {
      // Closing tag
      const tagName = tag.match(/<\/([a-zA-Z]+)/)?.[1]?.toLowerCase();
      if (tagName) {
        const lastOpenTag = openTagStack.pop();
        if (!lastOpenTag || lastOpenTag !== tagName) {
          hasMalformedTags = true;
          break;
        }
      }
    } else if (!tag.endsWith('/>')) {
      // Opening tag (not self-closing)
      const tagName = tag.match(/<([a-zA-Z]+)/)?.[1]?.toLowerCase();
      if (tagName && !['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName)) {
        openTagStack.push(tagName);
      }
    }
  }

  if (hasMalformedTags || openTagStack.length > 0) {
    warnings.push('Potentially malformed HTML tags detected');
  }

  // Check for missing alt attributes on images
  const imgTags = htmlContent.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = imgTags.filter(tag => !tag.includes('alt='));
  if (imagesWithoutAlt.length > 0) {
    warnings.push(`${imagesWithoutAlt.length} image(s) missing alt attributes`);
  }

  // Check file size estimation
  const estimatedSize = new Blob([htmlContent]).size;
  if (estimatedSize > 1024 * 1024) { // 1MB
    warnings.push('Large file size detected - may be slow to download');
  } else if (estimatedSize > 512 * 1024) { // 512KB
    warnings.push('Moderately large file size - consider optimization');
  }

  // Check for accessibility issues
  const headings = htmlContent.match(/<h[1-6][^>]*>/gi) || [];
  if (headings.length === 0) {
    warnings.push('No heading tags found - may impact accessibility');
  }

  // Check for missing lang attribute
  if (!htmlContent.includes('lang=')) {
    warnings.push('Missing language attribute - may impact accessibility');
  }

  // Check for inline styles (should prefer CSS classes)
  const inlineStyles = htmlContent.match(/style=["'][^"']*["']/gi) || [];
  if (inlineStyles.length > 10) {
    warnings.push(`${inlineStyles.length} inline styles detected - consider using CSS classes`);
  }

  // Check for deprecated HTML elements
  const deprecatedElements = ['center', 'font', 'marquee', 'blink'];
  deprecatedElements.forEach(element => {
    const regex = new RegExp(`<${element}[^>]*>`, 'gi');
    if (regex.test(htmlContent)) {
      warnings.push(`Deprecated HTML element '${element}' detected`);
    }
  });

  // Check for missing viewport meta tag in mobile-first design
  if (!htmlContent.includes('viewport') && !htmlContent.includes('width=device-width')) {
    warnings.push('Missing viewport meta tag - may not display properly on mobile devices');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Minifies HTML content (basic implementation)
 */
export function minifyHTML(html: string): string {
  return html
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
    .replace(/<!--[\s\S]*?-->/g, ''); // Remove comments
}

/**
 * Extracts CSS from HTML content
 */
export function extractCSSFromHTML(htmlContent: string): string {
  const styleMatches = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (!styleMatches) return '';
  
  return styleMatches
    .map(match => {
      const cssMatch = match.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      return cssMatch ? cssMatch[1] : '';
    })
    .join('\n\n');
}

/**
 * Removes CSS from HTML content
 */
export function removeCSSFromHTML(htmlContent: string): string {
  return htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
}

/**
 * Verifies the integrity of exported HTML file
 */
export function verifyExportIntegrity(exportResult: ExportResult): {
  isValid: boolean;
  checks: {
    hasDoctype: boolean;
    hasTitle: boolean;
    hasBody: boolean;
    hasValidStructure: boolean;
    sizeMatches: boolean;
  };
  issues: string[];
} {
  const { htmlContent, size } = exportResult;
  const issues: string[] = [];

  // Check for DOCTYPE
  const hasDoctype = htmlContent.includes('<!DOCTYPE html>');
  if (!hasDoctype) {
    issues.push('Missing DOCTYPE declaration');
  }

  // Check for title tag
  const hasTitle = /<title[^>]*>.*<\/title>/i.test(htmlContent);
  if (!hasTitle) {
    issues.push('Missing or empty title tag');
  }

  // Check for body tag
  const hasBody = /<body[^>]*>[\s\S]*<\/body>/i.test(htmlContent);
  if (!hasBody) {
    issues.push('Missing body tag');
  }

  // Check for valid HTML structure
  const hasValidStructure = htmlContent.includes('<html') && htmlContent.includes('</html>');
  if (!hasValidStructure) {
    issues.push('Invalid HTML structure - missing html tags');
  }

  // Verify size matches content
  const actualSize = new Blob([htmlContent]).size;
  const sizeMatches = Math.abs(actualSize - size) < 100; // Allow small variance
  if (!sizeMatches) {
    issues.push(`Size mismatch: expected ${size}, actual ${actualSize}`);
  }

  return {
    isValid: issues.length === 0,
    checks: {
      hasDoctype,
      hasTitle,
      hasBody,
      hasValidStructure,
      sizeMatches
    },
    issues
  };
}

/**
 * Enhanced export with integrity verification
 */
export function exportHTMLWithVerification(
  htmlContent: string,
  cssContent: string = '',
  title: string = 'Generated Landing Page',
  options: ExportOptions = {}
): ExportResult & { integrity: ReturnType<typeof verifyExportIntegrity> } {
  // Perform standard export
  const exportResult = downloadHTML(htmlContent, cssContent, title, options);
  
  // Verify integrity
  const integrity = verifyExportIntegrity(exportResult);
  
  return {
    ...exportResult,
    integrity
  };
}

/**
 * Creates a clean, standalone HTML output optimized for distribution
 */
export function generateStandaloneHTML(
  htmlContent: string,
  cssContent: string = '',
  title: string = 'Generated Landing Page',
  options: ExportOptions = {}
): string {
  const enhancedOptions: ExportOptions = {
    includeInlineCSS: true,
    includeExternalCSS: true,
    addMetaTags: true,
    responsive: true,
    minifyHTML: false,
    ...options
  };

  // Generate the complete HTML
  let completeHTML = generateCompleteHTML(htmlContent, cssContent, title, enhancedOptions);

  // Add additional meta tags for better SEO and social sharing
  const additionalMeta = `
    <meta name="robots" content="index, follow">
    <meta name="author" content="LP Creator Platform">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="Generated landing page">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="Generated landing page">
  `;

  // Insert additional meta tags after the existing head content
  completeHTML = completeHTML.replace(
    /<\/head>/i,
    `${additionalMeta}\n</head>`
  );

  // Add performance optimization script
  const performanceScript = `
    <script>
      // Performance optimization for standalone HTML
      document.addEventListener('DOMContentLoaded', function() {
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          });
        });
        
        images.forEach(img => imageObserver.observe(img));
        
        // Add smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
          anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
              target.scrollIntoView({ behavior: 'smooth' });
            }
          });
        });
      });
    </script>
  `;

  // Insert performance script before closing body tag
  completeHTML = completeHTML.replace(
    /<\/body>/i,
    `${performanceScript}\n</body>`
  );

  // Minify if requested
  if (enhancedOptions.minifyHTML) {
    completeHTML = minifyHTML(completeHTML);
  }

  return completeHTML;
}

/**
 * Batch export multiple variations
 */
export function exportMultipleVariations(
  variations: Array<{
    htmlContent: string;
    cssContent?: string;
    title: string;
    suffix?: string;
  }>,
  options: ExportOptions = {}
): ExportResult[] {
  return variations.map((variation, index) => {
    const title = variation.suffix 
      ? `${variation.title}_${variation.suffix}`
      : `${variation.title}_variant_${index + 1}`;
    
    return downloadHTML(
      variation.htmlContent,
      variation.cssContent || '',
      title,
      options
    );
  });
}

/**
 * Advanced export with dependency bundling
 */
export function exportWithDependencies(
  htmlContent: string,
  cssContent: string = '',
  title: string = 'Generated Landing Page',
  options: ExportOptions = {}
): ExportResult & { 
  dependencies: string[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const dependencies: string[] = [];

  // Detect external dependencies
  const externalLinks = htmlContent.match(/https?:\/\/[^\s"'<>]+/g) || [];
  const externalImages = htmlContent.match(/<img[^>]+src=["']https?:\/\/[^"']+["'][^>]*>/gi) || [];
  const externalScripts = htmlContent.match(/<script[^>]+src=["']https?:\/\/[^"']+["'][^>]*>/gi) || [];

  dependencies.push(...externalLinks);
  
  if (externalImages.length > 0) {
    warnings.push(`${externalImages.length} external image(s) detected - may not display offline`);
  }
  
  if (externalScripts.length > 0) {
    warnings.push(`${externalScripts.length} external script(s) detected - may not work offline`);
  }

  // Use standalone HTML generation for better dependency handling
  const standaloneHTML = generateStandaloneHTML(htmlContent, cssContent, title, options);
  
  // Perform the download
  const exportResult = downloadHTML(standaloneHTML, '', title, options);

  return {
    ...exportResult,
    htmlContent: standaloneHTML,
    dependencies: [...new Set(dependencies)], // Remove duplicates
    warnings
  };
}