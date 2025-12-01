import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/supabase";
import { getStore } from "@netlify/blobs";
import { resolveBlobStoreName } from "../blobs/storeName";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const { participantId, sessionId } = (await req.json()) as {
      participantId?: string;
      sessionId?: string;
    };

    if (!participantId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing participantId" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Netlify.env.get("VITE_SUPABASE_DATABASE_URL");
    const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    const { data: participantRow, error: updateErr } = await supabase
      .from("Participants")
      .update({
        lobby_presence: "Disconnected",
        disconnect_at: now,
        join_at: null,
      })
      .eq("participant_id", participantId)
      .select("session_id, profile_id")
      .maybeSingle();

    if (updateErr) {
      throw new Error(`Failed to mark participant disconnected: ${updateErr.message}`);
    }

    const resolvedSessionId = sessionId ?? participantRow?.session_id ?? null;
    const profileId = participantRow?.profile_id ?? null;

    // Mirror to participants blob for Active Games continuity
    if (profileId && resolvedSessionId) {
      try {
        const store = getStore({
          name: resolveBlobStoreName("participants"),
          consistency: "strong",
        });
        const blob = (await store.get(profileId, {
          type: "json",
        })) as Record<string, unknown> | null;
        const activeGames = Array.isArray(blob?.["active_games"])
          ? ([...blob["active_games"]] as Array<Record<string, unknown>>)
          : [];
        const idx = activeGames.findIndex(
          (g) => g.session_id === resolvedSessionId,
        );
        if (idx >= 0) {
          activeGames[idx] = {
            ...activeGames[idx],
            lobby_presence: "Disconnected",
            last_seen_at: now,
          };
        } else {
          activeGames.push({
            session_id: resolvedSessionId,
            session_code: resolvedSessionId,
            role: "Guest",
            lobby_presence: "Disconnected",
            last_seen_at: now,
          });
        }

        await store.setJSON(profileId, {
          ...(blob || {}),
          active_games: activeGames,
          last_updated: now,
        });
      } catch (blobErr) {
        console.warn("Failed to mirror disconnect to blobs:", blobErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sessionId: resolvedSessionId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in mark-player-disconnected:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const config: Config = {
  path: "/.netlify/functions/mark-player-disconnected",
};
