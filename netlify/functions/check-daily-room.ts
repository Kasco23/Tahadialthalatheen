import { withSentry } from './_sentry.js';

const checkDailyRoomHandler = async (event, _context) => {
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

  if (!process.env.DAILY_API_KEY) {
    console.error('DAILY_API_KEY environment variable is missing');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Daily API key not configured' }),
    };
  }

  try {
    const { roomName } = JSON.parse(event.body || '{}');

    if (!roomName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Room name is required' }),
      };
    }

    // Check if room exists using Daily.co API
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          exists: false,
          roomName,
        }),
      };
    }

    if (!response.ok) {
      const error = await response.text();
      console.error('Daily.co API error:', error);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to check room status' }),
      };
    }

    const room = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        exists: true,
        roomName: room.name,
        url: room.url,
        created: room.created_at,
        config: room.config,
        participants: room.participants || [],
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Export with Sentry monitoring
export const handler = withSentry('check-daily-room', checkDailyRoomHandler);
