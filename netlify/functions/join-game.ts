import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext } from './_auth.js';
import { withSentry } from './_sentry.js';

interface JoinGameRequest {
  sessionId: string;
  playerId: string;
  playerName: string;
  flag?: string;
  club?: string;
  role?: string;
}

interface JoinGameResponse {
  success: boolean;
  player?: {
    id: string;
    sessionId: string;
    name: string;
    userId?: string;
    isAuthenticated: boolean;
  };
  error?: string;
}

// Join a session as a player (supports both authenticated and anonymous users)
const joinGameHandler = async (
  event: HandlerEvent,
  _context: HandlerContext,
) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get authentication context (optional for player joining)
    const authContext = await getAuthContext(event);

    const requestData: JoinGameRequest = JSON.parse(event.body || '{}');

    // Validate request data
    if (
      !requestData.sessionId ||
      !requestData.playerId ||
      !requestData.playerName
    ) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required fields: sessionId, playerId, and playerName',
          code: 'INVALID_REQUEST',
        }),
      };
    }

    // Verify the session exists and is joinable
    const { data: sessionData, error: sessionError } = await authContext.supabase
      .from('sessions')
      .select('session_id, phase, status')
      .eq('session_id', requestData.sessionId)
      .single();

    if (sessionError || !sessionData) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        }),
      };
    }

    // Check if session is in a joinable state
    if (sessionData.status === 'completed') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Game has already completed',
          code: 'GAME_COMPLETED',
        }),
      };
    }

    // Remove any existing player with this ID from other sessions (allow switching)
    await authContext.supabase
      .from('players')
      .delete()
      .eq('player_id', requestData.playerId);

    // Add the player to the session
    const { data: playerData, error: joinError } = await authContext.supabase
      .from('players')
      .insert({
        player_id: requestData.playerId,
        session_id: requestData.sessionId,
        name: requestData.playerName,
        flag: requestData.flag || null,
        club: requestData.club || null,
        role: requestData.role || 'playerA',
        user_id: authContext.isAuthenticated ? authContext.userId : null,
        is_host: false, // Players joining via this endpoint are not hosts
        is_connected: true,
      })
      .select('player_id, session_id, name, user_id')
      .single();

    if (joinError) {
      console.error('Error adding player to game:', joinError);

      // Handle specific error cases
      if (joinError.code === '23503') {
        // Foreign key violation
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Game not found',
            code: 'GAME_NOT_FOUND',
          }),
        };
      }

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to join session',
          code: 'JOIN_FAILED',
          details: joinError.message,
        }),
      };
    }

    // Log the player join event
    await authContext.supabase.from('session_events').insert({
      session_id: requestData.sessionId,
      event_type: 'player_joined',
      payload: {
        player_id: requestData.playerId,
        player_name: requestData.playerName,
        is_authenticated: authContext.isAuthenticated,
        user_id: authContext.userId || null,
      },
    });

    // Update session status to active if this is the first player
    const { count: playerCount } = await authContext.supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', requestData.sessionId);

    if (playerCount === 1 && sessionData.status === 'waiting') {
      await authContext.supabase
        .from('sessions')
        .update({
          status: 'active',
          last_activity: new Date().toISOString(),
        })
        .eq('session_id', requestData.sessionId);
    }

    const response: JoinGameResponse = {
      success: true,
      player: {
        id: playerData.player_id,
        sessionId: playerData.session_id,
        name: playerData.name,
        userId: playerData.user_id || undefined,
        isAuthenticated: authContext.isAuthenticated,
      },
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Join game handler error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
    };
  }
};

// Export with Sentry monitoring
export const handler = withSentry('join-game', joinGameHandler);
