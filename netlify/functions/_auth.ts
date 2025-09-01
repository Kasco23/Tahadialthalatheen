import type { HandlerEvent } from '@netlify/functions';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Extract and validate user authentication from request headers
 */
export interface AuthContext {
  userId?: string;
  isAuthenticated: boolean;
  supabase: SupabaseClient;
}

export async function getAuthContext(
  event: HandlerEvent,
): Promise<AuthContext> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing');
  }

  // Extract Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
  );

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      // Verify the JWT token and get user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.warn('Invalid or expired auth token:', error?.message);
        return { isAuthenticated: false, supabase };
      }

      // Create authenticated client with the token
      const authenticatedSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        },
      );

      return {
        userId: user.id,
        isAuthenticated: true,
        supabase: authenticatedSupabase,
      };
    } catch (error) {
      console.warn('Auth token verification failed:', error);
      return { isAuthenticated: false, supabase };
    }
  }

  // No auth provided - return anonymous client
  return { isAuthenticated: false, supabase };
}

/**
 * Require authentication for protected endpoints
 */
export function requireAuth(
  authContext: AuthContext,
): asserts authContext is AuthContext & { userId: string } {
  if (!authContext.isAuthenticated || !authContext.userId) {
    throw new Error('Authentication required');
  }
}

/**
 * Check if user owns/hosts a specific session
 */
export async function verifyGameHost(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('sessions')
    .select('host_id')
    .eq('session_id', sessionId)
    .single();

  if (error || !data) {
    return false;
  }

  return (data as { host_id: string }).host_id === userId;
}

/**
 * Check if user is a player in a specific session
 */
export async function verifyGamePlayer(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('players')
    .select('user_id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}
