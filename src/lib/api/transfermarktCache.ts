/**
 * Transfermarkt API Caching Layer
 *
 * Implements Netlify Blobs-based caching with TTL strategy:
 * - Search results: 1 hour (volatile, frequently changing)
 * - Player stats: 1 day (changes seasonally)
 * - Player profiles: 7 days (relatively stable)
 * - Transfer history: 30 days (historical data, rarely changes)
 *
 * Cache Structure:
 * transfermarkt/
 *   ├── players/{playerId}/profile.json
 *   ├── players/{playerId}/transfers.json
 *   ├── players/{playerId}/stats.json
 *   ├── players/{playerId}/achievements.json
 *   ├── players/{playerId}/jerseys.json
 *   ├── clubs/{clubId}/profile.json
 *   ├── clubs/{clubId}/players-{seasonId}.json
 *   ├── competitions/{competitionId}/clubs-{seasonId}.json
 *   └── search-cache/{hash}.json
 *
 * @see /docs/TRANSFERMARKT_INTEGRATION_ROADMAP.md for architecture details
 */

import { getStore } from "@netlify/blobs";
import crypto from "crypto";
import {
  transfermarktClient,
  type PlayerSearch,
  type PlayerProfile,
  type PlayerTransfers,
  type PlayerStats,
  type PlayerAchievements,
  type PlayerJerseyNumbers,
  type ClubSearch,
  type ClubPlayers,
  type CompetitionSearch,
  type CompetitionClubs,
} from "./transfermarkt";

// ============================================================================
// Types
// ============================================================================

interface CachedData<T> {
  data: T;
  cachedAt: number; // Unix timestamp in milliseconds
}

export enum CacheTTL {
  ONE_HOUR = 60 * 60 * 1000, // 1 hour in ms
  ONE_DAY = 24 * 60 * 60 * 1000, // 1 day in ms
  ONE_WEEK = 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  ONE_MONTH = 30 * 24 * 60 * 60 * 1000, // 30 days in ms
}

// ============================================================================
// Cache Key Generation
// ============================================================================

/**
 * Generate a consistent cache key using SHA-256 hash
 * @param prefix - Cache key prefix (e.g., 'search', 'player')
 * @param params - Parameters to include in hash
 * @returns Hashed cache key
 */
function generateCacheKey(
  prefix: string,
  params: Record<string, unknown>,
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join("&");

  const hash = crypto
    .createHash("sha256")
    .update(sortedParams)
    .digest("hex")
    .substring(0, 16);

  return `${prefix}-${hash}`;
}

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Get Netlify Blobs store instance for Transfermarkt cache
 */
function getTransfermarktStore() {
  return getStore({
    name: "transfermarkt",
    consistency: "strong", // Ensure cache consistency
  });
}

/**
 * Retrieve data from cache if valid
 * @param key - Cache key
 * @param ttl - Time-to-live in milliseconds
 * @returns Cached data or null if expired/missing
 */
async function getCachedData<T>(key: string, ttl: number): Promise<T | null> {
  try {
    const store = getTransfermarktStore();
    const cached = await store.get(key, { type: "json" });

    if (!cached) {
      return null;
    }

    const cachedData = cached as CachedData<T>;
    const now = Date.now();
    const age = now - cachedData.cachedAt;

    // Check if cache is still valid
    if (age > ttl) {
      // Cache expired, delete it
      await store.delete(key);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.error(`Cache read error for key ${key}:`, error);
    return null;
  }
}

/**
 * Store data in cache with timestamp
 * @param key - Cache key
 * @param data - Data to cache
 */
async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    const store = getTransfermarktStore();
    const cachedData: CachedData<T> = {
      data,
      cachedAt: Date.now(),
    };

    await store.setJSON(key, cachedData);
  } catch (error) {
    console.error(`Cache write error for key ${key}:`, error);
    // Don't throw - cache failures shouldn't break the app
  }
}

/**
 * Invalidate cache entries matching a pattern
 * @param pattern - Glob pattern to match cache keys
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const store = getTransfermarktStore();
    const { blobs } = await store.list({ prefix: pattern });

    let deletedCount = 0;
    for (const blob of blobs) {
      await store.delete(blob.key);
      deletedCount++;
    }

    return deletedCount;
  } catch (error) {
    console.error(`Cache invalidation error for pattern ${pattern}:`, error);
    return 0;
  }
}

// ============================================================================
// Cached API Methods (Player)
// ============================================================================

/**
 * Search for players with 1-hour cache
 */
