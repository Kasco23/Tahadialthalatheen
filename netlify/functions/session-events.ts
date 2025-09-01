import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import type { AuthContext } from './_auth';
import { getAuthContext, verifySessionHost, verifySessionPlayer } from './_auth';
import { 
  handleCors, 
  createSuccessResponse, 
  createErrorResponse, 
  parseRequestBody,
  validateMethod 
} from './_utils';

interface SessionEventRequest {
  sessionId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  playerId?: string;
  timestamp?: string;
}

interface SessionEventResponse {
  eventId: string;
  sessionState: {
    sessionId: string;
    phase: string;
    playerCount: number;
    videoRoomCreated: boolean;
  };
}

const handler = async (
  event: HandlerEvent,
  _context: HandlerContext,
) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Validate method
  if (!validateMethod(event.httpMethod, ['POST'])) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  try {
    // Get authentication context
    const authContext = await getAuthContext(event);

    // Parse request body
    const requestData = parseRequestBody<SessionEventRequest>(event.body);
    if (!requestData) {
      return createErrorResponse('Invalid JSON in request body', 'INVALID_JSON');
    }

    // Validate required fields
    if (!requestData.sessionId || !requestData.eventType) {
      return createErrorResponse(
        'Missing required fields: sessionId and eventType',
        'MISSING_FIELDS'
      );
    }

    // Verify session exists
    const { data: sessionData, error: sessionError } = await authContext.supabase
      .from('sessions')
      .select('session_id, phase, video_room_created, host_id')
      .eq('session_id', requestData.sessionId)
      .single();

    if (sessionError || !sessionData) {
      return createErrorResponse('Session not found', 'SESSION_NOT_FOUND', 404);
    }

    // Check authorization based on event type
    const hostOnlyEvents = [
      'phase_changed',
      'quiz_started', 
      'quiz_ended',
      'session_settings_updated',
      'video_room_created',
    ];

    if (hostOnlyEvents.includes(requestData.eventType)) {
      if (!authContext.isAuthenticated || !authContext.userId) {
        return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
      }

      const isHost = await verifySessionHost(
        authContext.supabase,
        requestData.sessionId,
        authContext.userId
      );
      
      if (!isHost) {
        return createErrorResponse(
          'Only the session host can perform this action',
          'HOST_ONLY_ACTION',
          403
        );
      }
    } else if (requestData.eventType === 'score_updated' && requestData.playerId) {
      if (!authContext.isAuthenticated || !authContext.userId) {
        return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
      }

      const isPlayer = await verifySessionPlayer(
        authContext.supabase,
        requestData.sessionId,
        authContext.userId
      );
      
      if (!isPlayer) {
        return createErrorResponse(
          'Only players in the session can update scores',
          'PLAYER_ONLY_ACTION',
          403
        );
      }
    }

    // Insert session event
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
      console.error('Error inserting session event:', eventError);
      return createErrorResponse(
        'Failed to record session event',
        'EVENT_INSERTION_FAILED',
        500,
        eventError.message
      );
    }

    // Handle specific event types
    switch (requestData.eventType) {
      case 'phase_changed': {
        const newPhase = requestData.eventData.to as string;
        await authContext.supabase
          .from('sessions')
          .update({
            phase: newPhase,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', requestData.sessionId);
        
        sessionData.phase = newPhase;
        break;
      }

      case 'quiz_started':
        await authContext.supabase
          .from('sessions')
          .update({
            current_segment: requestData.eventData.segment as string,
            phase: 'PLAYING',
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', requestData.sessionId);
        break;

      case 'quiz_ended':
        await authContext.supabase
          .from('sessions')
          .update({
            phase: 'COMPLETED',
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', requestData.sessionId);
        break;

      case 'score_updated':
        if (requestData.playerId && requestData.eventData.new_score) {
          await authContext.supabase
            .from('players')
            .update({
              score: requestData.eventData.new_score as number,
              last_active: new Date().toISOString(),
            })
            .eq('player_id', requestData.playerId)
            .eq('session_id', requestData.sessionId)
            .eq('user_id', authContext.userId);
        }
        break;
    }

    // Get updated player count
    const { count: playerCount } = await authContext.supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', requestData.sessionId);

    const response: SessionEventResponse = {
      eventId: eventData.event_id.toString(),
      sessionState: {
        sessionId: sessionData.session_id,
        phase: sessionData.phase,
        playerCount: playerCount || 0,
        videoRoomCreated: sessionData.video_room_created,
      },
    };

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Session event handler error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
};

export default handler;
