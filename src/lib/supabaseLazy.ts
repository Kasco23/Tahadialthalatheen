/**
 * Lazy loading wrapper for Supabase SDK to reduce initial bundle size
 */

// Type-only imports for better tree-shaking
import type {
  SupabaseClient,
  RealtimeChannel,
  PostgrestResponse,
} from '@supabase/supabase-js';

// Cache the dynamic import promise and client instance
let supabaseImportPromise: Promise<
  typeof import('@supabase/supabase-js')
> | null = null;
let supabaseClient: SupabaseClient | null = null;

// Environment variables
const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env as {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  console.error(
    'Supabase env vars VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing.',
  );
}

// Fallback values to avoid runtime crashes
const supabaseUrl = VITE_SUPABASE_URL ?? 'https://example.supabase.co';
const supabaseKey = VITE_SUPABASE_ANON_KEY ?? 'example-key-placeholder';

/**
 * Lazy load the Supabase SDK only when needed
 */
async function loadSupabase(): Promise<typeof import('@supabase/supabase-js')> {
  if (!supabaseImportPromise) {
    supabaseImportPromise = import('@supabase/supabase-js');
  }
  return supabaseImportPromise;
}

/**
 * Get or create the lazy-loaded Supabase client
 */
export async function getSupabase(): Promise<SupabaseClient> {
  if (!supabaseClient) {
    const { createClient } = await loadSupabase();
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

/**
 * Returns true if real Supabase credentials appear to be present
 */
export function isSupabaseConfigured(): boolean {
  return (
    VITE_SUPABASE_URL !== undefined &&
    VITE_SUPABASE_ANON_KEY !== undefined &&
    VITE_SUPABASE_URL !== 'https://example.supabase.co' &&
    VITE_SUPABASE_ANON_KEY !== 'example-key-placeholder'
  );
}

/**
 * Returns a user-friendly error message for configuration issues.
 */
export function getConfigurationError(): string | null {
  if (isSupabaseConfigured()) return null;

  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    return 'متغيرات البيئة مفقودة: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY';
  }

  return 'إعدادات قاعدة البيانات غير صحيحة - تعمل في وضع التطوير';
}

/**
 * Create a Supabase channel with lazy loading
 */
export async function createChannel(
  name: string,
  config?: Parameters<SupabaseClient['channel']>[1],
): Promise<RealtimeChannel> {
  const supabase = await getSupabase();
  return supabase.channel(name, config);
}

/**
 * Execute a database query with lazy loading
 */
export async function executeQuery<T>(
  queryFn: (supabase: SupabaseClient) => Promise<PostgrestResponse<T>>,
): Promise<PostgrestResponse<T>> {
  const supabase = await getSupabase();
  return queryFn(supabase);
}

// Re-export common types for convenience
export type { SupabaseClient, RealtimeChannel, PostgrestResponse };
