import type { PropertyListing } from '../properties/types.js';

/** Lysa's product capabilities. Each maps to one specialized agent. */
export type CapabilityId =
  | 'knowledge'
  | 'lead_qualification'
  | 'property_discovery'
  | 'viewing_booking'
  | 'memory';

export interface AppConfig {
  name: string;
  brand: {
    assistantName: string;
    companyName: string;
    tone: string;
  };
  locale: {
    defaultLanguage: string;
    supportedLanguages: string[];
    timezone: string;
    currency: string;
  };
  features: {
    typingIndicator: boolean;
    conversationReset: boolean;
  };
  capabilities: CapabilityId[];
  model: string;
  knowledge?: {
    entries: Array<{ topic: string; content: string }>;
  };
  properties?: {
    /** `config` reads the listings below. Other values require a provider adapter. */
    source?: 'config' | 'provider';
    listings?: PropertyListing[];
  };
  scheduling?: {
    /**
     * `request` records viewing requests for the team to confirm.
     * `disabled` refuses scheduling and hands off to a human.
     */
    mode?: 'request' | 'disabled';
    viewingDurationMinutes?: number;
    /** Human-readable windows the team can usually accommodate, e.g. "Mon-Fri 09:00-18:00". */
    availableWindows?: string[];
    notes?: string;
  };
  memory?: {
    /** Long-term facts recalled across conversations. Thread history is always on. */
    longTerm?: boolean;
    maxItems?: number;
  };
}

export interface AppContext {
  config: AppConfig;
  systemPrompt: string;
}

/** Per-turn identity resolved by the channel and shared with every agent and tool. */
export interface CustomerIdentity {
  phone: string;
  name?: string | null;
  email?: string | null;
}
