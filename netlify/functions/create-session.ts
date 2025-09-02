import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext, requireAuth } from './_auth';
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  validateMethod,
} from './_utils';

interface CreateSessionRequest {
  sessionId: string;
  hostCode: string;
  hostName?: string;
  segmentSettings?: Record<string, number>;
}

interface SessionData {
  sessionId: string;
  hostCode: string;
  hostId: string;
  hostName: string | null;
  phase: string;
  status: string;
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
    // Get authentication context - session creation requires authentication
    const authContext = await getAuthContext(event);
    requireAuth(authContext);

    // Parse request body
    const requestData = parseRequestBody<CreateSessionRequest>(event.body);
    if (!requestData) {
      return createErrorResponse(
        'Invalid JSON in request body',
        'INVALID_JSON',
      );
    }

    // Validate required fields
    if (!requestData.sessionId || !requestData.hostCode) {
      return createErrorResponse(
        'Missing required fields: sessionId and hostCode',
        'MISSING_FIELDS',
      );
    }

    // Create the session
    const { data: sessionData, error: createError } = await authContext.supabase
      .from('sessions')
      .insert({
        session_id: requestData.sessionId,
        host_code: requestData.hostCode,
        host_name: requestData.hostName || null,
        host_id: authContext.userId,
        phase: 'CONFIG',
        status: 'waiting',
        last_activity: new Date().toISOString(),
        segment_settings: requestData.segmentSettings || {
          AUCT: 8,
          BELL: 12,
          REMO: 5,
          SING: 6,
          WSHA: 10,
        },
      })
      .select('session_id, host_code, host_id, host_name, phase, status')
      .single();

    if (createError) {
      console.error('Error creating session:', createError);

      // Handle unique constraint violation
      if (createError.code === '23505') {
        return createErrorResponse(
          'Session ID already exists',
          'SESSION_EXISTS',
          409,
        );
      }

      return createErrorResponse(
        'Failed to create session',
        'CREATE_FAILED',
        500,
        createError.message,
      );
    }

    // Log the session creation event
    await authContext.supabase.from('session_events').insert({
      session_id: requestData.sessionId,
      event_type: 'session_created',
      payload: {
        host_id: authContext.userId,
        host_name: requestData.hostName,
        segment_settings: requestData.segmentSettings,
      },
    });

    const response: SessionData = {
      sessionId: sessionData.session_id,
      hostCode: sessionData.host_code,
      hostId: sessionData.host_id || authContext.userId,
      hostName: sessionData.host_name,
      phase: sessionData.phase,
      status: sessionData.status,
    };

    return createSuccessResponse(response, 201);
  } catch (error) {
    console.error('Create session handler error:', error);

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse(
        'Authentication required to create sessions',
        'AUTH_REQUIRED',
        401,
      );
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      'INTERNAL_ERROR',
      500,
    );
  }
};

export default handler;
