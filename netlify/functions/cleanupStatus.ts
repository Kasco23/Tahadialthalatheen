import type { Context, Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Scheduled Function: Cleanup Stale Participant Status
 *
 * Purpose:
 * - Reset stale participants who haven't sent a heartbeat recently
 * - Maintains accurate presence information in the database
 * - Runs hourly via Netlify scheduled functions
 *
 * Logic:
 * - Finds participants with lastHeartbeat > 10 minutes ago
 * - Sets isConnected=false, isReady=false, inCall=false for stale participants
 * - Returns count of cleaned participants
 *
 * Scheduled in netlify.toml:
 * [[functions]]
 * name = "cleanupStatus"
 * schedule = "0 * * * *"  # Runs hourly at the top of the hour
 */
export const handler: Handler = async (_event, _context: Context) => {
  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: "Server configuration error",
          cleaned: 0,
        }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Calculate timestamp for 10 minutes ago
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    console.log(
      `Checking for stale participants (lastHeartbeat < ${tenMinutesAgo})`,
    );

    // Find stale participants who appear connected but haven't sent heartbeat
    const { data: staleUsers, error: selectError } = await supabase
      .from("Participant")
      .select("participant_id, name, role, lastHeartbeat")
      .lte("lastHeartbeat", tenMinutesAgo)
      .eq("lobby_presence", "Joined");

    if (selectError) {
      console.error("Error querying stale participants:", selectError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: `Database query error: ${selectError.message}`,
          cleaned: 0,
        }),
      };
    }

    const cleanedCount = staleUsers?.length || 0;

    if (cleanedCount > 0) {
      console.log(
        `Found ${cleanedCount} stale participants to clean up:`,
        staleUsers.map((u) => ({
          id: u.participant_id,
          name: u.name,
          role: u.role,
        })),
      );

      // Update stale participants to disconnected state
      const { error: updateError } = await supabase
        .from("Participant")
        .update({
          lobby_presence: "Disconnected",
          isReady: false,
          video_presence: false,
          disconnect_at: new Date().toISOString(),
        })
        .in(
          "participant_id",
          staleUsers.map((u) => u.participant_id),
        );

      if (updateError) {
        console.error("Error updating stale participants:", updateError);
        return {
          statusCode: 500,
          body: JSON.stringify({
            success: false,
            error: `Database update error: ${updateError.message}`,
            cleaned: 0,
          }),
        };
      }

      console.log(`Successfully cleaned up ${cleanedCount} stale participants`);
    } else {
      console.log("No stale participants found");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        cleaned: cleanedCount,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Unexpected error in cleanupStatus function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        cleaned: 0,
      }),
    };
  }
};
