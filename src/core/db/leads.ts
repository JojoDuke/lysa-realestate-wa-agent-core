import { supabase, withSupabase, isSupabaseConfigured } from './supabase.js';
import { updateUserContact } from './users.js';
import { normalizePhone } from '../lib/phone.js';

export type LeadIntent = 'buy' | 'sell' | 'rent' | 'let' | 'other';
export type LeadFinancing = 'cash' | 'mortgage_approved' | 'mortgage_needed' | 'unknown';
export type LeadStatus = 'new' | 'qualifying' | 'qualified' | 'handed_off';

export interface LeadProfile {
  phone_number: string;
  name?: string | null;
  email?: string | null;
  intent?: LeadIntent | null;
  property_type?: string | null;
  preferred_area?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  bedrooms?: number | null;
  timeline?: string | null;
  financing?: LeadFinancing | null;
  notes?: string | null;
  status?: LeadStatus | null;
  updated_at?: string | null;
}

export type LeadPatch = Omit<LeadProfile, 'phone_number' | 'updated_at'>;

/** Fields the Lead Qualification capability tries to collect before handoff. */
export const REQUIRED_LEAD_FIELDS = [
  'name',
  'intent',
  'property_type',
  'preferred_area',
  'timeline',
] as const;

const SELECT_COLUMNS =
  'phone_number, name, email, intent, property_type, preferred_area, budget_min, budget_max, bedrooms, timeline, financing, notes, status, updated_at';

export async function getLead(phone: string): Promise<LeadProfile | null> {
  const canonical = normalizePhone(phone);
  return withSupabase(
    'getLead',
    async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(SELECT_COLUMNS)
        .eq('phone_number', canonical)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as LeadProfile | null) ?? null;
    },
    null,
  );
}

export async function saveLead(phone: string, patch: LeadPatch): Promise<LeadProfile | null> {
  const canonical = normalizePhone(phone);
  const fields = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  if (Object.keys(fields).length === 0) return getLead(phone);

  // Contact details stay mirrored on `users` so the channel greeting keeps working.
  if (typeof fields.name === 'string' || typeof fields.email === 'string') {
    await updateUserContact(canonical, {
      ...(typeof fields.name === 'string' ? { name: fields.name } : {}),
      ...(typeof fields.email === 'string' ? { email: fields.email } : {}),
    });
  }

  return withSupabase(
    'saveLead',
    async () => {
      const { data, error } = await supabase
        .from('leads')
        .upsert({ phone_number: canonical, ...fields }, { onConflict: 'phone_number' })
        .select(SELECT_COLUMNS)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as LeadProfile | null) ?? null;
    },
    null,
  );
}

export function missingLeadFields(lead: LeadProfile | null): string[] {
  if (!lead) return [...REQUIRED_LEAD_FIELDS];
  return REQUIRED_LEAD_FIELDS.filter((field) => {
    const value = lead[field];
    return value === undefined || value === null || value === '';
  });
}

export function leadStorageAvailable(): boolean {
  return isSupabaseConfigured();
}
