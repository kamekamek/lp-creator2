# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
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
- Development logs are enabled in non-production environments
- Tool results and agent responses are logged extensively
- Preview detection system has detailed debugging output

## Important Notes
- Always test LP generation workflow end-to-end when making changes
- Tool schema must match exactly between tool definitions and agent calls
- Preview detection relies on specific tool result formats
- HTML download functionality expects complete HTML documents