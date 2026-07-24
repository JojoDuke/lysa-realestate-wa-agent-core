export type CapabilityId = 'core' | 'booking' | 'knowledge' | 'lead_capture';

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
}

export interface AppContext {
  config: AppConfig;
  systemPrompt: string;
}
