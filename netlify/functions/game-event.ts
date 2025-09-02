import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import {
  getAuthContext,
  verifySessionHost,
  verifySessionPlayer,
} from './_auth';
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  validateMethod,
} from './_utils';

/**
 * GAME EVENT HANDLER
 *
 * This endpoint handles game events with proper authentication and authorization:
 * - Host verification for restricted events (room creation, phase changes)
 * - Player verification for game participation events
 * - Enhanced security with RLS policy enforcement
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

const gameEventHandler = async (
  event: HandlerEvent,
  _context: HandlerContext,
) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Only allow POST requests for event recording
  if (!validateMethod(event.httpMethod, ['POST'])) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  // Validate environment configuration
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return createErrorResponse(
      'Database not configured',
      'MISSING_DATABASE_CONFIG',
      500,
    );
  }

  try {
    // Get authentication context
    const authContext = await getAuthContext(event);

    const requestData = parseRequestBody<GameEventRequest>(event.body);
    if (!requestData) {
      return createErrorResponse(
        'Invalid JSON in request body',
        'INVALID_JSON',
      );
    }

    // Validate request data
    if (!requestData.gameId || !requestData.eventType) {
      return createErrorResponse(
        'Missing required fields: gameId and eventType',
        'INVALID_REQUEST',
      );
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
        return createErrorResponse(
          'Authentication required for this event type',
          'AUTHENTICATION_REQUIRED',
          401,
        );
      }

      // Verify host permissions for restricted events
      const isHost = await verifySessionHost(
        authContext.supabase,
        requestData.gameId,
        authContext.userId || '',
      );
      if (!isHost) {
        return createErrorResponse(
          'Only the session host can perform this action',
          'INSUFFICIENT_PERMISSIONS',
          403,
        );
      }
    }

    // For player-specific events, verify player access
    if (requestData.playerId && authContext.isAuthenticated) {
      const isPlayer = await verifySessionPlayer(
        authContext.supabase,
        requestData.gameId,
        authContext.userId || '',
      );
      if (!isPlayer) {
        return createErrorResponse(
          'Player not authorized for this session',
          'PLAYER_NOT_IN_SESSION',
          403,
        );
      }
    }

    // Verify session exists using authenticated client
    const { data: sessionData, error: sessionError } =
      await authContext.supabase
        .from('sessions')
        .select('session_id, phase, video_room_created')
        .eq('session_id', requestData.gameId)
        .single();

    if (sessionError || !sessionData) {
      return createErrorResponse('Session not found', 'SESSION_NOT_FOUND', 404);
    }

    // Insert session event using authenticated client
    const { data: eventData, error: eventError } = await authContext.supabase
      .from('session_events')
      .insert({
        session_id: requestData.gameId,
        event_type: requestData.eventType,
        payload: requestData.eventData || {},
        created_at: requestData.timestamp || new Date().toISOString(),
      })
      .select('event_id')
      .single();

    if (eventError || !eventData) {
      return createErrorResponse(
        'Failed to create session event',
        'DATABASE_ERROR',
        500,
        eventError?.message,
      );
    }

    // Get current player count
    const { count: playerCount } = await authContext.supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', requestData.gameId);

    // Prepare response with current session state
    const response: GameEventResponse = {
      success: true,
      eventId: eventData.event_id.toString(),
      gameState: {
        id: sessionData.session_id,
        phase: sessionData.phase,
        playerCount: playerCount || 0,
        videoRoomCreated: sessionData.video_room_created,
      },
    };

    // Handle specific event types that might trigger additional actions
    switch (requestData.eventType) {
      case 'video_room_created': {
        // Update session record to mark video room as created
        await authContext.supabase
          .from('sessions')
          .update({
            video_room_created: true,
            video_room_url: requestData.eventData.room_url as string,
          })
          .eq('session_id', requestData.gameId);
        break;
      }

      case 'video_room_deleted': {
        // Update session record to mark video room as deleted
        await authContext.supabase
          .from('sessions')
          .update({
            video_room_created: false,
            video_room_url: null,
          })
          .eq('session_id', requestData.gameId);
        break;
      }

      case 'phase_changed': {
        // Update session phase
        const newPhase = requestData.eventData.to as string;
        await authContext.supabase
          .from('sessions')
          .update({
            phase: newPhase,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', requestData.gameId);

        if (response.gameState) {
          response.gameState.phase = newPhase;
        }
        break;
      }

      case 'quiz_started': {
        // Mark quiz start time
        await authContext.supabase
          .from('sessions')
          .update({
            current_segment: requestData.eventData.segment as string,
            phase: 'QUIZ',
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', requestData.gameId);
        break;
      }

      case 'quiz_ended': {
        // Mark quiz end time
        await authContext.supabase
          .from('sessions')
          .update({
            phase: 'RESULTS',
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', requestData.gameId);
        break;
      }

      case 'score_updated': {
        // Update player score
        if (requestData.playerId && requestData.eventData.new_score) {
          await authContext.supabase
            .from('players')
            .update({
              score: requestData.eventData.new_score as number,
              last_active: new Date().toISOString(),
            })
            .eq('player_id', requestData.playerId)
            .eq('session_id', requestData.gameId);
        }
        break;
      }
    }

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Game event handler error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      'INTERNAL_ERROR',
      500,
    );
  }
};

export default gameEventHandler;
