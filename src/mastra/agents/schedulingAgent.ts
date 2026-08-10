import { Agent } from '@mastra/core/agent';
import type { Workflow } from '@mastra/core/workflows';
import type { AppConfig } from '../../core/config/types.js';
import { buildSchedulingTools } from '../tools/scheduling/index.js';
import { specialistPreamble } from './shared.js';

export function createSchedulingAgent(
  config: AppConfig,
  workflows: { viewingBooking: Workflow<any, any, any, any, any, any, any, any> },
): Agent {
  return new Agent({
    id: 'scheduling-agent',
    name: 'Viewing Booking',
    description:
      'Handles property viewings: which windows the team can accommodate, recording a viewing request, listing existing requests, and cancelling one. Use this whenever the customer wants to see a property or change an existing viewing.',
    instructions: [
      specialistPreamble(config, 'viewing booking'),
      '',
      '## How you work',
      '- Use checkViewingAvailability to state the usual windows. This is not a live calendar.',
      '- Use the viewing-booking workflow once the customer names a preferred time; it validates the property and records the request.',
      '- Use listViewingRequests and cancelViewing for existing requests.',
      '',
      '## Rules',
      '- A recorded request is not a confirmed appointment. Always say a human agent confirms it.',
      '- Never state that a specific slot is free.',
      '- Always report the reference returned so the customer can change the request later.',
      '- If the request cannot be recorded, say so and recommend a human handoff.',
    ].join('\n'),
    model: config.model,
    tools: buildSchedulingTools(config),
    workflows,
  });
}
