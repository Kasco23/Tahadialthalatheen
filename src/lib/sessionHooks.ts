import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface SessionData {
  session_id: string;
  session_code: string | null;
  phase: string;
  game_state: string;
  host_password: string;
  created_at: string | null;
  ended_at: string | null;
}

interface UseSessionReturn {
  session: SessionData | null;
  loading: boolean;
  error: string | null;
}

export const useSession = (sessionId: string | null): UseSessionReturn => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Subscribe to session changes
    const subscribeToSession = () => {
      const channel = supabase
        .channel(`session_${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Session',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('Session update:', payload);

            if (!isMounted) return;

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setSession(payload.new as SessionData);
              setError(null);
            } else if (payload.eventType === 'DELETE') {
              setSession(null);
            }
          }
        )
        .subscribe((status) => {
          console.log('Session subscription status:', status);

          if (!isMounted) return;

          if (status === 'SUBSCRIBED') {
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            setError('Failed to subscribe to session updates');
          } else if (status === 'TIMED_OUT') {
            setError('Session subscription timed out');
          }
        });

      return channel;
    };

    // Load initial session data
    const loadInitialSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('Session')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No rows returned
            setError('Session not found');
          } else {
            console.error('Error loading session:', fetchError);
            setError('Failed to load session data');
          }
          setSession(null);
        } else {
          if (isMounted) {
            setSession(data);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Error in loadInitialSession:', err);
        if (isMounted) {
          setError('An unexpected error occurred');
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initialize
    loadInitialSession();
    const channel = subscribeToSession();

    // Cleanup function
    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [sessionId]);

  return {
    session,
    loading,
    error
  };
};
