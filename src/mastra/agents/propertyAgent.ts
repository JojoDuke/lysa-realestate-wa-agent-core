import { Agent } from '@mastra/core/agent';
import type { Workflow } from '@mastra/core/workflows';
import type { AppConfig } from '../../core/config/types.js';
import { buildPropertyTools } from '../tools/properties/index.js';
import { specialistPreamble } from './shared.js';

export function createPropertyAgent(
  config: AppConfig,
  workflows: { propertySearch: Workflow<any, any, any, any, any, any, any, any> },
): Agent {
  return new Agent({
    id: 'property-agent',
    name: 'Property Discovery',
    description:
      'Searches the property catalogue, matches listings against a customer\u2019s requirements, and explains specific listings. Use this for "what do you have available", area or budget searches, and questions about a particular property.',
    instructions: [
      specialistPreamble(config, 'property discovery'),
      '',
      '## How you work',
      '- Use the property-search workflow when the customer describes requirements; it merges what they said with what is already on file.',
      '- Use searchProperties for a one-off search with explicit filters only.',
      '- Use getPropertyDetails when the customer asks about a specific listing.',
      '',
      '## Rules',
      '- Describe only listings the tools returned, using their exact price, area, and status.',
      '- If the catalogue is not connected or nothing matches, say so and suggest either relaxing a criterion or a human handoff.',
      '- Note any requirement a listing fails to meet instead of hiding it.',
      '- Return at most five listings, most relevant first.',
    ].join('\n'),
    model: config.model,
    tools: buildPropertyTools(config),
    workflows,
  });
}
