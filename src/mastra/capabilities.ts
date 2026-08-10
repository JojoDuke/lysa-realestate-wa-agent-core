import type { Agent } from '@mastra/core/agent';
import type { Workflow } from '@mastra/core/workflows';
import type { AppConfig } from '../core/config/types.js';
import { createKnowledgeAgent } from './agents/knowledge.js';

type AnyWorkflow = Workflow<any, any, any, any, any, any, any, any>;

export interface CapabilitySummary {
  key: string;
  label: string;
  whenToUse: string;
}

export interface CapabilityRuntime {
  agents: Record<string, Agent>;
  workflows: Record<string, AnyWorkflow>;
  summaries: CapabilitySummary[];
}

/**
 * Assembles capability specialists enabled in `config/app.json`.
 * Add one agent at a time here as you build each capability.
 */
export function buildCapabilityRuntime(config: AppConfig): CapabilityRuntime {
  const agents: Record<string, Agent> = {};
  const workflows: Record<string, AnyWorkflow> = {};
  const summaries: CapabilitySummary[] = [];

  if (config.capabilities.includes('knowledge')) {
    agents.knowledge = createKnowledgeAgent(config);
    summaries.push({
      key: 'knowledge',
      label: 'Knowledge',
      whenToUse:
        'Business, policy, fee, office hours, process, service-area, and company-info questions.',
    });
  }

  return { agents, workflows, summaries };
}
