import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These are public client-side values — security is enforced by Supabase RLS policies, not by hiding them.
// Override via VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY env vars if needed.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xmlgrdytoolipnqumwvy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbGdyZHl0b29saXBucXVtd3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTU3NzMsImV4cCI6MjA4OTA5MTc3M30.BMe9qN_8JYM8S0AVJudpw8beRl4_w2eXsqTt6BuhIv8';

// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});