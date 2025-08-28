import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext, requireAuth, verifyGameHost, verifyGamePlayer } from './_auth.js';
import { withSentry } from './_sentry.js';

interface GameEventRequest {
  gameId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  playerId?: string;
  timestamp?: string;
}

interface GameEventResponse {
  success: boolean;
  eventId?: string;
  error?: string;
  gameState?: {
    id: string;
    phase: string;
    playerCount: number;
    videoRoomCreated: boolean;
  };
}

// Enhanced game event tracking and analytics endpoint with authentication
const gameEventHandler = async (
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
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Only allow POST requests for event recording
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
    // Get authentication context
    const authContext = await getAuthContext(event);

    const requestData: GameEventRequest = JSON.parse(event.body || '{}');

    // Validate request data
    if (!requestData.gameId || !requestData.eventType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required fields: gameId and eventType',
          code: 'INVALID_REQUEST',
        }),
      };
    }

    // Verify game exists and get basic info
    const { data: gameData, error: gameError } = await authContext.supabase
      .from('games')
      .select('id, phase, video_room_created, host_id')
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
          gameId: requestData.gameId,
        }),
      };
    }

    // Check authorization based on event type
    const isRestrictedEvent = [
      'phase_changed',
      'quiz_started',
      'quiz_ended',
      'game_settings_updated',
      'video_room_created'
    ].includes(requestData.eventType);

    if (isRestrictedEvent) {
      // These events require authentication and host ownership
      requireAuth(authContext);

      const isHost = await verifyGameHost(authContext.supabase, requestData.gameId, authContext.userId);
      if (!isHost) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Only the game host can perform this action',
            code: 'HOST_ONLY_ACTION',
          }),
        };
      }
    } else if (requestData.eventType === 'score_updated' && requestData.playerId) {
      // Score updates require authentication and player verification
      requireAuth(authContext);

      const isPlayer = await verifyGamePlayer(authContext.supabase, requestData.gameId, authContext.userId);
      if (!isPlayer) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Only players in the game can update scores',
            code: 'PLAYER_ONLY_ACTION',
          }),
        };
      }
    }

    // Insert game event (now using authenticated client for proper RLS)
    const { data: eventData, error: eventError } = await authContext.supabase
      .from('game_events')
      .insert({
        game_id: requestData.gameId,
        event_type: requestData.eventType,
        event_data: requestData.eventData || {},
        created_at: requestData.timestamp || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (eventError) {
      console.error('Error inserting game event:', eventError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to record game event',
          code: 'EVENT_INSERTION_FAILED',
          details: eventError.message,
        }),
      };
    }

    // Get player count for response
    const { count: playerCount } = await authContext.supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', requestData.gameId);

    const response: GameEventResponse = {
      success: true,
      eventId: eventData.id,
      gameState: {
        id: gameData.id,
        phase: gameData.phase,
        playerCount: playerCount || 0,
        videoRoomCreated: gameData.video_room_created,
      },
    };

    // Handle special event types with database updates
    switch (requestData.eventType) {
      case 'phase_changed': {
        // Update game phase (host-only action, already verified)
        const newPhase = requestData.eventData.to as string;
        await authContext.supabase
          .from('games')
          .update({
            phase: newPhase,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestData.gameId);

        if (response.gameState) {
          response.gameState.phase = newPhase;
        }
        break;
      }

      case 'quiz_started':
        // Mark quiz start time (host-only action)
        await authContext.supabase
          .from('games')
          .update({
            current_segment: requestData.eventData.segment as string,
            phase: 'QUIZ',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestData.gameId);
        break;

      case 'quiz_ended':
        // Mark quiz end (host-only action)
        await authContext.supabase
          .from('games')
          .update({
            phase: 'RESULTS',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestData.gameId);
        break;

      case 'score_updated':
        // Update player score (player-only action, already verified)
        if (requestData.playerId && requestData.eventData.new_score) {
          await authContext.supabase
            .from('players')
            .update({
              score: requestData.eventData.new_score as number,
              last_active: new Date().toISOString()
            })
            .eq('id', requestData.playerId)
            .eq('game_id', requestData.gameId)
            .eq('user_id', authContext.userId); // Additional security check
        }
        break;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Game event handler error:', error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message === 'Authentication required') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
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
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
    };
  }
};

// Export with Sentry monitoring
export const handler = withSentry('game-event-secure', gameEventHandler);
