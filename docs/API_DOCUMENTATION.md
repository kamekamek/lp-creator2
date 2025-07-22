# API Documentation

## Security API

### HTML Sanitization

#### `sanitizeHTMLServer(html: string): string`

Server-side HTML sanitization using DOMPurify with JSDOM.

**Parameters:**
- `html` (string): Raw HTML content to sanitize

**Returns:**
- `string`: Sanitized HTML content

**Example:**
```typescript
import { sanitizeHTMLServer } from '@/utils/htmlSanitizer';

const cleanHTML = sanitizeHTMLServer(aiGeneratedHTML);
```

#### `sanitizeHTMLClient(html: string): string`

Client-side HTML sanitization using browser DOMPurify.

**Parameters:**
- `html` (string): Raw HTML content to sanitize

**Returns:**
- `string`: Sanitized HTML content

**Example:**
```typescript
import { sanitizeHTMLClient } from '@/utils/htmlSanitizer';

const cleanHTML = sanitizeHTMLClient(userHTML);
```

### Security Validation

#### `performSecurityChecks(html: string): SecurityCheckResult`

Performs additional security validation beyond sanitization.

**Parameters:**
- `html` (string): HTML content to validate

**Returns:**
```typescript
interface SecurityCheckResult {
  isSecure: boolean;
  violations: string[];
}
```

**Example:**
```typescript
import { performSecurityChecks } from '@/utils/htmlSanitizer';

const { isSecure, violations } = performSecurityChecks(html);

if (!isSecure) {
  console.warn('Security violations:', violations);
}
```

### Content Security Policy

#### `generateCSPHeader(): string`

Generates CSP header string from configured directives.

**Returns:**
- `string`: Complete CSP header string

**Example:**
```typescript
import { generateCSPHeader } from '@/utils/htmlSanitizer';

const cspHeader = generateCSPHeader();
// "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; ..."
```

### Security Utilities

#### `fixCommonSecurityIssues(html: string): string`

Fixes common HTML issues that could cause security problems.

**Parameters:**
- `html` (string): HTML content to fix

**Returns:**
- `string`: Fixed HTML content

**Features:**
- Fixes broken attributes
- Removes dangerous src attributes
- Adds security attributes to external links
- Fixes broken SVG paths

## Export API

### HTML Export

#### `generateCompleteHTML(htmlContent, cssContent, title, options): string`

Generates a complete standalone HTML file with integrated CSS.

**Parameters:**
- `htmlContent` (string): The main HTML content
- `cssContent` (string, optional): CSS styles to include
- `title` (string, optional): Page title (default: 'Generated Landing Page')
- `options` (ExportOptions, optional): Export configuration

**Returns:**
- `string`: Complete HTML document with integrated styles

**Example:**
```typescript
import { generateCompleteHTML } from '@/utils/htmlExporter';

const completeHTML = generateCompleteHTML(
  htmlContent,
  cssContent,
  'My Landing Page',
  {
    includeInlineCSS: true,
    addMetaTags: true,
    responsive: true
  }
);
```

#### `generateFilename(title): string`

Generates a unique filename based on the page title with timestamp.

**Parameters:**
- `title` (string): Page title to use for filename

**Returns:**
- `string`: Sanitized filename with timestamp (format: `title_YYYYMMDDTHHMMSS.html`)

**Example:**
```typescript
import { generateFilename } from '@/utils/htmlExporter';

const filename = generateFilename('My Awesome Landing Page');
// Returns: "my_awesome_landing_page_20240115T123456.html"
```

#### `downloadHTML(htmlContent, cssContent, title, options): ExportResult`

Downloads the HTML content as a file with integrated CSS.

**Parameters:**
- `htmlContent` (string): The main HTML content
- `cssContent` (string, optional): CSS styles to include
- `title` (string, optional): Page title
- `options` (ExportOptions, optional): Export configuration

**Returns:**
```typescript
interface ExportResult {
  htmlContent: string;
  filename: string;
  size: number;
  timestamp: Date;
}
```

**Example:**
```typescript
import { downloadHTML } from '@/utils/htmlExporter';

const result = downloadHTML(htmlContent, cssContent, 'My Landing Page');
console.log(`Downloaded ${result.filename} (${result.size} bytes)`);
```

#### `validateHTMLForExport(html): ValidationResult`

Validates HTML content before export to ensure quality and completeness.

**Parameters:**
- `html` (string): HTML content to validate

**Returns:**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

**Features:**
- Checks for required HTML structure
- Validates meta tags and title
- Ensures responsive design elements
- Detects potential accessibility issues

## AI Generation API

### Interactive Hearing System

#### `interactiveHearingTool.execute(params)`

Conducts step-by-step client interviews to gather comprehensive business requirements for LP generation.

**Parameters:**
```typescript
{
  stage: 'initial' | 'strategy' | 'details' | 'confirmation';
  userResponse?: string;
  currentData?: {
    必須情報?: {
      商材サービス内容?: string;
      独自価値UVP?: string;
      ターゲット顧客の悩み?: string;
      希望コンバージョン?: string;
      予算感覚と緊急度?: string;
    };
    戦略情報?: {
      競合他社?: string[];
      現在の集客チャネル?: string;
      ブランドイメージ?: string;
      成功指標?: string;
    };
  };
}
```

**Returns:**
```typescript
{
  success: boolean;
  currentStage: string;
  collectedData: object;
  nextQuestion: string;
  completionRate: number;
  isComplete: boolean;
  suggestedActions: string[];
}
```

