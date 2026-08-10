import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { env } from '../env.js';

dotenv.config();

const supabaseUrl = env('SUPABASE_URL');
const supabaseAnonKey = env('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not set — user persistence disabled.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Persistence is optional in this template, so a missing or failing database must
 * degrade into a handoff rather than breaking the conversation.
 */
export async function withSupabase<T>(
  operation: string,
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await run();
  } catch (error) {
    console.error(`❌ Supabase ${operation} failed:`, error);
    return fallback;
  }
}
