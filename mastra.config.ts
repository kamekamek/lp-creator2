import { config } from '@mastra/core';

export default config({
  name: 'lp-creator',
  tools: {
    directory: './src/mastra/tools',
  },
  agents: {
    directory: './src/mastra/agents',
  },
  workflows: {
    directory: './src/mastra/workflows',
  },
});