import { supabase } from "./supabaseClient";
import { updateLobbyPresence } from "./mutations";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceUser {
  user_id: string;
  name: string;
  flag: string;
  role: string;
  timestamp: string;
  is_active: boolean;
  lobby_presence?: string;
  video_presence?: boolean;
}

export interface PresenceState {
  [key: string]: PresenceUser;
}

/**
 * Enhanced Presence Helper using Supabase Realtime Policies
 * Leverages native presence tracking with broadcast support
 */
export class EnhancedPresenceHelper {
  private channel: RealtimeChannel | null = null;
  private sessionId: string;
  private currentUser: PresenceUser | null = null;
  private onPresenceChange: ((state: PresenceState) => void) | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Join presence using native Supabase presence with enhanced broadcasting
   */
  async joinPresence(user: PresenceUser): Promise<void> {
    if (this.channel) {
      await this.leavePresence();
    }

    this.currentUser = user;

    // Create enhanced channel with presence and broadcast capabilities
    this.channel = supabase.channel(`enhanced_presence_${this.sessionId}`, {
      config: {
        presence: {
          key: user.user_id,
        },
        broadcast: { self: true },
      },
    });

    // Set up presence event handlers
    this.channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = this.channel?.presenceState();
        if (this.onPresenceChange && presenceState) {
          this.onPresenceChange(this.formatPresenceState(presenceState));
        }
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("Enhanced presence - User joined:", key, newPresences);

        // Broadcast user join event for immediate UI updates
        this.broadcastPresenceEvent("user_joined", {
          userId: key,
          userData: newPresences[0],
          timestamp: new Date().toISOString(),
        });

        const presenceState = this.channel?.presenceState();
        if (this.onPresenceChange && presenceState) {
          this.onPresenceChange(this.formatPresenceState(presenceState));
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("Enhanced presence - User left:", key, leftPresences);

        // Broadcast user leave event
        this.broadcastPresenceEvent("user_left", {
          userId: key,
          userData: leftPresences[0],
          timestamp: new Date().toISOString(),
        });

        const presenceState = this.channel?.presenceState();
        if (this.onPresenceChange && presenceState) {
          this.onPresenceChange(this.formatPresenceState(presenceState));
        }
      })
      .on("broadcast", { event: "presence_update" }, (payload) => {
        console.log("Presence broadcast received:", payload);
        // Handle custom presence broadcasts for immediate UI updates
        this.handlePresenceBroadcast(payload.payload);
      });

    // Subscribe and track presence
    await this.channel.subscribe(async (status: string) => {
      console.log("Enhanced presence subscription status:", status);

      if (status === "SUBSCRIBED") {
        const presenceData = {
          user_id: user.user_id,
          name: user.name,
          flag: user.flag,
          role: user.role,
          timestamp: new Date().toISOString(),
          is_active: true,
          lobby_presence: "Joined",
          video_presence: false,
          join_at: new Date().toISOString(),
          disconnect_at: null,
        };

        await this.channel?.track(presenceData);

        // Start heartbeat for presence maintenance
        this.startHeartbeat();
      }
    });

    // Update database presence status
    await this.updateDatabasePresence(user.user_id, true);
  }

  /**
   * Leave presence with enhanced cleanup
   */
  async leavePresence(): Promise<void> {
    if (this.channel && this.currentUser) {
      // Stop heartbeat
      this.stopHeartbeat();

      // Broadcast leave event before actually leaving
      this.broadcastPresenceEvent("user_leaving", {
        userId: this.currentUser.user_id,
        timestamp: new Date().toISOString(),
      });

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
   * Update activity with enhanced broadcasting
   */
  async updateActivity(): Promise<void> {
    if (this.channel && this.currentUser) {
      const activityData = {
        ...this.currentUser,
        timestamp: new Date().toISOString(),
        is_active: true,
        last_activity: new Date().toISOString(),
      };

      await this.channel.track(activityData);

      // Broadcast activity update for real-time UI updates
      this.broadcastPresenceEvent("activity_update", {
        userId: this.currentUser.user_id,
        timestamp: activityData.timestamp,
      });
    }
  }

  /**
   * Update lobby presence status with broadcast
   */
  async updateLobbyStatus(
    status: "Joined" | "NotJoined" | "Disconnected",
  ): Promise<void> {
    if (this.channel && this.currentUser) {
      const updatedData = {
        ...this.currentUser,
        lobby_presence: status,
        timestamp: new Date().toISOString(),
      };

      await this.channel.track(updatedData);

      // Broadcast lobby status change
      this.broadcastPresenceEvent("lobby_status_changed", {
        userId: this.currentUser.user_id,
        status,
        timestamp: updatedData.timestamp,
      });

      // Update database
      await updateLobbyPresence(this.currentUser.user_id, status);
    }
  }

  /**
   * Update video presence status with broadcast
   */
  async updateVideoStatus(inVideo: boolean): Promise<void> {
    if (this.channel && this.currentUser) {
      const updatedData = {
        ...this.currentUser,
        video_presence: inVideo,
        timestamp: new Date().toISOString(),
      };

      await this.channel.track(updatedData);

      // Broadcast video status change
      this.broadcastPresenceEvent("video_status_changed", {
        userId: this.currentUser.user_id,
        inVideo,
        timestamp: updatedData.timestamp,
      });
    }
  }

  /**
   * Send a custom presence broadcast
   */
  private broadcastPresenceEvent(
    event: string,
    data: Record<string, unknown>,
  ): void {
    if (!this.channel) return;

    this.channel.send({
      type: "broadcast",
      event: "presence_update",
      payload: {
        event,
        data,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Handle incoming presence broadcasts
   */
  private handlePresenceBroadcast(payload: {
    event: string;
    data: Record<string, unknown>;
    sessionId: string;
    timestamp: string;
  }): void {
    const { event, data } = payload;

    switch (event) {
      case "user_joined":
        console.log("User joined via broadcast:", data);
        break;
      case "user_left":
        console.log("User left via broadcast:", data);
        break;
      case "activity_update":
        console.log("Activity update via broadcast:", data);
        break;
      case "lobby_status_changed":
        console.log("Lobby status changed via broadcast:", data);
        break;
      case "video_status_changed":
        console.log("Video status changed via broadcast:", data);
        break;
      default:
        console.log("Unknown presence broadcast:", event, data);
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Ensure no duplicate intervals

    this.heartbeatInterval = setInterval(() => {
      this.updateActivity();
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
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
  private formatPresenceState(
    rawState: Record<string, unknown[]>,
  ): PresenceState {
    const formatted: PresenceState = {};

    Object.keys(rawState).forEach((key) => {
      const presences = rawState[key];
      if (presences && presences.length > 0) {
        // Take the most recent presence for each user
        const latestPresence = presences[presences.length - 1] as PresenceUser;
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
}

/**
 * React hook for enhanced presence
 */
export const useEnhancedPresence = (
  sessionId: string,
  user: PresenceUser | null,
) => {
  let presenceHelper: EnhancedPresenceHelper | null = null;

  const initialize = async () => {
    if (!user || !sessionId) return null;

    presenceHelper = new EnhancedPresenceHelper(sessionId);
    await presenceHelper.joinPresence(user);

    return presenceHelper;
  };

  const cleanup = async () => {
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

export default EnhancedPresenceHelper;
