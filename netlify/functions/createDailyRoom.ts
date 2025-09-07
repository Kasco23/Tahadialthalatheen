import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export default async (req: Request, _context: Context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse JSON directly from the request
    const parsedBody = await req.json();
    console.log("Received request body:", parsedBody);

    const { session_code } = parsedBody;
    console.log("Parsed data:", { session_code });

    if (!session_code) {
      console.error("Missing session_code");
      return new Response(
        JSON.stringify({ error: "session_code is required" }),
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

    // Init Supabase (server env)
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Supabase env missing (SUPABASE_DATABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
      );
      return new Response(
        JSON.stringify({ error: "Server configuration error (Supabase)" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Get the session_id for the provided session_code
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("Session")
      .select("session_id")
      .eq("session_code", session_code.toUpperCase())
      .single();

    if (sessionErr || !sessionRow?.session_id) {
      console.error("Session not found for session_code:", sessionErr);
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session_id = sessionRow.session_id;
    console.log("Creating Daily.co room with session_code:", session_code);

    // Create room using Daily.co API with session_code as room name
    const roomResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: session_code, // Use session_code as room name
        privacy: "public",
        properties: {
          max_participants: 10,
          enable_recording: false,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    console.log("Daily.co API response status:", roomResponse.status);

    type DailyRoom = { url: string } & Record<string, unknown>;
    let roomData: DailyRoom;
    if (!roomResponse.ok) {
      const errorText = await roomResponse.text();
      console.error("Daily.co API error:", errorText);
      // If room already exists (conflict), try to fetch it (idempotent behavior)
      if (roomResponse.status === 409) {
        const getResp = await fetch(
          `https://api.daily.co/v1/rooms/${encodeURIComponent(session_code)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
            },
          },
        );
        if (!getResp.ok) {
          const getText = await getResp.text();
          console.error("Daily.co GET room error:", getText);
          return new Response(
            JSON.stringify({
              error: "Failed to get existing room",
              details: getText,
            }),
            {
              status: getResp.status,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        roomData = await getResp.json();
      } else {
        return new Response(
          JSON.stringify({
            error: "Failed to create room",
            details: errorText,
          }),
          {
            status: roomResponse.status,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } else {
      roomData = await roomResponse.json();
    }

    // Return room URL and session info
    const response = {
      room_url: roomData.url,
      room_name: session_code, // optional: front-end uses sessionCode for display
      session_id: session_id,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
      },
    );
  }
};

export const config: Config = {
  path: "/create-daily-room",
};
