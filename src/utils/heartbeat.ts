import { GameDatabase } from '@/lib/gameDatabase';
import { PlayerManager } from '@/lib/playerManager';
import type { PlayerId } from '@/types/game';
import { debugError, debugLog, debugWarn } from './debugLog';

export interface HeartbeatConfig {
  playerId: string;
  sessionId: string; // Updated from gameId
  intervalMs?: number; // Default: 60000 (60s)
  playerData?: {
    name?: string;
    flag?: string;
    club?: string;
  };
  onError?: (_err: Error) => void;
}

export class HeartbeatManager {
  private intervalId: number | null = null;
  private config: HeartbeatConfig;
  private isActive = false;

  constructor(config: HeartbeatConfig) {
    this.config = {
      intervalMs: 60000, // 60 seconds default
      ...config,
    };
  }

  /**
   * Start the heartbeat timer that updates last_active every ~60s
   */
  start(): void {
    if (this.isActive) {
      debugWarn('Heartbeat already active', 'HeartbeatManager', {
        playerId: this.config.playerId,
      });
      return;
    }

    this.isActive = true;

    // Initial heartbeat to mark as connected
    this.beat();

    // Set up interval for regular heartbeats
    this.intervalId = window.setInterval(() => {
      this.beat();
    }, this.config.intervalMs);

    debugLog('Heartbeat started', 'HeartbeatManager', {
      playerId: this.config.playerId,
      intervalMs: this.config.intervalMs,
    });
  }

  /**
   * Stop the heartbeat timer
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isActive = false;
    debugLog('Heartbeat stopped', 'HeartbeatManager', {
      playerId: this.config.playerId,
    });
  }

  /**
   * Send a single heartbeat update to the database
   */
  private async beat(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    try {
      // Use PlayerManager to ensure player exists before updating
      const result = await PlayerManager.updatePlayerConnection(
        this.config.playerId as PlayerId,
        this.config.sessionId, // Updated from gameId
        true,
        {
          name: this.config.playerData?.name || this.config.playerId,
          flag: this.config.playerData?.flag,
          club: this.config.playerData?.club,
        },
      );

      if (!result.success) {
        // Only log error if it's not a "not found" error (player might not exist yet)
        if (result.error !== 'Player not found') {
          debugWarn('Heartbeat failed', 'HeartbeatManager', {
            playerId: this.config.playerId,
            error: result.error,
          });
          this.config.onError?.(
            new Error(result.error || 'Unknown heartbeat error'),
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      debugError('Heartbeat operation failed', 'HeartbeatManager', {
        playerId: this.config.playerId,
        operation: 'heartbeat-beat',
        error: errorMessage,
      });
      this.config.onError?.(
        error instanceof Error ? error : new Error(errorMessage),
      );
    }
  }

  /**
   * Mark player as disconnected in the database
   */
  async markDisconnected(): Promise<void> {
    try {
      const result = await PlayerManager.updatePlayerConnection(
        this.config.playerId as PlayerId,
        this.config.sessionId, // Updated from gameId
        false,
      );

      if (!result.success && result.error !== 'Player not found') {
        debugWarn('Failed to mark player as disconnected', 'HeartbeatManager', {
          playerId: this.config.playerId,
          error: result.error,
        });
      }
    } catch (error) {
      debugError('Error marking player as disconnected', 'HeartbeatManager', {
        playerId: this.config.playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if heartbeat is currently active
   */
  get active(): boolean {
    return this.isActive;
  }
}

/**
 * Utility function to create and manage heartbeats for multiple players
 */
export class MultiPlayerHeartbeat {
  private heartbeats = new Map<string, HeartbeatManager>();

  /**
   * Start heartbeat for a specific player
   */
  startForPlayer(
    playerId: string,
    sessionId: string, // Updated from gameId
    onError?: (_err: Error) => void,
  ): void {
    if (this.heartbeats.has(playerId)) {
      debugWarn('Heartbeat already exists for player', 'MultiPlayerHeartbeat', {
        playerId,
      });
      return;
    }

    const heartbeat = new HeartbeatManager({
      playerId,
      sessionId, // Updated from gameId
      onError,
    });

    this.heartbeats.set(playerId, heartbeat);
    heartbeat.start();
  }

  /**
   * Stop heartbeat for a specific player
   */
  stopForPlayer(playerId: string): void {
    const heartbeat = this.heartbeats.get(playerId);
    if (heartbeat) {
      heartbeat.stop();
      this.heartbeats.delete(playerId);
    }
  }

  /**
   * Mark a player as disconnected
   */
  async markPlayerDisconnected(playerId: string): Promise<void> {
    const heartbeat = this.heartbeats.get(playerId);
    if (heartbeat) {
      await heartbeat.markDisconnected();
      heartbeat.stop();
      this.heartbeats.delete(playerId);
    } else {
      // Even if no heartbeat manager exists, try to mark as disconnected
      try {
        const now = new Date().toISOString();
        await GameDatabase.updatePlayerById(playerId, {
          is_connected: false,
          last_active: now,
        });
      } catch (error) {
        debugError(
          'Error marking player as disconnected',
          'MultiPlayerHeartbeat',
          {
            playerId,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        );
      }
    }
  }

  /**
   * Stop all heartbeats and mark all players as disconnected
   */
  async stopAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [, heartbeat] of this.heartbeats) {
      promises.push(heartbeat.markDisconnected());
      heartbeat.stop();
    }

    await Promise.all(promises);
    this.heartbeats.clear();
  }

  /**
   * Get list of active heartbeat player IDs
   */
  getActivePlayerIds(): string[] {
    return Array.from(this.heartbeats.keys());
  }
}
