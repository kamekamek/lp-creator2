'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize2, Minimize2, Shield, AlertTriangle, Smartphone, Tablet, Monitor } from 'lucide-react';
import { useEditMode } from '../contexts/EditModeContext';
import { InlineTextEditor } from './InlineTextEditor';
import { SmartHoverMenu } from './SmartHoverMenu';
import { 
  sanitizeHTMLClient, 
  sanitizeHTMLWithNonces,
  performSecurityChecks, 
  fixCommonSecurityIssues,
  SANDBOX_ATTRIBUTES 
} from '../../src/utils/htmlSanitizer';
import { downloadHTML, validateHTMLForExport } from '../../src/utils/htmlExporter';
import { generateCSPWithNonces } from '../../src/utils/secureCSP';
import { 
  detectEditableElements, 
  applyEditableAttributes, 
  removeEditableAttributes,
  validateEditableElement,
  applyElementHighlight,
  clearAllHighlights,
  setupElementInteraction,
  updateElementContent,
  detectEditableElementsOptimized,
  type EditableElementInfo,
  type ElementHighlightInfo 
} from '../../src/utils/elementDetection';
import { 
  sanitizeHtmlContent, 
  escapeForTemplate, 
  analyzeHtmlContent 
} from '../../src/utils/htmlProcessing';

interface LPViewerProps {
  htmlContent: string;
  cssContent?: string;
  width?: string;
  height?: string;
  enableFullscreen?: boolean;
  onTextUpdate?: (elementId: string, newText: string) => void;
  onAIImprove?: (elementId: string, currentText: string) => void;
  isModalOpen?: boolean;
  enableSecurityChecks?: boolean;
  title?: string;
  onExport?: (result: { filename: string; size: number }) => void;
  enableDevicePreview?: boolean;
  defaultDevice?: 'mobile' | 'tablet' | 'desktop';
}

interface SecurityViolation {
  type: 'warning' | 'error';
  message: string;
  timestamp: Date;
}

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ size?: number }>;
  className: string;
}

const DEVICE_PRESETS: Record<string, DevicePreset> = {
  mobile: {
    name: 'Mobile',
    width: 375,
    height: 667,
    icon: Smartphone,
    className: 'max-w-[375px]'
  },
  tablet: {
    name: 'Tablet',
    width: 768,
    height: 1024,
    icon: Tablet,
    className: 'max-w-[768px]'
  },
  desktop: {
    name: 'Desktop',
    width: 1200,
    height: 800,
    icon: Monitor,
    className: 'max-w-none'
  }
};

