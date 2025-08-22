import type { Handler } from '@netlify/functions';

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
export const handler: Handler = async (event) => {
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

    // Initialize Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );

    // Verify game exists
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('id, phase, video_room_created')
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

    // Insert game event
    const { data: eventData, error: eventError } = await supabase
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

    if (eventError) {
      console.error('Error inserting game event:', eventError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to record event',
          code: 'DATABASE_INSERT_ERROR',
          details: eventError.message,
        }),
      };
    }

    // Get current player count
    const { count: playerCount } = await supabase
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
      case 'video_room_created':
        // Update game record to mark video room as created
        await supabase
          .from('games')
          .update({
            video_room_created: true,
            video_room_url: requestData.eventData.room_url as string,
          })
          .eq('id', requestData.gameId);
        break;

      case 'video_room_deleted':
        // Update game record to mark video room as deleted
        await supabase
          .from('games')
          .update({
            video_room_created: false,
            video_room_url: null,
          })
          .eq('id', requestData.gameId);
        break;

      case 'phase_changed': {
        // Update game phase
        const newPhase = requestData.eventData.to as string;
        await supabase
          .from('games')
          .update({ phase: newPhase })
          .eq('id', requestData.gameId);

        if (response.gameState) {
          response.gameState.phase = newPhase;
        }
        break;
      }

      case 'quiz_started':
        // Mark quiz start time
        await supabase
          .from('games')
          .update({
            start_time: new Date().toISOString(),
            current_segment: requestData.eventData.segment as string,
            phase: 'QUIZ',
          })
          .eq('id', requestData.gameId);
        break;

      case 'quiz_ended':
        // Mark quiz end time
        await supabase
          .from('games')
          .update({
            end_time: new Date().toISOString(),
            phase: 'RESULTS',
          })
          .eq('id', requestData.gameId);
        break;

      case 'score_updated':
        // Update player score
        if (requestData.playerId && requestData.eventData.new_score) {
          await supabase
            .from('players')
            .update({ score: requestData.eventData.new_score as number })
            .eq('id', requestData.playerId)
            .eq('game_id', requestData.gameId);
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
