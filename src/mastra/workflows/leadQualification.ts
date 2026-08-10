import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  getLead,
  leadStorageAvailable,
  missingLeadFields,
  saveLead,
  type LeadPatch,
} from '../../core/db/leads.js';
import { customerPhone } from '../tools/context.js';

const detailsSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  intent: z.enum(['buy', 'sell', 'rent', 'let', 'other']).optional(),
  property_type: z.string().optional(),
  preferred_area: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  bedrooms: z.number().optional(),
  timeline: z.string().optional(),
  financing: z.enum(['cash', 'mortgage_approved', 'mortgage_needed', 'unknown']).optional(),
  notes: z.string().optional(),
});

const profileStateSchema = z.object({
  saved: z.boolean(),
  profile: z.record(z.string(), z.unknown()).nullable(),
  missingFields: z.array(z.string()),
  storageAvailable: z.boolean(),
});

const QUESTION_FOR_FIELD: Record<string, string> = {
  name: 'their name',
  intent: 'whether they are buying, selling, renting, or letting',
  property_type: 'what kind of property they need',
  preferred_area: 'which area they are looking in',
  timeline: 'when they want to move or transact',
};

/**
 * Merge newly heard details into the stored lead, then report what is still missing.
 * Deterministic on purpose: the agent decides what to ask, not what to persist.
 */
export function buildLeadQualificationWorkflow() {
  const mergeDetails = createStep({
    id: 'merge-lead-details',
    inputSchema: z.object({ details: detailsSchema }),
    outputSchema: profileStateSchema,
    execute: async ({ inputData, requestContext }) => {
      const phone = customerPhone({ requestContext });
      const storageAvailable = leadStorageAvailable();

      if (!phone || !storageAvailable) {
        return {
          saved: false,
          profile: null,
          missingFields: missingLeadFields(null),
          storageAvailable,
        };
      }

      const patch = inputData.details as LeadPatch;
      const profile = Object.keys(patch).length
        ? await saveLead(phone, { ...patch, status: 'qualifying' })
        : await getLead(phone);

      return {
        saved: profile !== null,
        profile: (profile ?? null) as Record<string, unknown> | null,
        missingFields: missingLeadFields(profile),
        storageAvailable,
      };
    },
  });

  const summarize = createStep({
    id: 'summarize-qualification',
    inputSchema: profileStateSchema,
    outputSchema: profileStateSchema.extend({
      complete: z.boolean(),
      askNext: z.string().nullable(),
      alreadyKnown: z.array(z.string()),
    }),
    execute: async ({ inputData }) => {
      const known = Object.entries(inputData.profile ?? {})
        .filter(([, value]) => value !== null && value !== '' && value !== undefined)
        .map(([field]) => field);

      const nextField = inputData.missingFields[0];

      return {
        ...inputData,
        complete: inputData.missingFields.length === 0,
        askNext: nextField ? (QUESTION_FOR_FIELD[nextField] ?? nextField) : null,
        alreadyKnown: known,
      };
    },
  });

  return createWorkflow({
    id: 'lead-qualification',
    description:
      'Persist newly heard qualification details and report what is still missing, so the customer is never asked twice',
    inputSchema: z.object({ details: detailsSchema }),
    outputSchema: profileStateSchema.extend({
      complete: z.boolean(),
      askNext: z.string().nullable(),
      alreadyKnown: z.array(z.string()),
    }),
  })
    .then(mergeDetails)
    .then(summarize)
    .commit();
}
