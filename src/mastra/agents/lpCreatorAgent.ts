import { Agent } from '@mastra/core';
import { createAnthropic } from '@ai-sdk/anthropic';
import { lpGeneratorTool } from '../tools';

export const lpCreatorAgent = new Agent({
  name: 'LP Creator',
  instructions: `
You are an expert landing page creator. Your role is to:

1. Understand the user's topic or business idea
2. Generate a comprehensive, high-converting landing page
3. Use modern design principles and responsive layouts
4. Include compelling copy and clear calls-to-action
5. Ensure the page is optimized for conversions

Always use the lpGeneratorTool to create landing pages based on the user's requirements.
Provide helpful suggestions for improving the landing page if asked.
  `,
  model: createAnthropic()('claude-3-5-sonnet-20240620'),
  tools: [lpGeneratorTool],
});