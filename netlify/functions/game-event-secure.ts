import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import {
  getAuthContext,
  requireAuth,
  verifySessionHost,
  verifySessionPlayer,
} from './_auth';
import { 
  handleCors, 
  createSuccessResponse, 
  createErrorResponse, 
  parseRequestBody 
} from './_utils';

interface GameEventRequest {
  sessionId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  playerId?: string;
  timestamp?: string;
}

interface GameEventResponse {
  success: boolean;
  eventId?: string;
  error?: string;
  sessionState?: {
    id: string;
    phase: string;
    playerCount: number;
    videoRoomCreated: boolean;
  };
}

// Enhanced session event tracking and analytics endpoint with authentication
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
    if (!requestData.sessionId || !requestData.eventType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required fields: sessionId and eventType',
          code: 'INVALID_REQUEST',
        }),
      };
    }

    // Verify session exists and get basic info
    const { data: sessionData, error: sessionError } = await authContext.supabase
      .from('sessions')
      .select('session_id, phase, video_room_created, host_id')
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
          sessionId: requestData.sessionId,
        }),
      };
    }

    // Check authorization based on event type
    const isRestrictedEvent = [
      'phase_changed',
      'quiz_started',
      'quiz_ended',
      'game_settings_updated',
      'video_room_created',
    ].includes(requestData.eventType);

    if (isRestrictedEvent) {
      // These events require authentication and host ownership
      requireAuth(authContext);

      // Verify host permission for session
      const isHost = await verifySessionHost(
        authContext.supabase,
        data.sessionId,
        authContext.userId || '',
      );
      if (!isHost) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Only the session host can perform this action',
            code: 'HOST_ONLY_ACTION',
          }),
        };
      }
    } else if (
      requestData.eventType === 'score_updated' &&
      requestData.playerId
    ) {
      // Score updates require authentication and player verification
      requireAuth(authContext);

      const isPlayer = await verifyGamePlayer(
        authContext.supabase,
        requestData.sessionId,
        authContext.userId,
      );
      if (!isPlayer) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Only players in the session can update scores',
            code: 'PLAYER_ONLY_ACTION',
          }),
        };
      }
    }

    // Insert session event (now using authenticated client for proper RLS)
    const { data: eventData, error: eventError } = await authContext.supabase
      .from('session_events')
      .insert({
        session_id: requestData.sessionId,
        event_type: requestData.eventType,
        payload: requestData.eventData || {},
        created_at: requestData.timestamp || new Date().toISOString(),
      })
      .select('event_id')
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
          error: 'Failed to record session event',
          code: 'EVENT_INSERTION_FAILED',
          details: eventError.message,
        }),
      };
    }

    // Get player count for response
    const { count: playerCount } = await authContext.supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', requestData.sessionId);

    const response: GameEventResponse = {
      success: true,
      eventId: eventData.event_id,
      sessionState: {
        id: sessionData.session_id,
        phase: sessionData.phase,
        playerCount: playerCount || 0,
        videoRoomCreated: sessionData.video_room_created,
      },
    };

    // Handle special event types with database updates
    switch (requestData.eventType) {
      case 'phase_changed': {
        // Update session phase (host-only action, already verified)
        const newPhase = requestData.eventData.to as string;
        await authContext.supabase
          .from('sessions')
          .update({
            phase: newPhase,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', requestData.sessionId);

        if (response.sessionState) {
          response.sessionState.phase = newPhase;
        }
        break;
      }

      case 'quiz_started':
        // Mark quiz start time (host-only action)
        await authContext.supabase
          .from('sessions')
          .update({
            current_segment: requestData.eventData.segment as string,
            phase: 'QUIZ',
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', requestData.sessionId);
        break;

      case 'quiz_ended':
        // Mark quiz end (host-only action)
        await authContext.supabase
          .from('sessions')
          .update({
            phase: 'RESULTS',
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', requestData.sessionId);
        break;

      case 'score_updated':
        // Update player score (player-only action, already verified)
        if (requestData.playerId && requestData.eventData.new_score) {
          await authContext.supabase
            .from('players')
            .update({
              score: requestData.eventData.new_score as number,
              last_active: new Date().toISOString(),
            })
            .eq('player_id', requestData.playerId)
            .eq('session_id', requestData.sessionId)
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
    console.error('Session event handler error:', error);

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
const handler = gameEventHandler;

export default handler;
