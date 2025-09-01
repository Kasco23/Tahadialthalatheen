import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext, verifySessionHost, verifySessionPlayer } from './_auth';
// Auth monitoring removed

/**
 * SECURE GAME EVENT HANDLER - Authentication-enabled version
 *
 * This endpoint handles game events with proper authentication and authorization:
 * - Host verification for res  } catch (error) {
    console.error('Game event handler error:', error);

    captureAuthError(error as Error, {
      functionName: 'game-event',
      context: 'Function execution failed',
      request: event,
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
    };
  }
};ns (room creation, phase changes)
 * - Player verification for game participation events
 * - Enhanced security with RLS policy enforcement
 * - Comprehensive monitoring and error tracking
 */

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

// Enhanced game event tracking and analytics endpoint
const gameEventHandler = async (
  event: HandlerEvent,
  _context: HandlerContext,
) => {
  // Early diagnostic logging (masked)
  if (process.env.NETLIFY_DEV) {
    const anon = process.env.SUPABASE_ANON_KEY;
    const maskedAnon = anon
      ? anon.slice(0, 6) + '...' + anon.slice(-4)
      : 'missing';
    console.log('[game-event] env check', {
      hasUrl: !!process.env.SUPABASE_URL,
      anonPreview: maskedAnon,
      hasDaily: !!process.env.DAILY_API_KEY,
    });
  }
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

  // Validate environment configuration
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Database not configured',
        code: 'MISSING_DATABASE_CONFIG',
      }),
    };
  }

  try {
    // Get authentication context (optional for some read operations)
    const authContext = await getAuthContext(event);
    trackAuthEvent('auth_context_created', {
      functionName: 'game-event',
      isAuthenticated: authContext.isAuthenticated,
      userId: authContext.userId,
    });

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

    // Check authorization for restricted event types
    const restrictedEvents = [
      'video_room_created',
      'video_room_deleted',
      'phase_changed',
      'quiz_started',
      'quiz_ended',
    ];

    if (restrictedEvents.includes(requestData.eventType)) {
      if (!authContext.isAuthenticated) {
        trackSecurityEvent('unauthorized_host_access', {
          functionName: 'game-event',
          gameId: requestData.gameId,
          attemptedAction: requestData.eventType,
          reason: 'not_authenticated',
        });

        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Authentication required for this event type',
            code: 'AUTHENTICATION_REQUIRED',
            eventType: requestData.eventType,
          }),
        };
      }

      // Verify host permissions for restricted events
      const isHost = await verifyGameHost(
        authContext.supabase,
        requestData.gameId,
        authContext.userId || '',
      );
      if (!isHost) {
        trackSecurityEvent('unauthorized_host_access', {
          functionName: 'game-event',
          userId: authContext.userId,
          gameId: requestData.gameId,
          attemptedAction: requestData.eventType,
          reason: 'not_host',
        });

        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Only the game host can perform this action',
            code: 'INSUFFICIENT_PERMISSIONS',
            eventType: requestData.eventType,
          }),
        };
      }

      trackSecurityEvent('permission_granted', {
        functionName: 'game-event',
        userId: authContext.userId,
        gameId: requestData.gameId,
        attemptedAction: requestData.eventType,
      });
    }

    // For player-specific events, verify player access
    if (requestData.playerId && authContext.isAuthenticated) {
      const isPlayer = await verifyGamePlayer(
        authContext.supabase,
        requestData.gameId,
        authContext.userId || '',
      );
      if (!isPlayer) {
        trackSecurityEvent('unauthorized_player_access', {
          functionName: 'game-event',
          userId: authContext.userId,
          gameId: requestData.gameId,
          attemptedAction: requestData.eventType,
          reason: 'not_in_game',
        });

        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Player not authorized for this game',
            code: 'PLAYER_NOT_IN_GAME',
          }),
        };
      }
    }

    // Verify game exists using authenticated client
    const { data: gameData, error: gameError } = await authContext.supabase
      .from('games')
      .select('id, phase, video_room_created')
      .eq('id', requestData.gameId)
      .single();

    if (gameError || !gameData) {
      trackDatabaseOperation('read', 'games', {
        functionName: 'game-event',
        authContext,
        recordId: requestData.gameId,
        success: false,
        error: gameError?.message || 'Game not found',
      });

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

    trackDatabaseOperation('read', 'games', {
      functionName: 'game-event',
      authContext,
      recordId: requestData.gameId,
      success: true,
    });

    // Insert game event using authenticated client
    const { data: eventData, error: eventError } = await authContext.supabase
      .from('game_events')
      .insert({
        game_id: requestData.gameId,
        event_type: requestData.eventType,
        event_data: requestData.eventData || {},
        player_id: requestData.playerId || null,
        created_at: requestData.timestamp || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (eventError || !eventData) {
      trackDatabaseOperation('write', 'game_events', {
        functionName: 'game-event',
        authContext,
        success: false,
        error: eventError?.message || 'Failed to create event',
      });

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to create game event',
          code: 'DATABASE_ERROR',
          details: eventError?.message,
        }),
      };
    }

    trackDatabaseOperation('write', 'game_events', {
      functionName: 'game-event',
      authContext,
      recordId: eventData.id,
      success: true,
    });

    // Get current player count
    const { count: playerCount } = await authContext.supabase
      .from('players')
      .select('id', { count: 'exact' })
      .eq('game_id', requestData.gameId);

    // Prepare response with current game state
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

    // Handle specific event types that might trigger additional actions
    switch (requestData.eventType) {
      case 'video_room_created': {
        // Update game record to mark video room as created
        const { error: videoCreateError } = await authContext.supabase
          .from('games')
          .update({
            video_room_created: true,
            video_room_url: requestData.eventData.room_url as string,
          })
          .eq('id', requestData.gameId);

        if (videoCreateError) {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: false,
            error: videoCreateError.message,
          });
        } else {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: true,
          });
        }
        break;
      }

      case 'video_room_deleted': {
        // Update game record to mark video room as deleted
        const { error: videoDeleteError } = await authContext.supabase
          .from('games')
          .update({
            video_room_created: false,
            video_room_url: null,
          })
          .eq('id', requestData.gameId);

        if (videoDeleteError) {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: false,
            error: videoDeleteError.message,
          });
        } else {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: true,
          });
        }
        break;
      }

      case 'phase_changed': {
        // Update game phase
        const newPhase = requestData.eventData.to as string;
        const { error: phaseError } = await authContext.supabase
          .from('games')
          .update({ phase: newPhase })
          .eq('id', requestData.gameId);

        if (phaseError) {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: false,
            error: phaseError.message,
          });
        } else {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: true,
          });
        }

        if (response.gameState) {
          response.gameState.phase = newPhase;
        }
        break;
      }

      case 'quiz_started': {
        // Mark quiz start time
        const { error: startError } = await authContext.supabase
          .from('games')
          .update({
            start_time: new Date().toISOString(),
            current_segment: requestData.eventData.segment as string,
            phase: 'QUIZ',
          })
          .eq('id', requestData.gameId);

        if (startError) {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: false,
            error: startError.message,
          });
        } else {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: true,
          });
        }
        break;
      }

      case 'quiz_ended': {
        // Mark quiz end time
        const { error: endError } = await authContext.supabase
          .from('games')
          .update({
            end_time: new Date().toISOString(),
            phase: 'RESULTS',
          })
          .eq('id', requestData.gameId);

        if (endError) {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: false,
            error: endError.message,
          });
        } else {
          trackDatabaseOperation('write', 'games', {
            functionName: 'game-event',
            authContext,
            recordId: requestData.gameId,
            success: true,
          });
        }
        break;
      }

      case 'score_updated': {
        // Update player score
        if (requestData.playerId && requestData.eventData.new_score) {
          const { error: scoreError } = await authContext.supabase
            .from('players')
            .update({ score: requestData.eventData.new_score as number })
            .eq('id', requestData.playerId)
            .eq('game_id', requestData.gameId);

          if (scoreError) {
            trackDatabaseOperation('write', 'players', {
              functionName: 'game-event',
              authContext,
              recordId: requestData.playerId,
              success: false,
              error: scoreError.message,
            });
          } else {
            trackDatabaseOperation('write', 'players', {
              functionName: 'game-event',
              authContext,
              recordId: requestData.playerId,
              success: true,
            });
          }
        }
        break;
      }
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
const handler = gameEventHandler;

export default handler;
