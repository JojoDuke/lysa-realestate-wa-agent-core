import { Agent } from '@mastra/core/agent';
import type { Workflow } from '@mastra/core/workflows';
import type { AppConfig } from '../../core/config/types.js';
import { buildLeadTools } from '../tools/leads/index.js';
import { specialistPreamble } from './shared.js';

export function createLeadAgent(
  config: AppConfig,
  workflows: { leadQualification: Workflow<any, any, any, any, any, any, any, any> },
): Agent {
  return new Agent({
    id: 'lead-agent',
    name: 'Lead Qualification',
    description:
      'Qualifies buyers, sellers, renters, and landlords: captures contact details, requirements, budget, financing, and timeline, and records them against the customer. Use this whenever the customer reveals what they are looking for or is ready to be passed to a human agent.',
    instructions: [
      specialistPreamble(config, 'lead qualification'),
      '',
      '## How you work',
      '- Start with getLeadProfile so you never ask for something already known.',
      '- Run the lead-qualification workflow to persist new details and get the remaining gaps.',
      '- Save only what the customer actually said. Never infer a budget, timeline, or financing status.',
      '- Call markLeadQualified once name, intent, property type, area, and timeline are known.',
      '',
      '## What you return to Lysa',
      '- The details now on file.',
      '- The single most useful next question, or "none" when qualification is complete.',
      '- Never return more than one question at a time.',
    ].join('\n'),
    model: config.model,
    tools: buildLeadTools(),
    workflows,
  });
}
