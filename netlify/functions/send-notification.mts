import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Serverless Function: Send Notification
 *
 * Sends a notification to a user via Supabase database.
 *
 * POST Body:
 * {
 *   "user_id": "uuid",
 *   "type": "friend_request" | "session_invite" | "general",
 *   "message": "notification message",
 *   "metadata": { ...additional data }
 * }
 */
export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { user_id, type, message, metadata } = await req.json();

    if (!user_id || !type || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: user_id, type, message",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate environment variables
    const supabaseUrl = Netlify.env.get("SUPABASE_DATABASE_URL");
    const supabaseKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || Netlify.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase environment variables missing");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Insert notification
    const { error } = await supabase.from("Notifications").insert({
      user_id,
      type,
      message,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      read: false,
    });

    if (error) {
      console.error("Failed to insert notification:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create notification",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Notification sent successfully to user:", user_id);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/send-notification",
};
