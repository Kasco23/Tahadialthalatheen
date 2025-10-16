import { createClient } from "@supabase/supabase-js";

// optional but nice for intellisense and ref safety
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_DATABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,           // keeps user logged in after refresh
    autoRefreshToken: true,         // silently refreshes expiring tokens
    detectSessionInUrl: true,       // allows magic link redirects if you ever use them
  },
});
