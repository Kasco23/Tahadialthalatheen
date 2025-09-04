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
    const { session_id } = await req.json();

    if (!session_id) {
      return new Response(JSON.stringify({ error: 'session_id is required' }), {
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

    // Create room using Daily.co API
    const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: session_id,
        privacy: 'public',
        properties: {
          max_participants: 10,
          enable_recording: false,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false
        }
      })
    });

    if (!roomResponse.ok) {
      const errorData = await roomResponse.text();
      console.error('Daily.co API error:', errorData);
      return new Response(JSON.stringify({
        error: 'Failed to create room',
        details: errorData
      }), {
        status: roomResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const roomData = await roomResponse.json();

    // Return room URL and session ID
    const response = {
      room_url: roomData.url,
      session_id: session_id
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating Daily room:', error);
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
  path: "/create-daily-room"
};
