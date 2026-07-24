import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../core/config/types.js';
import type { CapabilityModule } from '../types.js';

export const knowledgeCapability: CapabilityModule = {
  id: 'knowledge',
  promptExtension: `
## Knowledge base
Use searchKnowledge to answer questions about the business. Do not invent facts — if nothing matches, say you don't know and offer to connect them with a human.
`,
  getTools: (config: AppConfig) => {
    const entries = config.knowledge?.entries ?? [];

    return {
      searchKnowledge: createTool({
        id: 'search-knowledge',
        description: 'Search the business knowledge base for FAQs, policies, hours, and service info',
        inputSchema: z.object({
          query: z.string().describe('What to look up, e.g. "opening hours" or "contact email"'),
        }),
        execute: async (inputData) => {
          const q = inputData.query.toLowerCase();
          const matches = entries.filter(
            (e) =>
              e.topic.toLowerCase().includes(q) ||
              e.content.toLowerCase().includes(q) ||
              q.split(/\s+/).some((word: string) => word.length > 3 && e.content.toLowerCase().includes(word)),
          );

          if (matches.length === 0) {
            return {
              found: false,
              message: 'No matching knowledge entries. Tell the user you do not have that information.',
              results: [],
            };
          }

          return {
            found: true,
            results: matches.map((m) => ({ topic: m.topic, content: m.content })),
          };
        },
      }),
    };
  },
};
