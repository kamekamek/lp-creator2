# Project Structure

## Root Organization
```
├── app/                    # Next.js App Router (main UI)
├── src/                    # Core business logic
├── docs/                   # Project documentation
├── tests/                  # Test suites
├── .kiro/                  # Kiro AI assistant configuration
└── public/                 # Static assets
```

## App Directory (Next.js App Router)
```
app/
├── components/             # React components
│   ├── ui/                # Reusable UI primitives
│   ├── AIChatPanel.tsx    # AI chat interface
│   ├── LPViewer.tsx       # Landing page preview
│   └── EditModal.tsx      # Inline editing modals
├── contexts/              # React contexts
├── api/                   # API routes
│   └── lp-creator/        # LP generation endpoints
├── globals.css            # Global styles
├── layout.tsx             # Root layout
└── page.tsx               # Home page
```

## Source Directory (Business Logic)
```
src/
├── mastra/                # AI framework integration
│   ├── agents/            # AI agents (lpCreatorAgent)
│   ├── tools/             # AI tools for LP generation
│   │   ├── utils/         # Helper utilities
│   │   └── templates/     # LP templates
│   └── workflows/         # Multi-step AI workflows
├── components/            # Additional React components
├── stores/                # Zustand state stores
└── types/                 # TypeScript type definitions
```

## Key Architectural Patterns

### Component Organization
- **UI Components**: Reusable primitives in `app/components/ui/`
- **Feature Components**: Business logic components in `app/components/`
- **Shared Components**: Cross-feature components in `src/components/`

### AI Tool Structure
- **Core Tools**: `src/mastra/tools/` - Individual AI capabilities
- **Utilities**: `src/mastra/tools/utils/` - Shared helper functions
- **Templates**: `src/mastra/tools/templates/` - LP generation templates

### Type Safety
- **Core Types**: `src/types/lp-core.ts` - Main interfaces
- **Generator Types**: `src/types/lp-generator.ts` - AI-specific types

### Security Isolation
- AI-generated HTML rendered in sandboxed iframes
- Content Security Policy headers for XSS protection
- JSDOM for server-side HTML sanitization

## File Naming Conventions
- **Components**: PascalCase (e.g., `LPViewer.tsx`)
- **Utilities**: camelCase (e.g., `businessContextAnalyzer.ts`)
- **Types**: kebab-case (e.g., `lp-core.ts`)
- **API Routes**: kebab-case directories with `route.ts`

## Import Patterns
- Use path aliases: `@/components/*` for app components
- Relative imports for local utilities
- Absolute imports for external dependencies