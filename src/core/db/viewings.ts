import { withSupabase, isSupabaseConfigured } from './supabase.js';
import { normalizePhone } from '../lib/phone.js';

export type ViewingStatus = 'requested' | 'confirmed' | 'cancelled';

export interface ViewingRequest {
  reference: string;
  phone_number: string;
  property_id?: string | null;
  property_title?: string | null;
  preferred_time: string;
  status: ViewingStatus;
  notes?: string | null;
  created_at?: string;
}

const SELECT_COLUMNS =
  'reference, phone_number, property_id, property_title, preferred_time, status, notes, created_at';

function newReference(): string {
  return `VW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createViewingRequest(input: {
  phone: string;
  propertyId?: string;
  propertyTitle?: string;
  preferredTime: string;
  notes?: string;
}): Promise<ViewingRequest | null> {
  const canonical = normalizePhone(input.phone);
  const reference = newReference();

  return withSupabase(
    'createViewingRequest',
    async (db) => {
      const { data, error } = await db
        .from('viewing_requests')
        .insert({
          reference,
          phone_number: canonical,
          property_id: input.propertyId ?? null,
          property_title: input.propertyTitle ?? null,
          preferred_time: input.preferredTime,
          notes: input.notes ?? null,
          status: 'requested',
        })
        .select(SELECT_COLUMNS)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as ViewingRequest | null) ?? null;
    },
    null,
  );
}

export async function listViewingRequests(phone: string): Promise<ViewingRequest[]> {
  const canonical = normalizePhone(phone);
  return withSupabase(
    'listViewingRequests',
    async (db) => {
      const { data, error } = await db
        .from('viewing_requests')
        .select(SELECT_COLUMNS)
        .eq('phone_number', canonical)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return (data as ViewingRequest[] | null) ?? [];
    },
    [],
  );
}

export async function cancelViewingRequest(
  phone: string,
  reference: string,
): Promise<ViewingRequest | null> {
  const canonical = normalizePhone(phone);
  return withSupabase(
    'cancelViewingRequest',
    async (db) => {
      const { data, error } = await db
        .from('viewing_requests')
        .update({ status: 'cancelled' })
        .eq('phone_number', canonical)
        .eq('reference', reference.toUpperCase())
        .select(SELECT_COLUMNS)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as ViewingRequest | null) ?? null;
    },
    null,
  );
}

export function viewingStorageAvailable(): boolean {
  return isSupabaseConfigured();
}
