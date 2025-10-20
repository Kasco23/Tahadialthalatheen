import type { Context } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

/**
 * Netlify function to send notifications
 * This uses the service role key to bypass RLS policies
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
    // Parse request body
    const body = await req.json();
    const { recipient_id, sender_id, type, title, message, link, metadata } =
      body;

    // Validate required fields
    if (!recipient_id || !type || !title || !message) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: recipient_id, type, title, message",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate notification type
    const validTypes = [
      "friend_request",
      "friend_accepted",
      "match_invite",
      "match_result",
    ];
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid notification type. Must be one of: ${validTypes.join(", ")}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(
        "Supabase environment variables missing (SUPABASE_DATABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
      );
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert notification into database
    const { data, error } = await supabase
      .from("Notifications")
      .insert({
        recipient_id,
        sender_id: sender_id || null,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting notification:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to create notification",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log("Notification created successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        notification: data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const config = {
  path: "/send-notification",
};
