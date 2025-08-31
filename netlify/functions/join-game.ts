import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext } from './_auth.js';
import { withErrorHandling } from "./_utils.js";

interface JoinGameRequest {
  gameId: string;
  playerId: string;
  playerName: string;
  flag?: string;
  club?: string;
  role?: string;
  sessionId?: string;
}

interface JoinGameResponse {
  success: boolean;
  player?: {
    id: string;
    gameId: string;
    name: string;
    userId?: string;
    isAuthenticated: boolean;
  };
  error?: string;
}

// Join a game as a player (supports both authenticated and anonymous users)
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
      !requestData.gameId ||
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
          error: 'Missing required fields: gameId, playerId, and playerName',
          code: 'INVALID_REQUEST',
        }),
      };
    }

    // Verify the game exists and is joinable
    const { data: gameData, error: gameError } = await authContext.supabase
      .from('games')
      .select('id, phase, status')
      .eq('id', requestData.gameId)
      .single();

    if (gameError || !gameData) {
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

    // Check if game is in a joinable state
    if (gameData.status === 'completed') {
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

    // Remove any existing player with this ID from other games (allow switching)
    await authContext.supabase
      .from('players')
      .delete()
      .eq('id', requestData.playerId);

    // Add the player to the game
    const { data: playerData, error: joinError } = await authContext.supabase
      .from('players')
      .insert({
        id: requestData.playerId,
        game_id: requestData.gameId,
        name: requestData.playerName,
        flag: requestData.flag || null,
        club: requestData.club || null,
        role: requestData.role || 'playerA',
        user_id: authContext.isAuthenticated ? authContext.userId : null,
        is_host: false, // Players joining via this endpoint are not hosts
        session_id: requestData.sessionId || null,
        is_connected: true,
      })
      .select('id, game_id, name, user_id')
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
          error: 'Failed to join game',
          code: 'JOIN_FAILED',
          details: joinError.message,
        }),
      };
    }

    // Log the player join event
    await authContext.supabase.from('game_events').insert({
      game_id: requestData.gameId,
      event_type: 'player_joined',
      event_data: {
        player_id: requestData.playerId,
        player_name: requestData.playerName,
        is_authenticated: authContext.isAuthenticated,
        user_id: authContext.userId || null,
      },
    });

    // Update game status to active if this is the first player
    const { count: playerCount } = await authContext.supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', requestData.gameId);

    if (playerCount === 1 && gameData.status === 'waiting') {
      await authContext.supabase
        .from('games')
        .update({
          status: 'active',
          last_activity: new Date().toISOString(),
        })
        .eq('id', requestData.gameId);
    }

    const response: JoinGameResponse = {
      success: true,
      player: {
        id: playerData.id,
        gameId: playerData.game_id,
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

// Export with error handling
export const handler = withErrorHandling('join-game', joinGameHandler);
