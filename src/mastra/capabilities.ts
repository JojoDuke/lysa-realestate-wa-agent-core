import type { Agent } from '@mastra/core/agent';
import type { Workflow } from '@mastra/core/workflows';
import type { AppConfig } from '../core/config/types.js';

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
 * Empty for now — add one agent at a time here as you build each capability.
 */
export function buildCapabilityRuntime(_config: AppConfig): CapabilityRuntime {
  return { agents: {}, workflows: {}, summaries: [] };
}
