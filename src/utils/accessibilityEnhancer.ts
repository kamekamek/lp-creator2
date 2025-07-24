/**
 * Accessibility Enhancement Utilities
 * Automatically enhances generated content for WCAG 2.1 AA compliance
 */

export interface AccessibilityEnhancementOptions {
  enhanceSemantics: boolean;
  addAriaLabels: boolean;
  improveHeadingStructure: boolean;
  addKeyboardNavigation: boolean;
  checkColorContrast: boolean;
  addSkipLinks: boolean;
  enhanceForms: boolean;
}

export interface AccessibilityReport {
  score: number; // 0-100
  issues: AccessibilityIssue[];
  improvements: AccessibilityImprovement[];
  wcagLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element?: string;
  suggestion: string;
  wcagReference: string;
}

export interface AccessibilityImprovement {
  type: 'semantic' | 'aria' | 'heading' | 'keyboard' | 'contrast' | 'form';
  description: string;
  beforeAfter?: {
    before: string;
    after: string;
  };
}

export class AccessibilityEnhancer {
  private options: AccessibilityEnhancementOptions;
  private parser: DOMParser;

  constructor(options: Partial<AccessibilityEnhancementOptions> = {}) {
    this.options = {
      enhanceSemantics: true,
      addAriaLabels: true,
      improveHeadingStructure: true,
      addKeyboardNavigation: true,
      checkColorContrast: true,
      addSkipLinks: true,
      enhanceForms: true,
      ...options
    };

    this.parser = new DOMParser();
  }

  /**
   * Enhance HTML content for accessibility
   */
  public enhanceHTML(html: string): {
    enhancedHTML: string;
    report: AccessibilityReport;
  } {
    const doc = this.parser.parseFromString(html, 'text/html');
    const improvements: AccessibilityImprovement[] = [];
    const issues: AccessibilityIssue[] = [];

    // Apply enhancements
    if (this.options.enhanceSemantics) {
      this.enhanceSemanticStructure(doc, improvements, issues);
    }

    if (this.options.improveHeadingStructure) {
      this.improveHeadingHierarchy(doc, improvements, issues);
    }

    if (this.options.addAriaLabels) {
      this.addAriaLabelsAndRoles(doc, improvements, issues);
    }

    if (this.options.addKeyboardNavigation) {
      this.enhanceKeyboardNavigation(doc, improvements, issues);
    }

    if (this.options.addSkipLinks) {
      this.addSkipLinks(doc, improvements);
    }

    if (this.options.enhanceForms) {
      this.enhanceForms(doc, improvements, issues);
    }

    // Generate report
    const report = this.generateReport(improvements, issues);

    return {
      enhancedHTML: doc.documentElement.outerHTML,
      report
    };
  }

  /**
   * Enhance semantic structure
   */
  private enhanceSemanticStructure(
    doc: Document, 
    improvements: AccessibilityImprovement[], 
    issues: AccessibilityIssue[]
  ): void {
    // Convert divs to semantic elements where appropriate
    const divs = doc.querySelectorAll('div');
    
    divs.forEach(div => {
      const className = div.className.toLowerCase();
      const textContent = div.textContent?.toLowerCase() || '';
      
      let newTagName: string | null = null;
      
      // Header patterns
      if (className.includes('header') || className.includes('nav') || 
          textContent.includes('menu') || textContent.includes('navigation')) {
        if (!div.closest('header, nav')) {
          newTagName = className.includes('nav') || textContent.includes('menu') ? 'nav' : 'header';
        }
      }
      
      // Main content patterns
      else if (className.includes('main') || className.includes('content') ||
               className.includes('article')) {
        if (!div.closest('main, article')) {
          newTagName = className.includes('article') ? 'article' : 'main';
        }
      }
      
      // Sidebar patterns
      else if (className.includes('sidebar') || className.includes('aside')) {
        if (!div.closest('aside')) {
          newTagName = 'aside';
        }
      }
      
      // Footer patterns
      else if (className.includes('footer')) {
        if (!div.closest('footer')) {
          newTagName = 'footer';
        }
      }
      
      // Section patterns
      else if (className.includes('section') || className.includes('block')) {
        if (!div.closest('section, article')) {
          newTagName = 'section';
        }
      }
      
      if (newTagName) {
        const newElement = doc.createElement(newTagName);
        newElement.innerHTML = div.innerHTML;
        
        // Copy attributes
        Array.from(div.attributes).forEach(attr => {
          newElement.setAttribute(attr.name, attr.value);
        });
        
        div.parentNode?.replaceChild(newElement, div);
        
        improvements.push({
          type: 'semantic',
          description: `Converted div to semantic ${newTagName} element`,
          beforeAfter: {
            before: `<div class="${div.className}">`,
            after: `<${newTagName} class="${div.className}">`
          }
        });
      }
    });

    // Ensure proper document structure
    this.ensureDocumentStructure(doc, improvements, issues);
  }

