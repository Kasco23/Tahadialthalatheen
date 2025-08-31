import type { GameRecord, PlayerRecord } from '@/lib/gameDatabase';
import { PlayerManager } from '@/lib/playerManager';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabaseLazy';
import {
  addPlayerAtom,
  broadcastEventAtom,
  connectionErrorAtom,
  gameSyncInstanceAtom,
  isConnectedToSupabaseAtom,
  lobbyParticipantsAtom,
  updateGameStateAtom,
  updatePlayerAtom,
  type LobbyParticipant,
} from '@/state';
import type { GameState, Player, PlayerId } from '@/types/game';
import { MultiPlayerHeartbeat } from '@/utils/heartbeat';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createStore } from 'jotai';
type Store = ReturnType<typeof createStore>;

function mapPlayerRecord(record: PlayerRecord): Player {
  return {
    id: record.player_id as PlayerId, // Was id
    name: record.name,
    flag: record.flag ?? undefined,
    club: record.club ?? undefined,
    role: record.role,
    score: record.score,
    strikes: record.strikes_legacy, // Was strikes
    isConnected: record.is_connected,
    specialButtons: record.special_buttons as Player['specialButtons'],
  };
}

function mapRecordToState(record: GameRecord): Partial<GameState> {
  return {
    gameId: record.session_id, // Was id
    hostCode: record.host_code,
    hostName: record.host_name ?? null,
    hostIsConnected: record.host_is_connected ?? false,
    phase: record.phase as GameState['phase'],
    currentSegment: record.current_segment as GameState['currentSegment'],
    currentQuestionIndex: record.current_question_index,
    videoRoomUrl: record.video_room_url ?? undefined,
    videoRoomCreated: record.video_room_created,
    timer: record.timer,
    isTimerRunning: record.is_timer_running,
    segmentSettings: record.segment_settings,
  };
}

export class AtomGameSync {
  private gameId: string;
  private store: Store;
  private channel: RealtimeChannel | null = null;
  private gameSubscription: RealtimeChannel | null = null;
  private heartbeatManager: MultiPlayerHeartbeat;

  constructor(gameId: string, store: Store) {
    this.gameId = gameId;
    this.store = store;
    this.heartbeatManager = new MultiPlayerHeartbeat();
  }

  async connect() {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using local state only');
      this.store.set(connectionErrorAtom, 'Supabase not configured');
      return;
    }

    try {
      // Use lazy Supabase client
      const supabase = await getSupabase();

      // Create channel for real-time presence and broadcasts
      this.channel = supabase.channel(`game:${this.gameId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: 'participants' },
        },
      });

      // Listen for game state broadcasts with correct payload structure
      // Get channel reference to avoid repeated casting
      const channel = this.channel;
      if (!channel) return;

      // Use proper type casting for the channel methods
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channelWithMethods = channel as any;

      channelWithMethods.on(
        'broadcast',
        { event: 'game_state_update' },
        (data: { payload?: { gameState?: Partial<GameState> } }) => {
          if (data.payload?.gameState) {
            this.store.set(updateGameStateAtom, data.payload.gameState);
          }
        },
      );

      // Listen for player events with correct payload structure
      channelWithMethods.on(
        'broadcast',
        { event: 'player_join' },
        (data: { payload?: { playerId?: PlayerId; playerData?: unknown } }) => {
          if (data.payload?.playerId && data.payload?.playerData) {
            this.store.set(addPlayerAtom, data.payload.playerData as Player);
          }
        },
      );

      channelWithMethods.on(
        'broadcast',
        { event: 'player_leave' },
        (data: { payload?: { playerId?: PlayerId } }) => {
          if (data.payload?.playerId) {
            this.store.set(updatePlayerAtom, {
              playerId: data.payload.playerId,
              update: { isConnected: false },
            });
          }
        },
      );

      // Handle presence updates
      channelWithMethods.on('presence', { event: 'sync' }, () => {
        this.updatePresenceState();
      });

      channelWithMethods.on('presence', { event: 'join' }, () => {
        this.updatePresenceState();
      });

      channelWithMethods.on('presence', { event: 'leave' }, () => {
        this.updatePresenceState();
      });

      // Subscribe to postgres changes for game and players
      const postgresChannel = supabase.channel(`postgres:${this.gameId}`);

      postgresChannel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${this.gameId}`,
        },
        (payload) => {
          const newRow = payload.new as GameRecord;
          this.store.set(updateGameStateAtom, mapRecordToState(newRow));
        },
      );

      postgresChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${this.gameId}`,
        },
        (payload) => {
          const pl = payload.new as PlayerRecord;
          this.store.set(addPlayerAtom, mapPlayerRecord(pl));
        },
      );

      postgresChannel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${this.gameId}`,
        },
        (payload) => {
          const pl = payload.new as PlayerRecord;
          this.store.set(updatePlayerAtom, {
            playerId: pl.player_id as PlayerId, // Was id
            update: mapPlayerRecord(pl),
          });
        },
      );

      // Store the subscription reference and subscribe
      this.gameSubscription = postgresChannel;
      postgresChannel.subscribe();

      // Subscribe to the main channel
      await channelWithMethods.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Connected to game channel: ${this.gameId}`);
          this.store.set(isConnectedToSupabaseAtom, true);
          this.store.set(connectionErrorAtom, null);
        }
      });

      // Store the instance reference
      this.store.set(gameSyncInstanceAtom, this);
    } catch (error) {
      console.error('Failed to connect to game sync:', error);
      this.store.set(
        connectionErrorAtom,
        error instanceof Error ? error.message : 'Connection failed',
      );
      this.store.set(isConnectedToSupabaseAtom, false);
    }
  }

  private updatePresenceState() {
    if (!this.channel) return;

    const presenceState = this.channel.presenceState();
    const participants: LobbyParticipant[] = [];

    Object.values(presenceState).forEach((presence: unknown) => {
      (presence as unknown[]).forEach((participant: unknown) => {
        const p = participant as LobbyParticipant;
        participants.push({
          id: p.id,
          name: p.name,
          type: p.type,
          playerId: p.playerId,
          flag: p.flag,
          club: p.club,
          isConnected: true,
        });
      });
    });

    // Clear existing participants first, then add current ones
    // This ensures we have accurate presence tracking
    this.store.set(lobbyParticipantsAtom, participants);

    // Also update player connection status if they are tracked players
    participants.forEach((participant) => {
      if (
        participant.playerId &&
        (participant.playerId === 'playerA' ||
          participant.playerId === 'playerB')
      ) {
        this.store.set(updatePlayerAtom, {
          playerId: participant.playerId,
          update: { isConnected: true, name: participant.name },
        });

        // Start heartbeat for connected player
        this.startHeartbeat(participant.playerId);

        // Use PlayerManager to ensure player exists before updating
        PlayerManager.updatePlayerConnection(
          participant.playerId,
          this.gameId,
          true,
          {
            name: participant.name,
            flag: participant.flag,
            club: participant.club,
          },
        )
          .then((result) => {
            if (!result.success) {
              console.warn(
                `Failed to update player ${participant.playerId} connection:`,
                result.error,
              );
            } else {
              console.log(
                `Player ${participant.playerId} connection updated successfully`,
              );
            }
          })
          .catch(console.error);
      }
    });

    // Mark players as disconnected if they're not in presence
    const presentPlayerIds = new Set(
      participants.filter((p) => p.playerId).map((p) => p.playerId),
    );

    ['playerA', 'playerB'].forEach((playerId) => {
      if (!presentPlayerIds.has(playerId as PlayerId)) {
        this.store.set(updatePlayerAtom, {
          playerId: playerId as PlayerId,
          update: { isConnected: false },
        });

        // Stop heartbeat and mark as disconnected
        this.stopHeartbeat(playerId as PlayerId);

        // Use PlayerManager to safely update disconnection status
        PlayerManager.updatePlayerConnection(
          playerId as PlayerId,
          this.gameId,
          false,
        )
          .then((result) => {
            if (!result.success) {
              console.warn(
                `Failed to update player ${playerId} disconnection:`,
                result.error,
              );
            } else {
              console.log(`Player ${playerId} marked as disconnected`);
            }
          })
          .catch(console.error);
      }
    });
  }

  // Broadcast methods using proper Supabase v2 channel API
  async broadcastGameState(gameState: Partial<GameState>) {
    if (!this.channel) return;

    try {
      // Use proper Supabase v2 broadcast API format
      const result = await this.channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload: { gameState },
      });

      if (result === 'ok') {
        this.store.set(broadcastEventAtom, {
          event: 'game_state_update',
          payload: gameState,
        });
      } else {
        console.warn('Broadcast may not have been delivered:', result);
      }
    } catch (error) {
      console.error('Failed to broadcast game state:', error);
    }
  }

  async broadcastPlayerJoin(playerId: PlayerId, playerData: Player) {
    if (!this.channel) return;

    try {
      // Use proper Supabase v2 broadcast API format
      const result = await this.channel.send({
        type: 'broadcast',
        event: 'player_join',
        payload: { playerId, playerData },
      });

      if (result === 'ok') {
        this.store.set(broadcastEventAtom, {
          event: 'player_join',
          payload: { playerId, playerData },
        });
      } else {
        console.warn('Broadcast may not have been delivered:', result);
      }
    } catch (error) {
      console.error('Failed to broadcast player join:', error);
    }
  }

  async broadcastPlayerLeave(playerId: PlayerId) {
    if (!this.channel) return;

    try {
      // Use proper Supabase v2 broadcast API format
      const result = await this.channel.send({
        type: 'broadcast',
        event: 'player_leave',
        payload: { playerId },
      });

      if (result === 'ok') {
        this.store.set(broadcastEventAtom, {
          event: 'player_leave',
          payload: { playerId },
        });
      } else {
        console.warn('Broadcast may not have been delivered:', result);
      }
    } catch (error) {
      console.error('Failed to broadcast player leave:', error);
    }
  }

  async trackPresence(participantData: LobbyParticipant) {
    if (!this.channel) return;

    try {
      await this.channel.track(participantData);
    } catch (error) {
      console.error('Failed to track presence:', error);
    }
  }

  async disconnect() {
    // Stop all heartbeats and mark players as disconnected
    await this.heartbeatManager.stopAll();

    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }

    if (this.gameSubscription) {
      const supabase = await getSupabase();
      supabase.removeChannel(this.gameSubscription);
      this.gameSubscription = null;
    }

    this.store.set(isConnectedToSupabaseAtom, false);
    this.store.set(gameSyncInstanceAtom, null);
  }

  /**
   * Start heartbeat for a player to keep their last_active updated
   */
  startHeartbeat(playerId: PlayerId) {
    this.heartbeatManager.startForPlayer(
      playerId,
      this.gameId,
      (error: Error) => {
        console.warn(`Heartbeat error for player ${playerId}:`, error);
      },
    );
  }

  /**
   * Stop heartbeat for a player and mark them as disconnected
   */
  async stopHeartbeat(playerId: PlayerId) {
    await this.heartbeatManager.markPlayerDisconnected(playerId);
  }

  /**
   * Get list of players with active heartbeats
   */
  getActiveHeartbeats(): string[] {
    return this.heartbeatManager.getActivePlayerIds();
  }
}

// Factory function to create and connect game sync
export async function createAtomGameSync(
  gameId: string,
  store: Store,
): Promise<AtomGameSync> {
  const gameSync = new AtomGameSync(gameId, store);
  await gameSync.connect();
  return gameSync;
}
