import { getSupabase, isSupabaseConfigured } from './supabaseLazy';

// Check if we should use development mode (in-memory storage)
// Only use development mode if Supabase is NOT configured
const shouldUseDevelopmentMode = () => {
  const isDev = import.meta.env?.DEV === true;
  const supabaseConfigured = isSupabaseConfigured();

  // If Supabase is configured, always use it regardless of DEV mode
  if (supabaseConfigured) {
    console.log(
      '[GameDatabase] Supabase configured - using production database even in dev mode',
    );
    return false;
  }

  // If Supabase is not configured and we're in dev mode, use in-memory storage
  if (isDev) {
    console.log(
      '[GameDatabase] Development mode with no Supabase - using in-memory storage',
    );
    return true;
  }

  // Production mode without Supabase configuration
  console.warn(
    '[GameDatabase] Production mode but Supabase not configured - this will cause issues',
  );
  return false;
};

// In-memory storage for development mode
const developmentStorage = {
  sessions: new Map<string, GameRecord>(), // Was games
  players: new Map<string, PlayerRecord[]>(), // Still keyed by session_id
  atomicLocks: new Map<string, boolean>(), // Track atomic locks
};

// GameState and PlayerId types are not needed in this module
const FALLBACK_SEGMENT_SETTINGS: Record<string, number> = {
  WSHA: 4,
  AUCT: 4,
  BELL: 10,
  SING: 10,
  REMO: 4,
};

export interface GameRecord {
  session_id: string; // Primary key (was id)
  host_code: string; // Host code used for auth; non-unique
  host_name: string | null;
  host_is_connected: boolean; // Track host connection status
  host_id: string | null; // UUID of authenticated host user
  phase: string; // 'CONFIG' | 'LOBBY' | 'PLAYING' | 'COMPLETED'
  current_segment: string | null;
  current_question_index: number;
  timer: number;
  is_timer_running: boolean;
  video_room_url: string | null;
  video_room_created: boolean;
  segment_settings: Record<string, number>;
  status: string; // 'waiting' | 'active' | 'completed'
  last_activity: string; // timestamp for cleanup
  created_at: string;
  updated_at: string;
  controller_user_id: string | null; // New field from schema
}

export interface PlayerRecord {
  player_id: string; // Primary key (was id)
  session_id: string | null; // Foreign key to sessions (was game_id)
  name: string;
  flag: string | null;
  club: string | null;
  role: string;
  score: number;
  strikes_legacy: number; // Was strikes
  is_connected: boolean;
  special_buttons: Record<string, boolean>;
  user_id: string | null; // UUID of authenticated user
  is_host: boolean; // whether this player is also the host
  slot: string | null; // New field from schema
  joined_at: string;
  last_active: string;
}

// Type guard to validate PlayerRecord
function isPlayerRecord(data: unknown): data is PlayerRecord {
  if (!data || typeof data !== 'object') return false;

  const record = data as Record<string, unknown>;

  return (
    typeof record.player_id === 'string' &&
    (record.session_id === null || typeof record.session_id === 'string') &&
    typeof record.name === 'string' &&
    (record.flag === null || typeof record.flag === 'string') &&
    (record.club === null || typeof record.club === 'string') &&
    typeof record.role === 'string' &&
    typeof record.score === 'number' &&
    typeof record.strikes_legacy === 'number' &&
    typeof record.is_connected === 'boolean' &&
    typeof record.special_buttons === 'object' &&
    record.special_buttons !== null &&
    typeof record.joined_at === 'string' &&
    typeof record.last_active === 'string'
  );
}

export class GameDatabase {
  // Check if Supabase is configured
  static isConfigured(): boolean {
    return isSupabaseConfigured() || shouldUseDevelopmentMode();
  }

  // =====================================
  // GAME OPERATIONS
  // =====================================

