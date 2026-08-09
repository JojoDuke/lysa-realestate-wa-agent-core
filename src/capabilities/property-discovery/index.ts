import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../core/config/types.js';
import type { CapabilityModule } from '../types.js';

export const propertyDiscoveryCapability: CapabilityModule = {
  id: 'property_discovery',
  promptExtension: `
## Property discovery
Search configured listings only. Never invent homes, prices, or availability.
`,
  getTools: (config: AppConfig) => ({
    searchListings: createTool({
      id: 'search-listings',
      description: 'Search the brokerage listing feed by area, budget, bedrooms, and property type',
      inputSchema: z.object({
        area: z.string().optional(),
        maxPrice: z.number().optional(),
        minBedrooms: z.number().optional(),
        propertyType: z.string().optional(),
        query: z.string().optional().describe('Free-text keywords'),
      }),
      execute: async (input) => {
        const listings = (config.listings ?? []).filter((l) => (l.status ?? 'available') === 'available');
        const q = (input.query ?? '').toLowerCase();
        const area = (input.area ?? '').toLowerCase();
        const type = (input.propertyType ?? '').toLowerCase();

        const matches = listings.filter((l) => {
          if (input.maxPrice != null && l.price > input.maxPrice) return false;
          if (input.minBedrooms != null && l.bedrooms < input.minBedrooms) return false;
          if (area && !l.area.toLowerCase().includes(area)) return false;
          if (type && !l.propertyType.toLowerCase().includes(type)) return false;
          if (
            q &&
            ![l.title, l.description, l.area, l.propertyType].join(' ').toLowerCase().includes(q) &&
            !q.split(/\s+/).some((w) => w.length > 2 && l.description.toLowerCase().includes(w))
          ) {
            return false;
          }
          return true;
        });

        if (matches.length === 0) {
          return {
            found: false,
            message: 'No matching listings in the configured feed. Offer to refine criteria or hand off.',
            results: [],
          };
        }

        return {
          found: true,
          count: matches.length,
          results: matches.slice(0, 5).map((l) => ({
            id: l.id,
            title: l.title,
            area: l.area,
            price: l.price,
            currency: config.locale.currency,
            bedrooms: l.bedrooms,
            bathrooms: l.bathrooms,
            propertyType: l.propertyType,
            description: l.description,
            imageUrl: l.imageUrl,
          })),
        };
      },
    }),
  }),
};