**Features:**
- **Progressive Information Gathering**: Structured interview process with priority-based questions
- **Natural Language Processing**: Analyzes user responses for keywords, sentiment, and entities
- **Completion Tracking**: Real-time progress monitoring with percentage completion
- **Smart Question Generation**: Context-aware next question selection
- **Data Validation**: Ensures all required information is collected before proceeding

### Enhanced LP Generator

#### `POST /api/lp-creator/chat`

Generates landing pages using AI with marketing psychology principles.

**Request Body:**
```typescript
{
  topic: string;
  targetAudience?: string;
  businessGoal?: string;
  industry?: string;
  competitiveAdvantage?: string;
  designStyle?: 'modern' | 'minimalist' | 'corporate' | 'creative' | 'tech' | 'startup';
  useMarketingPsychology?: {
    pasona?: boolean;
    fourU?: boolean;
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  htmlContent: string;
  cssContent: string;
  title: string;
  metadata: {
    generatedAt: string;
    model: string;
    processingTime: number;
    businessContext?: BusinessContext;
  };
}
```

### Intelligent Variant Generator

#### `intelligentLPGeneratorTool.execute(params)`

Generates multiple design variants with AI recommendations.

**Parameters:**
```typescript
{
  topic: string;
  targetAudience?: string;
  businessGoal?: string;
  industry?: string;
  competitiveAdvantage?: string;
  designStyle?: 'modern' | 'minimalist' | 'corporate' | 'creative' | 'tech' | 'startup';
  variantCount?: number; // 1-3
  focusAreas?: ('modern-clean' | 'conversion-optimized' | 'content-rich')[];
}
```

**Returns:**
```typescript
{
  success: boolean;
  variants: LPVariant[];
  recommendedVariant: string;
  metadata: {
    generatedAt: string;
    processingTime: number;
    totalVariants: number;
    version: string;
  };
}
```

## Type Definitions

### Core Types

```typescript
interface HearingData {
  必須情報: {
    商材サービス内容: string;
    独自価値UVP?: string;
    ターゲット顧客の悩み: string;
    希望コンバージョン: string;
    予算感覚と緊急度?: string;
  };
  戦略情報: {
    競合他社?: string[];
    現在の集客チャネル?: string;
    ブランドイメージ?: string;
    成功指標?: string;
  };
}

interface HearingResponse {
  success: boolean;
  currentStage: 'initial' | 'strategy' | 'details' | 'confirmation';
  collectedData: HearingData;
  nextQuestion: string;
  completionRate: number;
  isComplete: boolean;
  suggestedActions: string[];
}

interface LPGenerationResult {
  htmlContent: string;
  cssContent: string;
  title: string;
  metadata: {
    generatedAt: string;
    model: string;
    processingTime: number;
    businessContext?: BusinessContext;
  };
}

interface LPVariant extends LPGenerationResult {
  variantId: string;
  score: number;
  description: string;
  features: string[];
  designFocus: 'modern-clean' | 'conversion-optimized' | 'content-rich';
  recommendation?: {
    reason: string;
    targetUseCase: string;
    strengths: string[];
  };
}

interface BusinessContext {
  industry: string;
  targetAudience: string;
  businessGoal: string;
  competitiveAdvantage: string[];
  tone: 'professional' | 'friendly' | 'casual' | 'premium';
}
```

### Security Types

```typescript
interface SecurityError {
  type: 'xss_detected' | 'unsafe_html' | 'script_injection';
  element: string;
  severity: 'low' | 'medium' | 'high';
  details?: string;
  timestamp: Date;
}

interface AIGenerationError {
  type: 'model_timeout' | 'rate_limit' | 'invalid_response' | 'content_policy';
  message: string;
  retryable: boolean;
  retryAfter?: number;
  model?: string;
  timestamp: Date;
}
```

## Error Handling

### Security Errors

Security errors are handled gracefully with fallback content:

```typescript
try {
  const cleanHTML = sanitizeHTMLServer(html);
  return cleanHTML;
} catch (error) {
  console.error('Sanitization failed:', error);
  return '<div class="error-message">Content could not be safely rendered</div>';
}
```

### AI Generation Errors

AI generation errors include retry logic and fallback models:

```typescript
const handleAIError = (error: AIGenerationError) => {
  switch (error.type) {
    case 'model_timeout':
      return { 
        action: 'retry', 
        delay: 2000,
        fallbackModel: 'gpt-3.5-turbo' 
      };
    case 'rate_limit':
      return { 
        action: 'queue', 
        delay: error.retryAfter || 60000 
      };
    default:
      return { 
        action: 'user_notification',
        message: error.message 
      };
  }
};
```

## Configuration

### Security Configuration

```typescript
const SANITIZATION_CONFIG = {
  allowedTags: [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'button', 'section', 'header', 'footer', 'nav',
    // ... more tags
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'data-editable-id', 'style'],
    'a': ['href', 'target', 'rel', 'title'],
    'img': ['src', 'alt', 'width', 'height', 'loading'],
    // ... more attributes
  },
  forbiddenTags: [
    'script', 'iframe', 'object', 'embed', 'applet'
  ],
  forbiddenAttributes: [
    'onload', 'onerror', 'onclick', 'javascript:', 'vbscript:'
  ]
};
```

### CSP Configuration

```typescript
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};
```

### Sandbox Configuration

```typescript
export const SANDBOX_ATTRIBUTES = [
  'allow-scripts',      // Allow JavaScript execution
  'allow-same-origin',  // Allow same-origin access for editing
  'allow-forms'         // Allow form interactions
];
```