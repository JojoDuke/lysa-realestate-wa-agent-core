import type { Agent } from '@mastra/core/agent';
import type { Workflow } from '@mastra/core/workflows';
import type { AppConfig } from '../core/config/types.js';
import { createKnowledgeAgent } from './agents/knowledgeAgent.js';
import { createLeadAgent } from './agents/leadAgent.js';
import { createMemoryAgent } from './agents/memoryAgent.js';
import { createPropertyAgent } from './agents/propertyAgent.js';
import { createSchedulingAgent } from './agents/schedulingAgent.js';
import { buildLeadQualificationWorkflow } from './workflows/leadQualification.js';
import { buildPropertySearchWorkflow } from './workflows/propertySearch.js';
import { buildViewingBookingWorkflow } from './workflows/viewingBooking.js';

type AnyWorkflow = Workflow<any, any, any, any, any, any, any, any>;

/** One line of Lysa's routing table, so the prompt stays accurate when a capability is off. */
export interface CapabilitySummary {
  key: string;
  label: string;
  whenToUse: string;
}

export interface CapabilityRuntime {
  /** Keyed by delegation name; Lysa exposes each as an `agent-<key>` tool. */
  agents: Record<string, Agent>;
  workflows: Record<string, AnyWorkflow>;
  summaries: CapabilitySummary[];
}

/**
 * Assembles the capabilities enabled in `config/app.json`. Adding a future capability
 * means adding one block here plus its agent, tools, and optional workflow.
 */
export function buildCapabilityRuntime(config: AppConfig): CapabilityRuntime {
  const enabled = new Set(config.capabilities);
  const agents: Record<string, Agent> = {};
  const workflows: Record<string, AnyWorkflow> = {};
  const summaries: CapabilitySummary[] = [];

  if (enabled.has('memory')) {
    agents.memoryAgent = createMemoryAgent(config);
    summaries.push({
      key: 'memoryAgent',
      label: 'Memory',
      whenToUse:
        'the customer refers to something from a past conversation, states a lasting preference, or you need their history before answering',
    });
  }

  if (enabled.has('knowledge')) {
    agents.knowledgeAgent = createKnowledgeAgent(config);
    summaries.push({
      key: 'knowledgeAgent',
      label: 'Knowledge',
      whenToUse:
        'the question is about the business itself: services, policies, fees, hours, or how buying, selling, renting, or letting works here',
    });
  }

  if (enabled.has('lead_qualification')) {
    const leadQualification = buildLeadQualificationWorkflow();
    workflows.leadQualification = leadQualification;
    agents.leadAgent = createLeadAgent(config, { leadQualification });
    summaries.push({
      key: 'leadAgent',
      label: 'Lead Qualification',
      whenToUse:
        'the customer shares what they want, their budget, timeline, financing, or contact details, or is ready to speak to a human agent',
    });
  }

  if (enabled.has('property_discovery')) {
    const propertySearch = buildPropertySearchWorkflow(config);
    workflows.propertySearch = propertySearch;
    agents.propertyAgent = createPropertyAgent(config, { propertySearch });
    summaries.push({
      key: 'propertyAgent',
      label: 'Property Discovery',
      whenToUse:
        'the customer asks what is available, searches by area, budget, or size, or asks about a specific listing',
    });
  }

  if (enabled.has('viewing_booking')) {
    const viewingBooking = buildViewingBookingWorkflow(config);
    workflows.viewingBooking = viewingBooking;
    agents.schedulingAgent = createSchedulingAgent(config, { viewingBooking });
    summaries.push({
      key: 'schedulingAgent',
      label: 'Viewing Booking',
      whenToUse:
        'the customer wants to view a property, asks when a viewing is possible, or wants to change or cancel one',
    });
  }

  return { agents, workflows, summaries };
}
