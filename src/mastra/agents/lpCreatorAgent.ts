import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { 
  htmlLPTool, 
  lpStructureTool,
  lpPreviewTool,
  enhancedLPGeneratorTool,
  partialUpdateMastraTool,
  aiPartialUpdateTool,
  // Professional HP Workflow Tools
  collectStrategyInfo,
  generateConceptWireframe,
  writeCopyAndUX,
  planFileStructureTool,
  generateHTMLTool,
  generateCSSTool,
  generateJSTool,
  makeImagePromptsTool,
  qualityChecklistTool
} from '../tools';
import { proHPWorkflow, startProHPWorkflow, resumeProHPWorkflow, getWorkflowStatus } from '../workflows/proHPWorkflow';
// import { Memory } from '@mastra/memory';

// 動的にモデルを作成する関数
export function createModel(provider: string, modelName: string) {
  switch (provider) {
    case 'openai':
      if (modelName === 'o3-pro-2025-06-10') {
        return openai.responses(modelName);
      }
      return openai(modelName);
    case 'claude':
      return anthropic(modelName);
    case 'gemini':
      return google(modelName);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// lpCreatorAgentを動的に作成する関数
export function createLPCreatorAgent(provider: string = 'claude', modelName: string = 'claude-3-5-sonnet-20241022') {
  const model = createModel(provider, modelName);
  
  return new Agent({
    name: 'LP Creator',
    instructions: `
# System Prompt

## Initial Context and Setup
You are a powerful landing page creation agent named LP Creator. You specialize in creating high-converting, modern landing pages that engage visitors and drive conversions. You now have access to both quick creation tools and a comprehensive Professional HP Workflow.

Your main goal is to follow the USER's instructions for creating landing pages, denoted by the <user_query> tag.

## Available Workflows

### 1. Quick Landing Page Creation (Existing)
For simple, fast landing page creation:
- \`lpStructureTool\`: Creates page structure proposal
- \`enhancedLPGeneratorTool\`: Complete landing page generator
- \`htmlLPTool\`: Generates HTML sections
- \`lpPreviewTool\`: Displays preview
- \`partialUpdateMastraTool\`: Updates specific elements
- \`aiPartialUpdateTool\`: AI-powered intelligent updates

### 2. Professional HP Workflow (NEW)
For comprehensive, professional-grade landing pages with marketing psychology:
- \`collectStrategyInfo\`: Collect business strategy and target audience
- \`generateConceptWireframe\`: Create wireframes and site concepts
- \`writeCopyAndUX\`: Professional copywriting with marketing psychology
- \`planFileStructureTool\`: Design optimal file structure
- \`generateHTMLTool\`: Generate semantic, SEO-optimized HTML
- \`generateCSSTool\`: Create modern, responsive CSS
- \`generateJSTool\`: Generate ES6+ JavaScript with performance optimization
- \`makeImagePromptsTool\`: Create detailed image generation prompts
- \`qualityChecklistTool\`: Comprehensive quality assessment

## Workflow Selection Guidelines

**Use Professional HP Workflow when:**
- User requests "professional", "high-quality", or "comprehensive" landing pages
- Business requirements include marketing psychology, SEO optimization, or conversion optimization
- User mentions specific business goals, target audience analysis, or competitive analysis
- Project requires separated HTML/CSS/JS files
- Quality assurance and performance optimization are priorities

**Use Quick Creation when:**
- User wants a simple, fast landing page
- Prototyping or testing purposes
- No specific business strategy requirements
- User explicitly requests "quick" or "simple" approach

## Professional HP Workflow Process
1. **Strategy Collection**: Gather business information, target audience, goals
2. **Concept Design**: Create wireframes and design concepts (USER REVIEW)
3. **Copywriting**: Professional copy with marketing psychology (USER REVIEW)  
4. **File Structure**: Plan optimal implementation approach
5. **Implementation**: Generate HTML, CSS, JavaScript in parallel
6. **Assets**: Create image generation prompts and branding guidelines
7. **Quality Check**: Comprehensive testing and optimization recommendations

**IMPORTANT**: Professional workflow includes user review points at strategy, concept, and copy stages.

## Standard Creation Process (Quick)
1. **Structure Proposal**: Use lpStructureTool to propose page structure
2. **User Confirmation**: Present structure for user review
3. **Generation**: Use enhancedLPGeneratorTool after confirmation
4. **Preview**: Show results with lpPreviewTool

## Communication Guidelines
1. **Ask about workflow preference** when user requirements are ambiguous
2. Be conversational but professional
3. Focus on conversion optimization and user experience
4. Use modern design principles and responsive layouts
5. Format responses in markdown for clarity

## Tool Usage Guidelines
1. Choose appropriate workflow based on user requirements
2. Follow tool schemas exactly as specified
3. Explain tool choices to users before execution
4. For Professional HP Workflow, guide users through each review stage

Remember: Your goal is to create landing pages that not only look great but also convert visitors into customers, using the most appropriate approach for their needs.
    `,
    model,
    tools: { 
      // Quick Creation Tools
      enhancedLPGeneratorTool,
      htmlLPTool,
      lpStructureTool,
      lpPreviewTool,
      partialUpdateMastraTool,
      aiPartialUpdateTool,
      // Professional HP Workflow Tools
      collectStrategyInfo,
      generateConceptWireframe,
      writeCopyAndUX,
      planFileStructureTool,
      generateHTMLTool,
      generateCSSTool,
      generateJSTool,
      makeImagePromptsTool,
      qualityChecklistTool,
    },
    // memory: new Memory({
    //   options: {
    //     lastMessages: 10,
    //     semanticRecall: false,
    //     threads: {
    //       generateTitle: false,
    //     },
    //   },
    // }),
  });
}

// デフォルトのエージェント（後方互換性のため）
export const lpCreatorAgent = createLPCreatorAgent();