/**
 * A wrapper around fetch that injects the Supabase anon key and
 * an Accept header by default, and throws on non‑OK responses.
 */
export async function useSupabaseFetch<T = unknown>(
  url: string,
  init: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  // Build a proper Headers instance
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  // Inject the anon API key unless skipAuth is true
  if (!init.skipAuth) {
    headers.set('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY);
  }

  // Perform the request
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    // Grab and throw the response text on error
    throw new Error(await response.text());
  }

  // Parse JSON
  return response.json() as Promise<T>;
}
