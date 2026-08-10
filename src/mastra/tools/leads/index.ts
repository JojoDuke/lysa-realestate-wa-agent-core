import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getLead,
  saveLead,
  missingLeadFields,
  leadStorageAvailable,
  type LeadPatch,
} from '../../../core/db/leads.js';
import { customerPhone, NO_CUSTOMER_RESULT } from '../context.js';

const leadDetailsSchema = z.object({
  name: z.string().optional().describe('Full name the customer gave'),
  email: z.string().optional().describe('Email address the customer gave'),
  intent: z
    .enum(['buy', 'sell', 'rent', 'let', 'other'])
    .optional()
    .describe('What the customer wants to do'),
  property_type: z.string().optional().describe('Apartment, house, land, commercial, and so on'),
  preferred_area: z.string().optional().describe('Neighbourhood, city, or region'),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  bedrooms: z.number().optional(),
  timeline: z.string().optional().describe('When they want to move or transact, in their words'),
  financing: z
    .enum(['cash', 'mortgage_approved', 'mortgage_needed', 'unknown'])
    .optional()
    .describe('Only set this when the customer states it'),
  notes: z.string().optional().describe('Short free-text detail worth keeping'),
});

const STORAGE_UNAVAILABLE = {
  ok: false as const,
  reason: 'storage_unavailable',
  message:
    'Lead storage is not configured, so nothing was saved. Continue the conversation and offer a human handoff for follow-up.',
};

export function buildLeadTools() {
  return {
    getLeadProfile: createTool({
      id: 'get-lead-profile',
      description:
        'Load everything already known about this customer as a lead, plus which qualification details are still missing',
      inputSchema: z.object({}),
      execute: async (_inputData, context) => {
        const phone = customerPhone(context);
        if (!phone) return NO_CUSTOMER_RESULT;

        const lead = await getLead(phone);
        return {
          ok: true as const,
          exists: lead !== null,
          profile: lead,
          missingFields: missingLeadFields(lead),
          storageAvailable: leadStorageAvailable(),
        };
      },
    }),

    saveLeadDetails: createTool({
      id: 'save-lead-details',
      description:
        'Save or update qualification details for this customer. Only pass fields the customer actually provided.',
      inputSchema: leadDetailsSchema,
      execute: async (inputData, context) => {
        const phone = customerPhone(context);
        if (!phone) return NO_CUSTOMER_RESULT;
        if (!leadStorageAvailable()) return STORAGE_UNAVAILABLE;

        const profile = await saveLead(phone, { ...(inputData as LeadPatch), status: 'qualifying' });
        return {
          ok: profile !== null,
          profile,
          missingFields: missingLeadFields(profile),
        };
      },
    }),

    markLeadQualified: createTool({
      id: 'mark-lead-qualified',
      description:
        'Mark this lead as qualified once the core requirements are known and the customer is ready for a human agent',
      inputSchema: z.object({
        summary: z.string().describe('One or two sentences a human agent can act on'),
      }),
      execute: async (inputData, context) => {
        const phone = customerPhone(context);
        if (!phone) return NO_CUSTOMER_RESULT;
        if (!leadStorageAvailable()) return STORAGE_UNAVAILABLE;

        const profile = await saveLead(phone, { status: 'qualified', notes: inputData.summary });
        return { ok: profile !== null, profile };
      },
    }),
  };
}
