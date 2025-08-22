import type { Handler } from '@netlify/functions';

/**
 * Get Daily.co room presence information to check if room is active
 * and has participants. Used for filtering active games.
 */
export const handler: Handler = async (event) => {
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

  // Allow both GET and POST requests
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

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
    let roomName: string;

    // Extract room name from request
    if (event.httpMethod === 'GET') {
      roomName = event.queryStringParameters?.roomName || '';
    } else {
      const requestBody = JSON.parse(event.body || '{}');
      roomName = requestBody.roomName || '';
    }

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

    // Get room presence from Daily.co API
    const presenceResponse = await fetch(
      `https://api.daily.co/v1/rooms/${roomName}/presence`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // If room doesn't exist, return not active
    if (presenceResponse.status === 404) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          roomName,
          exists: false,
          active: false,
          participantCount: 0,
          participants: [],
        }),
      };
    }

    if (!presenceResponse.ok) {
      const errorText = await presenceResponse.text();
      console.error('Daily.co presence API error:', {
        status: presenceResponse.status,
        error: errorText,
        roomName,
      });

      return {
        statusCode:
          presenceResponse.status >= 500 ? 502 : presenceResponse.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to get room presence',
          code: 'DAILY_API_ERROR',
          status: presenceResponse.status,
        }),
      };
    }

    const presenceData = await presenceResponse.json();

    // Calculate if room is active (has participants or recent activity)
    const participants = presenceData.participants || [];
    const participantCount = participants.length;
    const isActive = participantCount > 0;

    // Also get basic room info to check if it exists and is valid
    const roomResponse = await fetch(
      `https://api.daily.co/v1/rooms/${roomName}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    let roomInfo = null;
    if (roomResponse.ok) {
      roomInfo = await roomResponse.json();
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        roomName,
        exists: true,
        active: isActive,
        participantCount,
        participants: participants.map(
          (p: {
            user_id?: string;
            user_name?: string;
            joined_at?: string;
            will_eject_at?: string;
          }) => ({
            user_id: p.user_id,
            user_name: p.user_name,
            joined_at: p.joined_at,
            will_eject_at: p.will_eject_at,
          }),
        ),
        roomInfo: roomInfo
          ? {
              name: roomInfo.name,
              url: roomInfo.url,
              created_at: roomInfo.created_at,
              config: roomInfo.config,
            }
          : null,
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
