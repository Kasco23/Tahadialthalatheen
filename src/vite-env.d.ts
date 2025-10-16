/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_DATABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DAILY_DOMAIN: string;
  readonly VITE_ENABLE_DUMMY_USER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
