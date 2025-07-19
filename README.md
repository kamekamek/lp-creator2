# LP Creator Platform

An AI-powered SaaS platform for automatically generating and editing high-quality landing pages. The platform combines marketing psychology principles (PASONA method, 4U principles) with modern web technologies to create professional landing pages from natural language input.

## 🚀 Features

- **AI-Powered Generation**: Natural language input generates complete landing pages with HTML, CSS, and JavaScript
- **Real-time Preview**: Safe iframe-based preview with live editing capabilities
- **Multiple Variants**: Generate up to 3 design variations with AI recommendations and scoring
- **Interactive Workflow**: Step-by-step client confirmation process with concept proposals
- **Inline Editing**: Double-click to edit text elements with immediate preview updates
- **Export Functionality**: Download complete HTML files with integrated styles
- **Advanced Security**: Multi-layer security with DOMPurify sanitization and CSP headers
- **Marketing Psychology**: Built-in PASONA formula and 4U principles for conversion optimization

## 🛡️ Security Features

- **HTML Sanitization**: Server-side and client-side sanitization using DOMPurify and JSDOM
- **Content Security Policy**: Comprehensive CSP headers for XSS protection
- **Iframe Sandboxing**: AI-generated content rendered in secure sandboxed iframes
- **Security Validation**: Real-time security checks for dangerous content patterns
- **Safe Fallbacks**: Graceful error handling with secure fallback content

## 🏗️ Architecture

Built with Next.js 15, React 19, and TypeScript, featuring:

- **Mastra AI Framework**: Multi-model AI integration with tools and workflows
- **Vercel AI SDK v4**: Support for Claude, GPT, and Google AI models
- **TailwindCSS 4**: Modern styling with CSS variables
- **Zustand**: Lightweight state management
- **Playwright**: End-to-end testing

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Copy environment variables:

```bash
cp .env.example .env.local
```

4. Configure your AI provider API keys in `.env.local`

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 Testing

Run the test suite:

```bash
# Unit and integration tests
npm test

# E2E tests with Playwright
npm run test:e2e

# Run tests with UI
npm run test:ui

# Debug tests
npm run test:debug
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router (main UI)
│   ├── components/         # React components
│   ├── api/               # API routes
│   └── contexts/          # React contexts
├── src/                   # Core business logic
│   ├── mastra/           # AI framework integration
│   ├── components/       # Shared components
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript definitions
├── tests/               # Test suites
├── docs/               # Documentation
└── .kiro/             # AI assistant configuration
```

## 🔧 Configuration

### Environment Variables

Required environment variables:

```bash
# AI Provider API Keys
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_key

# Optional: Custom model configurations
DEFAULT_AI_MODEL=claude-3-5-sonnet-20241022
```

### Security Configuration

The platform includes comprehensive security configurations:

- **HTML Sanitization**: Configurable allowed tags and attributes
- **CSP Directives**: Content Security Policy for iframe protection
- **Sandbox Attributes**: Iframe sandbox restrictions

## 🎯 Target Users

- **Marketers**: Quick, professional landing page generation
- **Designers**: AI-assisted rapid prototyping
- **Project Managers**: Client approval workflows
- **Developers**: Landing page templates and components

## 📚 Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Setup Guide](docs/PROJECT_SETUP_GUIDE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Security Guide](docs/SECURITY.md)

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Connect your GitHub repository
2. Configure environment variables
3. Deploy with zero configuration

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
