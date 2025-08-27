import type { HandlerContext, HandlerEvent } from '@netlify/functions';
const { withSentry, createApiResponse } = require('./_sentry.js');

// Import Supabase for database check
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Function to check if video room is already being created
async function checkVideoRoomStatus(
  gameId: string,
): Promise<{ alreadyCreated: boolean; roomUrl?: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('Supabase not configured, skipping database check');
    return { alreadyCreated: false };
  }

  try {
    // Use dynamic import to load Supabase only when needed
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('games')
      .select('video_room_created, video_room_url')
      .eq('id', gameId)
      .single();

    if (error) {
      console.error('Database check error:', error);
      return { alreadyCreated: false };
    }

    if (data?.video_room_created && data?.video_room_url) {
      console.log(
        'Video room already exists for game:',
        gameId,
        'URL:',
        data.video_room_url,
      );
      return { alreadyCreated: true, roomUrl: data.video_room_url };
    }

    return { alreadyCreated: false };
  } catch (error) {
    console.error('Error checking video room status:', error);
    return { alreadyCreated: false };
  }
}

// Enhanced Daily.co room creation with comprehensive error handling and validation
const createDailyRoomHandler = async (
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
        'Access-Control-Max-Age': '86400', // 24 hours
      },
      body: '',
    };
  }

  // Only allow POST requests for actual function execution
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
  if (!process.env.DAILY_API_KEY) {
    console.error('DAILY_API_KEY environment variable is missing');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Daily API key not configured',
        code: 'MISSING_API_KEY',
      }),
    };
  }

  try {
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
        }),
      };
    }

    const { roomName, properties = {} } = requestBody;

    // Validate required parameters
    if (!roomName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Room name is required',
          code: 'MISSING_ROOM_NAME',
        }),
      };
    }

    // Validate parameter types and constraints
    if (typeof roomName !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Room name must be a string',
          code: 'INVALID_ROOM_NAME_TYPE',
        }),
      };
    }

    // Validate room name format for session IDs
    if (roomName.length > 200) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Room name too long (max 200 characters)',
          code: 'ROOM_NAME_TOO_LONG',
        }),
      };
    }

    // Use the session ID directly as room name (no sanitization to preserve session ID)
    // Session IDs should already be safe for Daily.co room names
    const roomNameForDaily = roomName.trim();

    // Check if room is already created in database to prevent duplicates
    console.log('Checking database for existing video room:', roomNameForDaily);
    const roomStatus = await checkVideoRoomStatus(roomNameForDaily);

    if (roomStatus.alreadyCreated && roomStatus.roomUrl) {
      console.log('Room already exists in database, returning existing URL');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST',
        } as Record<string, string>,
        body: JSON.stringify({
          roomName: roomNameForDaily,
          url: roomStatus.roomUrl,
          created: new Date().toISOString(),
          config: {},
          note: 'Room already existed in database',
        }),
      };
    }

    // Prepare room configuration with safe defaults and extended expiry
    const roomConfig = {
      name: roomNameForDaily,
      properties: {
        max_participants: Math.min(
          Math.max(Number(properties.max_participants) || 10, 2),
          50,
        ),
        enable_screenshare: Boolean(properties.enable_screenshare ?? true),
        enable_chat: Boolean(properties.enable_chat ?? true),
        start_video_off: Boolean(properties.start_video_off ?? false),
        start_audio_off: Boolean(properties.start_audio_off ?? false),
        enable_recording: Boolean(properties.enable_recording ?? false),
        enable_knocking: Boolean(properties.enable_knocking ?? true), // Enable waiting room
        exp: Math.round(Date.now() / 1000) + 150 * 60, // Room expires in 150 minutes (2.5 hours)
        eject_at_room_exp: true, // Automatically eject participants when room expires
        ...properties,
      },
    };

    console.log('Creating Daily.co room:', {
      original: roomName,
      roomNameForDaily: roomNameForDaily,
      properties: roomConfig.properties,
    });

    // Create room using Daily.co API with enhanced error handling
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomConfig),
    });

    // Enhanced response handling
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      console.error('Daily.co room API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        request: roomConfig,
      });

      // Map common Daily.co errors to user-friendly messages
      const errorMessage = (() => {
        if (response.status === 401) return 'Invalid Daily.co API key';
        if (response.status === 403) return 'Access denied to Daily.co API';
        if (response.status === 409)
          return 'Room already exists with this name';
        if (response.status === 429) return 'Too many requests to Daily.co API';
        if (errorData?.info?.includes('invalid property'))
          return `Invalid property: ${errorData.info}`;
        if (errorData?.error === 'invalid-request-error')
          return `Invalid request: ${errorData.info || 'check room configuration'}`;
        return `Daily.co API error: ${errorData?.error || errorText || response.statusText}`;
      })();

      return {
        statusCode: response.status >= 500 ? 502 : response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: errorMessage,
          code: 'DAILY_API_ERROR',
          status: response.status,
          details: errorData,
        }),
      };
    }

    const room = await response.json();

    if (!room.url || !room.name) {
      console.error('Daily.co API returned incomplete room data:', room);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Daily.co API returned incomplete room data',
          code: 'INCOMPLETE_ROOM_DATA',
        }),
      };
    }

    // Use custom domain if configured, otherwise use the default URL from Daily.co
    let finalUrl = room.url;
    const customDomain = process.env.DAILY_DOMAIN;
    if (customDomain && customDomain.trim() !== '') {
      // Replace the default daily.co domain with the custom domain
      // Example: https://daily.co/room-name -> https://thirty.daily.co/room-name
      const roomName = room.name;
      finalUrl = `https://${customDomain.trim()}/${roomName}`;
      console.log('Using custom Daily.co domain:', {
        original: room.url,
        custom: finalUrl,
        domain: customDomain.trim(),
      });
    }

    console.log('Successfully created Daily.co room:', {
      name: room.name,
      url: finalUrl,
      created: room.created_at,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      } as Record<string, string>,
      body: JSON.stringify({
        roomName: room.name,
        url: finalUrl,
        created: room.created_at,
        config: room.config || {},
        expires: roomConfig.properties.exp,
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return createApiResponse(500, {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Export with Sentry monitoring
export const handler = withSentry('create-daily-room', createDailyRoomHandler);
