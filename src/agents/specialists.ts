import { Agent } from '@mastra/core/agent';
import type { AppContext } from '../core/config/types.js';
import { buildTools } from '../capabilities/registry.js';

function modelOf(app: AppContext): string {
  return app.config.model;
}

export function createLeadQualificationAgent(app: AppContext): Agent {
  const { config } = app;
  return new Agent({
    id: 'lead-qualification-agent',
    name: 'Lead Qualification',
    description:
      'Qualifies buyers/sellers/renters: collects contact + budget/area/timeline, scores Hot/Warm/Cold, saves structured leads.',
    instructions: `You are the Lead Qualification specialist for ${config.brand.companyName}.
Ask naturally for only missing fields. Capture with captureLead when you have enough signal.
Score Hot (ready soon + clear budget), Warm (exploring), Cold (vague / far out).
Keep replies short. Do not invent contact details.`,
    model: modelOf(app),
    tools: buildTools(config, ['lead_qualification']) as Record<string, never>,
  });
}

export function createKnowledgeAgent(app: AppContext): Agent {
  const { config } = app;
  return new Agent({
    id: 'knowledge-agent',
    name: 'Knowledge',
    description:
      'Answers brokerage FAQs, process, fees, office hours, and policy questions from the configured knowledge base.',
    instructions: `You are the Knowledge specialist for ${config.brand.companyName}.
Use searchKnowledge and getBusinessInfo. Never invent facts — if nothing matches, say so and suggest a human handoff.
Tone: ${config.brand.tone}.`,
    model: modelOf(app),
    tools: buildTools(config, ['knowledge', 'core']) as Record<string, never>,
  });
}

export function createPropertyDiscoveryAgent(app: AppContext): Agent {
  const { config } = app;
  return new Agent({
    id: 'property-discovery-agent',
    name: 'Property Discovery',
    description:
      'Searches configured listings and recommends matching properties with prices, areas, and short descriptions.',
    instructions: `You are the Property Discovery specialist for ${config.brand.companyName}.
Use searchListings only. Never invent homes or prices. Present up to 3 strong matches briefly.
Currency: ${config.locale.currency}. Offer to refine criteria or book a showing next.`,
    model: modelOf(app),
    tools: buildTools(config, ['property_discovery']) as Record<string, never>,
  });
}

export function createShowingBookingAgent(app: AppContext): Agent {
  const { config } = app;
  return new Agent({
    id: 'showing-booking-agent',
    name: 'Showing Booking',
    description:
      'Checks showing availability and books appointments from the configured calendar slots.',
    instructions: `You are the Showing Booking specialist for ${config.brand.companyName}.
Always checkShowingAvailability before offering times. Confirm only after requestShowing succeeds.
Timezone: ${config.locale.timezone}. Never invent slots.`,
    model: modelOf(app),
    tools: buildTools(config, ['showing_booking']) as Record<string, never>,
  });
}

export function createConversationMemoryAgent(app: AppContext): Agent {
  const { config } = app;
  return new Agent({
    id: 'conversation-memory-agent',
    name: 'Conversation Memory',
    description:
      'Recalls and updates stored customer preferences so returning conversations stay personalized.',
    instructions: `You are the Conversation Memory specialist for ${config.brand.companyName}.
Use recallPreferences at the start of returning chats when a resourceId is known.
Use savePreferences when the customer shares lasting criteria (area, budget, bedrooms, intent).
Summarize remembered context briefly for the supervisor — do not invent history.`,
    model: modelOf(app),
    tools: buildTools(config, ['conversation_memory']) as Record<string, never>,
  });
}

export function createSpecialistAgents(app: AppContext) {
  return {
    leadQualificationAgent: createLeadQualificationAgent(app),
    knowledgeAgent: createKnowledgeAgent(app),
    propertyDiscoveryAgent: createPropertyDiscoveryAgent(app),
    showingBookingAgent: createShowingBookingAgent(app),
    conversationMemoryAgent: createConversationMemoryAgent(app),
  };
}
