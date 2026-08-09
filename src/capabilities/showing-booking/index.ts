import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../core/config/types.js';
import type { CapabilityModule } from '../types.js';

/** In-memory bookings for Studio demos — replace with calendar/CRM per customer. */
const bookings = new Map<string, { slotId: string; name?: string; propertyId?: string; createdAt: string }>();

export const showingBookingCapability: CapabilityModule = {
  id: 'showing_booking',
  promptExtension: `
## Showing booking
Only offer slots returned by tools. Never invent availability or confirm without requestShowing.
`,
  getTools: (config: AppConfig) => ({
    checkShowingAvailability: createTool({
      id: 'check-showing-availability',
      description: 'List available showing slots from the configured calendar feed',
      inputSchema: z.object({
        propertyId: z.string().optional(),
      }),
      execute: async (input) => {
        const slots = (config.showingSlots ?? []).filter((s) => {
          if (bookings.has(s.id)) return false;
          if (input.propertyId && s.propertyId && s.propertyId !== input.propertyId) return false;
          return true;
        });

        if (slots.length === 0) {
          return {
            available: false,
            message: 'No open slots in the demo calendar. Offer human handoff.',
            slots: [],
          };
        }

        return {
          available: true,
          timezone: config.locale.timezone,
          slots: slots.map((s) => ({
            id: s.id,
            start: s.start,
            label: s.label,
            propertyId: s.propertyId,
          })),
        };
      },
    }),

    requestShowing: createTool({
      id: 'request-showing',
      description: 'Book a showing slot for a prospect (demo calendar)',
      inputSchema: z.object({
        slotId: z.string(),
        name: z.string().optional(),
        propertyId: z.string().optional(),
        notes: z.string().optional(),
      }),
      execute: async (input) => {
        const slot = (config.showingSlots ?? []).find((s) => s.id === input.slotId);
        if (!slot) {
          return { booked: false, message: `Unknown slot ${input.slotId}` };
        }
        if (bookings.has(slot.id)) {
          return { booked: false, message: 'That slot was just taken. Check availability again.' };
        }

        const record = {
          slotId: slot.id,
          name: input.name,
          propertyId: input.propertyId ?? slot.propertyId,
          createdAt: new Date().toISOString(),
        };
        bookings.set(slot.id, record);

        return {
          booked: true,
          confirmation: {
            ...record,
            label: slot.label,
            start: slot.start,
            timezone: config.locale.timezone,
            notes: input.notes,
          },
          message: `Showing reserved: ${slot.label} (${slot.start}).`,
        };
      },
    }),
  }),
};
