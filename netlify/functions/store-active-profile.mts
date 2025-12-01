import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { resolveBlobStoreName } from "../blobs/storeName";

/**
 * Netlify Serverless Function: Store Active Profile
 *
 * Stores the currently active user profile in Netlify Blobs for quick access.
 *
 * POST Body:
 * {
 *   "userId": "user-id",
 *   "profileData": { ...profile object }
 * }
 */

interface ParticipantBlobData {
  participant_id: string;
  profile_id: string | null;
  name: string;
  username: string | null;
  flag: string;
  team: string | null;
  team_logo_url: string | null;
  current_session_id: string | null;
  current_session_code: string | null;
  role: "Host" | "Home" | "Away" | "GameMaster" | "Guest";
  lobby_presence: "NotJoined" | "Joined" | "Disconnected";
  video_presence: boolean;
  last_heartbeat: string;
  join_at: string | null;
  disconnect_at: string | null;
  device_id: string;
  last_device_sync: string;
  preferred_flag: string | null;
  preferred_team: string | null;
  audio_enabled: boolean;
  video_enabled: boolean;
  created_at: string;
  last_updated: string;
  session_history: string[];
  metadata?: Record<string, unknown>;
}

type ProfileData = Partial<ParticipantBlobData> & {
  id?: string;
  user_id?: string;
  username?: string | null;
  flag?: string | null;
  team?: string | null;
  avatar_url?: string | null;
  name?: string | null;
  preferred_flag?: string | null;
  preferred_team?: string | null;
  device_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

const buildParticipantRecord = (
  userId: string,
  profileData: ProfileData,
): ParticipantBlobData => {
  const now = new Date().toISOString();
  const participantId = profileData.participant_id ?? userId;
  const metadata = profileData.metadata ?? {};
  const metadataString = (key: string): string | undefined => {
    const value = metadata[key];
    return typeof value === "string" ? value : undefined;
  };
  const metadataBoolean = (key: string): boolean | undefined => {
    const value = metadata[key];
    return typeof value === "boolean" ? value : undefined;
  };
  const fallbackName =
    profileData.name ||
    profileData.username ||
    metadataString("display_name") ||
    "Player";
  const metadataSource = metadataString("source");

  return {
    participant_id: participantId,
    profile_id: profileData.profile_id ?? profileData.id ?? userId,
    name: fallbackName,
    username: profileData.username ?? metadataString("username") ?? null,
    flag:
      profileData.flag ??
      profileData.preferred_flag ??
      metadataString("flag") ??
      "sa",
    team: profileData.team ?? null,
    team_logo_url: profileData.team_logo_url ?? profileData.avatar_url ?? null,
    current_session_id: profileData.current_session_id ?? null,
    current_session_code: profileData.current_session_code ?? null,
    role: profileData.role ?? "Guest",
    lobby_presence: profileData.lobby_presence ?? "NotJoined",
    video_presence: profileData.video_presence ?? false,
    last_heartbeat: profileData.last_heartbeat ?? now,
    join_at: profileData.join_at ?? null,
    disconnect_at: profileData.disconnect_at ?? null,
    device_id:
      profileData.device_id ??
      metadataString("device_id") ??
      `user-${userId}`,
    last_device_sync: profileData.last_device_sync ?? now,
    preferred_flag:
      profileData.preferred_flag ?? metadataString("preferred_flag") ?? null,
    preferred_team:
      profileData.preferred_team ?? metadataString("preferred_team") ?? null,
    audio_enabled:
      profileData.audio_enabled ?? metadataBoolean("audio_enabled") ?? true,
    video_enabled:
      profileData.video_enabled ?? metadataBoolean("video_enabled") ?? true,
    created_at: profileData.created_at ?? now,
    last_updated: profileData.last_updated ?? now,
    session_history: profileData.session_history ?? [],
    metadata: {
      ...profileData.metadata,
      source: metadataSource ?? "supabase",
    },
  };
};

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const { userId, profileData } = (await req.json()) as {
      userId: string;
      profileData: ProfileData;
    };

    if (!userId || !profileData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing userId or profileData",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Use consolidated "participants" store with strong consistency
    // Migrated from "active-profiles" in Phase 3.2
    const store = getStore({
      name: resolveBlobStoreName("participants"),
      consistency: "strong",
    });
    const normalizedProfile = buildParticipantRecord(userId, profileData);

    await store.setJSON(userId, normalizedProfile, {
      metadata: {
        updated_at: new Date().toISOString(),
        schema: "participant",
      },
    });

    console.log("Profile stored successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile stored successfully",
        profile: normalizedProfile,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error storing profile:", error);
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
  path: "/api/store-active-profile",
};
