import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext } from './_auth.js';
import { withSentry } from './_sentry.js';

interface DailyRoomInfo {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: {
    start_video_off?: boolean;
    start_audio_off?: boolean;
    max_participants?: number;
    enable_screenshare?: boolean;
    enable_chat?: boolean;
    enable_recording?: boolean;
  };
}

interface GameDatabaseInfo {
  id: string;
  host_code: string;
  host_name: string | null;
  phase: string;
  video_room_created: boolean;
  video_room_url: string | null;
  created_at: string;
  updated_at: string;
}

// Daily.co integration diagnostics and analytics
const dailyDiagnosticsHandler = async (
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Allow GET and POST requests
  if (!['GET', 'POST'].includes(event.httpMethod || '')) {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get authentication context for database access
  const authContext = await getAuthContext(event);

  // Check environment configuration
  const diagnostics = {
    environment: {
      daily_api_key_configured: !!process.env.DAILY_API_KEY,
      daily_api_key_length: process.env.DAILY_API_KEY?.length || 0,
      supabase_url_configured: !!process.env.SUPABASE_URL,
      supabase_anon_key_configured: !!process.env.SUPABASE_ANON_KEY,
    },
    timestamp: new Date().toISOString(),
  };

  if (!process.env.DAILY_API_KEY) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ...diagnostics,
        error: 'Daily API key not configured',
        status: 'misconfigured',
      }),
    };
  }

  try {
    // Test Daily.co API connectivity
    const dailyHealthResponse = await fetch(
      'https://api.daily.co/v1/rooms?limit=1',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const dailyHealthStatus = {
      status: dailyHealthResponse.status,
      ok: dailyHealthResponse.ok,
      accessible: dailyHealthResponse.status < 500,
    };

    let roomsData: DailyRoomInfo[] = [];
    if (dailyHealthResponse.ok) {
      const data = await dailyHealthResponse.json();
      roomsData = data.data || [];
    }

    // Test Supabase connectivity using authenticated context
    let supabaseHealthStatus = { accessible: false, game_count: 0 };
    let gamesData: GameDatabaseInfo[] = [];

    try {
      const { data, error } = await authContext.supabase
        .from('games')
        .select(
          'id, host_code, host_name, phase, video_room_created, video_room_url, created_at, updated_at',
        )
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase query error:', error);
        supabaseHealthStatus = { accessible: false, game_count: 0 };
      } else {
        gamesData = data || [];
        supabaseHealthStatus = {
          accessible: true,
          game_count: gamesData.length,
        };
      }
    } catch (error) {
      console.error('Supabase connection error:', error);
      supabaseHealthStatus = { accessible: false, game_count: 0 };
    }

    // Analyze data consistency
    const analysis = {
      daily_rooms_count: roomsData.length,
      games_with_video_rooms: gamesData.filter((g) => g.video_room_created)
        .length,
      games_without_video_rooms: gamesData.filter((g) => !g.video_room_created)
        .length,
      orphaned_rooms: roomsData.filter(
        (room) =>
          !gamesData.some((game) => game.video_room_url?.includes(room.name)),
      ).length,
      missing_daily_rooms: gamesData.filter(
        (game) =>
          game.video_room_created &&
          game.video_room_url &&
          !roomsData.some((room) => game.video_room_url?.includes(room.name)),
      ).length,
    };

    // For POST requests, provide detailed game-specific analysis
    if (event.httpMethod === 'POST') {
      const { gameId } = JSON.parse(event.body || '{}');

      if (gameId) {
        const gameData = gamesData.find((g) => g.id === gameId);
        const roomData = roomsData.find((r) => r.name === gameId);

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            ...diagnostics,
            daily_health: dailyHealthStatus,
            supabase_health: supabaseHealthStatus,
            game_analysis: {
              game_id: gameId,
              game_exists_in_db: !!gameData,
              room_exists_in_daily: !!roomData,
              video_room_created_flag: gameData?.video_room_created || false,
              video_room_url: gameData?.video_room_url || null,
              game_phase: gameData?.phase || 'unknown',
              consistency_status:
                gameData?.video_room_created && roomData
                  ? 'consistent'
                  : gameData?.video_room_created && !roomData
                    ? 'missing_daily_room'
                    : !gameData?.video_room_created && roomData
                      ? 'orphaned_daily_room'
                      : 'no_video_room',
            },
            status: 'detailed_analysis',
          }),
        };
      }
    }

    // General health report
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ...diagnostics,
        daily_health: dailyHealthStatus,
        supabase_health: supabaseHealthStatus,
        integration_analysis: analysis,
        recent_games: gamesData.slice(0, 5).map((g) => ({
          id: g.id,
          phase: g.phase,
          video_room_created: g.video_room_created,
          has_video_url: !!g.video_room_url,
          created_at: g.created_at,
        })),
        recent_daily_rooms: roomsData.slice(0, 5).map((r) => ({
          name: r.name,
          url: r.url,
          created_at: r.created_at,
          max_participants: r.config.max_participants,
        })),
        status: 'healthy',
      }),
    };
  } catch (error) {
    console.error('Diagnostics error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ...diagnostics,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      }),
    };
  }
};

// Export with Sentry monitoring
export const handler = withSentry('daily-diagnostics', dailyDiagnosticsHandler);
