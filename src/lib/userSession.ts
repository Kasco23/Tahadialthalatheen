import { Logger } from "./logger";
import { saveSession, loadSession, type BlobSessionData } from "./blobStore";
// User session management with Netlify Blobs and localStorage fallback
import type { ParticipantRole } from "./types";

/**
 * User Session Management
 * 
 * Hybrid Implementation: Netlify Blobs + localStorage
 * 
 * Primary Storage (Netlify Blobs via Edge Functions):
 * - Cross-device session persistence
 * - Server-side storage through edge functions
 * - Better security and validation
 * - Persists across browser clears
 * 
 * Fallback Storage (localStorage):
 * - Offline support when network unavailable
 * - Fast synchronous access
 * - Browser-specific persistence
 * 
 * Rationale:
 * - Netlify Blobs provide the best of both worlds for session management
 * - Edge Functions act as secure proxy for blob operations
 * - localStorage ensures app works offline and provides instant feedback
 * - This hybrid approach maximizes availability and user experience
 */

export interface UserSessionData {
  participantId?: string;
  sessionCode?: string;
  participantName?: string;
  role?: ParticipantRole;
  isHost?: boolean;
  flag?: string;
  teamLogoUrl?: string;
  teamName?: string;
}

const SESSION_KEY = "tt_user_session";

export class UserSession {
  private static data: UserSessionData = {};

  // Initialize from localStorage
  static init(): void {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        // Migrate from old localStorage keys if they exist
        this.migrateOldKeys();
      }
    } catch (error) {
      Logger.warn("Failed to parse user session data:", error);
      this.data = {};
    }
  }

  // Migrate from old individual localStorage keys
  private static migrateOldKeys(): void {
    const oldKeys = [
      "participantId",
      "sessionCode",
      "playerName",
      "hostName",
      "tt_participant_name",
      "isHost",
      "userRole",
      "selectedFlag",
      "teamLogoUrl",
      "teamName",
    ];

    const migrated: UserSessionData = {};

    // Consolidate participant name from various sources
    migrated.participantName =
      localStorage.getItem("tt_participant_name") ||
      localStorage.getItem("playerName") ||
      localStorage.getItem("hostName") ||
      undefined;

    // Consolidate other fields
    migrated.participantId = localStorage.getItem("participantId") || undefined;
    migrated.sessionCode = localStorage.getItem("sessionCode") || undefined;
    migrated.isHost = localStorage.getItem("isHost") === "true";
    migrated.role =
      (localStorage.getItem("userRole") as ParticipantRole) ||
      (migrated.isHost ? "Host" : "Player1");
    migrated.flag = localStorage.getItem("selectedFlag") || undefined;
    migrated.teamLogoUrl = localStorage.getItem("teamLogoUrl") || undefined;
    migrated.teamName = localStorage.getItem("teamName") || undefined;

    // Save consolidated data
    this.set(migrated);

    // Clean up old keys
    oldKeys.forEach((key) => localStorage.removeItem(key));
  }

  // Get all session data
  static get(): UserSessionData {
    return { ...this.data };
  }

  // Set session data (partial update)
  static set(updates: Partial<UserSessionData>): void {
    this.data = { ...this.data, ...updates };
    this.save();
    
    // Attempt to sync to blob store if we have session and participant info
    if (this.data.sessionCode && this.data.participantId) {
      this.syncToBlob().catch((error) => {
        Logger.warn("Failed to sync session to blob store:", error);
      });
    }
  }

  // Get specific field
  static getField<K extends keyof UserSessionData>(key: K): UserSessionData[K] {
    return this.data[key];
  }

  // Set specific field
  static setField<K extends keyof UserSessionData>(
    key: K,
    value: UserSessionData[K],
  ): void {
    this.data[key] = value;
    this.save();
  }

  // Clear all session data
  static clear(): void {
    this.data = {};
    localStorage.removeItem(SESSION_KEY);
  }

  // Save to localStorage
  private static save(): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.data));
    } catch (error) {
      Logger.warn("Failed to save user session data:", error);
    }
  }

  // Convenience getters
  static get participantId(): string | undefined {
    return this.data.participantId;
  }

  static get participantName(): string | undefined {
    return this.data.participantName;
  }

  static get sessionCode(): string | undefined {
    return this.data.sessionCode;
  }

  static get role(): ParticipantRole | undefined {
    return this.data.role;
  }

  static get isHost(): boolean {
    return this.data.isHost || false;
  }

  static get canModerate(): boolean {
    return ["Host", "GameMaster"].includes(this.data.role || "");
  }

  // Sync session data to Netlify Blobs (async operation)
  private static async syncToBlob(): Promise<void> {
    const { sessionCode, participantId } = this.data;
    
    if (!sessionCode || !participantId) {
      Logger.warn("Cannot sync to blob: missing sessionCode or participantId");
      return;
    }

    try {
      const blobData: BlobSessionData = {
        ...this.data,
      };
      
      const success = await saveSession(sessionCode, participantId, blobData);
      if (success) {
        Logger.log("Session synced to blob store successfully");
      }
    } catch (error) {
      Logger.error("Error syncing session to blob store:", error);
      // Don't throw - we have localStorage as fallback
    }
  }

  // Load session data from Netlify Blobs (async operation)
  static async loadFromBlob(
    sessionCode: string,
    participantId: string
  ): Promise<boolean> {
    try {
      const blobData = await loadSession(sessionCode, participantId);
      
      if (blobData) {
        // Merge blob data with existing data, preferring blob data
        this.data = {
          ...this.data,
          ...blobData,
        };
        this.save(); // Save to localStorage as well
        Logger.log("Session loaded from blob store successfully");
        return true;
      }
      
      Logger.log("No session data found in blob store");
      return false;
    } catch (error) {
      Logger.error("Error loading session from blob store:", error);
      return false;
    }
  }
}

// Initialize on import
UserSession.init();

// Seat-based routing functions
export const getSeatFromStorage = (): string | null => {
  return localStorage.getItem("userSeat");
};

export const setSeatInStorage = (seat: string): void => {
  localStorage.setItem("userSeat", seat);
};

export const clearSeatFromStorage = (): void => {
  localStorage.removeItem("userSeat");
};

export const resolveSeatFromUrl = (seatParam?: string): string | null => {
  if (seatParam && ["1", "2", "3"].includes(seatParam)) {
    return seatParam;
  }
  return getSeatFromStorage();
};

// Map participant roles to seat numbers for URL routing
export const getSeatsFromRole = (role: ParticipantRole): string | null => {
  switch (role) {
    case "Host":
      return "1";
    case "Player1":
      return "2";
    case "Player2":
      return "3";
    case "GameMaster":
      return "1"; // GameMaster shares seat with Host
    default:
      return null;
  }
};
