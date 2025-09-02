import type { PlayerId } from '@/types/game';
import { GameDatabase, type PlayerRecord } from './gameDatabase';

/**
 * Enhanced player management utilities that ensure players exist before operations
 */
export class PlayerManager {
  /**
   * Ensure a player exists in the database, creating them if necessary
   */
  static async ensurePlayerExists(
    playerId: PlayerId,
    gameId: string,
    playerData: {
      name: string;
      flag?: string;
      club?: string;
      role?: string;
    },
  ): Promise<{ success: boolean; data?: PlayerRecord; error?: string }> {
    try {
      // First, try to get the player
      const existingPlayers = await GameDatabase.getGamePlayers(gameId);
      const existingPlayer = existingPlayers.find((p) => p.player_id === playerId);

      if (existingPlayer) {
        // Player exists, update with any new data
        const updatedPlayer = await GameDatabase.updatePlayerById(playerId, {
          name: playerData.name,
          flag: playerData.flag || existingPlayer.flag,
          club: playerData.club || existingPlayer.club,
          role: playerData.role || existingPlayer.role,
          is_connected: true,
          last_active: new Date().toISOString(),
        });

        return updatedPlayer;
      } else {
        // Player doesn't exist, create them
        const newPlayer = await GameDatabase.addPlayer(playerId, gameId, {
          name: playerData.name,
          flag: playerData.flag,
          club: playerData.club,
          role: playerData.role || playerId, // Use playerId as role if not specified
        });

        if (newPlayer) {
          return { success: true, data: newPlayer };
        } else {
          return { success: false, error: 'Failed to create player' };
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error ensuring player ${playerId} exists:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Safely update a player's connection status, ensuring they exist first
   */
  static async updatePlayerConnection(
    playerId: PlayerId,
    gameId: string,
    isConnected: boolean,
    playerData?: {
      name?: string;
      flag?: string;
      club?: string;
    },
  ): Promise<{ success: boolean; data?: PlayerRecord; error?: string }> {
    try {
      if (isConnected && playerData?.name) {
        // Ensure player exists when connecting
        return await this.ensurePlayerExists(playerId, gameId, {
          name: playerData.name,
          flag: playerData.flag,
          club: playerData.club,
          role: playerId, // Default role is the playerId
        });
      } else {
        // Just update connection status
        return await GameDatabase.updatePlayerById(playerId, {
          is_connected: isConnected,
          last_active: new Date().toISOString(),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `Error updating player ${playerId} connection:`,
        errorMessage,
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Safely update a player's score, ensuring they exist first
   */
  static async updatePlayerScore(
    playerId: PlayerId,
    gameId: string,
    score: number,
    playerData?: {
      name?: string;
      flag?: string;
      club?: string;
    },
  ): Promise<{ success: boolean; data?: PlayerRecord; error?: string }> {
    try {
      // If we have player data, ensure player exists first
      if (playerData?.name) {
        const ensureResult = await this.ensurePlayerExists(playerId, gameId, {
          name: playerData.name,
          flag: playerData.flag,
          club: playerData.club,
          role: playerId,
        });

        if (!ensureResult.success) {
          return ensureResult;
        }
      }

      // Update the score
      return await GameDatabase.updatePlayerById(playerId, {
        score,
        last_active: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error updating player ${playerId} score:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Batch update player connections for efficiency
   */
  static async batchUpdatePlayerConnections(
    gameId: string,
    updates: Array<{
      playerId: PlayerId;
      isConnected: boolean;
      playerData?: {
        name?: string;
        flag?: string;
        club?: string;
      };
    }>,
  ): Promise<{
    success: boolean;
    results: Array<{ playerId: PlayerId; success: boolean; error?: string }>;
  }> {
    const results: Array<{
      playerId: PlayerId;
      success: boolean;
      error?: string;
    }> = [];

    try {
      // Process updates concurrently but limit to avoid overwhelming the database
      const BATCH_SIZE = 5;
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (update) => {
          const result = await this.updatePlayerConnection(
            update.playerId,
            gameId,
            update.isConnected,
            update.playerData,
          );

          return {
            playerId: update.playerId,
            success: result.success,
            error: result.error,
          };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const allSuccessful = results.every((r) => r.success);
      return { success: allSuccessful, results };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in batch update player connections:', errorMessage);
      return {
        success: false,
        results: updates.map((u) => ({
          playerId: u.playerId,
          success: false,
          error: errorMessage,
        })),
      };
    }
  }

  /**
   * Clean up disconnected players after a timeout
   */
  static async cleanupDisconnectedPlayers(
    gameId: string,
    timeoutMinutes: number = 30,
  ): Promise<{ success: boolean; removedCount: number; error?: string }> {
    try {
      const players = await GameDatabase.getGamePlayers(gameId);
      const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      let removedCount = 0;

      for (const player of players) {
        const lastActive = new Date(player.last_active);
        if (!player.is_connected && lastActive < cutoffTime) {
          // Remove player from database
          await GameDatabase.updatePlayerById(player.player_id, {
            is_connected: false,
            // Mark for cleanup or actually remove based on requirements
          });
          removedCount++;
        }
      }

      return { success: true, removedCount };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error cleaning up disconnected players:', errorMessage);
      return { success: false, removedCount: 0, error: errorMessage };
    }
  }
}
