/**
 * Lightweight preference store for Conversation Memory agent demos.
 * In-memory by default (Studio / local). Swap for Supabase later per customer.
 */

export interface CustomerPreferences {
  resourceId: string;
  name?: string;
  intent?: 'buyer' | 'seller' | 'renter' | 'landlord' | 'tenant' | 'other';
  budget?: string;
  preferredArea?: string;
  propertyType?: string;
  bedrooms?: number;
  timeline?: string;
  notes?: string;
  updatedAt: string;
}

const store = new Map<string, CustomerPreferences>();

export function getPreferences(resourceId: string): CustomerPreferences | null {
  return store.get(resourceId) ?? null;
}

export function savePreferences(
  resourceId: string,
  patch: Partial<Omit<CustomerPreferences, 'resourceId' | 'updatedAt'>>,
): CustomerPreferences {
  const prev = store.get(resourceId);
  const next: CustomerPreferences = {
    ...prev,
    ...patch,
    resourceId,
    updatedAt: new Date().toISOString(),
  };
  store.set(resourceId, next);
  return next;
}
