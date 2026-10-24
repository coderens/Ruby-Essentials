import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabasePublishableKey || 'sb_publishable_not_configured',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
