/**
 * HTML Processing Utilities
 * 
 * Collection of utility functions for sanitizing and processing HTML content.
 * These functions handle common HTML issues like broken attributes, malformed SVG paths,
 * and HTML entity decoding.
 */

/**
 * Decodes common HTML entities back to their original characters
 * @param content - HTML content string to decode
 * @returns Decoded HTML content
 */
export const decodeHtmlEntities = (content: string): string => {
  return content
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // 最後に処理することが重要
};

/**
 * Fixes broken SVG path attributes that may have escaped quotes or malformed syntax
 * @param content - HTML content string to fix
 * @returns HTML content with fixed SVG paths
 */
export const fixBrokenSvgPaths = (content: string): string => {
  return content
    .replace(/d="\\*"/g, 'd=""')
    .replace(/d="\\+"([^"]*)"\\*"/g, 'd="$1"')
    .replace(/d="\\"([^"]*)\\""/g, 'd="$1"');
};

/**
 * Fixes broken HTML attributes that may have escaped quotes
 * @param content - HTML content string to fix
 * @returns HTML content with fixed attributes
 */
export const fixBrokenAttributes = (content: string): string => {
  return content
    .replace(/src="\\"([^"]*)\\""/g, 'src="$1"')
    .replace(/href="\\"([^"]*)\\""/g, 'href="$1"');
};

/**
 * Fixes SVG data URLs that may have malformed quote escaping
 * @param content - HTML content string to fix
 * @returns HTML content with fixed SVG data URLs
 */
export const fixSvgDataUrls = (content: string): string => {
  return content.replace(/"data:image\/svg\+xml,[^"]*"/g, (match: string) => {
    return match.replace(/\\"/g, '"').replace(/""/g, '"');
  });
};

/**
 * Replaces empty img tags with placeholder divs
 * @param content - HTML content string to process
 * @returns HTML content with placeholder divs instead of empty images
 */
export const replaceEmptyImages = (content: string): string => {
  return content.replace(
    /<img[^>]*src=""[^>]*>/g, 
    '<div class="bg-gray-200 rounded-lg h-48 flex items-center justify-center"><span class="text-gray-500">画像プレースホルダー</span></div>'
  );
};

/**
 * Escapes characters that could break template literals
 * @param str - String to escape
 * @returns Escaped string safe for template literals
 */
export const escapeForTemplate = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${'); // "${" をエスケープ
};

/**
 * Comprehensive HTML content sanitization
 * Applies all the individual sanitization functions in the correct order
 * @param content - Raw HTML content to sanitize
 * @returns Sanitized HTML content
 */
export const sanitizeHtmlContent = (content: string): string => {
  let processedContent = content;
  processedContent = decodeHtmlEntities(processedContent);
  processedContent = fixBrokenSvgPaths(processedContent);
  processedContent = fixBrokenAttributes(processedContent);
  processedContent = fixSvgDataUrls(processedContent);
  processedContent = replaceEmptyImages(processedContent);
  return processedContent;
};

/**
 * Type definition for HTML content analysis result
 */
export interface HtmlContentAnalysis {
  hasStyleTag: boolean;
  hasHtmlStructure: boolean;
  isCompleteHtml: boolean;
}

/**
 * Analyzes HTML content to determine its structure and completeness
 * @param content - HTML content to analyze
 * @returns Analysis result with flags for different HTML features
 */
export const analyzeHtmlContent = (content: string): HtmlContentAnalysis => {
  const hasStyleTag = content.includes('<style>') && content.includes('</style>');
  const hasHtmlStructure = content.includes('<section') || content.includes('<div') || content.includes('<body');
  const isCompleteHtml = content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html');
  
  return {
    hasStyleTag,
    hasHtmlStructure,
    isCompleteHtml
  };
};