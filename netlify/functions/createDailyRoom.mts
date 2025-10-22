import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Serverless Function: Create Daily.co Room
 *
 * Creates a Daily.co video call room for a quiz session.
 * Uses session code as the room name for easy identification.
 *
 * POST Body:
 * {
 *   "session_code": "ABC123"
 * }
 *
 * Returns:
 * {
 *   "room_url": "https://thirty.daily.co/ABC123",
 *   "room_name": "ABC123",
 *   "session_id": "uuid"
 * }
 */
export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    const { session_code } = await req.json();

    if (!session_code) {
      return new Response(
        JSON.stringify({ error: "session_code is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate environment variables using Netlify.env
    const dailyApiKey = Netlify.env.get("DAILY_API_KEY");
    const supabaseUrl = Netlify.env.get("SUPABASE_DATABASE_URL");
    const supabaseKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || Netlify.env.get("SUPABASE_ANON_KEY");

    if (!dailyApiKey) {
      console.error("DAILY_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase environment variables missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Get session_id from session_code
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("Sessions")
      .select("session_id")
      .eq("session_code", session_code.toUpperCase())
      .single();

    if (sessionErr || !sessionRow?.session_id) {
      console.error("Session not found:", sessionErr);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const session_id = sessionRow.session_id;

    console.log("Creating Daily.co room for session:", session_code);

    // Create room using Daily.co API
    const roomResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dailyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: session_code, // Use session_code as room name
        privacy: "public",
        properties: {
          max_participants: 10,
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          enable_recording: "cloud", // Enable cloud recording
          enable_prejoin_ui: false,
        },
      }),
    });

    if (!roomResponse.ok) {
      const errorData = await roomResponse.text();
      console.error("Daily.co API error:", errorData);
      return new Response(
        JSON.stringify({
          error: "Failed to create Daily.co room",
          details: errorData,
        }),
        {
          status: roomResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const roomData = await roomResponse.json();
    console.log("Daily.co room created:", roomData.name);

    // Save room data to Supabase
    const { error: dbError } = await supabase
      .from("DailyRooms")
      .upsert({
        room_id: session_id,
        room_url: roomData.url,
        ready: true,
      });

    if (dbError) {
      console.error("Failed to save room to database:", dbError);
      return new Response(
        JSON.stringify({
          error: "Failed to save room data",
          details: dbError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        room_url: roomData.url,
        room_name: roomData.name,
        session_id: session_id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating Daily room:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Export config for custom path
export const config: Config = {
  path: "/api/create-daily-room",
};
