export type ListingType = 'sale' | 'rent';

export type ListingStatus = 'available' | 'under_offer' | 'sold' | 'let' | 'withdrawn';

export interface PropertyListing {
  id: string;
  title: string;
  propertyType: string;
  listingType: ListingType;
  area: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  status?: ListingStatus;
  description?: string;
  features?: string[];
  url?: string;
}

export interface PropertySearchFilters {
  listingType?: ListingType;
  propertyType?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  keywords?: string;
}

export interface PropertyMatch {
  listing: PropertyListing;
  score: number;
  matched: string[];
  missed: string[];
}

/**
 * Provider-neutral listing source. The bundled implementation reads listings from
 * `config/app.json`; a customer fork swaps in an MLS, portal feed, or PMS adapter
 * without touching agents, tools, or workflows.
 */
export interface PropertyProvider {
  readonly source: string;
  isConfigured(): boolean;
  search(filters: PropertySearchFilters): Promise<PropertyMatch[]>;
  getById(id: string): Promise<PropertyListing | null>;
}
