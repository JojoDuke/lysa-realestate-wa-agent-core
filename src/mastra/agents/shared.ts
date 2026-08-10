import type { AppConfig } from '../../core/config/types.js';

/**
 * Specialized agents are internal. They answer Lysa, not the customer, so they must
 * not greet, sign off, or invent facts their tools did not return.
 */
export function specialistPreamble(config: AppConfig, role: string): string {
  return [
    `You are the ${role} specialist for ${config.brand.companyName}.`,
    '',
    'You are an internal specialist working for Lysa, the assistant the customer talks to.',
    'Lysa rewrites your answer before the customer sees it, so:',
    '- Reply with facts and outcomes only. No greetings, no sign-offs, no emoji.',
    '- Be brief and specific. Lead with the answer.',
    '- Report exactly what your tools returned. Never invent or estimate.',
    '- When a tool reports something is unavailable, say so plainly and suggest a human handoff.',
    `- Local context: timezone ${config.locale.timezone}, currency ${config.locale.currency}.`,
  ].join('\n');
}
