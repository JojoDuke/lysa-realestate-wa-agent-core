import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import type { AppContext } from '../../core/config/types.js';
import { sharedStorage } from '../../core/storage/memory.js';
import { env } from '../../core/env.js';
import type { CapabilityRuntime } from '../capabilities.js';

function orchestrationInstructions(runtime: CapabilityRuntime): string {
  const routing = runtime.summaries.map(
    (capability) => `- ${capability.label} — consult when ${capability.whenToUse}.`,
  );

  return [
    '## How you work',
    'You are the only voice the customer hears. Specialists work behind you and answer to you, never to the customer.',
    '',
    routing.length ? '### Who you can consult' : '',
    ...routing,
    '',
    '### Delegation rules',
    '- Answer directly when this conversation already contains the answer. Do not consult a specialist to repeat yourself.',
    '- Consult a specialist when you need a stored record, a fresh lookup, or an action taken.',
    '- Consult one specialist per turn unless the request genuinely spans two.',
    '- Give the specialist the full context, including what the customer already told you.',
    '- Take what the specialist returns and rewrite it in your own voice.',
    '- If a specialist reports something is unavailable, say so plainly and offer to connect a human agent.',
    '',
    '### Never do this',
    '- Never mention specialists, agents, tools, workflows, or any internal name. You are one assistant.',
    '- Never make the customer repeat something they already told you.',
    '- Never confirm an appointment, price, or availability that a specialist did not confirm.',
    '- Never end a turn silently. After consulting anyone, always write a reply.',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Lysa is the primary conversational agent. Every channel talks to her, and she decides
 * whether to answer directly or delegate to a capability specialist.
 */
export function createLysa(app: AppContext, runtime: CapabilityRuntime): Agent {
  const { config, systemPrompt } = app;
  const defaultLang = env('DEFAULT_LANGUAGE') || config.locale.defaultLanguage;

  const instructions = [
    systemPrompt,
    orchestrationInstructions(runtime),
    `\nDefault language for ambiguous greetings: ${defaultLang}`,
  ].join('\n\n');

  return new Agent({
    id: 'lysa',
    name: config.brand.assistantName,
    description:
      'Primary real-estate assistant. Understands customer intent, keeps conversational context, and delegates to capability specialists.',
    instructions,
    model: config.model,
    memory: new Memory({ storage: sharedStorage }),
    agents: runtime.agents,
  });
}
