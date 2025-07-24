/**
 * Color Contrast Validation and High Contrast Mode Support
 * WCAG 2.1 AA compliance utilities for color accessibility
 */

export interface ColorContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  level: 'fail' | 'AA' | 'AAA';
  suggestions?: string[];
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface HighContrastTheme {
  name: string;
  colors: {
    background: string;
    text: string;
    link: string;
    linkVisited: string;
    border: string;
    buttonBackground: string;
    buttonText: string;
    focus: string;
  };
}

export class ColorContrastValidator {
  private static instance: ColorContrastValidator;

  private constructor() {}

  public static getInstance(): ColorContrastValidator {
    if (!ColorContrastValidator.instance) {
      ColorContrastValidator.instance = new ColorContrastValidator();
    }
    return ColorContrastValidator.instance;
  }

  /**
   * Calculate color contrast ratio between two colors
   */
  public calculateContrast(foreground: string, background: string): ColorContrastResult {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    const wcagAA = ratio >= 4.5;
    const wcagAAA = ratio >= 7;
    
    let level: 'fail' | 'AA' | 'AAA' = 'fail';
    if (wcagAAA) level = 'AAA';
    else if (wcagAA) level = 'AA';
    
    const suggestions: string[] = [];
    if (!wcagAA) {
      suggestions.push('Consider darkening the text or lightening the background');
      suggestions.push('Use a color palette with higher contrast ratios');
      if (ratio >= 3) {
        suggestions.push('Close to WCAG AA - small adjustments needed');
      }
    }
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      wcagAA,
      wcagAAA,
      level,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Validate all color combinations in HTML content
   */
  public validateHTMLContent(html: string): {
    results: Array<{
      element: string;
      foreground: string;
      background: string;
      contrast: ColorContrastResult;
    }>;
    overallScore: number;
    issues: number;
  } {
    // Create a temporary DOM to analyze
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const results: Array<{
      element: string;
      foreground: string;
      background: string;
      contrast: ColorContrastResult;
    }> = [];
    
    // Get all text elements
    const textElements = doc.querySelectorAll('*');
    
    textElements.forEach((element, index) => {
      const computedStyle = this.getComputedStyles(element as HTMLElement);
      const textContent = element.textContent?.trim();
      
      if (textContent && textContent.length > 0) {
        const foreground = computedStyle.color || '#000000';
        const background = computedStyle.backgroundColor || '#ffffff';
        
        // Only validate if we have actual colors (not transparent)
        if (foreground !== 'transparent' && background !== 'transparent') {
          const contrast = this.calculateContrast(foreground, background);
          
          results.push({
            element: `${element.tagName.toLowerCase()}[${index}]`,
            foreground,
            background,
            contrast
          });
        }
      }
    });
    
    // Calculate overall score
    const totalChecks = results.length;
    const passedChecks = results.filter(r => r.contrast.wcagAA).length;
    const overallScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
    const issues = totalChecks - passedChecks;
    
    return {
      results,
      overallScore,
      issues
    };
  }

  /**
   * Generate accessible color palette
   */
  public generateAccessiblePalette(baseColor: string): ColorPalette {
    const hsl = this.hexToHsl(baseColor);
    
    return {
      primary: baseColor,
      secondary: this.hslToHex((hsl.h + 30) % 360, hsl.s, Math.max(hsl.l - 0.1, 0.2)),
      background: '#ffffff',
      text: '#212529',
      accent: this.hslToHex((hsl.h + 180) % 360, Math.min(hsl.s + 0.2, 1), 0.4)
    };
  }

  /**
   * Fix color contrast issues automatically
   */
  public fixContrastIssues(html: string, css: string): {
    fixedHTML: string;
    fixedCSS: string;
    changes: Array<{
      type: 'color' | 'background';
      original: string;
      fixed: string;
      reason: string;
    }>;
  } {
    const changes: Array<{
      type: 'color' | 'background';
      original: string;
      fixed: string;
      reason: string;
    }> = [];
    
    let fixedCSS = css;
    
    // Common problematic color combinations
    const fixes = [
      // Light gray text on white background
      {
        search: /color:\s*#([cdefCDEF][0-9a-fA-F]{5}|[89a-fA-F][0-9a-fA-F]{5})/g,
        replace: 'color: #495057',
        reason: 'Improved text contrast'
      },
      // Very light backgrounds with dark text
      {
        search: /background-color:\s*#([fF][0-9a-fA-F]{5})/g,
        replace: 'background-color: #f8f9fa',
        reason: 'Improved background contrast'
      }
    ];
    
    fixes.forEach(fix => {
      const matches = fixedCSS.match(fix.search);
      if (matches) {
        matches.forEach(match => {
          changes.push({
            type: match.includes('background') ? 'background' : 'color',
            original: match,
            fixed: fix.replace,
            reason: fix.reason
          });
        });
        
        fixedCSS = fixedCSS.replace(fix.search, fix.replace);
      }
    });
    
    return {
      fixedHTML: html,
      fixedCSS,
      changes
    };
  }

  /**
   * Get high contrast themes
   */
  public getHighContrastThemes(): HighContrastTheme[] {
    return [
      {
        name: 'High Contrast Dark',
        colors: {
          background: '#000000',
          text: '#ffffff',
          link: '#66d9ff',
          linkVisited: '#b366ff',
          border: '#ffffff',
          buttonBackground: '#ffffff',
          buttonText: '#000000',
          focus: '#ffff00'
        }
      },
      {
        name: 'High Contrast Light',
        colors: {
          background: '#ffffff',
          text: '#000000',
          link: '#0066cc',
          linkVisited: '#6600cc',
          border: '#000000',
          buttonBackground: '#000000',
          buttonText: '#ffffff',
          focus: '#ff6600'
        }
      },
      {
        name: 'High Contrast Yellow',
        colors: {
          background: '#ffff00',
          text: '#000000',
          link: '#0000ff',
          linkVisited: '#800080',
          border: '#000000',
          buttonBackground: '#000000',
          buttonText: '#ffff00',
          focus: '#ff0000'
        }
      }
    ];
  }

  /**
   * Apply high contrast theme to CSS
   */
  public applyHighContrastTheme(css: string, theme: HighContrastTheme): string {
    let themedCSS = css;
    
    // Replace common color properties
    const replacements = [
      { search: /background-color:\s*[^;]+/g, replace: `background-color: ${theme.colors.background}` },
      { search: /color:\s*[^;]+/g, replace: `color: ${theme.colors.text}` },
      { search: /border-color:\s*[^;]+/g, replace: `border-color: ${theme.colors.border}` }
    ];
    
    replacements.forEach(({ search, replace }) => {
      themedCSS = themedCSS.replace(search, replace);
    });
    
    // Add high contrast specific styles
    const highContrastStyles = `
/* High Contrast Theme: ${theme.name} */
body {
  background-color: ${theme.colors.background} !important;
  color: ${theme.colors.text} !important;
}

a, a:link {
  color: ${theme.colors.link} !important;
  text-decoration: underline !important;
}

a:visited {
  color: ${theme.colors.linkVisited} !important;
}

button, input[type="button"], input[type="submit"] {
  background-color: ${theme.colors.buttonBackground} !important;
  color: ${theme.colors.buttonText} !important;
  border: 2px solid ${theme.colors.border} !important;
}

:focus {
  outline: 3px solid ${theme.colors.focus} !important;
  outline-offset: 2px !important;
}

* {
  border-color: ${theme.colors.border} !important;
}

img {
  filter: contrast(1.2) brightness(1.1);
}
`;
    
    return themedCSS + '\n' + highContrastStyles;
  }

  /**
   * Check if user prefers high contrast
   */
  public prefersHighContrast(): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(-ms-high-contrast: active)').matches;
  }

