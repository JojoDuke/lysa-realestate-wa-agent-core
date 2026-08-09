import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../core/config/types.js';
import { getPreferences, savePreferences } from '../../core/storage/preferences.js';
import type { CapabilityModule } from '../types.js';

export const conversationMemoryCapability: CapabilityModule = {
  id: 'conversation_memory',
  promptExtension: `
## Conversation memory
Recall and update stored customer preferences so returning chats feel continuous.
`,
  getTools: (_config: AppConfig) => ({
    recallPreferences: createTool({
      id: 'recall-preferences',
      description: 'Load remembered preferences for a customer resource id',
      inputSchema: z.object({
        resourceId: z.string(),
      }),
      execute: async (input) => {
        const prefs = getPreferences(input.resourceId);
        if (!prefs) {
          return { found: false, message: 'No stored preferences for this customer yet.' };
        }
        return { found: true, preferences: prefs };
      },
    }),

    savePreferences: createTool({
      id: 'save-preferences',
      description: 'Persist customer search preferences for future conversations',
      inputSchema: z.object({
        resourceId: z.string(),
        name: z.string().optional(),
        intent: z.enum(['buyer', 'seller', 'renter', 'landlord', 'tenant', 'other']).optional(),
        budget: z.string().optional(),
        preferredArea: z.string().optional(),
        propertyType: z.string().optional(),
        bedrooms: z.number().optional(),
        timeline: z.string().optional(),
        notes: z.string().optional(),
      }),
      execute: async (input) => {
        const { resourceId, ...patch } = input;
        const preferences = savePreferences(resourceId, patch);
        return { saved: true, preferences };
      },
    }),
  }),
};
