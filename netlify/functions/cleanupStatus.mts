import type { Config } from "@netlify/functions";
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
 * - Sets lobby_presence=Disconnected, video_presence=false for stale participants
 * - Returns count of cleaned participants
 *
 * Note: Scheduled functions have a 30-second execution limit
 */
export default async (req: Request) => {
  try {
    // Parse the scheduled event body
    const { next_run } = await req.json();
    console.log("Running cleanupStatus. Next invocation at:", next_run);

    // Initialize Supabase client with service role key using Netlify.env
    const supabaseUrl = Netlify.env.get("SUPABASE_DATABASE_URL");
    const supabaseKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return;
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
      .from("Participants")
      .select("participant_id, name, role, lastHeartbeat")
      .lte("lastHeartbeat", tenMinutesAgo)
      .eq("lobby_presence", "Joined");

    if (selectError) {
      console.error("Error querying stale participants:", selectError);
      return;
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
      // Note: isReady column has been removed from the schema
      const { error: updateError } = await supabase
        .from("Participants")
        .update({
          lobby_presence: "Disconnected",
          video_presence: false,
          disconnect_at: new Date().toISOString(),
        })
        .in(
          "participant_id",
          staleUsers.map((u) => u.participant_id),
        );

      if (updateError) {
        console.error("Error updating stale participants:", updateError);
        return;
      }

      console.log(`Successfully cleaned up ${cleanedCount} stale participants`);
    } else {
      console.log("No stale participants found");
    }

    console.log(
      `cleanupStatus completed: ${cleanedCount} participants cleaned at ${new Date().toISOString()}`,
    );
  } catch (error) {
    console.error("Unexpected error in cleanupStatus function:", error);
  }
};

export const config: Config = {
  schedule: "0 * * * *", // Runs hourly at the top of the hour
};
