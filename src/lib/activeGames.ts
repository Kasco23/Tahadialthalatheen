import { supabase } from "./supabaseClient";
import { Logger } from "./logger";
import {
  getParticipantBlob,
  saveParticipantBlob,
  type ParticipantBlobData,
} from "./blobsManager";
import type {
  LobbyPresence,
  ParticipantRole,
  SessionPhase,
  GameState,
} from "./types";
import type { Tables } from "./types/supabase";

export interface ActiveGameEntry {
  session_id: string;
  session_code: string;
  role: ParticipantRole;
  session_presence: LobbyPresence;
  phase?: SessionPhase;
  game_state?: GameState;
  host_profile_id?: string | null;
  host_name?: string | null;
  participant_count?: number;
  has_daily_room?: boolean;
  invited?: boolean;
  last_seen_at?: string;
}

type ProfileInfo = Partial<Tables<"Profiles">> | null | undefined;

const unique = <T>(arr: T[]): T[] => Array.from(new Set(arr));

/**
 * Fetch active games for a profile from Supabase.
 * Includes sessions the user participates in plus recent invites.
 */
export async function fetchProfileActiveGames(
  profileId: string,
): Promise<ActiveGameEntry[]> {
  // Step 1: fetch participant rows for the profile
  const { data: participantRows, error: participantErr } = await supabase
    .from("Participants")
    .select("session_id, role, session_presence")
    .eq("profile_id", profileId);

  if (participantErr) {
    throw new Error(
      `Failed to fetch participant sessions: ${participantErr.message}`,
    );
  }

  const participantMap = new Map<
    string,
    { role: ParticipantRole; session_presence: LobbyPresence }
  >();
  const sessionIds = unique(
    (participantRows || [])
      .map((p) => p.session_id)
      .filter((id): id is string => !!id),
  );

  (participantRows || []).forEach((p) => {
    if (p.session_id) {
      participantMap.set(p.session_id, {
        role: (p.role as ParticipantRole) || "Guest",
        session_presence: (p.session_presence as LobbyPresence) || "NotJoined",
      });
    }
  });

  // Step 2: fetch session details for those IDs
  type SessionRow = {
    session_id: string;
    session_code: string;
    phase: SessionPhase;
    game_state: GameState;
    ended_at?: string | null;
    host_profile_id?: string | null;
    Participants?: Array<{
      role: string;
      session_presence: string;
      profile_id?: string | null;
      Profiles?: { name?: string | null } | null;
    }> | null;
    DailyRooms?: Array<{ room_url?: string | null }> | null;
  };

  let sessionRows: SessionRow[] = [];
  if (sessionIds.length > 0) {
    const { data, error: sessionErr } = await supabase
      .from("Sessions")
      .select(
        `
        session_id,
        session_code,
        phase,
        game_state,
        ended_at,
        host_profile_id,
        Participants (
          role,
          session_presence,
          profile_id,
          Profiles!profile_id ( name )
        ),
        DailyRooms ( room_url )
      `,
      )
      .in("session_id", sessionIds)
      .is("ended_at", null);

    if (sessionErr) {
      throw new Error(
        `Failed to fetch session details: ${sessionErr.message}`,
      );
    }

    sessionRows = (data as unknown as SessionRow[]) || [];
  }

  const sessionMap = new Map<string, ActiveGameEntry>();
  sessionRows.forEach((row) => {
    const participant = participantMap.get(row.session_id);
    const participants = Array.isArray(row.Participants)
      ? row.Participants
      : [];
    const hostParticipant = participants.find((p) => p.role === "Host");
    const hostName =
      (hostParticipant?.Profiles as { name?: string | null } | undefined)
        ?.name || "Host";
    const playerCount = participants.filter(
      (p) =>
        (p.role === "Home" || p.role === "Away") &&
        p.session_presence === "Joined",
    ).length;

    if (!participant) {
      return;
    }

    sessionMap.set(row.session_id, {
      session_id: row.session_id,
      session_code: row.session_code,
      phase: row.phase,
      game_state: row.game_state,
      role: participant.role,
      session_presence: participant.session_presence,
      host_profile_id: row.host_profile_id,
      host_name: hostName,
      participant_count: playerCount,
      has_daily_room: !!(row.DailyRooms && row.DailyRooms.length > 0),
      invited: false,
      last_seen_at: new Date().toISOString(),
    });
  });

  // Step 3: incorporate recent invites for this user
  const { data: inviteRows, error: inviteErr } = await supabase
    .from("Notifications")
    .select("metadata, created_at")
    .eq("recipient_id", profileId)
    .eq("type", "match_invite")
    .order("created_at", { ascending: false })
    .limit(10);

  if (inviteErr) {
    Logger.warn("Failed to fetch invites for active games:", inviteErr);
  } else if (inviteRows) {
    inviteRows.forEach((invite) => {
      const meta = (invite.metadata || {}) as Record<string, unknown>;
      const sessionCode =
        (meta.sessionCode as string | undefined) ??
        (meta.session_code as string | undefined);
      const sessionId =
        (meta.sessionId as string | undefined) ??
        (meta.session_id as string | undefined) ??
        sessionCode;
      if (!sessionCode || !sessionId) return;

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          session_id: sessionId,
          session_code: sessionCode,
          role: ((meta.role as ParticipantRole | undefined) || "Home") as
            | ParticipantRole
            | "Home",
          session_presence: "NotJoined",
          invited: true,
          last_seen_at: invite.created_at || new Date().toISOString(),
        });
      }
    });
  }

  return Array.from(sessionMap.values()).sort((a, b) => {
    const aTime = a.last_seen_at || "";
    const bTime = b.last_seen_at || "";
    return bTime.localeCompare(aTime);
  });
}

