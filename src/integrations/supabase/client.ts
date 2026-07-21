import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These are public client-side values — security is enforced by Supabase RLS policies, not by hiding them.
// Override via VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY env vars if needed.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xmlgrdytoolipnqumwvy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_a8TaOa2boEklePAGlT-ymA_Bkx_wi3O';

// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});