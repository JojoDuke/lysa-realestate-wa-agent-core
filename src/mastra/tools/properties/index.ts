import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../../core/config/types.js';
import { createPropertyProvider } from '../../../core/properties/provider.js';
import type { PropertyListing, PropertyMatch } from '../../../core/properties/types.js';

export const NOT_CONFIGURED = {
  ok: false as const,
  reason: 'catalogue_unavailable',
  message:
    'No property catalogue is connected, so no listings can be shown. Say that live listings are unavailable and offer to pass the requirements to a human agent.',
};

function present(match: PropertyMatch, currency: string) {
  return {
    id: match.listing.id,
    title: match.listing.title,
    propertyType: match.listing.propertyType,
    listingType: match.listing.listingType,
    area: match.listing.area,
    price: `${match.listing.price.toLocaleString()} ${currency}`,
    bedrooms: match.listing.bedrooms,
    bathrooms: match.listing.bathrooms,
    sizeSqm: match.listing.sizeSqm,
    status: match.listing.status ?? 'available',
    url: match.listing.url,
    unmetCriteria: match.missed,
  };
}

function presentListing(listing: PropertyListing, currency: string) {
  return {
    ...listing,
    price: `${listing.price.toLocaleString()} ${currency}`,
  };
}

export function buildPropertyTools(config: AppConfig) {
  const provider = createPropertyProvider(config);
  const currency = config.locale.currency;

  return {
    searchProperties: createTool({
      id: 'search-properties',
      description:
        'Search the connected property catalogue against a customer\u2019s requirements and return matching listings',
      inputSchema: z.object({
        listingType: z.enum(['sale', 'rent']).optional(),
        propertyType: z.string().optional().describe('Apartment, house, land, commercial, and so on'),
        area: z.string().optional().describe('Neighbourhood, city, or region'),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minBedrooms: z.number().optional(),
        keywords: z.string().optional().describe('Free-text extras such as "garden" or "parking"'),
        limit: z.number().optional().describe('Maximum listings to return, default 5'),
      }),
      execute: async (inputData) => {
        if (!provider.isConfigured()) return NOT_CONFIGURED;

        const { limit, ...filters } = inputData;
        const matches = await provider.search(filters);
        const top = matches.slice(0, limit ?? 5);

        return {
          ok: true as const,
          source: provider.source,
          totalMatches: matches.length,
          returned: top.length,
          listings: top.map((match) => present(match, currency)),
          message:
            top.length === 0
              ? 'Nothing in the catalogue matches these requirements. Suggest relaxing a criterion or offer a human handoff.'
              : undefined,
        };
      },
    }),

    getPropertyDetails: createTool({
      id: 'get-property-details',
      description: 'Get the full detail of one listing by its id',
      inputSchema: z.object({
        propertyId: z.string().describe('The listing id returned by searchProperties'),
      }),
      execute: async (inputData) => {
        if (!provider.isConfigured()) return NOT_CONFIGURED;

        const listing = await provider.getById(inputData.propertyId);
        if (!listing) {
          return {
            ok: false as const,
            reason: 'not_found',
            message: `No listing with id ${inputData.propertyId}. Do not describe a property that is not in the catalogue.`,
          };
        }

        return { ok: true as const, listing: presentListing(listing, currency) };
      },
    }),
  };
}
