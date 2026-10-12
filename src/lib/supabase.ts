import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://njsrkejwprowjfknyfbz.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_RgyudKP5HKPh4--Nk_ZQCQ_FjYZFjrT';

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_KEY
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