  /**
   * Get relative luminance of a color
   */
  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;
    
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Convert hex color to HSL
   */
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return { h: 0, s: 0, l: 0 };
    
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return { h: h * 360, s, l };
  }

  /**
   * Convert HSL to hex color
   */
  private hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  /**
   * Get computed styles for an element (mock implementation)
   */
  private getComputedStyles(element: HTMLElement): { color: string; backgroundColor: string } {
    // In a real implementation, this would use getComputedStyle
    // For now, we'll extract from inline styles or provide defaults
    
    const style = element.getAttribute('style') || '';
    
    let color = '#000000';
    let backgroundColor = '#ffffff';
    
    const colorMatch = style.match(/color:\s*([^;]+)/);
    if (colorMatch) {
      color = colorMatch[1].trim();
    }
    
    const bgMatch = style.match(/background-color:\s*([^;]+)/);
    if (bgMatch) {
      backgroundColor = bgMatch[1].trim();
    }
    
    // Check for common class-based colors
    const className = element.className.toLowerCase();
    if (className.includes('text-white')) color = '#ffffff';
    if (className.includes('text-black')) color = '#000000';
    if (className.includes('text-gray')) color = '#6c757d';
    if (className.includes('bg-white')) backgroundColor = '#ffffff';
    if (className.includes('bg-black')) backgroundColor = '#000000';
    if (className.includes('bg-gray')) backgroundColor = '#f8f9fa';
    
    return { color, backgroundColor };
  }
}

// Export singleton instance
export const colorContrastValidator = ColorContrastValidator.getInstance();

// React hook for color contrast validation
export function useColorContrastValidator() {
  const [isHighContrast, setIsHighContrast] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState<HighContrastTheme | null>(null);

  React.useEffect(() => {
    // Check user preference
    const prefersHighContrast = colorContrastValidator.prefersHighContrast();
    setIsHighContrast(prefersHighContrast);

    // Listen for preference changes
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addListener(handleChange);

    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  const enableHighContrast = (theme?: HighContrastTheme) => {
    const selectedTheme = theme || colorContrastValidator.getHighContrastThemes()[0];
    setCurrentTheme(selectedTheme);
    setIsHighContrast(true);

    // Apply theme to document
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-high-contrast', selectedTheme.name);
    }
  };

  const disableHighContrast = () => {
    setCurrentTheme(null);
    setIsHighContrast(false);

    if (typeof document !== 'undefined') {
      document.body.removeAttribute('data-high-contrast');
    }
  };

  const validateContent = (html: string) => {
    return colorContrastValidator.validateHTMLContent(html);
  };

  const calculateContrast = (foreground: string, background: string) => {
    return colorContrastValidator.calculateContrast(foreground, background);
  };

  return {
    isHighContrast,
    currentTheme,
    enableHighContrast,
    disableHighContrast,
    validateContent,
    calculateContrast,
    availableThemes: colorContrastValidator.getHighContrastThemes()
  };
}

// Add React import for hook
import React from 'react';