import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../core/config/types.js';
import { updateUserContact } from '../../core/db/users.js';
import { savePreferences } from '../../core/storage/preferences.js';
import type { CapabilityModule } from '../types.js';

export const leadQualificationCapability: CapabilityModule = {
  id: 'lead_qualification',
  promptExtension: `
## Lead qualification
Capture structured lead details. Score Hot / Warm / Cold. Do not invent contact info.
`,
  getTools: (_config: AppConfig) => ({
    captureLead: createTool({
      id: 'capture-lead',
      description:
        'Save a structured real-estate lead (contact + qualification fields + Hot/Warm/Cold score)',
      inputSchema: z.object({
        resourceId: z.string().describe('WhatsApp sender / customer id when known'),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        intent: z.enum(['buyer', 'seller', 'renter', 'landlord', 'tenant', 'other']),
        budget: z.string().optional(),
        preferredArea: z.string().optional(),
        propertyType: z.string().optional(),
        bedrooms: z.number().optional(),
        timeline: z.string().optional(),
        financingStatus: z.string().optional(),
        notes: z.string().optional(),
        score: z.enum(['Hot', 'Warm', 'Cold']),
      }),
      execute: async (input) => {
        const prefs = savePreferences(input.resourceId || input.phone || 'anonymous', {
          name: input.name,
          intent: input.intent,
          budget: input.budget,
          preferredArea: input.preferredArea,
          propertyType: input.propertyType,
          bedrooms: input.bedrooms,
          timeline: input.timeline,
          notes: [input.notes, input.financingStatus, `score:${input.score}`]
            .filter(Boolean)
            .join(' | '),
        });

        if (input.phone && (input.name || input.email)) {
          await updateUserContact(input.phone, {
            name: input.name,
            email: input.email,
          });
        }

        return {
          saved: true,
          lead: {
            ...input,
            preferences: prefs,
          },
          summary: `${input.score} ${input.intent} lead saved${input.name ? ` for ${input.name}` : ''}.`,
        };
      },
    }),
  }),
};
