/* eslint-disable @typescript-eslint/no-explicit-any */
import { mapRecordToState } from '@/context/GameContext';
import type { GameAction } from '@/context/gameReducer';
import type { Dispatch } from 'react';
import type { GameState, Player, PlayerId } from '../types/game';
import type { GameRecord, PlayerRecord } from './gameDatabase';
import { getSupabase, isSupabaseConfigured } from './supabaseLazy';

function mapPlayerRecord(record: PlayerRecord): Player {
  return {
    id: record.player_id as PlayerId, // Was id
    name: record.name,
    flag: record.flag ?? undefined,
    club: record.club ?? undefined,
    score: record.score,
    strikes: record.strikes_legacy, // Was strikes
    isConnected: record.is_connected,
    specialButtons: record.special_buttons as Player['specialButtons'],
  };
}

export interface GameSyncCallbacks {
  onGameStateUpdate: (_gameState: Partial<GameState>) => void;
  onPlayerJoin: (_playerId: PlayerId, _playerData: unknown) => void;
  onPlayerLeave: (_playerId: PlayerId) => void;
  onHostUpdate: (_hostName: string) => void;
  onVideoRoomUpdate: (_roomUrl: string, _roomCreated: boolean) => void;
  onPresenceStateChange?: (_state: Record<string, unknown>) => void;
}

export class GameSync {
  private gameId: string;
  private channel: unknown = null;
  private callbacks: GameSyncCallbacks;

  constructor(gameId: string, callbacks: GameSyncCallbacks) {
    this.gameId = gameId;
    this.callbacks = callbacks;
  }

  // Initialize real-time subscription
  async connect() {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using local state only');
      return;
    }

