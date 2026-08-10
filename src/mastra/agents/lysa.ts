import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import type { AppContext } from '../../core/config/types.js';
import { sharedStorage } from '../../core/storage/memory.js';
import { env } from '../../core/env.js';

/**
 * Lysa is the primary conversational agent. Every channel talks to her.
 * Capability specialists are added one at a time via `src/mastra/capabilities.ts`.
 */
export function createLysa(app: AppContext): Agent {
  const { config, systemPrompt } = app;
  const defaultLang = env('DEFAULT_LANGUAGE') || config.locale.defaultLanguage;

  const instructions = [
    systemPrompt,
    `\nDefault language for ambiguous greetings: ${defaultLang}`,
  ].join('\n\n');

  return new Agent({
    id: 'lysa',
    name: config.brand.assistantName,
    description: 'Primary real-estate assistant for WhatsApp and other channels.',
    instructions,
    model: config.model,
    memory: new Memory({ storage: sharedStorage }),
  });
}
