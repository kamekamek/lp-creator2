
// @ts-nocheck
import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';
import { LibSQLStore } from '@mastra/libsql';
import { lpCreatorAgent } from './agents';
import { 
  htmlLPTool, 
  lpStructureTool,
  lpPreviewTool
} from './tools';

// @ts-ignore - Type definition issue with tools property
export const mastra = new Mastra({
  agents: { 
    lpCreatorAgent,
  },
  tools: { 
    htmlLPTool, 
    lpStructureTool,
    lpPreviewTool,
  } as any,
  storage: new LibSQLStore({
    url: "file:../memory.db",
  }),
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
  server: {
    timeout: 300000,
    port: 4112, // Open_SuperAgentと異なるポート
  },
});

export * from './agents';
