import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../../core/config/types.js';
import {
  cancelViewingRequest,
  createViewingRequest,
  listViewingRequests,
  viewingStorageAvailable,
} from '../../../core/db/viewings.js';
import { createPropertyProvider } from '../../../core/properties/provider.js';
import { customerPhone, NO_CUSTOMER_RESULT } from '../context.js';

const DISABLED = {
  ok: false as const,
  reason: 'scheduling_disabled',
  message:
    'Viewing scheduling is turned off for this business. Offer to pass the request to a human agent instead.',
};

const STORAGE_UNAVAILABLE = {
  ok: false as const,
  reason: 'storage_unavailable',
  message:
    'Viewing requests cannot be recorded because storage is not configured. Do not confirm any appointment; offer a human handoff.',
};

export function buildSchedulingTools(config: AppConfig) {
  const mode = config.scheduling?.mode ?? 'request';
  const windows = config.scheduling?.availableWindows ?? [];
  const durationMinutes = config.scheduling?.viewingDurationMinutes ?? 30;
  const notes = config.scheduling?.notes;
  const provider = createPropertyProvider(config);

  return {
    checkViewingAvailability: createTool({
      id: 'check-viewing-availability',
      description:
        'Report which viewing windows this business can usually accommodate. This is not a live calendar lookup.',
      inputSchema: z.object({
        propertyId: z.string().optional().describe('Listing the customer asked about'),
      }),
      execute: async () => {
        if (mode === 'disabled') return DISABLED;

        return {
          ok: true as const,
          liveCalendar: false,
          durationMinutes,
          timezone: config.locale.timezone,
          usualWindows: windows,
          notes,
          message:
            'These are general windows, not confirmed slots. Ask the customer for a preferred time and record it as a request.',
        };
      },
    }),

    requestViewing: createTool({
      id: 'request-viewing',
      description:
        'Record a viewing request for a human agent to confirm. Never present the result as a confirmed appointment.',
      inputSchema: z.object({
        preferredTime: z
          .string()
          .describe('The customer\u2019s preferred day and time, in their own words'),
        propertyId: z.string().optional().describe('Listing id when the customer named one'),
        notes: z.string().optional().describe('Anything the agent should know before the viewing'),
      }),
      execute: async (inputData, context) => {
        if (mode === 'disabled') return DISABLED;
        const phone = customerPhone(context);
        if (!phone) return NO_CUSTOMER_RESULT;
        if (!viewingStorageAvailable()) return STORAGE_UNAVAILABLE;

        const listing = inputData.propertyId
          ? await provider.getById(inputData.propertyId)
          : null;

        if (inputData.propertyId && !listing) {
          return {
            ok: false as const,
            reason: 'not_found',
            message: `No listing with id ${inputData.propertyId}. Confirm which property the customer means before requesting a viewing.`,
          };
        }

        const request = await createViewingRequest({
          phone,
          propertyId: listing?.id,
          propertyTitle: listing?.title,
          preferredTime: inputData.preferredTime,
          notes: inputData.notes,
        });

        if (!request) return STORAGE_UNAVAILABLE;

        return {
          ok: true as const,
          status: request.status,
          reference: request.reference,
          property: request.property_title ?? null,
          preferredTime: request.preferred_time,
          message: `Request ${request.reference} was recorded. Tell the customer a human agent will confirm the time; it is not booked yet.`,
        };
      },
    }),

    listViewingRequests: createTool({
      id: 'list-viewing-requests',
      description: 'List the viewing requests already recorded for this customer',
      inputSchema: z.object({}),
      execute: async (_inputData, context) => {
        if (mode === 'disabled') return DISABLED;
        const phone = customerPhone(context);
        if (!phone) return NO_CUSTOMER_RESULT;
        if (!viewingStorageAvailable()) return STORAGE_UNAVAILABLE;

        const requests = await listViewingRequests(phone);
        return {
          ok: true as const,
          count: requests.length,
          requests: requests.map((request) => ({
            reference: request.reference,
            property: request.property_title,
            preferredTime: request.preferred_time,
            status: request.status,
          })),
        };
      },
    }),

    cancelViewing: createTool({
      id: 'cancel-viewing',
      description: 'Cancel a viewing request this customer previously made, using its reference',
      inputSchema: z.object({
        reference: z.string().describe('The reference returned when the request was recorded'),
      }),
      execute: async (inputData, context) => {
        if (mode === 'disabled') return DISABLED;
        const phone = customerPhone(context);
        if (!phone) return NO_CUSTOMER_RESULT;
        if (!viewingStorageAvailable()) return STORAGE_UNAVAILABLE;

        const cancelled = await cancelViewingRequest(phone, inputData.reference);
        if (!cancelled) {
          return {
            ok: false as const,
            reason: 'not_found',
            message: `No viewing request ${inputData.reference} for this customer.`,
          };
        }

        return { ok: true as const, reference: cancelled.reference, status: cancelled.status };
      },
    }),
  };
}
