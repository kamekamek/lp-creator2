/**
 * Enhanced element detection utilities for real-time editing system
 * Implements advanced element detection with improved highlighting and selection
 */

export interface EditableElementInfo {
  element: HTMLElement;
  id: string;
  type: string;
  text: string;
  priority: number;
  isVisible: boolean;
  boundingRect: DOMRect;
  parentType?: string;
  depth: number;
  isInteractive?: boolean;
  hasChildren?: boolean;
  textLength?: number;
}

export interface ElementHighlightInfo {
  elementId: string;
  isHovered: boolean;
  isSelected: boolean;
  isEditing: boolean;
  highlightColor: string;
  zIndex: number;
}

export interface ElementDetectionOptions {
  minTextLength?: number;
  maxTextLength?: number;
  excludeSelectors?: string[];
  includeSelectors?: string[];
  prioritizeHeadings?: boolean;
  skipNestedElements?: boolean;
}

/**
 * Enhanced element detection with improved filtering and prioritization
 * Implements smart element detection with better performance and accuracy
 */
export function detectEditableElements(
  document: Document,
  options: ElementDetectionOptions = {}
): EditableElementInfo[] {
  const {
    minTextLength = 2,
    maxTextLength = 1000,
    excludeSelectors = ['script', 'style', 'noscript', '[contenteditable="true"]'],
    includeSelectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'button', 'a',
      'li', 'td', 'th', 'figcaption', 'blockquote', 'cite', 'label',
      '[role="heading"]', '[role="button"]', '[role="link"]',
      '.text-content', '.editable-text', '.content'
    ],
    prioritizeHeadings = true,
    skipNestedElements = true
  } = options;

  const elements = document.querySelectorAll(includeSelectors.join(', '));
  const editableElements: EditableElementInfo[] = [];
  const processedElements = new Set<HTMLElement>();

  elements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;

    // Skip if already processed or excluded
    if (processedElements.has(htmlElement)) return;
    if (excludeSelectors.some(selector => htmlElement.closest(selector))) return;

    const textContent = htmlElement.textContent?.trim() || '';
    const computedStyle = document.defaultView?.getComputedStyle(htmlElement);

    // Enhanced visibility check
    const isVisible = computedStyle &&
      computedStyle.display !== 'none' &&
      computedStyle.visibility !== 'hidden' &&
      computedStyle.opacity !== '0' &&
      htmlElement.offsetWidth > 0 &&
      htmlElement.offsetHeight > 0;

    // Enhanced text content validation
    const hasValidText = textContent.length >= minTextLength &&
      textContent.length <= maxTextLength &&
      !isOnlyWhitespace(textContent) &&
      !isOnlySpecialChars(textContent);

    if (!isVisible || !hasValidText) return;

    // Skip if already has data-editable-id (avoid duplicates)
    if (htmlElement.hasAttribute('data-editable-id')) return;

    // Calculate element depth for prioritization
    const depth = getElementDepth(htmlElement);

    // Skip deeply nested elements if option is enabled
    if (skipNestedElements && depth > 10) return;

    // Generate unique ID
    const elementType = htmlElement.tagName.toLowerCase();
    const parentType = htmlElement.parentElement?.tagName.toLowerCase() || 'root';
    const contentHash = generateContentHash(textContent);
    const position = getElementPosition(htmlElement);
    const editableId = `${elementType}-${parentType}-${contentHash}-${position}-${index}`;

    // Calculate priority score
    const priority = calculateElementPriority(htmlElement, textContent, prioritizeHeadings);

    // Get bounding rectangle
    const boundingRect = htmlElement.getBoundingClientRect();

    const elementInfo: EditableElementInfo = {
      element: htmlElement,
      id: editableId,
      type: elementType,
      text: textContent,
      priority,
      isVisible: !!isVisible,
      boundingRect,
      parentType,
      depth
    };

    editableElements.push(elementInfo);
    processedElements.add(htmlElement);

    // Mark parent elements as processed to avoid nested selection
    if (skipNestedElements) {
      let parent = htmlElement.parentElement;
      while (parent && parent !== document.body) {
        processedElements.add(parent);
        parent = parent.parentElement;
      }
    }
  });

  // Sort by priority (higher priority first)
  return editableElements.sort((a, b) => b.priority - a.priority);
}

/**
 * Apply editable attributes to detected elements
 */
export function applyEditableAttributes(elements: EditableElementInfo[]): void {
  elements.forEach(({ element, id, type, text }) => {
    element.setAttribute('data-editable-id', id);
    element.setAttribute('data-original-text', text);
    element.setAttribute('data-element-type', type);
    element.setAttribute('data-edit-priority', element.dataset.editPriority || '0');
  });
}

/**
 * Remove editable attributes from elements
 */