export const LPViewer: React.FC<LPViewerProps> = ({ 
  htmlContent, 
  cssContent = '',
  width = '100%',
  height = '100%',
  enableFullscreen = true,
  onTextUpdate,
  onAIImprove,
  isModalOpen = false,
  enableSecurityChecks = true,
  title = 'Generated Landing Page',
  onExport,
  enableDevicePreview = true,
  defaultDevice = 'desktop'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isEditMode, selectedElementId, selectElement } = useEditMode();
  
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [hoverMenuVisible, setHoverMenuVisible] = useState(false);
  const [hoverMenuPosition, setHoverMenuPosition] = useState({ x: 0, y: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [editableElementsCache, setEditableElementsCache] = useState<EditableElementInfo[]>([]);
  const [realTimeUpdateEnabled, setRealTimeUpdateEnabled] = useState(true);
  
  // Device preview states
  const [currentDevice, setCurrentDevice] = useState<keyof typeof DEVICE_PRESETS>(defaultDevice);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  
  // Security state
  const [securityViolations, setSecurityViolations] = useState<SecurityViolation[]>([]);
  const [isContentSecure, setIsContentSecure] = useState(true);
  const [sanitizedContent, setSanitizedContent] = useState<string>('');
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [cspNonces, setCspNonces] = useState<{ script: string; style: string } | null>(null);
  const [secureCSPHeader, setSecureCSPHeader] = useState<string>('');

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const extractTextFromElement = useCallback((elementId: string): string => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return '';
    const element = doc.querySelector(`[data-editable-id="${elementId}"]`);
    return element?.textContent?.trim() || '';
  }, []);

  const startInlineEdit = useCallback((elementId: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    setInlineEditingId(elementId);
    setHoverMenuVisible(false);
    selectElement(elementId);
  }, [selectElement]);

  const saveInlineEdit = useCallback((elementId: string, newText: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    if (onTextUpdate) {
      onTextUpdate(elementId, newText);
    }
    setInlineEditingId(null);
    selectElement(null);
  }, [onTextUpdate, selectElement]);

  const cancelInlineEdit = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    setInlineEditingId(null);
    selectElement(null);
  }, [selectElement]);

  const handleAIImprove = useCallback((elementId: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const currentText = extractTextFromElement(elementId);
    if (onAIImprove && currentText) {
      onAIImprove(elementId, currentText);
    }
    setHoverMenuVisible(false);
  }, [extractTextFromElement, onAIImprove]);

  // Export functionality
  const handleExportHTML = useCallback(async () => {
    try {
      // Validate content before export
      const validation = validateHTMLForExport(htmlContent);
      
      if (!validation.isValid) {
        console.error('Export validation failed:', validation.errors);
        alert(`エクスポートできません: ${validation.errors.join(', ')}`);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        const proceed = confirm(
          `警告があります:\n${validation.warnings.join('\n')}\n\nエクスポートを続行しますか？`
        );
        if (!proceed) return;
      }

      // Perform export
      const result = downloadHTML(htmlContent, cssContent, title, {
        includeInlineCSS: true,
        includeExternalCSS: true,
        addMetaTags: true,
        responsive: true
      });

      console.log('Export successful:', {
        filename: result.filename,
        size: result.size,
        timestamp: result.timestamp
      });

      // Notify parent component
      if (onExport) {
        onExport({
          filename: result.filename,
          size: result.size
        });
      }

      // Show success message
      alert(`エクスポート完了: ${result.filename} (${Math.round(result.size / 1024)}KB)`);

    } catch (error) {
      console.error('Export failed:', error);
      alert(`エクスポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }, [htmlContent, cssContent, title, onExport]);

  // Real-time update handler for immediate DOM updates
  const handleRealTimeUpdate = useCallback((elementId: string, newText: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !realTimeUpdateEnabled) return;
    
    console.log('🔄 Real-time update:', elementId, newText);
    
    // Update the element immediately in the iframe
    const success = updateElementContent(doc, elementId, newText);
    
    if (success) {
      // Update the cached HTML content
      const updatedHTML = doc.body?.innerHTML || '';
      // Note: This would typically trigger a parent component update
      // For now, we'll just log the success
      console.log('✅ Real-time update successful');
    }
  }, [realTimeUpdateEnabled]);

  const handleClick = useCallback((editableId: string | null) => {
    if (!editableId) return;
    selectElement(editableId);
    // 他のクリック時のロジックがあればここに追加
  }, [selectElement]);

  // CSS styles for edit mode
  const EDIT_MODE_STYLES = `
    /* Enhanced editable element styles with improved animations */
    [data-editable-id] {
      position: relative;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 2px;
    }
    
    [data-editable-id]:hover.edit-hover {
      cursor: pointer;
      transform: translateY(-1px) scale(1.01);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }
    
    [data-editable-id].edit-highlight {
      position: relative;
      z-index: 10;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      background-color: rgba(59, 130, 246, 0.05) !important;
    }
    
    [data-editable-id].editing {
      position: relative;
      z-index: 20;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4);
      background-color: rgba(16, 185, 129, 0.08) !important;
    }
    
    /* Enhanced focus styles for keyboard navigation */
    [data-editable-id]:focus {
      outline: 3px solid #3b82f6 !important;
      outline-offset: 2px;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
      z-index: 15;
    }
    
    [data-editable-id]:focus-visible {
      outline: 3px solid #3b82f6 !important;
      outline-offset: 3px;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.5);
    }
    
    /* Accessibility improvements */
    [data-editable-id][role="button"] {
      cursor: pointer;
    }
    
    [data-editable-id][aria-selected="true"] {
      background-color: rgba(59, 130, 246, 0.1) !important;
      border: 2px solid rgba(59, 130, 246, 0.5);
    }
    
    /* Enhanced animations */
    @keyframes editHighlight {
      0% { 
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      50% { 
        transform: scale(1.02);
        box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
      }
      100% { 
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    
    [data-editable-id].edit-highlight {
      animation: editHighlight 0.4s ease-out;
    }
    
    /* Enhanced hover indicator */
    .edit-indicator {
      animation: fadeIn 0.2s ease-in-out, pulse 2s infinite;
    }
    
    /* Improved visual hierarchy */
    [data-editable-id][data-element-type="h1"],
    [data-editable-id][data-element-type="h2"],
    [data-editable-id][data-element-type="h3"] {
      border-left: 4px solid transparent;
      padding-left: 8px;
      transition: border-color 0.2s ease;
    }
    
    [data-editable-id][data-element-type="h1"]:hover,
    [data-editable-id][data-element-type="h2"]:hover,
    [data-editable-id][data-element-type="h3"]:hover {
      border-left-color: #3b82f6;
    }
    
    [data-editable-id][data-element-type="button"] {
      border: 2px solid transparent;
      transition: border-color 0.2s ease;
    }
    
    [data-editable-id][data-element-type="button"]:hover {
      border-color: #3b82f6;
    }
    
    /* Loading state for elements being updated */
    [data-editable-id].updating {
      opacity: 0.7;
      pointer-events: none;
      position: relative;
    }
    
    [data-editable-id].updating::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid #3b82f6;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      [data-editable-id]:focus {
        outline: 4px solid #000 !important;
        background-color: #fff !important;
      }
      
      [data-editable-id]:hover {
        outline: 2px solid #000;
        background-color: #f0f0f0 !important;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      [data-editable-id],
      [data-editable-id]:hover,
      .edit-indicator {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
    }
    
    /* Dark mode adjustments (though we force light mode) */
    @media (prefers-color-scheme: dark) {
      [data-editable-id]:focus {
        outline-color: #60a5fa !important;
        box-shadow: 0 0 12px rgba(96, 165, 250, 0.4);
      }
    }
  `;

  // Event handler factory functions
  const createDoubleClickHandler = useCallback((element: HTMLElement, editableId: string) => {
    return (e: MouseEvent) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        console.log(`✏️ Enhanced double-click on element: ${editableId}`);
        
        // Add visual feedback for double-click
        element.style.transform = 'scale(1.02)';
        setTimeout(() => {
          element.style.transform = '';
        }, 150);
        
        startInlineEdit(editableId);
      } catch (error) {
        console.error('Error handling double-click:', error);
      }
    };
  }, [startInlineEdit]);

  const createSingleClickHandler = useCallback((element: HTMLElement, editableId: string) => {
    return (e: MouseEvent) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        console.log(`👆 Single click selection: ${editableId}`);
        selectElement(editableId);
        
        // Enhanced visual feedback for selection
        element.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
        setTimeout(() => {
          if (selectedElementId !== editableId) {
            element.style.boxShadow = '';
          }
        }, 200);
      } catch (error) {
        console.error('Error handling single-click:', error);
      }
    };
  }, [selectElement, selectedElementId]);

  const createMouseEnterHandler = useCallback((element: HTMLElement, editableId: string) => {
    return (e: MouseEvent) => {
      try {
        if (inlineEditingId || isModalOpen) return;
        
        const iframe = iframeRef.current;
        if (!iframe) return;
        
        // Enhanced hover detection with better positioning and boundary checks
        const rect = element.getBoundingClientRect();
        const iframeRect = iframe.getBoundingClientRect();
        
        // Ensure valid rectangles
        if (rect.width === 0 || rect.height === 0) return;
        
        setHoveredElementId(editableId);
        
        // Smart positioning to avoid viewport overflow
        const menuWidth = 160; // Approximate menu width
        const menuHeight = 200; // Approximate menu height
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let menuX = iframeRect.left + rect.right + 10;
        let menuY = iframeRect.top + rect.top;
        
        // Adjust if menu would overflow viewport
        if (menuX + menuWidth > viewportWidth) {
          menuX = iframeRect.left + rect.left - menuWidth - 10;
        }
        if (menuY + menuHeight > viewportHeight) {
          menuY = iframeRect.top + rect.bottom - menuHeight;
        }
        
        setHoverMenuPosition({ x: Math.max(10, menuX), y: Math.max(10, menuY) });
        setHoverMenuVisible(true);
        
        // Enhanced hover styling with smooth transitions
        element.classList.add('edit-hover');
        element.style.outline = '2px dashed #3b82f6';
        element.style.outlineOffset = '2px';
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
        element.style.transition = 'all 0.2s ease-in-out';
        element.style.cursor = 'pointer';
        
        // Add hover indicator
        if (!element.querySelector('.edit-indicator')) {
          const doc = iframe.contentDocument;
          if (doc) {
            const indicator = doc.createElement('div');
            indicator.className = 'edit-indicator';
            indicator.innerHTML = '✏️';
            indicator.style.cssText = `
              position: absolute;
              top: -8px;
              right: -8px;
              background: #3b82f6;
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              z-index: 1000;
              pointer-events: none;
              opacity: 0.9;
              animation: fadeIn 0.2s ease-in-out;
            `;
            element.style.position = 'relative';
            element.appendChild(indicator);
          }
        }
      } catch (error) {
        console.error('Error handling mouse enter:', error);
      }
    };
  }, [inlineEditingId, isModalOpen, setHoveredElementId, setHoverMenuPosition, setHoverMenuVisible]);

  const createMouseLeaveHandler = useCallback((element: HTMLElement, editableId: string) => {
    return () => {
      try {
        // Enhanced hover cleanup with smooth transitions
        element.classList.remove('edit-hover');
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.backgroundColor = '';
        element.style.cursor = '';
        element.style.transition = '';
        
        // Remove hover indicator
        const indicator = element.querySelector('.edit-indicator');
        if (indicator) {
          indicator.remove();
        }
        
        // Delayed menu hide to allow for menu interaction
        setTimeout(() => {
          if (hoveredElementId === editableId && !document.querySelector('.smart-hover-menu:hover')) {
             setHoverMenuVisible(false);
          }
        }, 150);
      } catch (error) {
        console.error('Error handling mouse leave:', error);
      }
    };
  }, [hoveredElementId, setHoverMenuVisible]);

  const createKeyDownHandler = useCallback((element: HTMLElement, editableId: string) => {
    return (e: KeyboardEvent) => {
      try {
        if (selectedElementId === editableId) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startInlineEdit(editableId);
          } else if (e.key === 'Escape') {
            selectElement(null);
          } else if (e.key === 'Tab') {
            // Enhanced keyboard navigation
            const doc = iframeRef.current?.contentDocument;
            if (doc) {
              const allEditableElements = Array.from(doc.querySelectorAll('[data-editable-id]'));
              const currentIndex = allEditableElements.indexOf(element);
              const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
              const nextElement = allEditableElements[nextIndex] as HTMLElement;
              
              if (nextElement) {
                e.preventDefault();
                nextElement.focus();
                selectElement(nextElement.dataset.editableId || null);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error handling key down:', error);
      }
    };
  }, [selectedElementId, startInlineEdit, selectElement]);

  const createFocusHandler = useCallback((element: HTMLElement) => {
    return () => {
      try {
        // Enhanced focus styling
        element.style.outline = '3px solid #3b82f6';
        element.style.outlineOffset = '2px';
        element.setAttribute('aria-selected', 'true');
      } catch (error) {
        console.error('Error handling focus:', error);
      }
    };
  }, []);

  const createBlurHandler = useCallback((element: HTMLElement, editableId: string) => {
    return () => {
      try {
        // Clean up focus styling if not selected
        if (selectedElementId !== editableId) {
          element.style.outline = '';
          element.style.outlineOffset = '';
          element.removeAttribute('aria-selected');
        }
      } catch (error) {
        console.error('Error handling blur:', error);
      }
    };
  }, [selectedElementId]);

  // Helper function to enable edit mode for an element
  const enableEditModeForElement = useCallback((element: HTMLElement, editableId: string, doc: Document) => {
    // Enhanced editing capabilities with better accessibility
    element.contentEditable = 'false'; // Keep false to prevent direct editing
    element.spellcheck = false;
    element.setAttribute('data-editable', 'true');
    element.setAttribute('data-edit-ready', 'true');

    // Enhanced event listener setup with better performance and error handling
    if (!element.hasAttribute('data-edit-listener')) {
      const handleDoubleClick = createDoubleClickHandler(element, editableId);
      const handleSingleClick = createSingleClickHandler(element, editableId);
      const handleMouseEnter = createMouseEnterHandler(element, editableId);
      const handleMouseLeave = createMouseLeaveHandler(element, editableId);
      const handleKeyDown = createKeyDownHandler(element, editableId);
      const handleFocus = createFocusHandler(element);
      const handleBlur = createBlurHandler(element, editableId);

      // Enhanced event listeners with error handling
      element.addEventListener('dblclick', handleDoubleClick as EventListener);
      element.addEventListener('click', handleSingleClick as EventListener);
      element.addEventListener('mouseenter', handleMouseEnter as EventListener);
      element.addEventListener('mouseleave', handleMouseLeave as EventListener);
      element.addEventListener('keydown', handleKeyDown as EventListener);
      element.addEventListener('focus', handleFocus as EventListener);
      element.addEventListener('blur', handleBlur as EventListener);
      
      // Enhanced accessibility attributes
      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', `Edit text: ${element.textContent?.substring(0, 50)}...`);
      element.setAttribute('aria-describedby', 'edit-instructions');
      
      // Add edit instructions for screen readers (only once)
      if (!doc.getElementById('edit-instructions')) {
        const instructions = doc.createElement('div');
        instructions.id = 'edit-instructions';
        instructions.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        instructions.textContent = 'Press Enter or Space to edit, Escape to cancel, Tab to navigate';
        doc.body.appendChild(instructions);
      }
      
      element.setAttribute('data-edit-listener', 'true');
    }
  }, [createDoubleClickHandler, createSingleClickHandler, createMouseEnterHandler, createMouseLeaveHandler, createKeyDownHandler, createFocusHandler, createBlurHandler]);

  // Helper function to disable edit mode for an element
  const disableEditModeForElement = useCallback((element: HTMLElement) => {
    // Enhanced cleanup when edit mode is disabled
    element.contentEditable = 'false';
    element.removeAttribute('data-edit-listener');
    element.removeAttribute('data-editable');
    element.removeAttribute('data-edit-ready');
    element.removeAttribute('tabindex');
    element.removeAttribute('role');
    element.removeAttribute('aria-label');
    element.removeAttribute('aria-describedby');
    element.removeAttribute('aria-selected');
    element.classList.remove('edit-hover', 'edit-highlight', 'editing');
    
    // Clear inline styles
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.backgroundColor = '';
    element.style.cursor = '';
    element.style.transition = '';
    element.style.transform = '';
    element.style.boxShadow = '';
    
    // Remove edit indicator
    const indicator = element.querySelector('.edit-indicator');
    if (indicator) {
      indicator.remove();
    }
  }, []);

  // Helper function to apply element highlighting
  const applyElementHighlighting = useCallback((element: HTMLElement, editableId: string) => {
    // Enhanced highlight management
    if (selectedElementId === editableId && isEditMode) {
      element.classList.add('edit-highlight');
      element.style.outline = '3px solid #3b82f6';
      element.style.outlineOffset = '2px';
      element.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.3)';
    } else {
      element.classList.remove('edit-highlight');
      if (!element.classList.contains('edit-hover')) {
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.boxShadow = '';
      }
    }
    
    if (inlineEditingId === editableId && isEditMode) {
      element.classList.add('editing');
      element.style.outline = '3px solid #10b981';
      element.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
    } else {
      element.classList.remove('editing');
      if (selectedElementId !== editableId) {
        element.style.backgroundColor = '';
      }
    }
  }, [selectedElementId, isEditMode, inlineEditingId]);

  // Helper function to add or remove CSS styles
  const manageEditModeStyles = useCallback((doc: Document, isEditMode: boolean) => {
    let style = doc.getElementById('edit-mode-styles') as HTMLStyleElement;
    if (isEditMode) {
      if (!style) {
        style = doc.createElement('style');
        style.id = 'edit-mode-styles';
        style.textContent = EDIT_MODE_STYLES;
        if (doc && doc.head) {
          doc.head.appendChild(style);
        }
      }
    } else {
      if (style) {
        style.remove();
      }
      setHoverMenuVisible(false); // 編集モード解除時はホバーメニューも非表示
    }
  }, [EDIT_MODE_STYLES, setHoverMenuVisible]);

  const setupEditableElements = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      console.warn('setupEditableElements: iframe not available. Skipping setup.');
      return;
    }
    const doc = iframe.contentDocument;
    if (!doc) {
      console.warn('setupEditableElements: iframe document not available. Skipping setup.');
      return;
    }
    if (!doc.body) {
      console.warn('setupEditableElements: iframe body not available. Skipping setup.');
      return;
    }
    if (doc.body.children.length === 0 && doc.readyState !== 'complete') {
        console.log('⚠️ iframe body is empty or not fully loaded, skipping setupEditableElements');
        return;
    }

    console.log('🎯 Setting up enhanced editable elements detection...');
    
    // Enhanced element detection using optimized utility function
    const editableElementsInfo = detectEditableElementsOptimized(doc, {
      minTextLength: 2,
      maxTextLength: 1000,
      prioritizeHeadings: true,
      skipNestedElements: true,
      excludeSelectors: [
        'script', 'style', 'noscript', 
        '[contenteditable="true"]',
        '.no-edit', '.skip-edit'
      ],
      includeSelectors: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'button', 'a',
        'li', 'td', 'th', 'figcaption', 'blockquote', 'cite', 'label',
        '[role="heading"]', '[role="button"]', '[role="link"]',
        '.text-content', '.editable-text', '.content', '.title', '.heading'
      ]
    });
    
    // Cache the detected elements for performance
    setEditableElementsCache(editableElementsInfo);

    // Apply editable attributes to detected elements
    applyEditableAttributes(editableElementsInfo);
    
    const editableElements = editableElementsInfo.map(info => info.element);
    console.log(`📝 Enhanced detection found ${editableElements.length} editable elements`);
    console.log('🔧 [ENHANCED] Using optimized DOM manipulation with improved element detection');

    editableElements.forEach((element) => {
      const editableId = element.dataset.editableId;
      if (!editableId) return;

      if (isEditMode) {
        enableEditModeForElement(element, editableId, doc);
      } else {
        disableEditModeForElement(element);
      }

      // Apply element highlighting
      applyElementHighlighting(element, editableId);
    });

    // Manage CSS styles
    manageEditModeStyles(doc, isEditMode);
  }, [isEditMode, selectElement, inlineEditingId, startInlineEdit, selectedElementId, applyElementHighlighting, disableEditModeForElement, enableEditModeForElement, manageEditModeStyles]);

  // Enhanced security processing effect with secure CSP
  useEffect(() => {
    if (!htmlContent || !enableSecurityChecks) {
      setSanitizedContent(htmlContent);
      setIsContentSecure(true);
      setSecurityViolations([]);
      setCspNonces(null);
      setSecureCSPHeader('');
      return;
    }

    try {
      // Step 1: Generate secure CSP with nonces
      const { scriptNonce, styleNonce, header } = generateCSPWithNonces({
        reportOnly: process.env.NODE_ENV === 'development',
        reportUri: '/api/csp-report'
      });
      
      setCspNonces({ script: scriptNonce, style: styleNonce });
      setSecureCSPHeader(header);
      
      // Step 2: Perform security checks
      const securityCheck = performSecurityChecks(htmlContent);
      
      if (!securityCheck.isSecure) {
        const violations: SecurityViolation[] = securityCheck.violations.map(violation => ({
          type: 'warning' as const,
          message: violation,
          timestamp: new Date()
        }));
        
        setSecurityViolations(violations);
        setShowSecurityWarning(true);
        console.warn('🔒 Security violations detected:', violations);
      } else {
        setSecurityViolations([]);
        setShowSecurityWarning(false);
      }

      // Step 3: Fix common security issues
      const processedContent = fixCommonSecurityIssues(htmlContent);

      // Step 4: Secure sanitization with nonces
      const { sanitizedHTML, cspHeader } = sanitizeHTMLWithNonces(
        processedContent,
        scriptNonce,
        styleNonce,
        false // client-side
      );
      
      setSanitizedContent(sanitizedHTML);
      setIsContentSecure(securityCheck.isSecure);
      setSecureCSPHeader(cspHeader);
      
      console.log('🔒 Enhanced security processing completed:', {
        violations: securityCheck.violations.length,
        sanitized: sanitizedHTML.length !== htmlContent.length,
        cspNonces: { script: scriptNonce.substring(0, 8) + '...', style: styleNonce.substring(0, 8) + '...' },
        cspHeaderLength: cspHeader.length
      });
      
    } catch (error) {
      console.error('🔒 Enhanced security processing failed:', error);
      
      // Fallback to safe content
      setSanitizedContent('<div class="error-message p-4 text-red-600">Content could not be safely processed</div>');
      setIsContentSecure(false);
      setSecurityViolations([{
        type: 'error',
        message: 'Enhanced security processing failed',
        timestamp: new Date()
      }]);
      setCspNonces(null);
      setSecureCSPHeader('');
    }
  }, [htmlContent, enableSecurityChecks]);

  // iframeのコンテンツを初期化・更新する
  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;

    if (doc && sanitizedContent) {
      // Use utility functions for HTML processing
      const processedContent = sanitizeHtmlContent(sanitizedContent);

      // Analyze HTML content structure
      const { hasStyleTag, hasHtmlStructure, isCompleteHtml } = analyzeHtmlContent(processedContent);

      const escapedContent = escapeForTemplate(processedContent);
      const escapedCssContent = escapeForTemplate(cssContent);
      let finalHtml = '';
      if (isCompleteHtml) {
        finalHtml = escapedContent;
      } else if (hasStyleTag && hasHtmlStructure) {
        finalHtml = `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
              // 🔧 [CRITICAL FIX] Tailwind ダークモードを強制無効化
              tailwind.config = {
                darkMode: false
              }
            </script>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
              /* 🔧 [CRITICAL FIX] prefers-color-scheme を iframe 内で強制無効化 */
              @media (prefers-color-scheme: dark) {
                html, body { 
                  background: white !important; 
                  color: black !important; 
                }
              }
              ${escapedCssContent}
              body {
                margin: 0;
                padding: 0;
                font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
                overflow-x: hidden;
                line-height: 1.6;
                color: #111827; /* USER MEMORY: text-black or text-gray-900 */
              }
              main {
                width: 100%;
                height: 100%;
              }
              section {
                width: 100%;
                min-height: 50vh;
                padding: 2rem;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 1rem;
              }
              @media (max-width: 768px) {
                section {
                  padding: 1rem;
                  min-height: 40vh;
                }
              }
              ::-webkit-scrollbar {
                width: 8px;
              }
              ::-webkit-scrollbar-track {
                background: #f1f1f1;
              }
              ::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
              .lp-section {
                width: 100%;
                min-height: 50vh;
                box-sizing: border-box;
                opacity: 0;
                animation: fadeInUp 0.6s ease-out forwards;
              }
              .lp-section:nth-child(2) { animation-delay: 0.1s; }
              .lp-section:nth-child(3) { animation-delay: 0.2s; }
              .lp-section:nth-child(4) { animation-delay: 0.3s; }
              .lp-section:nth-child(5) { animation-delay: 0.4s; }
              .lp-section:nth-child(6) { animation-delay: 0.5s; }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .fullscreen-mode body, .fullscreen-mode {
                background: #fff;
                width: 100vw;
                height: 100vh;
                overflow-y: auto;
              }
            </style>
          </head>
          <body class="${isFullscreen ? 'fullscreen-mode' : ''}">
            ${escapedContent}
          </body>
          </html>
        `;
      } else if (hasHtmlStructure) {
        finalHtml = `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
              // 🔧 [CRITICAL FIX] Tailwind ダークモードを強制無効化
              tailwind.config = {
                darkMode: false
              }
            </script>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
              /* 🔧 [CRITICAL FIX] prefers-color-scheme を iframe 内で強制無効化 */
              @media (prefers-color-scheme: dark) {
                html, body { 
                  background: white !important; 
                  color: black !important; 
                }
              }
              /* Minimal styles if no cssContent is provided but HTML structure exists */
              body {
                margin: 0;
                padding: 0;
                font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
                overflow-x: hidden;
                line-height: 1.6;
                color: #111827; /* USER MEMORY: text-black or text-gray-900 */
              }
              main { width: 100%; height: 100%; }
              section { width: 100%; min-height: 50vh; padding: 2rem; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; }
              .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
              @media (max-width: 768px) { section { padding: 1rem; min-height: 40vh; } }
              ::-webkit-scrollbar { width: 8px; }
              ::-webkit-scrollbar-track { background: #f1f1f1; }
              ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
              ::-webkit-scrollbar-thumb:hover { background: #555; }
              .lp-section {
                opacity: 0;
                animation: fadeInUp 0.6s ease-out forwards;
              }
              .lp-section:nth-child(2) { animation-delay: 0.1s; }
              .lp-section:nth-child(3) { animation-delay: 0.2s; }
              .lp-section:nth-child(4) { animation-delay: 0.3s; }
              .lp-section:nth-child(5) { animation-delay: 0.4s; }
              .lp-section:nth-child(6) { animation-delay: 0.5s; }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .fullscreen-mode body, .fullscreen-mode {
                background: #fff;
                width: 100vw;
                height: 100vh;
                overflow-y: auto;
              }
            </style>
          </head>
          <body class="${isFullscreen ? 'fullscreen-mode' : ''}">
            <main>${escapedContent}</main>
          </body>
          </html>
        `;
      } else {
        // プレーンテキストまたは非常に単純なHTMLの場合
        finalHtml = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: sans-serif; padding: 1rem; color: #333; }
            .fullscreen-mode body, .fullscreen-mode { background: #fff; width: 100vw; height: 100vh; overflow-y: auto; }
          </style>
        </head>
        <body class="${isFullscreen ? 'fullscreen-mode' : ''}">
          ${escapedContent}
        </body>
        </html>
        `;
      }

  if (doc) {
    doc.open();
    doc.write(finalHtml);
    doc.close(); // ドキュメントのロードを完了させる
  } else {
    console.warn('Attempted to write to iframe but document was null.');
  }
}

}, [sanitizedContent, cssContent, isFullscreen]); // 🔧 [CRITICAL FIX] setupEditableElements削除でiframe再描画を防止

// isEditMode, selectedElementId, inlineEditingId, htmlContent が変更されたときに setupEditableElements を呼び出す
useEffect(() => {
  const iframe = iframeRef.current;
  const handleLoad = () => {
    if (iframe?.contentDocument?.body && iframe?.contentDocument?.readyState === 'complete') {
      console.log('iframe loaded, setting up editable elements via load event');
      setupEditableElements();
    } else if (iframe?.contentDocument?.body) {
      console.log('iframe load event fired, body present, but readyState not complete, attempting setup');
      setupEditableElements();
    }
  };

  if (iframe) {
    if (iframe.contentDocument?.body && iframe.contentDocument?.readyState === 'complete') {
      console.log('iframe already loaded with body, setting up editable elements immediately');
      setupEditableElements();
    } else {
      iframe.addEventListener('load', handleLoad);
    }
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }
}, [isEditMode, selectedElementId, inlineEditingId]); // 🔧 [CRITICAL FIX] 不要な依存削除で連鎖的再描画を防止

const getIframeClasses = useCallback(() => {
  const baseClasses = "w-full h-full border-0 transition-all duration-300 mx-auto";
  
  if (isFullscreen) {
    return baseClasses;
  }
  
  if (!enableDevicePreview || currentDevice === 'desktop') {
    return baseClasses;
  }
  
  const device = DEVICE_PRESETS[currentDevice];
  return `${baseClasses} ${device.className} shadow-lg border border-gray-300`;
}, [isFullscreen, enableDevicePreview, currentDevice]);

const getIframeStyles = useCallback(() => {
  if (isFullscreen || !enableDevicePreview || currentDevice === 'desktop') {
    return {};
  }
  
  const device = DEVICE_PRESETS[currentDevice];
  return {
    width: `${device.width}px`,
    maxHeight: `${device.height}px`,
    aspectRatio: `${device.width} / ${device.height}`
  };
}, [isFullscreen, enableDevicePreview, currentDevice]);

return (
  <div ref={containerRef} className="relative w-full h-full" style={{ width: isFullscreen ? '100vw' : width, height: isFullscreen ? '100vh' : height }}>
    {/* Security Warning Banner */}
    {showSecurityWarning && securityViolations.length > 0 && (
      <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 p-2 z-50">
        <div className="flex items-center gap-2 text-sm text-yellow-800">
          <AlertTriangle size={16} />
          <span className="font-medium">Security Notice:</span>
          <span>{securityViolations.length} potential security issue(s) detected and sanitized</span>
          <button 
            onClick={() => setShowSecurityWarning(false)}
            className="ml-auto text-yellow-600 hover:text-yellow-800"
          >
            ×
          </button>
        </div>
      </div>
    )}
    
    {/* Device Preview Controls */}
    {enableDevicePreview && !isFullscreen && (
      <div className="absolute top-2 left-2 z-50 flex items-center gap-1 bg-white rounded-lg shadow-md p-1">
        {Object.entries(DEVICE_PRESETS).map(([key, device]) => {
          const IconComponent = device.icon;
          return (
            <button
              key={key}
              onClick={() => setCurrentDevice(key as keyof typeof DEVICE_PRESETS)}
              className={`p-2 rounded transition-colors touch-manipulation ${
                currentDevice === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={device.name}
              aria-label={`Switch to ${device.name} view`}
            >
              <IconComponent size={14} />
            </button>
          );
        })}
      </div>
    )}
    
    {/* Security Status Indicator */}
    <div className={`absolute top-2 z-40 ${enableDevicePreview && !isFullscreen ? 'left-32' : 'left-2'}`}>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isContentSecure 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        <Shield size={12} />
        {isContentSecure ? 'Secure' : 'Sanitized'}
      </div>
    </div>

    <div className={`flex-1 flex items-center justify-center p-4 ${showSecurityWarning ? 'mt-10' : ''} ${currentDevice !== 'desktop' && enableDevicePreview ? 'bg-gray-100' : ''}`}>
      <iframe
        ref={iframeRef}
        title={`LP Preview - ${DEVICE_PRESETS[currentDevice]?.name || 'Desktop'} - Secure Sandbox`}
        className={getIframeClasses()}
        style={getIframeStyles()}
        sandbox={SANDBOX_ATTRIBUTES.join(' ')}
        allow="same-origin"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
      />
    </div>
    {enableFullscreen && (
      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors z-50"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
    )}
    {inlineEditingId && (
      <InlineTextEditor
        elementId={inlineEditingId!} 
        initialText={extractTextFromElement(inlineEditingId!)}
        onSave={(newText) => saveInlineEdit(inlineEditingId!, newText)}
        onCancel={cancelInlineEdit}
        onAIImprove={onAIImprove ? (text) => onAIImprove(inlineEditingId!, text) : undefined}
        onRealTimeUpdate={(newText) => handleRealTimeUpdate(inlineEditingId!, newText)}
        isActive={!!inlineEditingId}
        position={hoverMenuPosition}
        maxLength={500}
        enableRealTimePreview={realTimeUpdateEnabled}
        autoSave={false}
      />
    )}
    {hoverMenuVisible && hoveredElementId && (
      <SmartHoverMenu
        isVisible={hoverMenuVisible}
        elementId={hoveredElementId!}
        position={hoverMenuPosition}
        onEdit={() => startInlineEdit(hoveredElementId!)}
        onAIImprove={() => handleAIImprove(hoveredElementId!)}
        onClose={() => setHoverMenuVisible(false)}
        className="smart-hover-menu"
      />
    )}
  </div>
);
};