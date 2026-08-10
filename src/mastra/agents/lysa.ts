import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import type { AppContext } from '../../core/config/types.js';
import { sharedStorage } from '../../core/storage/memory.js';
import { env } from '../../core/env.js';
import type { CapabilitySummary } from '../capabilities.js';

/**
 * Lysa is the primary conversational agent. Every channel talks to her.
 * Capability specialists are added one at a time via `src/mastra/capabilities.ts`.
 */
export function createLysa(
  app: AppContext,
  specialists: Record<string, Agent> = {},
  summaries: CapabilitySummary[] = [],
): Agent {
  const { config, systemPrompt } = app;
  const defaultLang = env('DEFAULT_LANGUAGE') || config.locale.defaultLanguage;

  const routing =
    summaries.length > 0
      ? [
          'Delegation:',
          ...summaries.map((s) => `- Use the ${s.key} agent when: ${s.whenToUse}`),
          'Specialists answer you, not the customer. Rewrite their output in your voice.',
          'Never name internal agents, tools, or workflows to the customer.',
        ].join('\n')
      : '';

  const instructions = [
    systemPrompt,
    `Default language for ambiguous greetings: ${defaultLang}`,
    routing,
  ]
    .filter(Boolean)
    .join('\n\n');

  return new Agent({
    id: 'lysa',
    name: config.brand.assistantName,
    description: 'Primary real-estate assistant for WhatsApp and other channels.',
    instructions,
    model: config.model,
    memory: new Memory({ storage: sharedStorage }),
    agents: specialists,
  });
}
