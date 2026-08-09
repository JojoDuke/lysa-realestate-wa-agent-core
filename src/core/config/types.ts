export type CapabilityId =
  | 'core'
  | 'knowledge'
  | 'lead_qualification'
  | 'property_discovery'
  | 'showing_booking'
  | 'conversation_memory'
  | 'booking'
  | 'lead_capture';

export interface Listing {
  id: string;
  title: string;
  area: string;
  price: number;
  bedrooms: number;
  bathrooms?: number;
  propertyType: string;
  description: string;
  imageUrl?: string;
  status?: 'available' | 'pending' | 'sold';
}

export interface ShowingSlot {
  id: string;
  start: string;
  label: string;
  propertyId?: string;
}

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
  /** Which Lysa specialist domains are active for this customer fork */
  capabilities: CapabilityId[];
  model: string;
  knowledge?: {
    entries: Array<{ topic: string; content: string }>;
  };
  /** Demo / customer listing feed — replace with live MLS/PMS integration later */
  listings?: Listing[];
  /** Demo showing slots — replace with calendar integration later */
  showingSlots?: ShowingSlot[];
}

export interface AppContext {
  config: AppConfig;
  systemPrompt: string;
}
