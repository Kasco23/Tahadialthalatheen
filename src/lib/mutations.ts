import { supabase } from "./supabaseClient";
import { dailyTokenManager } from "./dailyTokenManager";
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
  hostPassword: string,
  hostName?: string,
): Promise<{ sessionId: string; sessionCode: string }> {
  // Create the session; DB trigger will populate session_code
  const { data: sessionData, error: sessionError } = await supabase
    .from("Session")
    .insert({
      host_password: hostPassword,
      phase: "Setup",
      game_state: "pre-quiz",
    })
    .select("session_id, session_code")
    .single();

  if (sessionError) {
    throw new Error(`Failed to create session: ${sessionError.message}`);
  }

  // Create both GameMaster (PC user) and Host (mobile user) participants
  const participantsToCreate = [
    {
      session_id: sessionData.session_id,
      name: "GameMaster", // PC user who created the session
      role: "GameMaster",
      lobby_presence: "Joined", // PC user is immediately joined
    },
    {
      session_id: sessionData.session_id,
      name: hostName || "Host", // Mobile user who will join later
      role: "Host",
      lobby_presence: "NotJoined", // Will join via mobile
    },
  ];

  const { error: participantError } = await supabase
    .from("Participant")
    .insert(participantsToCreate);

  if (participantError) {
    throw new Error(
      `Failed to create participants: ${participantError.message}`,
    );
  }

  return {
    sessionId: sessionData.session_id,
    sessionCode: sessionData.session_code,
  };
}

// Function to fetch active sessions for the Active Games component
export async function getActiveSessions(): Promise<ActiveSession[]> {
  const { data, error } = await supabase
    .from("Session")
    .select(
      `
      session_id,
      session_code,
      phase,
      game_state,
      created_at,
      ended_at,
      Participant(name, role),
      DailyRoom(room_url)
    `,
    )
    // Show any session that hasn't ended yet
    .is("ended_at", null);

  if (error) {
    console.error("Error fetching active sessions:", error);
    throw new Error(`Failed to fetch active sessions: ${error.message}`);
  }

  console.log("Raw data from Supabase:", data);

  // Transform the data to match our interface
  type SessionRow = {
    session_id: string;
    session_code: string;
    phase: SessionPhase;
    game_state: GameState;
    created_at: string;
    ended_at?: string | null;
    Participant?: Array<{ name: string; role: string }> | null;
    DailyRoom?: Array<{ room_url?: string }> | null;
  };

  const rows = (data as SessionRow[]) || [];

  const activeSessions: ActiveSession[] = rows.map((session) => {
    const participants = Array.isArray(session.Participant)
      ? session.Participant
      : [];
    const hostParticipant = participants.find((p) => p.role === "Host");
    // Only count Player1 and Player2 roles for participant count
    const playerCount = participants.filter(
      (p) => p.role === "Player1" || p.role === "Player2",
    ).length;
    const hasDailyRoom = !!(session.DailyRoom && session.DailyRoom.length > 0);

    return {
      session_id: session.session_id,
      session_code: session.session_code,
      phase: session.phase,
      game_state: session.game_state,
      created_at: session.created_at,
      host_name: hostParticipant ? hostParticipant.name : "Unknown Host",
      participant_count: playerCount,
      has_daily_room: hasDailyRoom,
    };
  });

  console.log("Transformed active sessions:", activeSessions);
  return activeSessions;
}

// Helper function to resolve session_code to session_id
export async function getSessionIdByCode(sessionCode: string): Promise<string> {
  const { data, error } = await supabase
    .from("Session")
    .select("session_id")
    .eq("session_code", sessionCode.toUpperCase())
    .single();

  if (error) {
    throw new Error(`Session not found: ${error.message}`);
  }

  return data.session_id;
}

type ParticipantIdRow = { participant_id: string };

