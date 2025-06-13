# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## Architecture Overview

This is a Next.js application that integrates with Mastra framework to create an AI-powered landing page generator. The application allows users to generate and edit landing pages using AI agents.

### Core Components

**Mastra Integration (`src/mastra/`)**
- `lpCreatorAgent.ts` - Main AI agent that handles LP creation requests
- `lpGeneratorTool.ts` - Tool for generating complete landing pages with structure-first approach
- `partialUpdateTool.ts` - Tool for updating specific elements of existing LPs

**Frontend Architecture (`app/`)**
- `page.tsx` - Main page component with dual-view layout (chat + preview)
- `action.tsx` - Server actions handling AI state management and tool execution
- `EditModeContext.tsx` - Context for managing edit mode state and element selection
- `LpDisplay.tsx` - Component for rendering generated landing pages with edit capabilities

### Key Features

**AI-Powered Generation**
- Uses Anthropic Claude for LP structure planning and HTML generation
- Generates sections in batches to avoid API rate limits
- Includes fallback mechanisms for failed generations

**Element-Level Editing**
- Interactive editing mode with clickable elements
- Each editable element has `data-editable-id` attributes
- Partial updates modify specific elements without regenerating entire LP

**Dual-View Interface**
- Left panel: Chat interface for instructions and feedback
- Right panel: Live preview of generated landing page
- Toggle between view mode and edit mode

### Development Notes

**Mastra Configuration**
- Tools and agents are auto-discovered from their respective directories
- Configuration is in `mastra.config.ts`

**State Management**
- Uses AI RSC (React Server Components) for AI state management
- UI state tracks conversation history and generated content
- Edit mode state managed through React Context

**Styling**
- Generated HTML uses Tailwind CSS classes
- Responsive design with mobile-first approach
- Custom edit mode styling for element highlighting