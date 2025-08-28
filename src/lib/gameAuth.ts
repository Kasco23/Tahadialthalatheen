import {
  GameDatabase,
  type GameRecord,
  type PlayerRecord,
} from './gameDatabase.js';

/**
 * Authentication-aware game operations that integrate with Supabase Auth
 * These functions should be used by the frontend when users are authenticated
 */

// Interface for authenticated user context (matches your frontend auth system)
export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Create a new game with authenticated host
 */
export async function createAuthenticatedGame(
  gameId: string,
  hostCode: string,
  hostUser: AuthenticatedUser,
  hostName?: string,
  segmentSettings?: Record<string, number>,
): Promise<GameRecord | null> {
  return GameDatabase.createGame(
    gameId,
    hostCode,
    hostName || null,
    segmentSettings || {},
    hostUser.id,
  );
}

/**
 * Add authenticated player to a game
 */
export async function addAuthenticatedPlayer(
  playerId: string,
  gameId: string,
  user: AuthenticatedUser,
  playerData: {
    name: string;
    flag?: string;
    club?: string;
    role?: string;
    isHost?: boolean;
    sessionId?: string;
  },
): Promise<PlayerRecord | null> {
  return GameDatabase.addPlayer(playerId, gameId, {
    ...playerData,
    userId: user.id,
  });
}

/**
 * Add anonymous player to a game (for backwards compatibility)
 */
export async function addAnonymousPlayer(
  playerId: string,
  gameId: string,
  playerData: {
    name: string;
    flag?: string;
    club?: string;
    role?: string;
    sessionId?: string;
  },
): Promise<PlayerRecord | null> {
  return GameDatabase.addPlayer(playerId, gameId, {
    ...playerData,
    userId: undefined, // No auth required for anonymous players
    isHost: false,
  });
}

/**
 * Verify that a user can perform host actions on a game
 */
export async function verifyGameHostAccess(
  gameId: string,
  userId: string,
): Promise<boolean> {
  const game = await GameDatabase.getGame(gameId);
  return game?.host_id === userId;
}

/**
 * Verify that a user is a player in a game
 */
export async function verifyPlayerAccess(
  gameId: string,
  userId: string,
): Promise<boolean> {
  const players = await GameDatabase.getGamePlayers(gameId);
  return players.some((player) => player.user_id === userId);
}

/**
 * Get user's player record in a game
 */
export async function getUserPlayer(
  gameId: string,
  userId: string,
): Promise<PlayerRecord | null> {
  const players = await GameDatabase.getGamePlayers(gameId);
  return players.find((player) => player.user_id === userId) || null;
}

/**
 * Update game ownership when host authenticates
 * Useful for migrating anonymous games to authenticated hosts
 */
export async function claimGameAsHost(
  gameId: string,
  hostCode: string,
  userId: string,
): Promise<boolean> {
  // Verify the user has the correct host code
  const game = await GameDatabase.getGameByHostCode(gameId, hostCode);
  if (!game) {
    return false;
  }

  // If game already has an authenticated host, don't allow claiming
  if (game.host_id && game.host_id !== userId) {
    return false;
  }

  // Update the game to set the authenticated host
  const updated = await GameDatabase.updateGame(gameId, {
    host_id: userId,
    status: 'active',
    last_activity: new Date().toISOString(),
  });

  return !!updated;
}

/**
 * Migration helper: Update existing anonymous player to authenticated
 */
export async function authenticateExistingPlayer(
  playerId: string,
  gameId: string,
  userId: string,
): Promise<boolean> {
  const updated = await GameDatabase.updatePlayer(playerId, {
    user_id: userId,
    last_active: new Date().toISOString(),
  });

  return !!updated;
}
