import { supabase } from "./supabaseClient";
import { updateLobbyPresence } from "./mutations";

export interface PresenceUser {
  user_id: string;
  name: string;
  flag: string;
  role: string;
  timestamp: string;
  is_active: boolean;
}

export interface PresenceState {
  [key: string]: PresenceUser;
}

/**
 * Presence Helper Utility
 * Manages realtime presence tracking for players in a session
 */
export class PresenceHelper {
  private channel: any = null;
  private sessionId: string;
  private currentUser: PresenceUser | null = null;
  private onPresenceChange: ((state: PresenceState) => void) | null = null;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Initialize presence tracking for the current user
   */
  async joinPresence(user: PresenceUser): Promise<void> {
    if (this.channel) {
      await this.leavePresence();
    }

    this.currentUser = user;

    this.channel = supabase.channel(`presence_${this.sessionId}`, {
      config: {
        presence: {
          key: user.user_id,
        },
      },
    });

    // Track presence changes
    this.channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = this.channel.presenceState();
        if (this.onPresenceChange) {
          this.onPresenceChange(this.formatPresenceState(presenceState));
        }
      })
      .on("presence", { event: "join" }, ({ key, newPresences }: any) => {
        console.log("User joined:", key, newPresences);
        const presenceState = this.channel.presenceState();
        if (this.onPresenceChange) {
          this.onPresenceChange(this.formatPresenceState(presenceState));
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }: any) => {
        console.log("User left:", key, leftPresences);
        const presenceState = this.channel.presenceState();
        if (this.onPresenceChange) {
          this.onPresenceChange(this.formatPresenceState(presenceState));
        }
      });

    // Subscribe and track this user's presence
    await this.channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        // Track the current user
        await this.channel.track({
          ...user,
          timestamp: new Date().toISOString(),
          is_active: true,
        });
      }
    });

    // Update database presence status
    await this.updateDatabasePresence(user.user_id, true);
  }

  /**
   * Leave presence tracking
   */
  async leavePresence(): Promise<void> {
    if (this.channel && this.currentUser) {
      // Update database to mark as disconnected
      await this.updateDatabasePresence(this.currentUser.user_id, false);

      // Untrack presence
      await this.channel.untrack();

      // Unsubscribe from channel
      await this.channel.unsubscribe();

      this.channel = null;
      this.currentUser = null;
    }
  }

  /**
   * Update user's activity status (heartbeat)
   */
  async updateActivity(): Promise<void> {
    if (this.channel && this.currentUser) {
      await this.channel.track({
        ...this.currentUser,
        timestamp: new Date().toISOString(),
        is_active: true,
      });
    }
  }

  /**
   * Set callback for presence state changes
   */
  onPresenceUpdate(callback: (state: PresenceState) => void): void {
    this.onPresenceChange = callback;
  }

  /**
   * Get current presence state
   */
  getCurrentPresence(): PresenceState {
    if (!this.channel) return {};
    return this.formatPresenceState(this.channel.presenceState());
  }

  /**
   * Get list of active users
   */
  getActiveUsers(): PresenceUser[] {
    const presence = this.getCurrentPresence();
    return Object.values(presence).filter((user) => user.is_active);
  }

  /**
   * Check if a specific user is online
   */
  isUserOnline(userId: string): boolean {
    const presence = this.getCurrentPresence();
    return presence[userId]?.is_active || false;
  }

  /**
   * Get count of active users
   */
  getActiveUserCount(): number {
    return this.getActiveUsers().length;
  }

  /**
   * Private method to format presence state
   */
  private formatPresenceState(rawState: any): PresenceState {
    const formatted: PresenceState = {};

    Object.keys(rawState).forEach((key) => {
      const presences = rawState[key];
      if (presences && presences.length > 0) {
        // Take the most recent presence for each user
        const latestPresence = presences[presences.length - 1];
        formatted[key] = latestPresence;
      }
    });

    return formatted;
  }

  /**
   * Private method to update database presence
   */
  private async updateDatabasePresence(
    userId: string,
    isConnected: boolean,
  ): Promise<void> {
    try {
      if (isConnected) {
        await updateLobbyPresence(userId, "Joined");
      } else {
        await updateLobbyPresence(userId, "Disconnected");
      }
    } catch (err) {
      console.error("Failed to update database presence:", err);
    }
  }

  /**
   * Static method to create a heartbeat interval
   */
  static createHeartbeat(
    presenceHelper: PresenceHelper,
    intervalMs: number = 30000,
  ): NodeJS.Timeout {
    return setInterval(() => {
      presenceHelper.updateActivity();
    }, intervalMs);
  }

  /**
   * Static method to clear heartbeat
   */
  static clearHeartbeat(heartbeatId: NodeJS.Timeout): void {
    clearInterval(heartbeatId);
  }
}

/**
 * Hook-like function to use presence in React components
 */
export const usePresence = (sessionId: string, user: PresenceUser | null) => {
  let presenceHelper: PresenceHelper | null = null;
  let heartbeat: NodeJS.Timeout | null = null;

  const initialize = async () => {
    if (!user || !sessionId) return;

    presenceHelper = new PresenceHelper(sessionId);
    await presenceHelper.joinPresence(user);

    // Start heartbeat
    heartbeat = PresenceHelper.createHeartbeat(presenceHelper);

    return presenceHelper;
  };

  const cleanup = async () => {
    if (heartbeat) {
      PresenceHelper.clearHeartbeat(heartbeat);
      heartbeat = null;
    }

    if (presenceHelper) {
      await presenceHelper.leavePresence();
      presenceHelper = null;
    }
  };

  return {
    initialize,
    cleanup,
    getPresenceHelper: () => presenceHelper,
  };
};

export default PresenceHelper;
