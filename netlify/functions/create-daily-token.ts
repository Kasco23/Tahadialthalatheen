import type { Context, Config } from "@netlify/functions";

export default async (req: Request, _context: Context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { room_name, user_name } = await req.json();

    if (!room_name || !user_name) {
      return new Response(JSON.stringify({ error: 'room_name and user_name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if DAILY_API_KEY is available
    if (!process.env.DAILY_API_KEY) {
      console.error('DAILY_API_KEY environment variable is not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create meeting token using Daily.co API
    const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          room_name: room_name,
          user_name: user_name,
          is_owner: false,
          enable_recording: false,
          start_video_off: false,
          start_audio_off: false
        }
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Daily.co API error:', errorData);
      return new Response(JSON.stringify({
        error: 'Failed to create meeting token',
        details: errorData
      }), {
        status: tokenResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tokenData = await tokenResponse.json();

    return new Response(JSON.stringify(tokenData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating Daily token:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/create-daily-token"
};