// Helper to fetch participant_id by session and name
async function getParticipantIdBySessionAndName(
  sessionId: string,
  name: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("Participant")
    .select("participant_id")
    .eq("session_id", sessionId)
    .eq("name", name)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Participant not found: ${error?.message || "no data"}`);
  }

  return (data as ParticipantIdRow).participant_id;
}

// Wrapper function for joining as player with session code
export async function joinAsPlayerWithCode(
  sessionCode: string,
  name: string,
  flag: string,
  logoUrl: string,
): Promise<string> {
  const sessionId = await getSessionIdByCode(sessionCode);

  // First, check if player with this name already exists for the session
  try {
    const { data: existing, error: existingErr } = await supabase
      .from("Participant")
      .select("participant_id, role")
      .eq("session_id", sessionId)
      .eq("name", name)
      .limit(1)
      .single();

    type ExistingRow = { participant_id: string; role?: string } | null;

    if (!existingErr && (existing as ExistingRow)) {
      const existingRow = existing as ExistingRow;
      // Update presence with timestamps and return existing id
      await supabase
        .from("Participant")
        .update({
          lobby_presence: "Joined",
          join_at: new Date().toISOString(),
          disconnect_at: null,
        })
        .eq("participant_id", existingRow!.participant_id);
      return existingRow!.participant_id;
    }
  } catch (_e) {
    // ignore and continue to create
  }

  // Determine available player role (Player1 or Player2)
  const { data: playersData, error: playersError } = await supabase
    .from("Participant")
    .select("role")
    .eq("session_id", sessionId)
    .in("role", ["Player1", "Player2"]);

  if (playersError) {
    throw new Error(
      `Failed to determine player roles: ${playersError.message || String(playersError)}`,
    );
  }

  const existingRoles: string[] = Array.isArray(playersData)
    ? (playersData as Array<{ role?: string }>).map((r) => r.role || "")
    : [];
  let assignedRole: string;
  if (!existingRoles.includes("Player1")) assignedRole = "Player1";
  else if (!existingRoles.includes("Player2")) assignedRole = "Player2";
  else throw new Error("Session is full (both player slots taken)");

  // Try insert with assigned role
  const insertResultPlayer = await supabase
    .from("Participant")
    .insert({
      session_id: sessionId,
      name,
      flag,
      team_logo_url: logoUrl,
      role: assignedRole,
      lobby_presence: "Joined",
      join_at: new Date().toISOString(),
      disconnect_at: null,
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
    return insertDataPlayer[0].participant_id;
  }

  // If insert failed, try to find existing participant by name as a last resort
  try {
    return await getParticipantIdBySessionAndName(sessionId, name);
  } catch (err) {
    const insertMsg = extractErrorMessage(insertErrorPlayer);
    throw new Error(
      `Failed to join as player: ${insertMsg || (err instanceof Error ? err.message : String(err))}`,
    );
  }
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
    console.log("Creating Daily room with:", { sessionId, sessionCode });

    // Check if we're in local development without Netlify CLI
    const isLocalDev = window.location.hostname === "localhost" && window.location.port === "5173";
    
    if (isLocalDev) {
      console.warn("Running in local development mode - using mock Daily room");
      
      // Create mock Daily room for development
      const mockRoomUrl = `https://thirty.daily.co/${sessionCode.toLowerCase()}`;
      const mockResponse: CreateDailyRoomResponse = {
        room_url: mockRoomUrl,
        room_name: sessionCode,
        session_id: sessionId,
      };

      // Still update the database for consistency
      const { error } = await supabase.from("DailyRoom").upsert({
        room_id: sessionId,
        room_url: mockRoomUrl,
        ready: true,
      });

      if (error) {
        console.error("Database error saving mock Daily room:", error);
        throw new Error(`Failed to save mock Daily room: ${error.message}`);
      }

      console.log("Mock Daily room created successfully:", mockResponse);
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

    console.log("Daily room creation response status:", response.status);

    if (!response.ok) {
      // Clone response to allow reading body multiple times
      const responseClone = response.clone();
      
      // Try to get the error details from the response
      try {
        const errorData = await response.json();
        console.error("Daily room creation error details:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`,
        );
      } catch (_parseError) {
        // If we can't parse JSON, get text from the cloned response
        try {
          const errorText = await responseClone.text();
          console.error("Daily room creation error (raw):", errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, response: ${errorText}`,
          );
        } catch (_textError) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
    }

    const data: CreateDailyRoomResponse = await response.json();
    console.log("Daily room created successfully:", data);

    // Insert/update DailyRoom table
    const { error } = await supabase.from("DailyRoom").upsert({
      room_id: sessionId,
      room_url: data.room_url,
      ready: true,
    });

    if (error) {
      console.error("Database error saving Daily room:", error);
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
      .from("DailyRoom")
      .select("room_url, ready")
      .eq("room_id", sessionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No room found
        return null;
      }
      throw new Error(`Failed to get Daily room: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error getting Daily room:", error);
    return null;
  }
}

// 4. Join as Host - Unified helper function
export async function joinAsHost(
  sessionCode: string,
  hostPassword: string,
  flag?: string,
  logoUrl?: string,
): Promise<string> {
  // Verify host password using RPC with new parameter names
  const { data: isValidPassword, error: rpcError } = await supabase.rpc(
    "verify_host_password",
    {
      session_code_input: sessionCode.toUpperCase(),
      password_input: hostPassword,
    },
  );

  if (rpcError) {
    throw new Error(`Failed to verify password: ${rpcError.message}`);
  }

  if (!isValidPassword) {
    throw new Error("Invalid session code or password");
  }

  // Get the session ID
  const { data: sessionRow, error: sessionError } = await supabase
    .from("Session")
    .select("session_id")
    .eq("session_code", sessionCode.toUpperCase())
    .single();

  if (sessionError || !sessionRow) {
    throw new Error(
      `Session not found: ${sessionError?.message || "No session with that code"}`,
    );
  }

  const sessionId = sessionRow.session_id;

  // First, try to find existing host participant
  const { data: existingHost, error: findError } = await supabase
    .from("Participant")
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
      .from("Participant")
      .update(updateData)
      .eq("participant_id", existingHost.participant_id);

    if (updateError) {
      throw new Error(`Failed to update host: ${updateError.message}`);
    }

    return existingHost.participant_id;
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
    .from("Session")
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
    .from("Participant")
    .select("participant_id")
    .eq("session_id", sessionId)
    .eq("role", "GameMaster")
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to check for existing GameMaster: ${findError.message}`);
  }

  if (existingGameMaster) {
    // Update existing GameMaster
    const { error: updateError } = await supabase
      .from("Participant")
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
    .from("Participant")
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
    .from("Participant")
    .select("role")
    .eq("session_id", sessionId)
    .in("role", ["Player1", "Player2"]);

  if (countError) {
    throw new Error(`Failed to check existing players: ${countError.message}`);
  }

  // Determine role based on existing players
  let role: ParticipantRole;
  const hasPlayer1 = existingPlayers.some((p) => p.role === "Player1");
  const hasPlayer2 = existingPlayers.some((p) => p.role === "Player2");

  if (!hasPlayer1) {
    role = "Player1";
  } else if (!hasPlayer2) {
    role = "Player2";
  } else {
    throw new Error("Session is full - maximum 2 players allowed");
  }

  // Insert participant as player
  const { data, error } = await supabase
    .from("Participant")
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
  const updateData: TablesUpdate<"Participant"> = { lobby_presence: status };

  // Set timestamps based on status
  if (status === "Joined") {
    updateData.join_at = new Date().toISOString();
    updateData.disconnect_at = null;
  } else if (status === "Disconnected") {
    updateData.disconnect_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("Participant")
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

// Daily token retrieval with caching and refresh
export async function createDailyToken(
  roomName: string,
  userName: string,
): Promise<{ token: string }> {
  try {
    const token = await dailyTokenManager.getToken(roomName, userName);
    return { token };
  } catch (error) {
    throw new Error(
      `Failed to get Daily token: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Get cached token info for debugging/monitoring
export function getDailyTokenInfo(roomName: string, userName: string) {
  return dailyTokenManager.getTokenInfo(roomName, userName);
}

// Clear token cache for a specific user
export function clearDailyToken(roomName: string, userName: string): void {
  dailyTokenManager.clearToken(roomName, userName);
}

// Clear all tokens for a room (when session ends)
export function clearRoomTokens(roomName: string): void {
  dailyTokenManager.clearRoomTokens(roomName);
}

export async function updateVideoPresence(
  participantId: string,
  connected: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("Participant")
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
  const updateData: TablesUpdate<"Session"> = { phase };

  if (gameState) {
    updateData.game_state = gameState;
  }

  const { error } = await supabase
    .from("Session")
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
    .from("Score")
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
  const { error } = await supabase.from("Score").upsert(
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
    .from("Participant")
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
    .from("Session")
    .update({
      game_state: "concluded",
      ended_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(`Failed to end session: ${error.message}`);
  }

  // Clean up Daily.co tokens for this session
  if (sessionCode) {
    clearRoomTokens(sessionCode);
  }
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
