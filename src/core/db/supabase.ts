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
