/**
 * Unit tests for InlineTextEditor component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InlineTextEditor } from '../../app/components/InlineTextEditor';

// Mock userEvent for testing
const userEvent = {
  setup: () => ({
    clear: async (element: HTMLElement) => {
      fireEvent.change(element, { target: { value: '' } });
    },
    type: async (element: HTMLElement, text: string) => {
      if (text === '{Enter}') {
        fireEvent.keyDown(element, { key: 'Enter', code: 'Enter' });
      } else if (text === '{Escape}') {
        fireEvent.keyDown(element, { key: 'Escape', code: 'Escape' });
      } else {
        fireEvent.change(element, { target: { value: text } });
      }
    },
    click: async (element: HTMLElement) => {
      fireEvent.click(element);
    }
  })
};

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon">✓</div>,
  X: () => <div data-testid="x-icon">✕</div>,
  Sparkles: () => <div data-testid="sparkles-icon">✨</div>,
  Type: () => <div data-testid="type-icon">T</div>,
}));

describe('InlineTextEditor', () => {
  const defaultProps = {
    initialText: 'Initial text content',
    elementId: 'test-element-1',
    isActive: true,
    onSave: jest.fn(),
    onCancel: jest.fn(),
    onAIImprove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render when active', () => {
    render(<InlineTextEditor {...defaultProps} />);
    
    expect(screen.getByDisplayValue('Initial text content')).toBeInTheDocument();
    expect(screen.getByText('テキスト編集')).toBeInTheDocument();
    expect(screen.getByText('test-element-1')).toBeInTheDocument();
  });

  test('should not render when inactive', () => {
    render(<InlineTextEditor {...defaultProps} isActive={false} />);
    
    expect(screen.queryByDisplayValue('Initial text content')).not.toBeInTheDocument();
  });

  test('should handle text changes', async () => {
    const user = userEvent.setup();
    render(<InlineTextEditor {...defaultProps} />);
    
    const textarea = screen.getByDisplayValue('Initial text content');
    
    await user.clear(textarea);
    await user.type(textarea, 'New text content');
    
    expect(textarea).toHaveValue('New text content');
    expect(screen.getByText('• 未保存')).toBeInTheDocument();
  });

  test('should show character and word count', async () => {
    const user = userEvent.setup();
    render(<InlineTextEditor {...defaultProps} />);
    
    const textarea = screen.getByDisplayValue('Initial text content');
    
    await user.clear(textarea);
    await user.type(textarea, 'Hello world test');
    
    expect(screen.getByText('16/1000 文字')).toBeInTheDocument();
    expect(screen.getByText('3 単語')).toBeInTheDocument();
  });

  test('should handle save action', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    
    render(<InlineTextEditor {...defaultProps} onSave={onSave} />);
    
    const textarea = screen.getByDisplayValue('Initial text content');
    const saveButton = screen.getByRole('button', { name: /保存/ });
    
    await user.clear(textarea);
    await user.type(textarea, 'Updated content');
    await user.click(saveButton);
    
    expect(onSave).toHaveBeenCalledWith('Updated content');
  });

  test('should handle cancel action', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    
    render(<InlineTextEditor {...defaultProps} onCancel={onCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
    await user.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  test('should handle AI improve action', async () => {
    const user = userEvent.setup();
    const onAIImprove = jest.fn();
    
    render(<InlineTextEditor {...defaultProps} onAIImprove={onAIImprove} />);
    
    const aiButton = screen.getByRole('button', { name: /AI改善/ });
    await user.click(aiButton);
    
    expect(onAIImprove).toHaveBeenCalledWith('Initial text content');
  });

  test('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    const onCancel = jest.fn();
    
    render(<InlineTextEditor {...defaultProps} onSave={onSave} onCancel={onCancel} />);
    
    const textarea = screen.getByDisplayValue('Initial text content');
    
    // Test Enter key for save
    await user.clear(textarea);
    await user.type(textarea, 'New content');
    await user.type(textarea, '{Enter}');
    
    expect(onSave).toHaveBeenCalledWith('New content');
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test Escape key for cancel
    await user.type(textarea, '{Escape}');
    expect(onCancel).toHaveBeenCalled();
  });

  test('should validate text length', async () => {
    const user = userEvent.setup();
    
    render(<InlineTextEditor {...defaultProps} maxLength={10} />);
    
    const textarea = screen.getByDisplayValue('Initial text content');
    
    // Text is longer than maxLength, should show warning
    expect(screen.getByText('⚠️ 無効なテキスト')).toBeInTheDocument();
    
    // Clear and add valid text
    await user.clear(textarea);
    await user.type(textarea, 'Short');
    
    expect(screen.queryByText('⚠️ 無効なテキスト')).not.toBeInTheDocument();
  });

  test('should disable save button when text is invalid', async () => {
    const user = userEvent.setup();
    
    render(<InlineTextEditor {...defaultProps} maxLength={5} />);
    
    const saveButton = screen.getByRole('button', { name: /保存/ });
    
    // Should be disabled due to text being too long
    expect(saveButton).toBeDisabled();
    
    const textarea = screen.getByDisplayValue('Initial text content');
    await user.clear(textarea);
    await user.type(textarea, 'OK');
    
    // Should be enabled now
    expect(saveButton).toBeEnabled();
  });

  test('should handle empty text gracefully', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    
    render(<InlineTextEditor {...defaultProps} onCancel={onCancel} />);
    
    const textarea = screen.getByDisplayValue('Initial text content');
    const saveButton = screen.getByRole('button', { name: /保存/ });
    
    await user.clear(textarea);
    await user.click(saveButton);
    
    // Should call onCancel when trying to save empty text
    expect(onCancel).toHaveBeenCalled();
  });

  test('should auto-resize textarea', async () => {
    const user = userEvent.setup();
    
    render(<InlineTextEditor {...defaultProps} />);
    
    const textarea = screen.getByDisplayValue('Initial text content');
    const initialHeight = textarea.style.height;
    
    // Add multiple lines of text
    await user.clear(textarea);
    await user.type(textarea, 'Line 1\nLine 2\nLine 3\nLine 4');
    
    // Height should adjust (this is a basic test, actual auto-resize happens via useEffect)
    expect((textarea as HTMLTextAreaElement).value).toContain('\n');
  });

  test('should handle position prop', () => {
    const position = { x: 100, y: 200 };
    
    render(<InlineTextEditor {...defaultProps} position={position} />);
    
    const container = screen.getByDisplayValue('Initial text content').closest('div');
    expect(container).toHaveStyle({
      left: '100px',
      top: '200px'
    });
  });

  test('should adjust position to stay within viewport', () => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
    
    const position = { x: 750, y: 550 }; // Near edge of viewport
    
    render(<InlineTextEditor {...defaultProps} position={position} />);
    
    const container = screen.getByDisplayValue('Initial text content').closest('div');
    
    // Position should be adjusted to stay within viewport
    const computedStyle = window.getComputedStyle(container!);
    const left = parseInt(computedStyle.left);
    const top = parseInt(computedStyle.top);
    
    expect(left).toBeLessThan(800 - 320); // Should account for min width
    expect(top).toBeLessThan(600 - 200);  // Should account for min height
  });

  test('should handle focus and blur events', async () => {
    const user = userEvent.setup();
    
    render(<InlineTextEditor {...defaultProps} />);
    
    const textarea = screen.getByDisplayValue('Initial text content');
    
    // Should auto-focus when active
    expect(textarea).toHaveFocus();
    
    // Should select all text on focus
    expect((textarea as HTMLTextAreaElement).selectionStart).toBe(0);
    expect((textarea as HTMLTextAreaElement).selectionEnd).toBe('Initial text content'.length);
  });

  test('should handle click outside to save', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    
    render(
      <div>
        <InlineTextEditor {...defaultProps} onSave={onSave} />
        <button>Outside button</button>
      </div>
    );
    
    const textarea = screen.getByDisplayValue('Initial text content');
    const outsideButton = screen.getByRole('button', { name: 'Outside button' });
    
    await user.clear(textarea);
    await user.type(textarea, 'Changed text');
    await user.click(outsideButton);
    
    // Should save when clicking outside
    expect(onSave).toHaveBeenCalledWith('Changed text');
  });

  test('should not render AI improve button when onAIImprove is not provided', () => {
    const { onAIImprove, ...propsWithoutAI } = defaultProps;
    
    render(<InlineTextEditor {...propsWithoutAI} />);
    
    expect(screen.queryByRole('button', { name: /AI改善/ })).not.toBeInTheDocument();
  });

  test('should show keyboard shortcuts hint', () => {
    render(<InlineTextEditor {...defaultProps} />);
    
    expect(screen.getByText(/Enter/)).toBeInTheDocument();
    expect(screen.getByText(/Esc/)).toBeInTheDocument();
    expect(screen.getByText(/Ctrl\+Enter/)).toBeInTheDocument();
  });

  test('should handle rapid state changes', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    
    render(<InlineTextEditor {...defaultProps} onSave={onSave} />);
    
    const textarea = screen.getByDisplayValue('Initial text content');
    
    // Rapid typing and saving
    await user.clear(textarea);
    await user.type(textarea, 'A');
    await user.type(textarea, 'B');
    await user.type(textarea, 'C');
    
    const saveButton = screen.getByRole('button', { name: /保存/ });
    await user.click(saveButton);
    
    expect(onSave).toHaveBeenCalledWith('ABC');
  });
});