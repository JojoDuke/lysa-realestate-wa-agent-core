import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { env } from '../env.js';

dotenv.config();

const supabaseUrl = env('SUPABASE_URL');
const supabaseAnonKey = env('SUPABASE_ANON_KEY');

/** Null when unset — Studio / local demos work without Supabase. */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabase) {
  console.warn('⚠️  Supabase credentials not set — user persistence disabled (Studio/local OK).');
}
