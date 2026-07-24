import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import type { AppContext } from '../core/config/types.js';
import { sharedStorage } from '../core/storage/memory.js';
import { buildTools, buildPromptExtensions } from '../capabilities/registry.js';
import { env } from '../core/env.js';

export function createWhatsAppAgent(app: AppContext): Agent {
  const { config, systemPrompt } = app;
  const extensions = buildPromptExtensions(config);
  const defaultLang = env('DEFAULT_LANGUAGE') || config.locale.defaultLanguage;

  const instructions = [
    systemPrompt,
    extensions,
    `\nDefault language for ambiguous greetings: ${defaultLang}`,
  ]
    .filter(Boolean)
    .join('\n');

  return new Agent({
    id: 'whatsapp-agent',
    name: config.brand.assistantName,
    instructions,
    model: config.model,
    tools: buildTools(config) as Record<string, never>,
    memory: new Memory({ storage: sharedStorage }),
  });
}
