import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext, requireAuth } from './_auth.js';
import { withSentry } from './_sentry.js';

interface CreateGameRequest {
  gameId: string;
  hostCode: string;
  hostName?: string;
  segmentSettings?: Record<string, number>;
}

interface CreateGameResponse {
  success: boolean;
  game?: {
    id: string;
    hostCode: string;
    hostId: string;
    phase: string;
    status: string;
  };
  error?: string;
}

// Create a new authenticated game
const createGameHandler = async (
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
    // Get authentication context - authentication is REQUIRED for game creation
    const authContext = await getAuthContext(event);
    requireAuth(authContext);

    const requestData: CreateGameRequest = JSON.parse(event.body || '{}');

    // Validate request data
    if (!requestData.gameId || !requestData.hostCode) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required fields: gameId and hostCode',
          code: 'INVALID_REQUEST',
        }),
      };
    }

    // Create the game using authenticated Supabase client
    const { data: gameData, error: createError } = await authContext.supabase
      .from('games')
      .insert({
        id: requestData.gameId,
        host_code: requestData.hostCode,
        host_name: requestData.hostName || null,
        host_id: authContext.userId, // Set the authenticated user as host
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
      .select('id, host_code, host_id, phase, status')
      .single();

    if (createError) {
      console.error('Error creating game:', createError);

      // Handle specific error cases
      if (createError.code === '23505') {
        // Unique constraint violation
        return {
          statusCode: 409,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Game ID already exists',
            code: 'GAME_EXISTS',
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
          error: 'Failed to create game',
          code: 'CREATE_FAILED',
          details: createError.message,
        }),
      };
    }

    // Log the game creation event
    await authContext.supabase.from('game_events').insert({
      game_id: requestData.gameId,
      event_type: 'game_created',
      event_data: {
        host_id: authContext.userId,
        host_name: requestData.hostName,
        segment_settings: requestData.segmentSettings,
      },
    });

    const response: CreateGameResponse = {
      success: true,
      game: {
        id: gameData.id,
        hostCode: gameData.host_code,
        hostId: gameData.host_id || authContext.userId,
        phase: gameData.phase,
        status: gameData.status,
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
    console.error('Create game handler error:', error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message === 'Authentication required') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Authentication required to create games',
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
export const handler = withSentry('create-game', createGameHandler);