  /**
   * Insert a new game in CONFIG phase.
   *
   * @param sessionId     six-char player join code (was gameId)
   * @param hostCode      full host code e.g. ABC123-HOST
   * @param hostName      optional display name
   * @param segmentSettings  map of segment codes to question counts
   * @param hostId        UUID of authenticated host user
   */
  static async createGame(
    sessionId: string, // Was gameId
    hostCode: string,
    hostName: string | null = null,
    segmentSettings: Record<string, number> = {},
    hostId: string | null = null,
  ): Promise<GameRecord | null> {
    // Development mode: use in-memory storage
    if (shouldUseDevelopmentMode()) {
      console.log('[DEV] Creating game in memory:', {
        sessionId,
        hostCode,
        hostName,
      });

      const gameRecord: GameRecord = {
        session_id: sessionId, // Was id
        host_code: hostCode,
        host_name: hostName,
        host_is_connected: false,
        host_id: hostId, // Set the authenticated host user ID
        phase: 'CONFIG',
        current_segment: null,
        current_question_index: 0,
        timer: 0,
        is_timer_running: false,
        video_room_url: null,
        video_room_created: false,
        segment_settings: Object.keys(segmentSettings).length
          ? segmentSettings
          : FALLBACK_SEGMENT_SETTINGS,
        status: 'waiting',
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        controller_user_id: null,
      };

      developmentStorage.sessions.set(sessionId, gameRecord); // Was games
      console.log('[DEV] Game created successfully in memory');
      return gameRecord;
    }

    // Production mode: use Supabase
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('sessions') // Was games
        .insert({
          session_id: sessionId, // Was id
          host_code: hostCode,
          host_name: hostName,
          host_id: hostId,
          phase: 'CONFIG',
          status: 'waiting',
          last_activity: new Date().toISOString(),
          segment_settings: Object.keys(segmentSettings).length
            ? segmentSettings
            : FALLBACK_SEGMENT_SETTINGS,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating game:', error);
        return null;
      }

      return data as GameRecord;
    } catch (error) {
      console.error('Error creating game:', error);
      return null;
    }
  }

  /**
   * Fetch a game by its session ID.
   * @param sessionId The session ID to look up (was gameId).
   */
  static async getGame(sessionId: string): Promise<GameRecord | null> {
    // Development mode: get from in-memory storage
    if (shouldUseDevelopmentMode()) {
      console.log('[DEV] Getting game from memory:', sessionId);
      const game = developmentStorage.sessions.get(sessionId); // Was games
      if (game) {
        console.log('[DEV] Game found in memory:', game);
        return game;
      } else {
        console.log('[DEV] Game not found in memory:', sessionId);
        return null;
      }
    }

    // Production mode: use Supabase
    if (!isSupabaseConfigured()) return null;

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('sessions') // Was games
        .select('*') // selects all columns including host_code
        .eq('session_id', sessionId) // Was id
        .single();

      if (error) {
        console.error('Error fetching game:', error);
        return null;
      }

      return data as GameRecord;
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }

