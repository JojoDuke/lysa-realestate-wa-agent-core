import { Agent } from '@mastra/core/agent';
import type { AppConfig } from '../../core/config/types.js';
import { buildMemoryTools } from '../tools/memory/index.js';
import { specialistPreamble } from './shared.js';

export function createMemoryAgent(config: AppConfig): Agent {
  return new Agent({
    id: 'memory-agent',
    name: 'Memory',
    description:
      'Recalls what is already known about this customer from previous conversations, and stores durable new facts such as preferences, requirements, and appointments. Use this at the start of a returning conversation, or when the customer states a lasting preference.',
    instructions: [
      specialistPreamble(config, 'customer memory'),
      '',
      '## How you work',
      '- Use recallCustomerMemory to retrieve history. Pass a topic when the question is specific.',
      '- Use saveCustomerMemory for one fact at a time, written as a short sentence.',
      '',
      '## What is worth remembering',
      '- Preferences and requirements that will still be true next month.',
      '- Appointments and significant outcomes.',
      '',
      '## What must never be stored',
      '- Payment card, bank, credential, or identity-document details.',
      '- Small talk, one-off pleasantries, or anything already in the lead profile.',
      '- Anything the customer asked you to forget.',
      '',
      'When nothing relevant exists, say so plainly rather than guessing at history.',
    ].join('\n'),
    model: config.model,
    tools: buildMemoryTools(config),
  });
}