export async function searchPlayerCached(
  playerName: string,
  pageNumber: number = 1,
): Promise<PlayerSearch> {
  const cacheKey = generateCacheKey("search-player", {
    playerName,
    pageNumber,
  });

  // Try cache first
  const cached = await getCachedData<PlayerSearch>(cacheKey, CacheTTL.ONE_HOUR);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.searchPlayer(playerName, pageNumber);

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

/**
 * Get player profile with 7-day cache
 */
export async function getPlayerProfileCached(
  playerId: string,
): Promise<PlayerProfile> {
  const cacheKey = `player-${playerId}-profile`;

  // Try cache first
  const cached = await getCachedData<PlayerProfile>(
    cacheKey,
    CacheTTL.ONE_WEEK,
  );
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.getPlayerProfile(playerId);

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

/**
 * Get player transfers with 30-day cache (historical data)
 */
export async function getPlayerTransfersCached(
  playerId: string,
): Promise<PlayerTransfers> {
  const cacheKey = `player-${playerId}-transfers`;

  // Try cache first
  const cached = await getCachedData<PlayerTransfers>(
    cacheKey,
    CacheTTL.ONE_MONTH,
  );
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.getPlayerTransfers(playerId);

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

/**
 * Get player stats with 1-day cache (changes seasonally)
 */
export async function getPlayerStatsCached(
  playerId: string,
): Promise<PlayerStats> {
  const cacheKey = `player-${playerId}-stats`;

  // Try cache first
  const cached = await getCachedData<PlayerStats>(cacheKey, CacheTTL.ONE_DAY);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.getPlayerStats(playerId);

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

/**
 * Get player achievements with 30-day cache (historical data)
 */
export async function getPlayerAchievementsCached(
  playerId: string,
): Promise<PlayerAchievements> {
  const cacheKey = `player-${playerId}-achievements`;

  // Try cache first
  const cached = await getCachedData<PlayerAchievements>(
    cacheKey,
    CacheTTL.ONE_MONTH,
  );
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.getPlayerAchievements(playerId);

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

/**
 * Get player jersey numbers with 30-day cache (historical data)
 */
export async function getPlayerJerseyNumbersCached(
  playerId: string,
): Promise<PlayerJerseyNumbers> {
  const cacheKey = `player-${playerId}-jerseys`;

  // Try cache first
  const cached = await getCachedData<PlayerJerseyNumbers>(
    cacheKey,
    CacheTTL.ONE_MONTH,
  );
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.getPlayerJerseyNumbers(playerId);

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

// ============================================================================
// Cached API Methods (Club)
// ============================================================================

/**
 * Search for clubs with 1-hour cache
 */
export async function searchClubCached(
  clubName: string,
  pageNumber: number = 1,
): Promise<ClubSearch> {
  const cacheKey = generateCacheKey("search-club", { clubName, pageNumber });

  // Try cache first
  const cached = await getCachedData<ClubSearch>(cacheKey, CacheTTL.ONE_HOUR);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.searchClub(clubName, pageNumber);

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

/**
 * Get club players with 7-day cache (rosters relatively stable)
 */
export async function getClubPlayersCached(
  clubId: string,
  seasonId?: string,
): Promise<ClubPlayers> {
  const cacheKey = seasonId
    ? `club-${clubId}-players-${seasonId}`
    : `club-${clubId}-players-current`;

  // Try cache first
  const cached = await getCachedData<ClubPlayers>(cacheKey, CacheTTL.ONE_WEEK);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.getClubPlayers(clubId, seasonId);

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

// ============================================================================
// Cached API Methods (Competition)
// ============================================================================

/**
 * Search for competitions with 1-hour cache
 */
export async function searchCompetitionCached(
  competitionName: string,
  pageNumber: number = 1,
): Promise<CompetitionSearch> {
  const cacheKey = generateCacheKey("search-competition", {
    competitionName,
    pageNumber,
  });

  // Try cache first
  const cached = await getCachedData<CompetitionSearch>(
    cacheKey,
    CacheTTL.ONE_HOUR,
  );
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.searchCompetition(
    competitionName,
    pageNumber,
  );

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

/**
 * Get competition clubs with 7-day cache
 */
export async function getCompetitionClubsCached(
  competitionId: string,
  seasonId?: string,
): Promise<CompetitionClubs> {
  const cacheKey = seasonId
    ? `competition-${competitionId}-clubs-${seasonId}`
    : `competition-${competitionId}-clubs-current`;

  // Try cache first
  const cached = await getCachedData<CompetitionClubs>(
    cacheKey,
    CacheTTL.ONE_WEEK,
  );
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const data = await transfermarktClient.getCompetitionClubs(
    competitionId,
    seasonId,
  );

  // Store in cache
  await setCachedData(cacheKey, data);

  return data;
}

// ============================================================================
// Cache Statistics
// ============================================================================

export interface CacheStats {
  totalBlobs: number;
  totalSize: number;
  oldestBlob: string | null;
  newestBlob: string | null;
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const store = getTransfermarktStore();
    const { blobs } = await store.list();

    if (blobs.length === 0) {
      return {
        totalBlobs: 0,
        totalSize: 0,
        oldestBlob: null,
        newestBlob: null,
      };
    }

    // Note: Netlify Blobs list() doesn't return size or lastModified
    // We'll just return blob count and key info
    return {
      totalBlobs: blobs.length,
      totalSize: 0, // Not available from list() API
      oldestBlob: blobs[0]?.key || null,
      newestBlob: blobs[blobs.length - 1]?.key || null,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return {
      totalBlobs: 0,
      totalSize: 0,
      oldestBlob: null,
      newestBlob: null,
    };
  }
}
