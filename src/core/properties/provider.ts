import type { AppConfig } from '../config/types.js';
import type {
  PropertyListing,
  PropertyMatch,
  PropertyProvider,
  PropertySearchFilters,
} from './types.js';

const UNAVAILABLE_STATUSES = new Set(['sold', 'let', 'withdrawn']);

function isAvailable(listing: PropertyListing): boolean {
  return !UNAVAILABLE_STATUSES.has(listing.status ?? 'available');
}

function scoreListing(
  listing: PropertyListing,
  filters: PropertySearchFilters,
): PropertyMatch | null {
  const matched: string[] = [];
  const missed: string[] = [];

  if (filters.listingType) {
    if (listing.listingType !== filters.listingType) return null;
    matched.push('listingType');
  }

  if (filters.propertyType) {
    const wanted = filters.propertyType.toLowerCase();
    if (listing.propertyType.toLowerCase().includes(wanted)) matched.push('propertyType');
    else missed.push('propertyType');
  }

  if (filters.area) {
    const wanted = filters.area.toLowerCase();
    if (listing.area.toLowerCase().includes(wanted)) matched.push('area');
    else missed.push('area');
  }

  if (typeof filters.minBedrooms === 'number') {
    if ((listing.bedrooms ?? 0) >= filters.minBedrooms) matched.push('bedrooms');
    else missed.push('bedrooms');
  }

  if (typeof filters.maxPrice === 'number') {
    if (listing.price <= filters.maxPrice) matched.push('maxPrice');
    else missed.push('maxPrice');
  }

  if (typeof filters.minPrice === 'number') {
    if (listing.price >= filters.minPrice) matched.push('minPrice');
    else missed.push('minPrice');
  }

  if (filters.keywords) {
    const haystack = [listing.title, listing.description, ...(listing.features ?? [])]
      .join(' ')
      .toLowerCase();
    const hits = filters.keywords
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && haystack.includes(word));
    if (hits.length > 0) matched.push('keywords');
    else missed.push('keywords');
  }

  const considered = matched.length + missed.length;
  const score = considered === 0 ? 1 : matched.length / considered;

  return { listing, score, matched, missed };
}

/** Reads listings straight from `config/app.json`. Replace with a feed adapter when one exists. */
export function createConfigPropertyProvider(config: AppConfig): PropertyProvider {
  const listings = config.properties?.listings ?? [];

  return {
    source: 'config',
    isConfigured: () => listings.length > 0,
    async search(filters) {
      return listings
        .filter(isAvailable)
        .map((listing) => scoreListing(listing, filters))
        .filter((match): match is PropertyMatch => match !== null && match.score > 0)
        .sort((a, b) => b.score - a.score);
    },
    async getById(id) {
      return listings.find((listing) => listing.id === id) ?? null;
    },
  };
}

export function createPropertyProvider(config: AppConfig): PropertyProvider {
  return createConfigPropertyProvider(config);
}
