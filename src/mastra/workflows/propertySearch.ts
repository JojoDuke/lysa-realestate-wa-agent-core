import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import type { AppConfig } from '../../core/config/types.js';
import { getLead } from '../../core/db/leads.js';
import { createPropertyProvider } from '../../core/properties/provider.js';
import type { PropertySearchFilters } from '../../core/properties/types.js';
import { customerPhone } from '../tools/context.js';

const filtersSchema = z.object({
  listingType: z.enum(['sale', 'rent']).optional(),
  propertyType: z.string().optional(),
  area: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minBedrooms: z.number().optional(),
  keywords: z.string().optional(),
});

const resolvedSchema = z.object({
  filters: filtersSchema,
  usedSavedRequirements: z.boolean(),
  limit: z.number(),
});

const resultSchema = z.object({
  ok: z.boolean(),
  reason: z.string().optional(),
  message: z.string().optional(),
  usedFilters: filtersSchema,
  usedSavedRequirements: z.boolean(),
  totalMatches: z.number(),
  listings: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      area: z.string(),
      price: z.string(),
      bedrooms: z.number().optional(),
      propertyType: z.string(),
      listingType: z.string(),
      url: z.string().optional(),
      unmetCriteria: z.array(z.string()),
    }),
  ),
});

const INTENT_TO_LISTING_TYPE: Record<string, 'sale' | 'rent'> = {
  buy: 'sale',
  rent: 'rent',
};

/**
 * Combine stored lead requirements with anything said in this turn, then search once.
 * Explicit filters always win over remembered ones.
 */
export function buildPropertySearchWorkflow(config: AppConfig) {
  const provider = createPropertyProvider(config);
  const currency = config.locale.currency;

  const resolveRequirements = createStep({
    id: 'resolve-requirements',
    inputSchema: z.object({
      filters: filtersSchema.optional(),
      useSavedRequirements: z.boolean().optional(),
      limit: z.number().optional(),
    }),
    outputSchema: resolvedSchema,
    execute: async ({ inputData, requestContext }) => {
      const explicit = inputData.filters ?? {};
      const limit = inputData.limit ?? 5;

      if (inputData.useSavedRequirements === false) {
        return { filters: explicit, usedSavedRequirements: false, limit };
      }

      const phone = customerPhone({ requestContext });
      const lead = phone ? await getLead(phone) : null;
      if (!lead) return { filters: explicit, usedSavedRequirements: false, limit };

      const saved: PropertySearchFilters = {
        listingType: lead.intent ? INTENT_TO_LISTING_TYPE[lead.intent] : undefined,
        propertyType: lead.property_type ?? undefined,
        area: lead.preferred_area ?? undefined,
        minPrice: lead.budget_min ?? undefined,
        maxPrice: lead.budget_max ?? undefined,
        minBedrooms: lead.bedrooms ?? undefined,
      };

      const merged = Object.fromEntries(
        Object.entries({ ...saved, ...explicit }).filter(([, value]) => value !== undefined),
      );

      return { filters: merged, usedSavedRequirements: true, limit };
    },
  });

  const runSearch = createStep({
    id: 'run-property-search',
    inputSchema: resolvedSchema,
    outputSchema: resultSchema,
    execute: async ({ inputData }) => {
      const base = {
        usedFilters: inputData.filters,
        usedSavedRequirements: inputData.usedSavedRequirements,
      };

      if (!provider.isConfigured()) {
        return {
          ...base,
          ok: false,
          reason: 'catalogue_unavailable',
          message:
            'No property catalogue is connected. Say that live listings are unavailable and offer to pass the requirements to a human agent.',
          totalMatches: 0,
          listings: [],
        };
      }

      const matches = await provider.search(inputData.filters);
      const top = matches.slice(0, inputData.limit);

      return {
        ...base,
        ok: true,
        totalMatches: matches.length,
        listings: top.map((match) => ({
          id: match.listing.id,
          title: match.listing.title,
          area: match.listing.area,
          price: `${match.listing.price.toLocaleString()} ${currency}`,
          bedrooms: match.listing.bedrooms,
          propertyType: match.listing.propertyType,
          listingType: match.listing.listingType,
          url: match.listing.url,
          unmetCriteria: match.missed,
        })),
        message:
          top.length === 0
            ? 'Nothing matches these requirements. Suggest relaxing one criterion.'
            : undefined,
      };
    },
  });

  return createWorkflow({
    id: 'property-search',
    description:
      'Search the property catalogue using the customer\u2019s stored requirements merged with anything new they said',
    inputSchema: z.object({
      filters: filtersSchema.optional(),
      useSavedRequirements: z.boolean().optional(),
      limit: z.number().optional(),
    }),
    outputSchema: resultSchema,
  })
    .then(resolveRequirements)
    .then(runSearch)
    .commit();
}