export function removeEditableAttributes(document: Document): void {
  const editableElements = document.querySelectorAll('[data-editable-id]');
  editableElements.forEach(element => {
    element.removeAttribute('data-editable-id');
    element.removeAttribute('data-original-text');
    element.removeAttribute('data-element-type');
    element.removeAttribute('data-edit-priority');
    element.removeAttribute('data-editable');
    element.removeAttribute('data-edit-ready');
    element.removeAttribute('data-edit-listener');
  });
}

/**
 * Find editable element by coordinates
 */
export function findEditableElementAtPoint(
  document: Document,
  x: number,
  y: number
): HTMLElement | null {
  const element = document.elementFromPoint(x, y) as HTMLElement;
  if (!element) return null;

  // Check if element itself is editable
  if (element.hasAttribute('data-editable-id')) {
    return element;
  }

  // Check if any parent is editable
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    if (parent.hasAttribute('data-editable-id')) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return null;
}

/**
 * Get all editable elements in viewport
 */
export function getEditableElementsInViewport(document: Document): HTMLElement[] {
  const editableElements = document.querySelectorAll('[data-editable-id]');
  const viewportElements: HTMLElement[] = [];

  editableElements.forEach(element => {
    const htmlElement = element as HTMLElement;
    const rect = htmlElement.getBoundingClientRect();
    
    // Check if element is in viewport
    if (rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0) {
      viewportElements.push(htmlElement);
    }
  });

  return viewportElements;
}

// Helper functions

function isOnlyWhitespace(text: string): boolean {
  return /^\s*$/.test(text);
}

function isOnlySpecialChars(text: string): boolean {
  return /^[^\w\s]*$/.test(text);
}

function getElementDepth(element: HTMLElement): number {
  let depth = 0;
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    depth++;
    parent = parent.parentElement;
  }
  return depth;
}

function generateContentHash(text: string): string {
  return text
    .substring(0, 30)
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase() || 'empty';
}

function getElementPosition(element: HTMLElement): number {
  const parent = element.parentElement;
  if (!parent) return 0;
  return Array.from(parent.children).indexOf(element);
}

function calculateElementPriority(
  element: HTMLElement,
  textContent: string,
  prioritizeHeadings: boolean
): number {
  let priority = 0;

  // Base priority by element type
  const tagName = element.tagName.toLowerCase();
  const tagPriorities: Record<string, number> = {
    h1: 100, h2: 90, h3: 80, h4: 70, h5: 60, h6: 50,
    p: 40, button: 35, a: 30, span: 25, div: 20,
    li: 15, td: 10, th: 12
  };

  priority += tagPriorities[tagName] || 5;

  // Boost for headings if prioritization is enabled
  if (prioritizeHeadings && /^h[1-6]$/.test(tagName)) {
    priority += 20;
  }

  // Boost for shorter, more focused text
  if (textContent.length < 50) {
    priority += 10;
  } else if (textContent.length > 200) {
    priority -= 5;
  }

  // Boost for elements with specific classes
  const classList = element.classList;
  if (classList.contains('title') || classList.contains('heading')) {
    priority += 15;
  }
  if (classList.contains('button') || classList.contains('cta')) {
    priority += 10;
  }
  if (classList.contains('text-content') || classList.contains('editable-text')) {
    priority += 8;
  }

  // Reduce priority for deeply nested elements
  const depth = getElementDepth(element);
  if (depth > 5) {
    priority -= (depth - 5) * 2;
  }

  // Boost for elements with ARIA roles
  const role = element.getAttribute('role');
  if (role === 'heading') priority += 15;
  if (role === 'button') priority += 10;

  return Math.max(0, priority);
}

/**
 * Enhanced element highlighting system
 */
export function applyElementHighlight(
  element: HTMLElement,
  highlightInfo: ElementHighlightInfo
): void {
  const { elementId, isHovered, isSelected, isEditing, highlightColor, zIndex } = highlightInfo;
  
  // Remove existing highlight classes
  element.classList.remove('edit-hover', 'edit-selected', 'edit-editing');
  
  // Apply appropriate highlight class
  if (isEditing) {
    element.classList.add('edit-editing');
    element.style.outline = '3px solid #10b981';
    element.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
    element.style.zIndex = (zIndex + 20).toString();
  } else if (isSelected) {
    element.classList.add('edit-selected');
    element.style.outline = '3px solid #3b82f6';
    element.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
    element.style.zIndex = (zIndex + 10).toString();
  } else if (isHovered) {
    element.classList.add('edit-hover');
    element.style.outline = '2px dashed #3b82f6';
    element.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
    element.style.zIndex = zIndex.toString();
  } else {
    // Clear all highlight styles
    element.style.outline = '';
    element.style.backgroundColor = '';
    element.style.zIndex = '';
  }
  
  // Add transition for smooth highlighting
  element.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
}

