import { createClient } from '@supabase/supabase-js';

interface ImportMetaEnv {
  readonly VITE_SUPABASE_DATABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_DATABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
