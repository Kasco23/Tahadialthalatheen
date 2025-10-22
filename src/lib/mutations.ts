import { supabase } from "./supabaseClient";
import { Logger } from "./logger";
import type {
  TablesUpdate,
  SegmentCode,
  ParticipantRole,
  LobbyPresence,
  SessionPhase,
  GameState,
  Powerup,
  SegmentConfigInput,
  CreateDailyRoomResponse,
} from "./types";

// Type for participant data with Profile JOIN
type ParticipantWithProfile = {
  participant_id: string;
  role: string;
  isReady?: boolean;
  lobby_presence?: string;
  profile_id: string | null;
  Profiles: Array<{ name: string }> | { name: string } | null;
};

// Interface for active session data
export interface ActiveSession {
  session_id: string;
  session_code: string;
  phase: SessionPhase;
  game_state: GameState;
  created_at: string;
  host_name: string;
  participant_count: number;
  has_daily_room: boolean;
}

// 1. Create Session (Host PC → GameSetup)
export async function createSession(
  hostProfileId: string,
): Promise<{ sessionId: string; sessionCode: string }> {
  // Input validation
  if (!hostProfileId || hostProfileId.trim().length === 0) {
    throw new Error("Host profile ID is required");
  }

  try {
    // Create the session with host_profile_id
    const { data: sessionData, error: sessionError } = await supabase
      .from("Sessions")
      .insert({
        host_profile_id: hostProfileId,
        phase: "Setup",
        game_state: "pre-quiz",
      })
      .select("session_id, session_code")
      .single();

    if (sessionError) {
      Logger.error("Session creation failed:", sessionError);
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    if (!sessionData?.session_id || !sessionData?.session_code) {
      throw new Error("Session created but missing required data");
    }

    // Create ONE participant for the creator with Host AND GameMaster role
    // The creator is immediately joined and can access from any device
    // Note: We use "Host" as the primary role since they control the game
    const { error: participantError } = await supabase
      .from("Participants")
      .insert({
        session_id: sessionData.session_id,
        role: "Host" as ParticipantRole,
        lobby_presence: "Joined" as LobbyPresence, // Creator is immediately joined
        profile_id: hostProfileId, // Link to creator's profile
        join_at: new Date().toISOString(),
      });

    if (participantError) {
      Logger.error("Participant creation failed:", participantError);
      // Try to clean up the session if participant creation fails
      await supabase
        .from("Sessions")
        .delete()
        .eq("session_id", sessionData.session_id);
      throw new Error(
        `Failed to create participant: ${participantError.message}`,
      );
    }

    Logger.log("Session created successfully:", {
      sessionId: sessionData.session_id,
      sessionCode: sessionData.session_code,
      hostProfileId,
    });

    return {
      sessionId: sessionData.session_id,
      sessionCode: sessionData.session_code,
    };
  } catch (error) {
    // Re-throw with better context if it's not already an Error object
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error creating session: ${String(error)}`);
  }
}

// Function to fetch active sessions for the Active Games component
export async function getActiveSessions(): Promise<ActiveSession[]> {
  const { data, error } = await supabase
    .from("Sessions")
    .select(
      `
      session_id,
      session_code,
      phase,
      game_state,
      created_at,
      ended_at,
      Participants(role, lobby_presence, profile_id, Profiles!profile_id(name)),
      DailyRooms(room_url)
    `,
    )
    // Show any session that hasn't ended yet
    .is("ended_at", null)
    .order("created_at", { ascending: false }) // Most recent first
    .limit(4); // Only get the 4 most recent

  if (error) {
    Logger.error("Error fetching active sessions:", error);
    throw new Error(`Failed to fetch active sessions: ${error.message}`);
  }

  Logger.debug("Raw data from Supabase:", data);

  // Transform the data to match our interface
  type ProfileData = { name: string } | null;
  type SessionRow = {
    session_id: string;
    session_code: string;
    phase: SessionPhase;
    game_state: GameState;
    created_at: string;
    ended_at?: string | null;
    Participants?: Array<{
      role: string;
      lobby_presence: string;
      profile_id?: string;
      Profiles?: ProfileData;
    }> | null;
    DailyRooms?: Array<{ room_url?: string }> | null;
  };

  const rows = (data as unknown as SessionRow[]) || [];

  const activeSessions: ActiveSession[] = rows.map((session) => {
    const participants = Array.isArray(session.Participants)
      ? session.Participants
      : [];
    const hostParticipant = participants.find((p) => p.role === "Host");
    const hostName = hostParticipant?.Profiles?.name || "Unknown Host";

    // Only count Home and Away roles that have lobby_presence "Joined"
    const playerCount = participants.filter(
      (p) =>
        (p.role === "Home" || p.role === "Away") &&
        p.lobby_presence === "Joined",
    ).length;
    const hasDailyRoom = !!(
      session.DailyRooms && session.DailyRooms.length > 0
    );

    return {
      session_id: session.session_id,
      session_code: session.session_code,
      phase: session.phase,
      game_state: session.game_state,
      created_at: session.created_at,
      host_name: hostName,
      participant_count: playerCount,
      has_daily_room: hasDailyRoom,
    };
  });

  Logger.debug("Transformed active sessions:", activeSessions);
  return activeSessions;
}

// Helper function to resolve session_code to session_id
export async function getSessionIdByCode(sessionCode: string): Promise<string> {
  const { data, error } = await supabase
    .from("Sessions")
    .select("session_id")
    .eq("session_code", sessionCode.toUpperCase())
    .single();

  if (error) {
    throw new Error(`Session not found: ${error.message}`);
  }

  return data.session_id;
}

type ParticipantIdRow = { participant_id: string };

// Wrapper function for joining as player with session code
// Smart logic: If user created the session (their profile_id exists as Host), rejoin as Host
// Otherwise, join as Home, Away, or Guest based on available slots
export async function joinAsPlayerWithCode(
  sessionCode: string,
  _name: string, // Deprecated - now using Profiles.name
  _flag: string, // Deprecated - now using Profiles.flag
  _logoUrl: string, // Deprecated - now using Profiles.team
  profileId?: string,
): Promise<{ participantId: string; role: string }> {
  const sessionId = await getSessionIdByCode(sessionCode);

  // Check if this user is the session creator (Host)
  if (profileId) {
    const { data: hostCheck, error: hostError } = await supabase
      .from("Participants")
      .select("participant_id, role, lobby_presence")
      .eq("session_id", sessionId)
      .eq("profile_id", profileId)
      .eq("role", "Host")
      .maybeSingle();

    // If user is the Host, update their presence and rejoin
    if (!hostError && hostCheck) {
      await supabase
        .from("Participants")
        .update({
          lobby_presence: "Joined",
          join_at: new Date().toISOString(),
          disconnect_at: null,
        })
        .eq("participant_id", hostCheck.participant_id);

      return {
        participantId: hostCheck.participant_id,
        role: "Host",
      };
    }
  }

  // Check if user already has a participant record with their profile_id (Home/Away/Guest)
  if (profileId) {
    const { data: existing, error: existingErr } = await supabase
      .from("Participants")
      .select("participant_id, role")
      .eq("session_id", sessionId)
      .eq("profile_id", profileId)
      .limit(1)
      .maybeSingle();

    type ExistingRow = { participant_id: string; role?: string } | null;

    if (!existingErr && (existing as ExistingRow)) {
      const existingRow = existing as ExistingRow;
      // Update presence with timestamps and return existing id
      await supabase
        .from("Participants")
        .update({
          lobby_presence: "Joined",
          join_at: new Date().toISOString(),
          disconnect_at: null,
        })
        .eq("participant_id", existingRow!.participant_id);
      return {
        participantId: existingRow!.participant_id,
        role: existingRow!.role || "Home",
      };
    }
  }

  // Determine available player role (Home, Away, or Guest)
  const { data: playersData, error: playersError } = await supabase
    .from("Participants")
    .select("role")
    .eq("session_id", sessionId)
    .in("role", ["Home", "Away"]);

  if (playersError) {
    throw new Error(
      `Failed to determine player roles: ${playersError.message || String(playersError)}`,
    );
  }

  const existingRoles: string[] = Array.isArray(playersData)
    ? (playersData as Array<{ role?: string }>).map((r) => r.role || "")
    : [];

  let assignedRole: string;
  if (!existingRoles.includes("Home")) {
    assignedRole = "Home";
  } else if (!existingRoles.includes("Away")) {
    assignedRole = "Away";
  } else {
    // Both player slots taken, assign as Guest
    assignedRole = "Guest";
  }

  // Insert new participant with assigned role
  const insertResultPlayer = await supabase
    .from("Participants")
    .insert({
      session_id: sessionId,
      role: assignedRole,
      lobby_presence: "Joined",
      join_at: new Date().toISOString(),
      disconnect_at: null,
      ...(profileId && { profile_id: profileId }),
    })
    .select("participant_id");

  const insertPlayerTyped = insertResultPlayer as {
    data: ParticipantIdRow[] | null;
    error: unknown;
  };
  const insertDataPlayer = insertPlayerTyped.data;
  const insertErrorPlayer = insertPlayerTyped.error;

  if (
    !insertErrorPlayer &&
    insertDataPlayer &&
    Array.isArray(insertDataPlayer) &&
    insertDataPlayer.length > 0
  ) {
    return {
      participantId: insertDataPlayer[0].participant_id,
      role: assignedRole,
    };
  }

  // If insert failed, throw error
  const insertMsg = extractErrorMessage(insertErrorPlayer);
  throw new Error(`Failed to join session: ${insertMsg}`);
}

// 2. Add Segment Config (GameSetup)
export async function setSegmentConfig(
  sessionId: string,
  configs: SegmentConfigInput[],
): Promise<void> {
  const configsWithSessionId = configs.map((config) => ({
    session_id: sessionId,
    segment_code: config.segment_code,
    questions_count: config.questions_count,
  }));

  const { error } = await supabase
    .from("SegmentConfig")
    .upsert(configsWithSessionId, {
      onConflict: "session_id,segment_code",
    });

  if (error) {
    throw new Error(`Failed to set segment config: ${error.message}`);
  }
}

// 3. Create Daily Room (GameSetup → Netlify Function)
export async function createDailyRoom(
  sessionId: string,
  sessionCode: string,
): Promise<CreateDailyRoomResponse> {
  try {
    Logger.debug("Creating Daily room with:", { sessionId, sessionCode });

    // Check if we're in local development without Netlify CLI
    const isLocalDev =
      window.location.hostname === "localhost" &&
      window.location.port === "5173";

    if (isLocalDev) {
      Logger.warn("Running in local development mode - using mock Daily room");

      // Create mock Daily room for development
      const mockRoomUrl = `https://thirty.daily.co/${sessionCode.toLowerCase()}`;
      const mockResponse: CreateDailyRoomResponse = {
        room_url: mockRoomUrl,
        room_name: sessionCode,
        session_id: sessionId,
      };

      // Still update the database for consistency
      const { error } = await supabase.from("DailyRooms").upsert({
        room_id: sessionId,
        room_url: mockRoomUrl,
        ready: true,
      });

      if (error) {
        Logger.error("Database error saving mock Daily room:", error);
        throw new Error(`Failed to save mock Daily room: ${error.message}`);
      }

      Logger.debug("Mock Daily room created successfully:", mockResponse);
      return mockResponse;
    }

    // Call Netlify function with session_code for room name
    const response = await fetch("/api/create-daily-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_code: sessionCode,
      }),
    });

    Logger.debug("Daily room creation response status:", response.status);

    if (!response.ok) {
      // Clone response to allow reading body multiple times
      const responseClone = response.clone();

      // Try to get the error details from the response
      try {
        const errorData = await response.json();
        Logger.error("Daily room creation error details:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`,
        );
      } catch (_parseError) {
        // If we can't parse JSON, get text from the cloned response
        try {
          const errorText = await responseClone.text();
          Logger.error("Daily room creation error (raw):", errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, response: ${errorText}`,
          );
        } catch (_textError) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
    }

    const data: CreateDailyRoomResponse = await response.json();
    Logger.debug("Daily room created successfully:", data);

    // Insert/update DailyRoom table
    const { error } = await supabase.from("DailyRooms").upsert({
      room_id: sessionId,
      room_url: data.room_url,
      ready: true,
    });

    if (error) {
      Logger.error("Database error saving Daily room:", error);
      throw new Error(`Failed to save Daily room: ${error.message}`);
    }
    return data;
  } catch (error) {
    throw new Error(
      `Failed to create Daily room: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Helper function to get Daily room data
export async function getDailyRoom(
  sessionId: string,
): Promise<{ room_url: string; ready: boolean } | null> {
  try {
    const { data, error } = await supabase
      .from("DailyRooms")
      .select("room_url, ready")
      .eq("room_id", sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get Daily room: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error("Error getting Daily room:", error);
    return null;
  }
}

// 4. Join as Host - Unified helper function
export async function joinAsHost(
  sessionCode: string,
  hostProfileId: string,
  flag?: string,
  logoUrl?: string,
): Promise<{ participantId: string; role: string }> {
  // Get the session and verify host_profile_id matches
  const { data: sessionRow, error: sessionError } = await supabase
    .from("Sessions")
    .select("session_id, host_profile_id")
    .eq("session_code", sessionCode.toUpperCase())
    .single();

  if (sessionError || !sessionRow) {
    throw new Error(
      `Session not found: ${sessionError?.message || "No session with that code"}`,
    );
  }

  // Verify that the current user is the host
  if (sessionRow.host_profile_id !== hostProfileId) {
    throw new Error("You are not the host of this session");
  }

  const sessionId = sessionRow.session_id;

  // First, try to find existing host participant
  const { data: existingHost, error: findError } = await supabase
    .from("Participants")
    .select("participant_id")
    .eq("session_id", sessionId)
    .eq("role", "Host")
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to check for existing host: ${findError.message}`);
  }

  if (existingHost) {
    // Update existing host to 'Joined' status with flag and logo
    const updateData: {
      lobby_presence: string;
      join_at: string;
      disconnect_at: null;
      flag?: string;
      team_logo_url?: string;
    } = {
      lobby_presence: "Joined",
      join_at: new Date().toISOString(),
      disconnect_at: null,
    };

    if (flag) updateData.flag = flag;
    if (logoUrl) updateData.team_logo_url = logoUrl;

    const { error: updateError } = await supabase
      .from("Participants")
      .update(updateData)
      .eq("participant_id", existingHost.participant_id);

    if (updateError) {
      throw new Error(`Failed to update host: ${updateError.message}`);
    }

    return {
      participantId: existingHost.participant_id,
      role: "Host",
    };
  }

  // If no existing host found, this is an error - host should be created during session creation
  throw new Error(
    "No host participant found for this session. Host should be created during session setup.",
  );
}

// 4b. Join as GameMaster - PC/Desktop coordinator role
export async function joinAsGameMaster(
  sessionCode: string,
  gameMasterName: string,
  flag?: string,
  logoUrl?: string,
): Promise<string> {
  // Get the session ID
  const { data: sessionRow, error: sessionError } = await supabase
    .from("Sessions")
    .select("session_id")
    .eq("session_code", sessionCode.toUpperCase())
    .single();

  if (sessionError || !sessionRow) {
    throw new Error(
      `Session not found: ${sessionError?.message || "No session with that code"}`,
    );
  }

  const sessionId = sessionRow.session_id;

  // Check for existing GameMaster
  const { data: existingGameMaster, error: findError } = await supabase
    .from("Participants")
    .select("participant_id")
    .eq("session_id", sessionId)
    .eq("role", "GameMaster")
    .maybeSingle();

  if (findError) {
    throw new Error(
      `Failed to check for existing GameMaster: ${findError.message}`,
    );
  }

  if (existingGameMaster) {
    // Update existing GameMaster
    const { error: updateError } = await supabase
      .from("Participants")
      .update({
        name: gameMasterName,
        flag: flag || null,
        team_logo_url: logoUrl || null,
        lobby_presence: "Joined",
        join_at: new Date().toISOString(),
        disconnect_at: null,
      })
      .eq("participant_id", existingGameMaster.participant_id);

    if (updateError) {
      throw new Error(`Failed to update GameMaster: ${updateError.message}`);
    }

    return existingGameMaster.participant_id;
  }

  // Create new GameMaster participant
  const { data: newGameMaster, error: insertError } = await supabase
    .from("Participants")
    .insert({
      session_id: sessionId,
      name: gameMasterName,
      role: "GameMaster",
      flag: flag || null,
      team_logo_url: logoUrl || null,
      lobby_presence: "Joined",
      join_at: new Date().toISOString(),
    })
    .select("participant_id")
    .single();

  if (insertError || !newGameMaster) {
    throw new Error(`Failed to create GameMaster: ${insertError?.message}`);
  }

  return newGameMaster.participant_id;
}

// 5. Join as Player (Phone → Join)
export async function joinAsPlayer(
  sessionId: string,
  name: string,
  flag: string,
  logoUrl: string,
): Promise<string> {
  // Check existing players to determine role
  const { data: existingPlayers, error: countError } = await supabase
    .from("Participants")
    .select("role")
    .eq("session_id", sessionId)
    .in("role", ["Home", "Away"]);

  if (countError) {
    throw new Error(`Failed to check existing players: ${countError.message}`);
  }

  // Determine role based on existing players
  let role: ParticipantRole;
  const hasHome = existingPlayers.some((p) => p.role === "Home");
  const hasAway = existingPlayers.some((p) => p.role === "Away");

  if (!hasHome) {
    role = "Home";
  } else if (!hasAway) {
    role = "Away";
  } else {
    throw new Error("Session is full - maximum 2 players allowed");
  }

  // Insert participant as player
  const { data, error } = await supabase
    .from("Participants")
    .insert({
      session_id: sessionId,
      name: name,
      role: role,
      flag: flag,
      team_logo_url: logoUrl,
      lobby_presence: "Joined",
      join_at: new Date().toISOString(),
      disconnect_at: null,
    })
    .select("participant_id")
    .single();

  if (error) {
    throw new Error(`Failed to join as player: ${error.message}`);
  }

  return data.participant_id;
}

// 6. Update Presence (Lobby & Call)
export async function updateLobbyPresence(
  participantId: string,
  status: LobbyPresence,
): Promise<void> {
  const updateData: TablesUpdate<"Participants"> = { lobby_presence: status };

  // Set timestamps based on status
  if (status === "Joined") {
    updateData.join_at = new Date().toISOString();
    updateData.disconnect_at = null;
  } else if (status === "Disconnected") {
    updateData.disconnect_at = new Date().toISOString();
    updateData.join_at = null; // Clear join_at when leaving lobby
  }

  const { error } = await supabase
    .from("Participants")
    .update(updateData)
    .eq("participant_id", participantId);

  if (error) {
    throw new Error(`Failed to update lobby presence: ${error.message}`);
  }
}

// Helper function to leave the lobby (disconnect)
export async function leaveLobby(participantId: string): Promise<void> {
  await updateLobbyPresence(participantId, "Disconnected");
}

// Helper function to leave the lobby by role and session (role-based lookup)
export async function leaveLobbyByRole(
  sessionId: string,
  role: string,
): Promise<void> {
  // Find participant by session and role (use maybeSingle to handle not found gracefully)
  const { data: participant, error: findError } = await supabase
    .from("Participants")
    .select("participant_id")
    .eq("session_id", sessionId)
    .eq("role", role)
    .maybeSingle();

  if (findError) {
    Logger.error(`Failed to find participant: ${findError.message}`);
    return; // Don't throw, just log and return
  }

  if (!participant) {
    Logger.warn(
      `No participant found with role ${role} in session ${sessionId}`,
    );
    return; // Don't throw, just log and return
  }

  // Update presence to disconnected
  await updateLobbyPresence(participant.participant_id, "Disconnected");
}

/**
 * Create a Daily.co meeting token via Supabase Edge Function
 * 
 * This function calls the Supabase Edge Function to generate a Daily.co token
 * for a specific room and user. The token is used to join the video call.
 * 
 * The Supabase function fetches session data from the database and generates
 * the token using the Daily.co API.
 * 
 * @param sessionCode - The session code (used to look up the room)
 * @param userName - The user's display name for the video call
 * @returns Promise with the generated token and room URL
 */
export async function createDailyToken(
  sessionCode: string,
  userName: string,
): Promise<{ token: string; room_url?: string }> {
  try {
    Logger.log("Creating Daily token via Supabase Edge Function:", { sessionCode, userName });

    // Get Supabase project URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_DATABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration missing");
    }

    // Call Supabase Edge Function to create Daily.co token
    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-daily-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          session_code: sessionCode,
          user_name: userName,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      Logger.error("Daily token creation failed:", errorData);
      throw new Error(
        `Failed to create Daily token: ${response.status} - ${JSON.stringify(errorData)}`,
      );
    }

    const data = await response.json();
    Logger.log("Daily token created successfully via Supabase Edge Function");

    return { 
      token: data.token,
      room_url: data.room_url
    };
  } catch (error) {
    Logger.error("Error creating Daily token:", error);
    throw new Error(
      `Failed to create Daily token: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function updateVideoPresence(
  participantId: string,
  connected: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("Participants")
    .update({ video_presence: connected })
    .eq("participant_id", participantId);

  if (error) {
    throw new Error(`Failed to update video presence: ${error.message}`);
  }
}

// 7. Update Phase / Game State (Host actions)
export async function updatePhase(
  sessionId: string,
  phase: SessionPhase,
  gameState?: GameState,
): Promise<void> {
  const updateData: TablesUpdate<"Sessions"> = { phase };

  if (gameState) {
    updateData.game_state = gameState;
  }

  const { error } = await supabase
    .from("Sessions")
    .update(updateData)
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(`Failed to update phase: ${error.message}`);
  }
}

// 8. Update Score (Quiz)
export async function updateScore(
  sessionId: string,
  participantId: string,
  segmentCode: SegmentCode,
  points: number,
): Promise<void> {
  // First try to get existing score
  const { data: existingScore, error: selectError } = await supabase
    .from("Scores")
    .select("points")
    .eq("session_id", sessionId)
    .eq("participant_id", participantId)
    .eq("segment_code", segmentCode)
    .single();

  let totalPoints = points;

  // If score exists, add to existing points
  if (existingScore && !selectError) {
    totalPoints = existingScore.points + points;
  }

  // Upsert the score
  const { error } = await supabase.from("Scores").upsert(
    {
      session_id: sessionId,
      participant_id: participantId,
      segment_code: segmentCode,
      points: totalPoints,
    },
    {
      onConflict: "session_id,participant_id,segment_code",
    },
  );

  if (error) {
    throw new Error(`Failed to update score: ${error.message}`);
  }
}

// 9. Use Powerup (Quiz)
export async function activatePowerup(
  participantId: string,
  powerup: Powerup,
): Promise<void> {
  const powerupColumnMap = {
    pass: "powerup_pass_used",
    alhabeed: "powerup_alhabeed",
    bellegoal: "powerup_bellegoal",
    slippyg: "powerup_slippyg",
  } as const;

  const column = powerupColumnMap[powerup];

  const { error } = await supabase
    .from("Participants")
    .update({ [column]: true })
    .eq("participant_id", participantId);

  if (error) {
    throw new Error(`Failed to use powerup: ${error.message}`);
  }
}

// 10. End Session
export async function endSession(
  sessionId: string,
  sessionCode?: string,
): Promise<void> {
  const { error } = await supabase
    .from("Sessions")
    .update({
      game_state: "concluded",
      ended_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(`Failed to end session: ${error.message}`);
  }

  // Note: Daily.co tokens are stateless and expire automatically
  // No need for explicit cleanup when session ends
  Logger.log("Session ended:", { sessionId, sessionCode });
}

// 11. Increment Strike (WDYK only)
export async function incrementStrike(
  sessionId: string,
  participantId: string,
): Promise<number> {
  // First get current strikes count
  const { data: existingStrike, error: selectError } = await supabase
    .from("Strikes")
    .select("strikes")
    .eq("session_id", sessionId)
    .eq("participant_id", participantId)
    .eq("segment_code", "WDYK")
    .single();

  let newStrikesCount = 1;

  // If strike record exists, increment by 1
  if (existingStrike && !selectError) {
    newStrikesCount = existingStrike.strikes + 1;
  }

  // Upsert the strike record
  const { error } = await supabase.from("Strikes").upsert(
    {
      session_id: sessionId,
      participant_id: participantId,
      segment_code: "WDYK",
      strikes: newStrikesCount,
    },
    {
      onConflict: "session_id,participant_id,segment_code",
    },
  );

  if (error) {
    throw new Error(`Failed to increment strike: ${error.message}`);
  }

  return newStrikesCount;
}

// 12. Reset Strikes (WDYK only)
export async function resetStrikes(
  sessionId: string,
  participantId: string,
): Promise<void> {
  const { error } = await supabase.from("Strikes").upsert(
    {
      session_id: sessionId,
      participant_id: participantId,
      segment_code: "WDYK",
      strikes: 0,
    },
    {
      onConflict: "session_id,participant_id,segment_code",
    },
  );

  if (error) {
    throw new Error(`Failed to reset strikes: ${error.message}`);
  }
}

// 13. Get Segment Config for Session
export async function getSegmentConfig(
  sessionId: string,
): Promise<SegmentConfigInput[]> {
  const { data, error } = await supabase
    .from("SegmentConfig")
    .select("segment_code, questions_count")
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(`Failed to get segment config: ${error.message}`);
  }

  return data || [];
}

// 14. Check for existing participant preset (flag and logo) by name
export interface ExistingPreset {
  flag: string | null;
  team_logo_url: string | null;
  name: string;
  role: string;
}

export async function checkExistingPreset(
  _name: string,
  _sessionCode?: string,
  _role?: string,
): Promise<ExistingPreset | null> {
  // Note: flag and team_logo_url are now stored in Profiles table
  // This function now returns null as presets are handled via profile_id
  // TODO: Refactor to use Profiles table via profile_id
  Logger.warn("checkExistingPreset is deprecated - use Profiles table instead");
  return null;
}

// Helper function to extract message from unknown errors to avoid any casts.
function extractErrorMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    const asObj = err as { message?: unknown };
    if (asObj && typeof asObj.message === "string") return asObj.message;
  } catch (_parseError) {
    // ignore parse errors when extracting message
  }
  return String(err);
}

// 15. Update Participant Heartbeat
/**
 * Update the lastHeartbeat timestamp for a participant to indicate they are still active.
 * Should be called every 30 seconds by active clients to maintain presence.
 *
 * @param participantId - The participant ID to update
 * @param sessionId - Optional session ID for validation
 */
export async function updateParticipantHeartbeat(
  participantId: string,
  sessionId?: string,
): Promise<void> {
  const updateData: TablesUpdate<"Participants"> = {
    lastHeartbeat: new Date().toISOString(),
  };

  let query = supabase
    .from("Participants")
    .update(updateData)
    .eq("participant_id", participantId);

  // Optionally filter by session ID for additional safety
  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { error } = await query;

  if (error) {
    Logger.error(`Failed to update heartbeat for ${participantId}:`, error);
    // Don't throw - heartbeat failures shouldn't break the app
    return;
  }

  Logger.debug(`Heartbeat updated for participant: ${participantId}`);
}

// 19. Mark Participant as Disconnected
/**
 * Mark a participant as disconnected when they leave the lobby or video call.
 * Updates presence, ready status, and video state.
 *
 * @param participantId - The participant ID to mark as disconnected
 */
export async function markParticipantDisconnected(
  participantId: string,
): Promise<void> {
  const { error } = await supabase
    .from("Participants")
    .update({
      lobby_presence: "Disconnected",
      video_presence: false,
      isReady: false,
      disconnect_at: new Date().toISOString(),
    } as TablesUpdate<"Participants">)
    .eq("participant_id", participantId);

  if (error) {
    Logger.error(`Failed to mark participant disconnected:`, error);
    throw new Error(`Failed to update participant status: ${error.message}`);
  }

  Logger.log(`Participant marked as disconnected: ${participantId}`);
}

// 17. Get Participants for Session (for rejoin)
/**
 * Get list of participants for a session to enable rejoin functionality
 * Returns participant info without password for security
 */
export async function getSessionParticipants(sessionId: string): Promise<
  Array<{
    participant_id: string;
    name: string;
    role: string;
    lobby_presence: string;
    profile_id: string | null;
  }>
> {
  const { data, error } = await supabase
    .from("Participants")
    .select(
      "participant_id, role, lobby_presence, profile_id, Profiles!profile_id(name)",
    )
    .eq("session_id", sessionId)
    .order("join_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to get session participants: ${error.message}`);
  }

  return (data || []).map((p: ParticipantWithProfile) => {
    const profileName =
      Array.isArray(p.Profiles) && p.Profiles.length > 0
        ? p.Profiles[0].name
        : (p.Profiles as { name: string } | null)?.name || "Unknown";

    return {
      participant_id: p.participant_id,
      name: profileName,
      role: p.role,
      lobby_presence: p.lobby_presence || "NotJoined",
      profile_id: p.profile_id,
    };
  });
}

// 18. Set Participant Password
/**
 * Set or update a participant's password for rejoin authentication
 * @deprecated Use setParticipantPassword from participantAuth.ts instead
 * This function is kept for backward compatibility but uses the new module internally
 */
export async function setParticipantPassword(
  participantId: string,
  password: string,
): Promise<void> {
  // Use the new participantAuth module which handles hashing via database function
  const { setParticipantPassword: setPassword } = await import(
    "./participantAuth"
  );
  await setPassword(participantId, password);
}

// 19. Verify Participant Password
/**
 * Verify a participant's password for rejoin authentication
 * @deprecated Use verifyParticipantPassword from participantAuth.ts instead
 * This function is kept for backward compatibility but uses the new module internally
 */
export async function verifyParticipantPassword(
  participantId: string,
  password: string,
): Promise<{
  valid: boolean;
  participant?: {
    participant_id: string;
    name: string;
    role: string;
    session_id: string;
    profile_id: string | null;
  };
}> {
  // Use the new participantAuth module
  const { verifyParticipantPassword: verifyPassword } = await import(
    "./participantAuth"
  );
  const isValid = await verifyPassword(participantId, password);

  if (!isValid) {
    return { valid: false };
  }

  // Fetch participant data if password is valid
  const { data, error } = await supabase
    .from("Participants")
    .select(
      "participant_id, role, session_id, profile_id, Profiles!profile_id(name)",
    )
    .eq("participant_id", participantId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const profileData =
    Array.isArray(data.Profiles) && data.Profiles.length > 0
      ? data.Profiles[0]
      : data.Profiles;

  return {
    valid: true,
    participant: {
      participant_id: data.participant_id,
      name: (profileData as { name: string } | null)?.name || "Unknown",
      role: data.role,
      session_id: data.session_id,
      profile_id: data.profile_id,
    },
  };
}

// 20. Update Participant Configuration (for rejoin)
/**
 * Update participant's profile when rejoining
 * Note: Name, flag, and team are now stored in Profiles table, not Participants
 * This function is deprecated - profile updates should go through updateProfile instead
 */
export async function updateParticipantConfig(
  participantId: string,
  config: {
    name?: string;
    flag?: string;
    team_logo_url?: string;
  },
): Promise<void> {
  // Get the profile_id from participant
  const { data: participant, error: fetchError } = await supabase
    .from("Participants")
    .select("profile_id")
    .eq("participant_id", participantId)
    .single();

  if (fetchError || !participant?.profile_id) {
    throw new Error("Failed to fetch participant profile");
  }

  // Update the profile instead of participant
  const profileUpdate: TablesUpdate<"Profiles"> = {};
  if (config.name !== undefined) profileUpdate.name = config.name;
  if (config.flag !== undefined) profileUpdate.flag = config.flag;
  if (config.team_logo_url !== undefined)
    profileUpdate.team = config.team_logo_url;

  const { error } = await supabase
    .from("Profiles")
    .update(profileUpdate)
    .eq("id", participant.profile_id);

  if (error) {
    throw new Error(`Failed to update participant config: ${error.message}`);
  }

  Logger.log(`Participant config updated: ${participantId}`, config);
}

// 21. Rejoin as Participant
/**
 * Complete rejoin flow for an existing participant
 * Updates presence, optionally updates config, and returns participant data
 * @param participantId - The participant's ID
 * @param password - Plain text password (will be verified via database function)
 * @param config - Optional configuration updates
 */
export async function rejoinAsParticipant(
  participantId: string,
  password: string,
  config?: {
    name?: string;
    flag?: string;
    team_logo_url?: string;
  },
): Promise<{
  participantId: string;
  role: string;
  sessionId: string;
}> {
  // Verify password using the new auth module
  const verification = await verifyParticipantPassword(participantId, password);

  if (!verification.valid || !verification.participant) {
    throw new Error("Invalid password or participant not found");
  }

  // Update config if provided
  if (config) {
    await updateParticipantConfig(participantId, config);
  }

  // Update presence to rejoin
  const { error } = await supabase
    .from("Participants")
    .update({
      lobby_presence: "Joined",
      join_at: new Date().toISOString(),
      disconnect_at: null,
    } as TablesUpdate<"Participants">)
    .eq("participant_id", participantId);

  if (error) {
    throw new Error(`Failed to rejoin as participant: ${error.message}`);
  }

  Logger.log(`Participant rejoined: ${participantId}`);

  return {
    participantId: verification.participant.participant_id,
    role: verification.participant.role,
    sessionId: verification.participant.session_id,
  };
}

// Helper function to get available player seats for a session
export async function getAvailableSeats(sessionCode: string): Promise<{
  availableSeats: ParticipantRole[];
  occupiedSeats: ParticipantRole[];
}> {
  const sessionId = await getSessionIdByCode(sessionCode);

  const { data: participants, error } = await supabase
    .from("Participants")
    .select("role")
    .eq("session_id", sessionId)
    .in("role", ["Home", "Away"]);

  if (error) {
    Logger.error("Error checking available seats:", error);
    throw new Error(`Failed to check available seats: ${error.message}`);
  }

  const occupiedSeats = (participants || []).map(
    (p) => p.role as ParticipantRole,
  );
  const allSeats: ParticipantRole[] = ["Home", "Away"];
  const availableSeats = allSeats.filter(
    (seat) => !occupiedSeats.includes(seat),
  );

  return { availableSeats, occupiedSeats };
}
