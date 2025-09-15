import type { ParticipantRole } from "./types";

/**
 * Interface for participant data that includes role information
 */
interface ParticipantWithRole {
  role: ParticipantRole | string;
  [key: string]: unknown;
}

/**
 * Filter participants to only include those that should be displayed in lobby/game UI.
 * Excludes GameMaster role which is for configuration/moderation only.
 */
export function getDisplayParticipants<T extends ParticipantWithRole>(
  participants: T[],
): T[] {
  return participants.filter((p) => p.role !== "GameMaster");
}

/**
 * Get participants that should count towards player slots (Host + Players).
 * Excludes GameMaster role.
 */
export function getSlotParticipants<T extends ParticipantWithRole>(
  participants: T[],
): T[] {
  return participants.filter((p) =>
    ["Host", "Player1", "Player2"].includes(p.role as string),
  );
}

/**
 * Get only player participants (Player1, Player2), excluding Host and GameMaster.
 */
export function getPlayerParticipants<T extends ParticipantWithRole>(
  participants: T[],
): T[] {
  return participants.filter((p) =>
    ["Player1", "Player2"].includes(p.role as string),
  );
}

/**
 * Check if a participant has moderation privileges (Host or GameMaster).
 */
export function canModerate(role: ParticipantRole | string): boolean {
  return ["Host", "GameMaster"].includes(role as string);
}

/**
 * Get appropriate role icon for UI display.
 */
export function getRoleIcon(role: ParticipantRole | string): string {
  switch (role) {
    case "Host":
      return "👑";
    case "GameMaster":
      return "🎮"; // Different icon for GameMaster
    case "Player1":
      return "🎮";
    case "Player2":
      return "🎯";
    default:
      return "👤";
  }
}

/**
 * Get human-readable role display name.
 */
export function getRoleDisplayName(role: ParticipantRole | string): string {
  switch (role) {
    case "Host":
      return "Host";
    case "GameMaster":
      return "Game Master";
    case "Player1":
      return "Player A";
    case "Player2":
      return "Player B";
    default:
      return "Participant";
  }
}

/**
 * Calculate total available slots for display participants (Host + 2 Players = 3).
 * GameMaster doesn't count towards this limit.
 */
export const DISPLAY_PARTICIPANT_SLOTS = 3;
