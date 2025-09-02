import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext } from './_auth';
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  validateMethod,
} from './_utils';

interface JoinSessionRequest {
  sessionId: string;
  playerId: string;
  playerName: string;
  flag?: string;
  club?: string;
  role?: string;
}

interface PlayerData {
  playerId: string;
  sessionId: string;
  name: string;
  userId?: string;
  isAuthenticated: boolean;
}

const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Validate method
  if (!validateMethod(event.httpMethod, ['POST'])) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  try {
    // Get authentication context (optional for player joining)
    const authContext = await getAuthContext(event);

    // Parse request body
    const requestData = parseRequestBody<JoinSessionRequest>(event.body);
    if (!requestData) {
      return createErrorResponse(
        'Invalid JSON in request body',
        'INVALID_JSON',
      );
    }

    // Validate required fields
    if (
      !requestData.sessionId ||
      !requestData.playerId ||
      !requestData.playerName
    ) {
      return createErrorResponse(
        'Missing required fields: sessionId, playerId, and playerName',
        'MISSING_FIELDS',
      );
    }

    // Verify the session exists and is joinable
    const { data: sessionData, error: sessionError } =
      await authContext.supabase
        .from('sessions')
        .select('session_id, phase, status')
        .eq('session_id', requestData.sessionId)
        .single();

    if (sessionError || !sessionData) {
      return createErrorResponse('Session not found', 'SESSION_NOT_FOUND', 404);
    }

    // Check if session is in a joinable state
    if (sessionData.status === 'completed') {
      return createErrorResponse(
        'Session is already completed',
        'SESSION_COMPLETED',
        400,
      );
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
      console.error('Error adding player to session:', joinError);
      return createErrorResponse(
        'Failed to join session',
        'JOIN_FAILED',
        500,
        joinError.message,
      );
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

    const response: PlayerData = {
      playerId: playerData.player_id,
      sessionId: playerData.session_id,
      name: playerData.name,
      userId: playerData.user_id || undefined,
      isAuthenticated: authContext.isAuthenticated,
    };

    return createSuccessResponse(response, 201);
  } catch (error) {
    console.error('Join session handler error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      'INTERNAL_ERROR',
      500,
    );
  }
};

export default handler;
