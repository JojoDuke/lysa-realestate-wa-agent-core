import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import type { AppConfig } from '../../core/config/types.js';
import { saveMemory, memoryStorageAvailable } from '../../core/db/memories.js';
import { createViewingRequest, viewingStorageAvailable } from '../../core/db/viewings.js';
import { createPropertyProvider } from '../../core/properties/provider.js';
import { customerPhone } from '../tools/context.js';

const inputSchema = z.object({
  preferredTime: z.string(),
  propertyId: z.string().optional(),
  notes: z.string().optional(),
});

const validatedSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional(),
  message: z.string().optional(),
  preferredTime: z.string(),
  propertyId: z.string().optional(),
  propertyTitle: z.string().optional(),
  notes: z.string().optional(),
});

const outputSchema = z.object({
  ok: z.boolean(),
  status: z.string(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  property: z.string().optional(),
  preferredTime: z.string(),
  message: z.string(),
});

/**
 * Validate the property, record the request, then remember it. A recorded request is
 * never a confirmed appointment; a human confirms it.
 */
export function buildViewingBookingWorkflow(config: AppConfig) {
  const provider = createPropertyProvider(config);
  const mode = config.scheduling?.mode ?? 'request';

  const validateRequest = createStep({
    id: 'validate-viewing-request',
    inputSchema,
    outputSchema: validatedSchema,
    execute: async ({ inputData }) => {
      const base = {
        preferredTime: inputData.preferredTime,
        notes: inputData.notes,
      };

      if (mode === 'disabled') {
        return {
          ...base,
          valid: false,
          reason: 'scheduling_disabled',
          message: 'Viewing scheduling is turned off for this business.',
        };
      }

      if (!inputData.propertyId) {
        return { ...base, valid: true };
      }

      const listing = await provider.getById(inputData.propertyId);
      if (!listing) {
        return {
          ...base,
          valid: false,
          reason: 'not_found',
          message: `No listing with id ${inputData.propertyId}.`,
        };
      }

      return { ...base, valid: true, propertyId: listing.id, propertyTitle: listing.title };
    },
  });

  const recordRequest = createStep({
    id: 'record-viewing-request',
    inputSchema: validatedSchema,
    outputSchema,
    execute: async ({ inputData, requestContext }) => {
      const base = { preferredTime: inputData.preferredTime, property: inputData.propertyTitle };

      if (!inputData.valid) {
        return {
          ...base,
          ok: false,
          status: 'rejected',
          reason: inputData.reason,
          message: `${inputData.message ?? 'The request could not be recorded.'} Offer a human handoff.`,
        };
      }

      const phone = customerPhone({ requestContext });
      if (!phone || !viewingStorageAvailable()) {
        return {
          ...base,
          ok: false,
          status: 'not_recorded',
          reason: 'storage_unavailable',
          message:
            'The request could not be recorded. Do not confirm an appointment; offer a human handoff.',
        };
      }

      const request = await createViewingRequest({
        phone,
        propertyId: inputData.propertyId,
        propertyTitle: inputData.propertyTitle,
        preferredTime: inputData.preferredTime,
        notes: inputData.notes,
      });

      if (!request) {
        return {
          ...base,
          ok: false,
          status: 'not_recorded',
          reason: 'storage_unavailable',
          message:
            'The request could not be recorded. Do not confirm an appointment; offer a human handoff.',
        };
      }

      if (memoryStorageAvailable()) {
        await saveMemory(
          phone,
          'appointment',
          `Requested a viewing (${request.reference}) for ${request.property_title ?? 'an unspecified property'} at ${request.preferred_time}.`,
        );
      }

      return {
        ...base,
        ok: true,
        status: request.status,
        reference: request.reference,
        message: `Request ${request.reference} recorded. Tell the customer a human agent will confirm the time; it is not booked yet.`,
      };
    },
  });

  return createWorkflow({
    id: 'viewing-booking',
    description:
      'Validate a property, record a viewing request for human confirmation, and remember it for later conversations',
    inputSchema,
    outputSchema,
  })
    .then(validateRequest)
    .then(recordRequest)
    .commit();
}