/**
 * Remove all highlighting from elements
 */
export function clearAllHighlights(document: Document): void {
  const highlightedElements = document.querySelectorAll('.edit-hover, .edit-selected, .edit-editing');
  highlightedElements.forEach(element => {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.remove('edit-hover', 'edit-selected', 'edit-editing');
    htmlElement.style.outline = '';
    htmlElement.style.backgroundColor = '';
    htmlElement.style.zIndex = '';
    htmlElement.style.transition = '';
  });
}

/**
 * Enhanced element interaction setup
 */
export function setupElementInteraction(
  element: HTMLElement,
  elementId: string,
  callbacks: {
    onHover?: (elementId: string) => void;
    onUnhover?: (elementId: string) => void;
    onClick?: (elementId: string) => void;
    onDoubleClick?: (elementId: string) => void;
    onKeyDown?: (elementId: string, event: KeyboardEvent) => void;
  }
): () => void {
  const { onHover, onUnhover, onClick, onDoubleClick, onKeyDown } = callbacks;
  
  // Event handlers
  const handleMouseEnter = () => onHover?.(elementId);
  const handleMouseLeave = () => onUnhover?.(elementId);
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(elementId);
  };
  const handleDoubleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDoubleClick?.(elementId);
  };
  const handleKeyDown = (e: KeyboardEvent) => onKeyDown?.(elementId, e);
  
  // Add event listeners
  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);
  element.addEventListener('click', handleClick);
  element.addEventListener('dblclick', handleDoubleClick);
  element.addEventListener('keydown', handleKeyDown);
  
  // Setup accessibility
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  element.setAttribute('aria-label', `Edit text: ${element.textContent?.substring(0, 50)}...`);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    element.removeEventListener('click', handleClick);
    element.removeEventListener('dblclick', handleDoubleClick);
    element.removeEventListener('keydown', handleKeyDown);
    
    element.removeAttribute('tabindex');
    element.removeAttribute('role');
    element.removeAttribute('aria-label');
  };
}

/**
 * Immediate DOM update for real-time editing
 */
export function updateElementContent(
  document: Document,
  elementId: string,
  newContent: string
): boolean {
  try {
    const element = document.querySelector(`[data-editable-id="${elementId}"]`) as HTMLElement;
    if (!element) {
      console.error(`Element with ID ${elementId} not found`);
      return false;
    }
    
    // Store original content for potential rollback
    const originalContent = element.textContent || '';
    element.setAttribute('data-original-content', originalContent);
    
    // Update content immediately
    element.textContent = newContent;
    
    // Add visual feedback for successful update
    element.style.transform = 'scale(1.02)';
    element.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
    
    // Reset visual feedback after animation
    setTimeout(() => {
      element.style.transform = '';
      element.style.backgroundColor = '';
    }, 300);
    
    console.log(`✅ Successfully updated element ${elementId} with new content`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update element ${elementId}:`, error);
    return false;
  }
}

/**
 * Batch update multiple elements
 */
export function batchUpdateElements(
  document: Document,
  updates: Array<{ elementId: string; content: string }>
): { success: number; failed: number } {
  let success = 0;
  let failed = 0;
  
  updates.forEach(({ elementId, content }) => {
    if (updateElementContent(document, elementId, content)) {
      success++;
    } else {
      failed++;
    }
  });
  
  return { success, failed };
}

/**
 * Validate element for editing capability
 */
export function validateEditableElement(element: HTMLElement): {
  isValid: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let isValid = true;

  // Check if element exists and is connected
  if (!element || !element.isConnected) {
    reasons.push('Element is not connected to DOM');
    isValid = false;
  }

  // Check if element has text content
  const textContent = element.textContent?.trim();
  if (!textContent || textContent.length === 0) {
    reasons.push('Element has no text content');
    isValid = false;
  }

  // Check if element is visible
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
    reasons.push('Element is not visible');
    isValid = false;
  }

  // Check if element is not in an excluded container
  if (element.closest('script, style, noscript')) {
    reasons.push('Element is in excluded container');
    isValid = false;
  }

  // Check if element is not already contenteditable
  if (element.contentEditable === 'true' || element.closest('[contenteditable="true"]')) {
    reasons.push('Element is already contenteditable');
    isValid = false;
  }

  return { isValid, reasons };
}

/**
 * Enhanced element detection with performance optimization
 */
export function detectEditableElementsOptimized(
  document: Document,
  options: ElementDetectionOptions = {}
): EditableElementInfo[] {
  const startTime = performance.now();
  
  const elements = detectEditableElements(document, options);
  
  // Add performance metrics
  const endTime = performance.now();
  console.log(`🔍 Element detection completed in ${(endTime - startTime).toFixed(2)}ms, found ${elements.length} elements`);
  
  return elements;
}