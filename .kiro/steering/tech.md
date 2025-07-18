# Technology Stack

## Core Framework
- **Next.js 15** with App Router
- **React 19** with Server and Client Components
- **TypeScript 5.8.3** for type safety
- **TailwindCSS 4** for styling with CSS variables support

## AI & Backend
- **Vercel AI SDK v4** for multi-model AI integration
- **Mastra Framework** for AI tools, agents, and workflows
- **Anthropic Claude**, **OpenAI GPT**, and **Google AI** models
- **Zod** for schema validation
- **Zustand** for state management

## UI Components
- **Radix UI** primitives for accessible components
- **Lucide React** for icons
- **React Markdown** for content rendering
- **Class Variance Authority** for component variants

## Testing & Quality
- **Playwright** for E2E testing
- **ESLint** with Next.js config
- **TypeScript** strict mode enabled

## Security & Performance
- **iframe sandbox** for AI-generated content isolation
- **CSP headers** for content security
- **JSDOM** for server-side HTML processing

## Common Commands

```bash
# Development
npm run dev              # Start development server on localhost:3000

# Building
npm run build           # Build for production
npm start              # Start production server

# Testing
npm test               # Run Playwright tests
npm run test:ui        # Run tests with UI
npm run test:headed    # Run tests in headed mode
npm run test:debug     # Debug tests

# Code Quality
npm run lint           # Run ESLint
```

## Path Aliases
- `@/*` → Root directory
- `@/components/*` → `./app/components/*`

## Environment Setup
- Copy `.env.example` to `.env.local`
- Configure AI provider API keys
- Vercel deployment ready with `vercel.json`