    try {
      // Create or join the game channel
      const supabase = await getSupabase();
      this.channel = supabase.channel(`game:${this.gameId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: 'participants' },
        },
      }) as unknown;

      // Get channel reference to avoid repeated casting
      const channel = this.channel;
      if (!channel) return;

      // Use proper type casting for the channel methods

      const channelWithMethods = channel as any;

      // Listen for game state broadcasts
      channelWithMethods.on(
        'broadcast',
        { event: 'game_state_update' },
        (payload: Record<string, unknown>) => {
          if (payload.gameState) {
            this.callbacks.onGameStateUpdate(
              payload.gameState as Partial<GameState>,
            );
          }
        },
      );

      channelWithMethods.on(
        'broadcast',
        { event: 'player_join' },
        (payload: Record<string, unknown>) => {
          if (payload.playerId && payload.playerData !== undefined) {
            this.callbacks.onPlayerJoin(
              payload.playerId as PlayerId,
              payload.playerData,
            );
          }
        },
      );

      channelWithMethods.on(
        'broadcast',
        { event: 'player_leave' },
        (payload: Record<string, unknown>) => {
          if (payload.playerId) {
            this.callbacks.onPlayerLeave(payload.playerId as PlayerId);
          }
        },
      );

      channelWithMethods.on(
        'broadcast',
        { event: 'host_update' },
        (payload: Record<string, unknown>) => {
          if (payload.hostName) {
            this.callbacks.onHostUpdate(payload.hostName as string);
          }
        },
      );

      channelWithMethods.on(
        'broadcast',
        { event: 'video_room_update' },
        (payload: Record<string, unknown>) => {
          if (payload.roomUrl && payload.roomCreated !== undefined) {
            this.callbacks.onVideoRoomUpdate(
              payload.roomUrl as string,
              payload.roomCreated as boolean,
            );
          }
        },
      );

      // Handle presence updates and forward state to callback
      const handlePresenceUpdate = () => {
        const newState = channelWithMethods.presenceState();
        this.callbacks.onPresenceStateChange?.(newState);
      };

      channelWithMethods.on(
        'presence',
        { event: 'sync' },
        handlePresenceUpdate,
      );

      channelWithMethods.on('presence', { event: 'join' }, () => {
        handlePresenceUpdate();
      });

      channelWithMethods.on('presence', { event: 'leave' }, () => {
        handlePresenceUpdate();
      });

      // Subscribe to the channel
      await (this.channel as any)?.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Connected to game channel: ${this.gameId}`);
        }
      });
    } catch (error) {
      console.error('Failed to connect to game sync:', error);
    }
  }

  // Broadcast game state updates to all participants
  async broadcastGameState(gameState: Partial<GameState>) {
    if (!this.channel) return;

    try {
      await (this.channel as any).send({
        type: 'broadcast',
        event: 'game_state_update',
        gameState,
      });
    } catch (error) {
      console.error('Failed to broadcast game state:', error);
    }
  }

  // Broadcast player join
  async broadcastPlayerJoin(playerId: PlayerId, playerData: unknown) {
    if (!this.channel) return;

    try {
      await (this.channel as any).send({
        type: 'broadcast',
        event: 'player_join',
        playerId,
        playerData,
      });
    } catch (error) {
      console.error('Failed to broadcast player join:', error);
    }
  }

  // Broadcast player leave
  async broadcastPlayerLeave(playerId: PlayerId) {
    if (!this.channel) return;

    try {
      await (this.channel as any).send({
        type: 'broadcast',
        event: 'player_leave',
        playerId,
      });
    } catch (error) {
      console.error('Failed to broadcast player leave:', error);
    }
  }

  // Broadcast host name update
  async broadcastHostUpdate(hostName: string) {
    if (!this.channel) return;

    try {
      await (this.channel as any).send({
        type: 'broadcast',
        event: 'host_update',
        hostName,
      });
    } catch (error) {
      console.error('Failed to broadcast host update:', error);
    }
  }

  // Broadcast video room creation
  async broadcastVideoRoomUpdate(roomUrl: string, roomCreated: boolean) {
    if (!this.channel) return;

    try {
      await (this.channel as any).send({
        type: 'broadcast',
        event: 'video_room_update',
        roomUrl,
        roomCreated,
      });
    } catch (error) {
      console.error('Failed to broadcast video room update:', error);
    }
  }

  // Track presence (who's currently in the lobby)
  async trackPresence(participantData: {
    id: string;
    name: string;
    type: 'controller' | 'host' | 'player';
    playerId?: PlayerId;
    flag?: string;
    club?: string;
  }) {
    if (!this.channel) return;

    try {
      await (this.channel as any).track(participantData);
    } catch (error) {
      console.error('Failed to track presence:', error);
    }
  }

  // Disconnect from the channel
  async disconnect() {
    if (this.channel) {
      await (this.channel as any).unsubscribe();
      this.channel = null;
    }
  }

  // Get current presence state
  getPresenceState() {
    return this.channel ? (this.channel as any).presenceState() : {};
  }
}

// Utility function to create a GameSync instance
export function createGameSync(
  gameId: string,
  callbacks: GameSyncCallbacks,
): GameSync {
  return new GameSync(gameId, callbacks);
}

export async function attachGameSync(
  gameId: string,
  dispatch: Dispatch<GameAction>,
) {
  const supabase = await getSupabase();
  const channel = supabase.channel(`game:${gameId}`);

  const channelWithMethods = channel as any;

  channelWithMethods.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'games',
      filter: `id=eq.${gameId}`,
    },
    (payload: any) => {
      const newRow = payload.new as GameRecord;
      dispatch({ type: 'INIT', payload: mapRecordToState(newRow) });
    },
  );

  channelWithMethods.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'players',
      filter: `game_id=eq.${gameId}`,
    },
    (payload: any) => {
      const pl = payload.new as PlayerRecord;
      dispatch({ type: 'ADD_PLAYER', player: mapPlayerRecord(pl) });
    },
  );

  channelWithMethods.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'players',
      filter: `game_id=eq.${gameId}`,
    },
    (payload: any) => {
      const pl = payload.new as PlayerRecord;
      dispatch({
        type: 'UPDATE_PLAYER',
        id: pl.player_id as any, // Was id
        partial: mapPlayerRecord(pl),
      });
    },
  );

  channel.subscribe();

  // Cleanup function is now synchronous
  return () => {
    supabase.removeChannel(channel);
  };
}
