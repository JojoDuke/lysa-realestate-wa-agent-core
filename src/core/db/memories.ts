import { withSupabase, isSupabaseConfigured } from './supabase.js';
import { normalizePhone } from '../lib/phone.js';

export type MemoryKind = 'preference' | 'requirement' | 'interaction' | 'appointment';

export interface CustomerMemory {
  id?: string;
  phone_number: string;
  kind: MemoryKind;
  content: string;
  created_at?: string;
}

/**
 * Payment card, government ID, and credential material must never be persisted as
 * long-term memory, regardless of what the model decides to store.
 */
const SENSITIVE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'card or account number', pattern: /\b(?:\d[ -]?){13,19}\b/ },
  { label: 'credential', pattern: /\b(password|passcode|pin code|otp|one[- ]time code|api key)\b/i },
  { label: 'government identifier', pattern: /\b(ssn|social security|passport (no|number)|rodné číslo)\b/i },
];

export function findSensitiveContent(content: string): string | null {
  return SENSITIVE_PATTERNS.find(({ pattern }) => pattern.test(content))?.label ?? null;
}

export async function saveMemory(
  phone: string,
  kind: MemoryKind,
  content: string,
): Promise<CustomerMemory | null> {
  const canonical = normalizePhone(phone);
  return withSupabase(
    'saveMemory',
    async (db) => {
      const { data, error } = await db
        .from('customer_memories')
        .insert({ phone_number: canonical, kind, content })
        .select('id, phone_number, kind, content, created_at')
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as CustomerMemory | null) ?? null;
    },
    null,
  );
}

export async function listMemories(phone: string, limit = 20): Promise<CustomerMemory[]> {
  const canonical = normalizePhone(phone);
  return withSupabase(
    'listMemories',
    async (db) => {
      const { data, error } = await db
        .from('customer_memories')
        .select('id, phone_number, kind, content, created_at')
        .eq('phone_number', canonical)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data as CustomerMemory[] | null) ?? [];
    },
    [],
  );
}

export async function searchMemories(
  phone: string,
  query: string,
  limit = 10,
): Promise<CustomerMemory[]> {
  const all = await listMemories(phone, 100);
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);
  if (terms.length === 0) return all.slice(0, limit);

  return all
    .map((memory) => ({
      memory,
      hits: terms.filter((term) => memory.content.toLowerCase().includes(term)).length,
    }))
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map(({ memory }) => memory);
}

export function memoryStorageAvailable(): boolean {
  return isSupabaseConfigured();
}