  /**
   * Look up a game using both its session ID and host code to avoid collisions.
   */
  static async getGameByHostCode(
    sessionId: string, // Was gameId
    hostCode: string,
  ): Promise<GameRecord | null> {
    if (!this.isConfigured()) return null;

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('sessions') // Was games
        .select('*')
        .eq('session_id', sessionId) // Was id
        .eq('host_code', hostCode)
        .single();

      if (error) {
        console.error('Error fetching game with host code:', error);
        return null;
      }

      return data as GameRecord;
    } catch (error) {
      console.error('Error fetching game with host code:', error);
      return null;
    }
  }

  /**
   * Release the atomic lock for video room creation
   * This should be called after room creation completes (success or failure)
   */
  static releaseVideoRoomLock(sessionId: string): void { // Was gameId
    // Development mode: release the atomic lock
    if (shouldUseDevelopmentMode()) {
      const lockKey = `video_room_${sessionId}`;
      developmentStorage.atomicLocks.delete(lockKey);
      console.log('[DEV] Released video room atomic lock for:', sessionId);
    }
    // Production mode: no explicit lock release needed as DB transaction handles it
  }

  /**
   * Atomically set video_room_created flag to true if it's currently false.
   * This prevents race conditions during room creation.
   *
   * @param sessionId The session ID (was gameId)
   * @returns { success: true, data: GameRecord } if the flag was successfully set,
   *          { success: false } if the flag was already true (room already being created)
   */
  static async atomicSetVideoRoomCreating(
    sessionId: string, // Was gameId
  ): Promise<{ success: boolean; data?: GameRecord; error?: string }> {
    // Development mode: simulate atomic operation with in-memory storage
    if (shouldUseDevelopmentMode()) {
      console.log('[DEV] Atomic set video room creating for:', sessionId);

      const lockKey = `video_room_${sessionId}`;

      // Check if another process is already creating the room
      if (developmentStorage.atomicLocks.has(lockKey)) {
        console.log(
          '[DEV] Video room already being created by another process',
        );
        return { success: false, error: 'Video room already being created' };
      }

      const existingGame = developmentStorage.sessions.get(sessionId); // Was games
      if (!existingGame) {
        return { success: false, error: 'Game not found' };
      }

      if (existingGame.video_room_created) {
        console.log('[DEV] Video room already created');
        return { success: false, error: 'Video room already created' };
      }

      // Acquire the atomic lock (simulates database row lock)
      developmentStorage.atomicLocks.set(lockKey, true);

      // Set the flag atomically
      const updatedGame: GameRecord = {
        ...existingGame,
        video_room_created: true,
        updated_at: new Date().toISOString(),
      };

      developmentStorage.sessions.set(sessionId, updatedGame); // Was games
      console.log('[DEV] Video room creation flag set successfully');
      return { success: true, data: updatedGame };
    }

    // Production mode: use Supabase with atomic WHERE condition
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('sessions') // Was games
        .update({
          video_room_created: true,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId) // Was id
        .eq('video_room_created', false) // Only update if flag is currently false
        .select()
        .single();

      if (error) {
        // If no rows were updated, it means the flag was already true
        if (error.code === 'PGRST116') {
          console.log(
            'Video room creation already in progress for game:',
            sessionId,
          );
          return { success: false, error: 'Video room already being created' };
        }

        console.error('Error in atomic video room flag update:', error);
        return { success: false, error: error.message };
      }

      console.log(
        'Successfully set video room creation flag for game:',
        sessionId,
      );
      return { success: true, data: data as GameRecord };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in atomic video room flag update:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update a game record with the provided fields.
   */
  static async updateGame(
    sessionId: string, // Was gameId
    updates: Partial<GameRecord>,
  ): Promise<GameRecord | null> {
    // Development mode: update in-memory storage
    if (shouldUseDevelopmentMode()) {
      console.log('[DEV] Updating game in memory:', { sessionId, updates });

      const existingGame = developmentStorage.sessions.get(sessionId); // Was games
      if (!existingGame) {
        console.warn('[DEV] Game not found in memory:', sessionId);
        return null;
      }

      const updatedGame: GameRecord = {
        ...existingGame,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      developmentStorage.sessions.set(sessionId, updatedGame); // Was games
      console.log('[DEV] Game updated successfully in memory');
      return updatedGame;
    }

    // Production mode: use Supabase
    if (!isSupabaseConfigured()) return null;

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('sessions') // Was games
        .update(updates)
        .eq('session_id', sessionId) // Was id
        .select()
        .single();

      if (error) {
        console.error('Error updating game:', error);
        return null;
      }

      return data as GameRecord;
    } catch (error) {
      console.error('Error updating game:', error);
      return null;
    }
  }

  // =====================================
  // PLAYER OPERATIONS
  // =====================================

  static async addPlayer(
    playerId: string,
    sessionId: string, // Was gameId
    playerData: {
      name: string;
      flag?: string;
      club?: string;
      role?: string;
      userId?: string; // authenticated user ID
      isHost?: boolean; // whether this player is the host
      sessionId?: string; // session tracking (deprecated - using method param)
    },
  ): Promise<PlayerRecord | null> {
    if (!this.isConfigured()) return null;

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();

      // First, remove the player from any existing games to avoid primary key conflicts
      // This allows players to switch between games
      await supabase.from('players').delete().eq('player_id', playerId); // Was id

      // Now insert the player into the new game
      const { data, error } = await supabase
        .from('players')
        .insert({
          player_id: playerId, // Was id
          session_id: sessionId, // Was game_id
          name: playerData.name,
          flag: playerData.flag || null,
          club: playerData.club || null,
          role: playerData.role || 'playerA',
          user_id: playerData.userId || null,
          is_host: playerData.isHost || false,
          // Note: slot field will be set to null (default)
          is_connected: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding player:', error);
        return null;
      }

      return data as PlayerRecord;
    } catch (error) {
      console.error('Error adding player:', error);
      return null;
    }
  }

  static async getGamePlayers(sessionId: string): Promise<PlayerRecord[]> { // Was gameId
    if (!this.isConfigured()) return [];

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId) // Was game_id
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching players:', error);
        return [];
      }

      return data as PlayerRecord[];
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  }

  static async updatePlayer(
    playerId: string,
    updates: Partial<PlayerRecord>,
  ): Promise<PlayerRecord | null> {
    if (!this.isConfigured()) return null;

    try {
      // Use lazy supabase client - ensure single row update
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('player_id', playerId) // Was id
        .select()
        .limit(1)
        .single();

      if (error) {
        console.error('Error updating player:', error);
        return null;
      }

      return data as PlayerRecord;
    } catch (error) {
      console.error('Error updating player:', error);
      return null;
    }
  }

  /**
   * Update a player by ID with better error handling for single-row operations
   */
  static async updatePlayerById(
    playerId: string,
    updates: Partial<PlayerRecord>,
  ): Promise<{ success: boolean; data?: PlayerRecord; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const supabase = await getSupabase();
      // First check if player exists and get current data
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('player_id', playerId) // Was id
        .limit(1);

      if (fetchError) {
        console.error('Error fetching player before update:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (!existingPlayer || existingPlayer.length === 0) {
        console.warn(`Player ${playerId} not found for update`);
        return { success: false, error: 'Player not found' };
      }

      if (existingPlayer.length > 1) {
        console.warn(
          `Multiple players found with ID ${playerId}, updating first one`,
        );
      }

      // Update the player with precise filtering
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('player_id', playerId) // Was id
        .select()
        .limit(1)
        .single();

      if (error) {
        console.error('Error updating player:', error);
        return { success: false, error: error.message };
      }

      if (isPlayerRecord(data)) {
        return { success: true, data };
      } else {
        console.error(
          'Updated player data does not match PlayerRecord type:',
          data,
        );
        return {
          success: false,
          error: 'Invalid player data returned from database',
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating player by ID:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
  static async insertGameEvent(
    sessionId: string, // Was gameId
    event_type: string,
    event_data: Record<string, unknown> = {},
  ) {
    if (!this.isConfigured()) return;
    // Use lazy supabase client
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('game_events')
      .insert([{ session_id: sessionId, event_type, event_data }]); // Was game_id
    if (error) console.error('insertGameEvent error:', error);
  }

  static async removePlayer(playerId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('player_id', playerId); // Was id

      if (error) {
        console.error('Error removing player:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing player:', error);
      return false;
    }
  }

  /**
   * Get all players for a specific game
   */
  static async getPlayers(sessionId: string): Promise<PlayerRecord[]> { // Was gameId
    if (!this.isConfigured()) return [];

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId); // Was game_id

      if (error) {
        console.error('Error fetching players:', error);
        return [];
      }

      return data as PlayerRecord[];
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  }

  // =====================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================

  static async subscribeToGame(
    sessionId: string, // Was gameId
    callbacks: {
      onGameUpdate?: (game: GameRecord) => void;
      onPlayerJoin?: (player: PlayerRecord) => void;
      onPlayerUpdate?: (player: PlayerRecord) => void;
      onPlayerLeave?: (playerId: string) => void;
    },
  ) {
    if (!this.isConfigured()) {
      console.warn('Supabase not configured - real-time disabled');
      return null;
    }

    // Subscribe to game updates
    // Use lazy supabase client
    const supabase = await getSupabase();
    const gameChannel = supabase.channel(`game:${sessionId}`);

    gameChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions', // Was games
        filter: `session_id=eq.${sessionId}`, // Was id
      },
      (payload) => {
        console.log('Game update:', payload);
        if (payload.eventType === 'UPDATE' && callbacks.onGameUpdate) {
          callbacks.onGameUpdate(payload.new as GameRecord);
        }
      },
    );

    gameChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${sessionId}`, // Was game_id
      },
      (payload) => {
        console.log('Player update:', payload);
        if (payload.eventType === 'INSERT' && callbacks.onPlayerJoin) {
          callbacks.onPlayerJoin(payload.new as PlayerRecord);
        } else if (payload.eventType === 'UPDATE' && callbacks.onPlayerUpdate) {
          callbacks.onPlayerUpdate(payload.new as PlayerRecord);
        } else if (payload.eventType === 'DELETE' && callbacks.onPlayerLeave) {
          callbacks.onPlayerLeave(payload.old.player_id); // Was id
        }
      },
    );

    const gameSubscription = gameChannel;
    gameChannel.subscribe();

    return gameSubscription;
  }

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  /**
   * Check if a game exists and is in a specific phase
   */
  static async checkGamePhase(
    sessionId: string, // Was gameId
  ): Promise<{ exists: boolean; phase?: string; game?: GameRecord }> {
    if (!this.isConfigured()) {
      return { exists: false };
    }

    try {
      const game = await this.getGame(sessionId);
      if (!game) {
        return { exists: false };
      }

      return {
        exists: true,
        phase: game.phase,
        game,
      };
    } catch (error) {
      console.error('Error checking game phase:', error);
      return { exists: false };
    }
  }

  /**
   * Get game statistics for monitoring
   */
  static async getGameStats(sessionId: string): Promise<{ // Was gameId
    playerCount: number;
    connectedPlayers: number;
    totalQuestions: number;
    currentProgress: number;
    averageScore: number;
  } | null> {
    if (!this.isConfigured()) return null;

    try {
      const [game, players] = await Promise.all([
        this.getGame(sessionId),
        this.getPlayers(sessionId),
      ]);

      if (!game) return null;

      const totalQuestions = Object.values(game.segment_settings).reduce(
        (sum, count) => sum + (count as number),
        0,
      );
      const connectedPlayers = players.filter((p) => p.is_connected).length;
      const averageScore =
        players.length > 0
          ? players.reduce((sum, p) => sum + p.score, 0) / players.length
          : 0;

      return {
        playerCount: players.length,
        connectedPlayers,
        totalQuestions,
        currentProgress: game.current_question_index,
        averageScore,
      };
    } catch (error) {
      console.error('Error getting game stats:', error);
      return null;
    }
  }

  /**
   * Cleanup old games (for maintenance)
   */
  static async cleanupOldGames(olderThanHours: number = 24): Promise<number> {
    if (!this.isConfigured()) return 0;

    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

      // Use lazy supabase client
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('sessions') // Was games
        .delete()
        .lt('created_at', cutoffTime.toISOString())
        .select('session_id'); // Was id

      if (error) {
        console.error('Error cleaning up old games:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up old games:', error);
      return 0;
    }
  }

  /**
   * Reset a game to CONFIG phase (for testing/development)
   */
  static async resetGameToConfig(sessionId: string): Promise<boolean> { // Was gameId
    if (!this.isConfigured()) return false;

    try {
      const updated = await this.updateGame(sessionId, {
        phase: 'CONFIG',
        current_segment: null,
        current_question_index: 0,
        timer: 0,
        is_timer_running: false,
      });

      return !!updated;
    } catch (error) {
      console.error('Error resetting game to CONFIG:', error);
      return false;
    }
  }

  /**
   * Get all games with their current status (for admin/monitoring)
   */
  static async getAllGames(limit: number = 50): Promise<GameRecord[]> {
    if (!this.isConfigured()) return [];

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('sessions') // Was games
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching all games:', error);
        return [];
      }

      return data as GameRecord[];
    } catch (error) {
      console.error('Error fetching all games:', error);
      return [];
    }
  }

  static async logGameEvent(
    sessionId: string, // Was gameId
    eventType: string,
    eventData: Record<string, unknown>,
  ): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      // Use lazy supabase client
      const supabase = await getSupabase();
      const { error } = await supabase.from('game_events').insert({
        session_id: sessionId, // Was game_id
        event_type: eventType,
        event_data: eventData,
      });

      if (error) {
        console.error('Error logging game event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging game event:', error);
      return false;
    }
  }
}
