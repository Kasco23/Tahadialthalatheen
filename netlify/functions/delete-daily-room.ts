import type { Handler } from '@netlify/functions';

/**
 * Delete a Daily.co video room by name.
 * This is triggered via POST request with JSON body `{ roomName }`.
 */
export const handler: Handler = async (event) => {
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

    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Daily.co API delete error:', error);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to delete room' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
