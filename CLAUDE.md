# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

必ず日本語で応答してくださいね。
## Project Overview
LP Creator is a Next.js application that generates landing pages using AI agents powered by the Mastra framework. The app provides a chat-based interface where users can describe their desired landing page and get a fully functional HTML/CSS output with real-time preview.

## Core Architecture

### Mastra Framework Integration
- **Main config**: `src/mastra/index.ts` - Central Mastra configuration with agents, tools, and LibSQL storage
- **Agent system**: `src/mastra/agents/lpCreatorAgent.ts` - AI agent with dynamic model selection (OpenAI, Claude, Google)
- **Tool system**: `src/mastra/tools/` directory contains specialized LP generation tools
- **API routing**: `app/api/lp-creator/chat/route.ts` handles streaming responses from Mastra agents

### Key Tools
- `enhancedLPGeneratorTool` - Primary tool for complete landing page generation
- `lpStructureTool` - Creates page structure proposals for user approval
- `lpPreviewTool` - Generates previews of landing pages
- `htmlLPTool` - Generates individual HTML sections

### Frontend Architecture
- **Main page**: `app/page.tsx` - Split-pane interface with chat on left, preview on right
- **Chat integration**: Uses `@ai-sdk/react` useChat hook with custom Mastra API endpoint
- **Preview system**: `app/components/LPViewer.tsx` renders generated HTML in iframe
- **Edit mode**: Context-based editing system for iterative improvements

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting (Next.js + TypeScript rules)
npm run lint

# Run all E2E tests with Playwright
npm run test

# Run tests with UI mode (interactive debugging)
npm run test:ui

# Run tests in headed mode (browser visible)
npm run test:headed

# Run tests in debug mode (step-by-step debugging)
npm run test:debug

# Run specific test file
npx playwright test tests/e2e/lp-generation.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Key Development Patterns

### Agent-Tool Integration
The LP Creator agent follows a specific workflow:
1. Structure proposal using `lpStructureTool`
2. User confirmation/editing
3. Full page generation using `enhancedLPGeneratorTool`
4. Preview display using `lpPreviewTool`

### Dynamic Model Selection
The agent supports multiple AI providers:
- Claude (default): `claude-3-5-sonnet-20241022`
- OpenAI: Including o3-pro models with special handling
- Google: Gemini models

### Message Flow
- User input → API route → Mastra agent → Tool execution → Streaming response → UI update
- Tool results are detected in `page.tsx` and trigger preview panel updates

### Storage
- Uses LibSQL for agent memory and conversation history
- Database file: `../memory.db` (relative to src/mastra/)

## Testing and Debugging

### E2E Testing with Playwright
- **Test directory**: `tests/e2e/` contains all end-to-end tests
- **Test coverage**: AI response handling, LP generation workflow, edit mode functionality, basic smoke tests
- **Browser support**: Chromium, Firefox, WebKit (Safari)
- **Test server**: Automatically starts dev server on `http://localhost:3000` before tests
- **Retries**: 2 retries in CI environment for flaky test handling
- **Reports**: HTML reports generated after test runs

### Development Logging
- Development logs are enabled in non-production environments
- Tool results and agent responses are logged extensively via `devLog()` function
- Preview detection system has detailed debugging output
- Mastra logger configured at 'info' level with 5-minute timeout

## Natural Inline Editing System

### Overview
The LP Creator features a Notion/Word-like natural editing interface for non-technical users:

### Core Components
- **InlineTextEditor**: Handles double-click inline editing with Enter/Esc controls
- **SmartHoverMenu**: Context menu with ✏️編集, 🤖AI改善, 🎨スタイル options
- **AIChatPanel**: Natural language AI improvement requests

### Editing Interactions
1. **Double-click**: Immediate inline text editing (Notion-style)
2. **Hover**: Smart menu appears after 300ms delay
3. **Single-click**: Element selection (traditional mode)
4. **AI requests**: Natural language improvements via chat panel

### Technical Implementation
- **Immediate reflection**: Text changes update iframe content instantly via `onContentUpdate`
- **No chat delays**: Direct DOM manipulation for instant feedback
- **Visual feedback**: Subtle hover effects, smooth scaling (1.01x hover, 1.02x selection)
- **Text styling**: All editing text uses `text-gray-900` for proper contrast (never gray)

### Development Guidelines
- Always ensure text is readable with `text-gray-900` class
- Implement immediate DOM updates for editing changes
- Use natural language patterns in AI interaction prompts
- Test editing flow without requiring chat submission
- Maintain visual polish with smooth transitions and micro-interactions
- **Server-side HTML parsing**: Use `jsdom` instead of `DOMParser` in Node.js environment

## Technology Stack

### Core Dependencies
- **Next.js 15.3.3**: App router, streaming responses, TypeScript support
- **Mastra Framework 0.10.x**: AI agent orchestration, tool system, LibSQL storage
- **AI SDK**: Multi-provider support (@ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google)
- **React 19**: Latest React features with concurrent rendering
- **TypeScript 5.8.3**: Strict typing with Next.js integration

### Key Libraries
- **LibSQL**: Agent memory and conversation persistence
- **Playwright**: E2E testing framework with multi-browser support
- **jsdom**: Server-side HTML parsing (required for Node.js environment)
- **Tailwind CSS 4**: Utility-first styling with custom configuration
- **Zustand**: State management for React components

### Development Tools
- **ESLint**: Next.js + TypeScript rules with flat config
- **Playwright**: Automated browser testing with dev server integration

## Important Notes
- Always test LP generation workflow end-to-end when making changes
- Tool schema must match exactly between tool definitions and agent calls
- Preview detection relies on specific tool result formats
- HTML download functionality expects complete HTML documents
- **Editing must reflect immediately** - no chat requests for simple text changes
- **All editing UI text must be black/dark gray** - use `text-gray-900` for all labels, buttons, and editable text (never `text-gray-600` or lighter)