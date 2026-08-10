import { Agent } from '@mastra/core/agent';
import type { AppConfig } from '../../core/config/types.js';
import { buildKnowledgeTools } from '../tools/knowledge/index.js';

/**
 * Specialist for approved business knowledge. Answers Lysa, never the customer.
 */
export function createKnowledgeAgent(config: AppConfig): Agent {
  return new Agent({
    id: 'knowledge',
    name: 'Knowledge Agent',
    description:
      'Use when the customer asks about the business, policies, fees, office hours, processes, service areas, or general company information.',
    instructions: [
      'You are a knowledge specialist for a real-estate business.',
      'Answer only from tool results. Use searchKnowledge for topic lookups and getBusinessInfo for identity/locale/capabilities.',
      'If nothing matches, say you do not have that information and recommend a human handoff.',
      'Never invent property details, prices, availability, fees, legal advice, or appointments.',
      'Reply to Lysa with concise facts she can rewrite for the customer. Do not address the customer directly.',
    ].join('\n'),
    model: config.model,
    tools: buildKnowledgeTools(config),
  });
}