  /**
   * Ensure proper document structure
   */
  private ensureDocumentStructure(
    doc: Document, 
    improvements: AccessibilityImprovement[], 
    issues: AccessibilityIssue[]
  ): void {
    const body = doc.body;
    if (!body) return;

    // Ensure main element exists
    let main = body.querySelector('main');
    if (!main) {
      // Find likely main content
      const contentSelectors = [
        '[class*="main"]',
        '[class*="content"]',
        '[id*="main"]',
        '[id*="content"]'
      ];
      
      let mainContent = null;
      for (const selector of contentSelectors) {
        mainContent = body.querySelector(selector);
        if (mainContent) break;
      }
      
      if (mainContent && mainContent.tagName !== 'MAIN') {
        main = doc.createElement('main');
        mainContent.parentNode?.insertBefore(main, mainContent);
        main.appendChild(mainContent);
        
        improvements.push({
          type: 'semantic',
          description: 'Added main landmark element',
          beforeAfter: {
            before: `<${mainContent.tagName.toLowerCase()}>`,
            after: '<main>'
          }
        });
      }
    }

    // Check for multiple main elements (WCAG violation)
    const mains = body.querySelectorAll('main');
    if (mains.length > 1) {
      issues.push({
        type: 'error',
        rule: 'single-main-landmark',
        description: 'Multiple main landmarks found',
        suggestion: 'Ensure only one main landmark exists per page',
        wcagReference: 'WCAG 2.1 - 1.3.1 Info and Relationships'
      });
    }
  }

