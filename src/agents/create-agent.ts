import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import type { AppContext } from '../core/config/types.js';
import { buildPromptExtensions } from '../capabilities/registry.js';
import { sharedStorage } from '../core/storage/memory.js';
import { env } from '../core/env.js';
import { createSpecialistAgents } from './specialists.js';

export type LysaAgents = ReturnType<typeof createLysaAgents>;

/**
 * Builds Lysa's WhatsApp supervisor + the five specialist subagents.
 * Register all of them on Mastra so Studio can inspect and chat with each one.
 */
export function createLysaAgents(app: AppContext) {
  const specialists = createSpecialistAgents(app);
  const whatsappAgent = createWhatsAppAgent(app, specialists);
  return { whatsappAgent, ...specialists };
}

export function createWhatsAppAgent(
  app: AppContext,
  specialists = createSpecialistAgents(app),
): Agent {
  const { config, systemPrompt } = app;
  const extensions = buildPromptExtensions(config);
  const defaultLang = env('DEFAULT_LANGUAGE') || config.locale.defaultLanguage;

  const instructions = [
    systemPrompt,
    extensions,
    `\nDefault language for ambiguous greetings: ${defaultLang}`,
    `
## Subagent routing
You are the supervisor. Delegate with the specialist agents when helpful:
- conversationMemoryAgent — returning users / saved preferences
- leadQualificationAgent — new enquiries, contact capture, Hot/Warm/Cold scoring
- knowledgeAgent — FAQs, process, fees, office info
- propertyDiscoveryAgent — listing search and recommendations
- showingBookingAgent — availability and booking showings

Synthesize specialist results into one short WhatsApp-ready reply.
Do not mention internal agent names to the customer.
After any tool or subagent call, always write a visible reply.
`,
  ]
    .filter(Boolean)
    .join('\n');

  return new Agent({
    id: 'whatsapp-agent',
    name: config.brand.assistantName,
    description: `${config.brand.assistantName} — WhatsApp front desk for ${config.brand.companyName}. Routes to Lysa specialists.`,
    instructions,
    model: config.model,
    agents: specialists,
    memory: new Memory({ storage: sharedStorage }),
  });
}