/**
 * Persist active games into the participant blob for quick, profile-scoped access.
 */
export async function persistActiveGamesToBlob(
  profileId: string,
  games: ActiveGameEntry[],
  profile?: ProfileInfo,
): Promise<void> {
  try {
    const existing = await getParticipantBlob(profileId);
    const now = new Date().toISOString();
    const data = existing.success ? existing.data : null;
    const primaryJoined = games.find((g) => g.session_presence === "Joined");

    const record: ParticipantBlobData = {
      participant_id: data?.participant_id ?? profileId,
      profile_id: data?.profile_id ?? profileId,
      name: profile?.name ?? data?.name ?? profile?.username ?? "Player",
      username: profile?.username ?? data?.username ?? null,
      flag: profile?.flag ?? data?.flag ?? "sa",
      team_url: profile?.team_url ?? data?.team_url ?? null,
      team_logo_url: profile?.avatar_url ?? data?.team_logo_url ?? null,
      current_session_id:
        data?.current_session_id ?? primaryJoined?.session_id ?? null,
      current_session_code:
        data?.current_session_code ?? primaryJoined?.session_code ?? null,
      role: data?.role ?? primaryJoined?.role ?? "Guest",
      session_presence: data?.session_presence ?? "NotJoined",
      video_presence: data?.video_presence ?? false,
      last_heartbeat: data?.last_heartbeat ?? now,
      join_at: data?.join_at ?? null,
      disconnect_at: data?.disconnect_at ?? null,
      device_id: data?.device_id ?? `device-${profileId}`,
      last_device_sync: now,
      preferred_flag: data?.preferred_flag ?? null,
      preferred_team_url: data?.preferred_team_url ?? null,
      audio_enabled: data?.audio_enabled ?? true,
      video_enabled: data?.video_enabled ?? true,
      created_at: data?.created_at ?? now,
      last_updated: now,
      session_history: unique([
        ...(data?.session_history ?? []),
        ...games
          .map((g) => g.session_id || g.session_code)
          .filter((v): v is string => !!v),
      ]),
      active_games: games,
      metadata: {
        ...data?.metadata,
        source: "active-games",
      },
    };

    await saveParticipantBlob(record);
  } catch (err) {
    Logger.warn("Failed to persist active games to blob:", err);
  }
}

/**
 * Update a single active game presence entry in the participant blob.
 */
export async function updateActiveGamePresenceInBlob(
  profileId: string,
  sessionId: string,
  presence: LobbyPresence,
): Promise<void> {
  try {
    const result = await getParticipantBlob(profileId);
    if (!result.success || !result.data) return;

    const games = Array.isArray(result.data.active_games)
      ? [...result.data.active_games]
      : [];
    const idx = games.findIndex((g) => g.session_id === sessionId);
    const now = new Date().toISOString();

    if (idx >= 0) {
      games[idx] = {
        ...games[idx],
        session_presence: presence,
        last_seen_at: now,
      };
    } else {
      games.push({
        session_id: sessionId,
        session_code: sessionId,
        role: "Guest",
        session_presence: presence,
        last_seen_at: now,
      });
    }

    const updated: ParticipantBlobData = {
      ...result.data,
      active_games: games,
      last_updated: now,
    };

    await saveParticipantBlob(updated);
  } catch (err) {
    Logger.warn("Failed to update active game presence in blob:", err);
  }
}
