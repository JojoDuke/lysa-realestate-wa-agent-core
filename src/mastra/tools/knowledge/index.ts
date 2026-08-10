import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../../core/config/types.js';

export function buildKnowledgeTools(config: AppConfig) {
  const entries = config.knowledge?.entries ?? [];

  return {
    searchKnowledge: createTool({
      id: 'search-knowledge',
      description:
        'Search the approved knowledge base for business, service, policy, fee, process, and office information',
      inputSchema: z.object({
        query: z
          .string()
          .describe('What to look up, e.g. "office hours", "viewing process", or "service area"'),
      }),
      execute: async (inputData) => {
        const q = inputData.query.toLowerCase();
        const matches = entries.filter(
          (entry) =>
            entry.topic.toLowerCase().includes(q) ||
            entry.content.toLowerCase().includes(q) ||
            q
              .split(/\s+/)
              .some((word) => word.length > 3 && entry.content.toLowerCase().includes(word)),
        );

        if (matches.length === 0) {
          return {
            found: false,
            message:
              'No matching knowledge entries. Say that you do not have that information and offer a human handoff.',
            results: [],
          };
        }

        return {
          found: true,
          results: matches.map((match) => ({ topic: match.topic, content: match.content })),
        };
      },
    }),

    getBusinessInfo: createTool({
      id: 'get-business-info',
      description: 'Get the configured identity, locale, and enabled capabilities of this business',
      inputSchema: z.object({}),
      execute: async () => ({
        companyName: config.brand.companyName,
        assistantName: config.brand.assistantName,
        timezone: config.locale.timezone,
        currency: config.locale.currency,
        defaultLanguage: config.locale.defaultLanguage,
        capabilities: config.capabilities,
      }),
    }),
  };
}
