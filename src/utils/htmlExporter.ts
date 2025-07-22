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
    }
    
    @media (max-width: 480px) {
      body { font-size: 12px; }
      .container { padding: 5px; }
      h1 { font-size: 20px; }
      h2 { font-size: 18px; }
      h3 { font-size: 16px; }
    }
  ` : '';

  // Combine CSS content
  const combinedCSS = [
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
  const cleanTitle = title
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();

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