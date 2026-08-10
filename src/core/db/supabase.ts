import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { env } from '../env.js';

dotenv.config();

const supabaseUrl = env('SUPABASE_URL');
const supabaseAnonKey = env('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not set — user, lead, memory, and viewing storage disabled.');
}

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/** Created on first use so the app still boots without Supabase credentials. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}

/**
 * Persistence is optional in this template, so a missing or failing database must
 * degrade into a handoff rather than breaking the conversation.
 */
export async function withSupabase<T>(
  operation: string,
  run: (db: SupabaseClient) => Promise<T>,
  fallback: T,
): Promise<T> {
  const db = getSupabase();
  if (!db) return fallback;
  try {
    return await run(db);
  } catch (error) {
    console.error(`❌ Supabase ${operation} failed:`, error);
    return fallback;
  }
}
