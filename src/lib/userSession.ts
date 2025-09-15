import { Logger } from "./logger";
// User session management with consolidated localStorage
import type { ParticipantRole } from "./types";

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
}

// Initialize on import
UserSession.init();
