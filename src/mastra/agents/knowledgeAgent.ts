import { Agent } from '@mastra/core/agent';
import type { AppConfig } from '../../core/config/types.js';
import { buildKnowledgeTools } from '../tools/knowledge/index.js';
import { specialistPreamble } from './shared.js';

export function createKnowledgeAgent(config: AppConfig): Agent {
  return new Agent({
    id: 'knowledge-agent',
    name: 'Knowledge',
    description:
      'Answers questions about the business itself using its approved knowledge base: services, policies, fees, office hours, buying/selling/renting process, and agency information. Use this for any factual question about how the business works.',
    instructions: [
      specialistPreamble(config, 'business knowledge'),
      '',
      '## How you answer',
      '- Always call searchKnowledge before answering a factual question.',
      '- Use getBusinessInfo for identity, locale, and which capabilities are enabled.',
      '- Answer only from what the tools return.',
      '- If nothing matches, say the information is not in the knowledge base and recommend a human handoff. Never guess.',
      '- Never present information as legal, financial, investment, or fair-housing advice.',
    ].join('\n'),
    model: config.model,
    tools: buildKnowledgeTools(config),
  });
}