  /**
   * Improve heading hierarchy
   */
  private improveHeadingHierarchy(
    doc: Document, 
    improvements: AccessibilityImprovement[], 
    issues: AccessibilityIssue[]
  ): void {
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels: number[] = [];
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      headingLevels.push(level);
      
      // Check for proper nesting
      if (index > 0) {
        const prevLevel = headingLevels[index - 1];
        if (level > prevLevel + 1) {
          issues.push({
            type: 'warning',
            rule: 'heading-hierarchy',
            description: `Heading level skipped: ${heading.tagName} follows H${prevLevel}`,
            element: heading.textContent?.substring(0, 50) || '',
            suggestion: `Use H${prevLevel + 1} instead of ${heading.tagName}`,
            wcagReference: 'WCAG 2.1 - 1.3.1 Info and Relationships'
          });
        }
      }
    });

    // Ensure h1 exists and is first
    const h1s = doc.querySelectorAll('h1');
    if (h1s.length === 0) {
      // Try to identify the main title
      const titleCandidates = doc.querySelectorAll('h2, h3, .title, .heading, [class*="title"]');
      if (titleCandidates.length > 0) {
        const firstCandidate = titleCandidates[0];
        if (firstCandidate.tagName.startsWith('H')) {
          const h1 = doc.createElement('h1');
          h1.innerHTML = firstCandidate.innerHTML;
          Array.from(firstCandidate.attributes).forEach(attr => {
            h1.setAttribute(attr.name, attr.value);
          });
          firstCandidate.parentNode?.replaceChild(h1, firstCandidate);
          
          improvements.push({
            type: 'heading',
            description: 'Converted main heading to H1',
            beforeAfter: {
              before: firstCandidate.tagName.toLowerCase(),
              after: 'h1'
            }
          });
        }
      }
    } else if (h1s.length > 1) {
      issues.push({
        type: 'warning',
        rule: 'single-h1',
        description: 'Multiple H1 elements found',
        suggestion: 'Use only one H1 per page for the main heading',
        wcagReference: 'WCAG 2.1 - 1.3.1 Info and Relationships'
      });
    }
  }

  /**
   * Add ARIA labels and roles
   */
  private addAriaLabelsAndRoles(
    doc: Document, 
    improvements: AccessibilityImprovement[], 
    issues: AccessibilityIssue[]
  ): void {
    // Add landmarks roles where missing
    const landmarkElements = doc.querySelectorAll('nav, main, aside, header, footer, section');
    landmarkElements.forEach(element => {
      if (!element.getAttribute('role')) {
        let role = '';
        switch (element.tagName.toLowerCase()) {
          case 'nav':
            role = 'navigation';
            break;
          case 'main':
            role = 'main';
            break;
          case 'aside':
            role = 'complementary';
            break;
          case 'header':
            role = 'banner';
            break;
          case 'footer':
            role = 'contentinfo';
            break;
          case 'section':
            role = 'region';
            break;
        }
        
        if (role) {
          element.setAttribute('role', role);
          improvements.push({
            type: 'aria',
            description: `Added role="${role}" to ${element.tagName.toLowerCase()} element`
          });
        }
      }
    });

    // Add aria-label to navigation without visible text
    const navs = doc.querySelectorAll('nav');
    navs.forEach(nav => {
      if (!nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')) {
        const navText = nav.textContent?.trim();
        if (!navText || navText.length < 3) {
          nav.setAttribute('aria-label', 'Navigation menu');
          improvements.push({
            type: 'aria',
            description: 'Added aria-label to navigation element'
          });
        }
      }
    });

    // Enhance buttons and links
    this.enhanceInteractiveElements(doc, improvements, issues);
    
    // Add aria-live regions for dynamic content
    this.addLiveRegions(doc, improvements);
  }

  /**
   * Enhance interactive elements
   */
  private enhanceInteractiveElements(
    doc: Document, 
    improvements: AccessibilityImprovement[], 
    issues: AccessibilityIssue[]
  ): void {
    // Enhance buttons
    const buttons = doc.querySelectorAll('button, [role="button"]');
    buttons.forEach(button => {
      const text = button.textContent?.trim();
      if (!text || text.length < 2) {
        if (!button.getAttribute('aria-label') && !button.getAttribute('aria-labelledby')) {
          // Try to find context
          const icon = button.querySelector('svg, i, .icon');
          if (icon) {
            const className = icon.className || '';
            let label = 'Button';
            
            if (className.includes('close')) label = 'Close';
            else if (className.includes('edit')) label = 'Edit';
            else if (className.includes('delete')) label = 'Delete';
            else if (className.includes('save')) label = 'Save';
            else if (className.includes('menu')) label = 'Menu';
            
            button.setAttribute('aria-label', label);
            improvements.push({
              type: 'aria',
              description: `Added aria-label="${label}" to button with icon`
            });
          } else {
            issues.push({
              type: 'error',
              rule: 'button-name',
              description: 'Button without accessible name',
              suggestion: 'Add aria-label or visible text to button',
              wcagReference: 'WCAG 2.1 - 4.1.2 Name, Role, Value'
            });
          }
        }
      }
    });

    // Enhance links
    const links = doc.querySelectorAll('a');
    links.forEach(link => {
      const text = link.textContent?.trim();
      const href = link.getAttribute('href');
      
      // Check for ambiguous link text
      if (text && ['click here', 'read more', 'more', 'here', 'link'].includes(text.toLowerCase())) {
        issues.push({
          type: 'warning',
          rule: 'link-purpose',
          description: `Ambiguous link text: "${text}"`,
          suggestion: 'Use descriptive link text that explains the link purpose',
          wcagReference: 'WCAG 2.1 - 2.4.4 Link Purpose'
        });
      }
      
      // Add target indicators for external links
      if (href && (href.startsWith('http') || href.startsWith('//')) && 
          !href.includes(window.location.hostname)) {
        if (!link.getAttribute('aria-label')) {
          link.setAttribute('aria-label', `${text} (opens in new window)`);
          improvements.push({
            type: 'aria',
            description: 'Added external link indicator'
          });
        }
      }
    });
  }

  /**
   * Add live regions for dynamic content
   */
  private addLiveRegions(doc: Document, improvements: AccessibilityImprovement[]): void {
    // Look for elements that might contain dynamic content
    const dynamicSelectors = [
      '[class*="loading"]',
      '[class*="status"]',
      '[class*="alert"]',
      '[class*="notification"]',
      '[class*="message"]'
    ];
    
    dynamicSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.getAttribute('aria-live')) {
          const className = element.className.toLowerCase();
          let liveValue = 'polite';
          
          if (className.includes('alert') || className.includes('error')) {
            liveValue = 'assertive';
          }
          
          element.setAttribute('aria-live', liveValue);
          improvements.push({
            type: 'aria',
            description: `Added aria-live="${liveValue}" to dynamic content area`
          });
        }
      });
    });
  }

  /**
   * Enhance keyboard navigation
   */
  private enhanceKeyboardNavigation(
    doc: Document, 
    improvements: AccessibilityImprovement[], 
    issues: AccessibilityIssue[]
  ): void {
    // Ensure interactive elements are keyboard accessible
    const interactiveElements = doc.querySelectorAll('div[onclick], span[onclick], [role="button"]:not(button)');
    
    interactiveElements.forEach(element => {
      // Add tabindex if missing
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
        improvements.push({
          type: 'keyboard',
          description: 'Added tabindex="0" to interactive element'
        });
      }
      
      // Add keyboard event handling hint
      if (!element.getAttribute('onkeydown') && !element.getAttribute('onkeypress')) {
        element.setAttribute('data-keyboard-hint', 'true');
        improvements.push({
          type: 'keyboard',
          description: 'Added keyboard accessibility hint to clickable element'
        });
      }
    });

    // Check for keyboard traps
    const tabindexElements = doc.querySelectorAll('[tabindex]');
    let hasPositiveTabindex = false;
    
    tabindexElements.forEach(element => {
      const tabindex = parseInt(element.getAttribute('tabindex') || '0');
      if (tabindex > 0) {
        hasPositiveTabindex = true;
      }
    });
    
    if (hasPositiveTabindex) {
      issues.push({
        type: 'warning',
        rule: 'no-positive-tabindex',
        description: 'Positive tabindex values found',
        suggestion: 'Use tabindex="0" or rely on natural tab order',
        wcagReference: 'WCAG 2.1 - 2.4.3 Focus Order'
      });
    }
  }

  /**
   * Add skip links
   */
  private addSkipLinks(doc: Document, improvements: AccessibilityImprovement[]): void {
    const body = doc.body;
    if (!body) return;

    // Check if skip links already exist
    const existingSkipLinks = body.querySelector('a[href="#main"], a[href="#content"]');
    if (existingSkipLinks) return;

    // Find main content area
    const main = body.querySelector('main, #main, #content, [role="main"]');
    if (!main) return;

    // Ensure main has an ID
    if (!main.id) {
      main.id = 'main-content';
    }

    // Create skip link
    const skipLink = doc.createElement('a');
    skipLink.href = `#${main.id}`;
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      transition: top 0.3s;
    `;
    
    // Add focus styles
    skipLink.setAttribute('onfocus', "this.style.top = '6px'");
    skipLink.setAttribute('onblur', "this.style.top = '-40px'");

    // Insert at the beginning of body
    body.insertBefore(skipLink, body.firstChild);

    improvements.push({
      type: 'keyboard',
      description: 'Added skip link for keyboard navigation'
    });
  }

  /**
   * Enhance forms
   */
  private enhanceForms(
    doc: Document, 
    improvements: AccessibilityImprovement[], 
    issues: AccessibilityIssue[]
  ): void {
    const forms = doc.querySelectorAll('form');
    
    forms.forEach(form => {
      // Enhance form inputs
      const inputs = form.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        const type = input.getAttribute('type');
        const id = input.id;
        
        // Ensure inputs have labels
        if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
          let label = form.querySelector(`label[for="${id}"]`);
          
          if (!label && id) {
            // Try to find a label by proximity
            const parentDiv = input.parentElement;
            if (parentDiv) {
              const possibleLabel = parentDiv.querySelector('label, .label, [class*="label"]');
              if (possibleLabel && !possibleLabel.getAttribute('for')) {
                possibleLabel.setAttribute('for', id);
                label = possibleLabel;
              }
            }
          }
          
          if (!label) {
            issues.push({
              type: 'error',
              rule: 'form-label',
              description: `Form input without label: ${type || 'input'}`,
              suggestion: 'Add a label element or aria-label attribute',
              wcagReference: 'WCAG 2.1 - 1.3.1 Info and Relationships'
            });
          } else {
            improvements.push({
              type: 'form',
              description: 'Associated form input with label'
            });
          }
        }
        
        // Add required indicators
        if (input.hasAttribute('required')) {
          if (!input.getAttribute('aria-required')) {
            input.setAttribute('aria-required', 'true');
            improvements.push({
              type: 'form',
              description: 'Added aria-required to required field'
            });
          }
        }
        
        // Add placeholder alternatives
        const placeholder = input.getAttribute('placeholder');
        if (placeholder && !input.getAttribute('aria-describedby')) {
          const descId = `${id || 'input'}-desc`;
          const description = doc.createElement('div');
          description.id = descId;
          description.textContent = placeholder;
          description.className = 'sr-only';
          description.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          `;
          
          input.parentNode?.insertBefore(description, input.nextSibling);
          input.setAttribute('aria-describedby', descId);
          
          improvements.push({
            type: 'form',
            description: 'Enhanced placeholder with aria-describedby'
          });
        }
      });
    });
  }

  /**
   * Generate accessibility report
   */
  private generateReport(
    improvements: AccessibilityImprovement[], 
    issues: AccessibilityIssue[]
  ): AccessibilityReport {
    const errorCount = issues.filter(issue => issue.type === 'error').length;
    const warningCount = issues.filter(issue => issue.type === 'warning').length;
    
    // Calculate score based on issues and improvements
    let score = 100;
    score -= errorCount * 15; // Major deduction for errors
    score -= warningCount * 5; // Minor deduction for warnings
    score = Math.max(0, score);
    
    // Add points for improvements
    score += Math.min(improvements.length * 2, 20);
    score = Math.min(100, score);
    
    // Determine WCAG level
    let wcagLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant' = 'Non-compliant';
    if (errorCount === 0) {
      if (warningCount === 0) {
        wcagLevel = 'AAA';
      } else if (warningCount <= 2) {
        wcagLevel = 'AA';
      } else {
        wcagLevel = 'A';
      }
    }
    
    return {
      score,
      issues,
      improvements,
      wcagLevel
    };
  }
}

// Export default instance
export const accessibilityEnhancer = new AccessibilityEnhancer();