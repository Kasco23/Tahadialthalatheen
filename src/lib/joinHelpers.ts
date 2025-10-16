import { Logger } from "./logger";
import { supabase } from "./supabaseClient";
import type { ParticipantRole } from "./types";

/**
 * Join Helper Functions
 *
 * Extracted from Join.tsx to improve code organization and maintainability.
 * Contains reusable logic for join operations, preset checking, and navigation.
 */

export interface ExistingParticipant {
  participant_id: string;
  name: string;
  role: string;
  flag: string | null;
  team_logo_url: string | null;
  lobby_presence: string;
}

/**
 * Check if there are existing participants for a session
 * Used to determine if rejoin button should be shown
 */
export async function checkForExistingParticipants(
  sessionCode: string,
  role: "host" | "player",
): Promise<ExistingParticipant[]> {
  try {
    // Get session ID from code
    const { data: sessionData, error: sessionError } = await supabase
      .from("Session")
      .select("session_id")
      .eq("session_code", sessionCode.toUpperCase())
      .single();

    if (sessionError || !sessionData) {
      Logger.log("Session not found for code:", sessionCode);
      return [];
    }

    // Get participants for the session
    const { data: participants, error: participantsError } = await supabase
      .from("Participant")
      .select("participant_id, name, role, flag, team_logo_url, lobby_presence")
      .eq("session_id", sessionData.session_id)
      .order("join_at", { ascending: true });

    if (participantsError) {
      Logger.error("Error fetching participants:", participantsError);
      return [];
    }

    // Filter participants based on role
    const filtered =
      role === "host"
        ? (participants || []).filter((p) => p.role === "Host")
        : (participants || []).filter(
            (p) => p.role === "Player1" || p.role === "Player2",
          );

    return filtered as ExistingParticipant[];
  } catch (error) {
    Logger.error("Error checking for existing participants:", error);
    return [];
  }
}

/**
 * Store participant data in localStorage after successful join
 */
export function storeParticipantData(
  participantId: string,
  sessionCode: string,
  role: string,
  isHost: boolean,
  participantName?: string,
  flag?: string,
  logoUrl?: string,
  teamName?: string,
): void {
  try {
    localStorage.setItem("participantId", participantId);
    localStorage.setItem("sessionCode", sessionCode);
    localStorage.setItem("userRole", role);
    localStorage.setItem("isHost", isHost ? "true" : "false");

    if (participantName) {
      localStorage.setItem("playerName", participantName);
      localStorage.setItem("tt_participant_name", participantName);
    }

    if (flag) {
      localStorage.setItem("selectedFlag", flag);
    }

    if (logoUrl) {
      localStorage.setItem("teamLogoUrl", logoUrl);
    }

    if (teamName) {
      localStorage.setItem("teamName", teamName);
    }

    Logger.log("Participant data stored in localStorage");
  } catch (error) {
    Logger.warn("Could not save to localStorage:", error);
  }
}

/**
 * Get the lobby URL for navigation after join
 * Note: role parameter kept for potential future use but currently not utilized
 */
export function getLobbyUrl(
  sessionCode: string,
  _role: ParticipantRole,
  seat?: string | null,
): string {
  if (seat) {
    return `/lobby/${sessionCode}/${seat}`;
  }
  return `/lobby/${sessionCode}`;
}

/**
 * Extract team name from logo URL
 */
export function extractTeamNameFromLogoUrl(logoUrl: string): string {
  const parts = logoUrl.split("/");
  const filename = parts[parts.length - 1];
  const nameWithoutExt = filename.split(".")[0];
  return nameWithoutExt || "Selected Team";
}

/**
 * Check for existing preset based on participant name
 */
export interface ExistingPreset {
  flag: string | null;
  team_logo_url: string | null;
  name: string;
  role: string;
}

export async function checkForExistingPreset(
  name: string,
  sessionCode?: string,
  // Note: Role parameter kept for backward compatibility but not used for more flexible preset matching
  _role?: string,
): Promise<ExistingPreset | null> {
  try {
    let query = supabase
      .from("Participant")
      .select(
        "name, flag, team_logo_url, role, session_id, Session!inner(session_code)",
      )
      .ilike("name", name)
      .not("flag", "is", null)
      .not("team_logo_url", "is", null)
      .order("join_at", { ascending: false });

    if (sessionCode) {
      query = query.eq("Session.session_code", sessionCode.toUpperCase());
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      Logger.error("Error checking existing preset:", error);
      return null;
    }

    return data as ExistingPreset | null;
  } catch (error) {
    Logger.error("Error in checkForExistingPreset:", error);
    return null;
  }
}
