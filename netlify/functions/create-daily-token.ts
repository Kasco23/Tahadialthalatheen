import type { Context } from "@netlify/functions";

/**
 * Netlify Function: Create Daily.co Meeting Token
 *
 * Creates a Daily.co meeting token for a specific room and user.
 * The token is used to authenticate users joining the video call.
 *
 * @param {string} session_code - The session code (used as room name)
 * @param {string} user_name - The user's display name in the video call
 * @returns {object} { token: string, room_url: string }
 */
export default async (req: Request, _context: Context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { room_name, user_name, session_code } = await req.json();

    // Allow either room_name or session_code to be provided
    const roomIdentifier = room_name || session_code;

    if (!roomIdentifier || !user_name) {
      return new Response(
        JSON.stringify({
          error: "room_name (or session_code) and user_name are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if DAILY_API_KEY is available
    if (!process.env.DAILY_API_KEY) {
      console.error("DAILY_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get Daily domain from environment (with fallback)
    const dailyDomain =
      process.env.DAILY_DOMAIN ||
      process.env.VITE_DAILY_DOMAIN ||
      "thirty.daily.co";

    // Create meeting token using Daily.co API
    const tokenResponse = await fetch(
      "https://api.daily.co/v1/meeting-tokens",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: roomIdentifier, // Use the roomIdentifier (session_code or room_name)
            user_name: user_name,
            is_owner: false,
            enable_recording: false,
            start_video_off: false,
            start_audio_off: false,
          },
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Daily.co API error:", errorData);
      return new Response(
        JSON.stringify({
          error: "Failed to create meeting token",
          details: errorData,
        }),
        {
          status: tokenResponse.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const tokenData = await tokenResponse.json();

    // Construct the room URL
    const roomUrl = `https://${dailyDomain}/${roomIdentifier.toLowerCase()}`;

    // Return both token and room URL for convenience
    return new Response(
      JSON.stringify({
        token: tokenData.token,
        room_url: roomUrl,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating Daily token:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
