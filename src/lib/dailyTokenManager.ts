import { Logger } from "./logger";
import type {
  DailyTokenData,
  DailyTokenCache,
  DailyTokenRefreshConfig,
} from "./types";

/**
 * Daily.co Token Manager
 *
 * Provides token caching, automatic refresh, and lifecycle management
 * for Daily.co meeting tokens to support longer video sessions.
 */

const DEFAULT_CONFIG: DailyTokenRefreshConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  refreshThresholdMinutes: 5, // refresh 5 minutes before expiry
};

const STORAGE_KEY = "daily_token_cache";
const TOKEN_EXPIRY_HOURS = 2; // Daily.co tokens typically expire in 2 hours

class DailyTokenManager {
  private cache: DailyTokenCache = {};
  private config: DailyTokenRefreshConfig;
  private refreshTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<DailyTokenRefreshConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadCacheFromStorage();
    this.cleanupExpiredTokens();
  }

  /**
   * Get a cached token or create a new one if needed
   */
  async getToken(roomName: string, userName: string): Promise<string> {
    const cacheKey = this.getCacheKey(roomName, userName);
    const cachedToken = this.cache[cacheKey];

    // Check if we have a valid cached token
    if (cachedToken && this.isTokenValid(cachedToken)) {
      Logger.log("Using cached Daily token for:", { roomName, userName });
      return cachedToken.token;
    }

    // Create new token
    Logger.log("Creating new Daily token for:", { roomName, userName });
    const tokenData = await this.createToken(roomName, userName);

    // Cache the token
    this.cacheToken(tokenData);

    // Schedule refresh before expiry
    this.scheduleTokenRefresh(tokenData);

    return tokenData.token;
  }

  /**
   * Refresh a token before it expires
   */
  async refreshToken(roomName: string, userName: string): Promise<string> {
    Logger.log("Refreshing Daily token for:", { roomName, userName });

    try {
      const tokenData = await this.createToken(roomName, userName);
      this.cacheToken(tokenData);
      this.scheduleTokenRefresh(tokenData);
      return tokenData.token;
    } catch (error) {
      Logger.error("Failed to refresh Daily token:", error);
      throw error;
    }
  }

  /**
   * Clear token from cache
   */
  clearToken(roomName: string, userName: string): void {
    const cacheKey = this.getCacheKey(roomName, userName);
    delete this.cache[cacheKey];

    // Clear any scheduled refresh
    const timeoutId = this.refreshTimeouts.get(cacheKey);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.refreshTimeouts.delete(cacheKey);
    }

    this.saveCacheToStorage();
  }

  /**
   * Clear all tokens for a room (when session ends)
   */
  clearRoomTokens(roomName: string): void {
    const keysToDelete = Object.keys(this.cache).filter((key) =>
      key.startsWith(`${roomName}:`),
    );

    keysToDelete.forEach((key) => {
      delete this.cache[key];

      // Clear any scheduled refresh
      const timeoutId = this.refreshTimeouts.get(key);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.refreshTimeouts.delete(key);
      }
    });

    this.saveCacheToStorage();
  }

  /**
   * Get token expiry info for debugging/monitoring
   */
  getTokenInfo(roomName: string, userName: string): DailyTokenData | null {
    const cacheKey = this.getCacheKey(roomName, userName);
    return this.cache[cacheKey] || null;
  }

  private async createToken(
    roomName: string,
    userName: string,
  ): Promise<DailyTokenData> {
    const response = await this.createTokenWithRetry(roomName, userName);

    const now = Date.now();
    const expiresAt = now + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
    const refreshThreshold = this.config.refreshThresholdMinutes * 60 * 1000;

    return {
      token: response.token,
      room_name: roomName,
      user_name: userName,
      created_at: now,
      expires_at: expiresAt,
      refresh_threshold: refreshThreshold,
    };
  }

  private async createTokenWithRetry(
    roomName: string,
    userName: string,
    attempt: number = 1,
  ): Promise<{ token: string }> {
    try {
      // Check if we're in local development without Netlify CLI
      const isLocalDev =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost" &&
        window.location.port === "5173";

      if (isLocalDev) {
        Logger.warn(
          "Running in local development mode - using mock Daily token",
        );

        // Generate a mock token for development
        const mockToken = `mock-token-${roomName}-${userName}-${Date.now()}`;
        return { token: mockToken };
      }

      const response = await fetch("/api/create-daily-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_name: roomName,
          user_name: userName,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          `HTTP ${response.status}: ${JSON.stringify(errorData)}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw new Error(
          `Failed to create Daily token after ${this.config.maxRetries} attempts: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        this.config.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        this.config.maxDelay,
      );

      Logger.warn(
        `Daily token creation attempt ${attempt} failed, retrying in ${delay}ms:`,
        error,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      return this.createTokenWithRetry(roomName, userName, attempt + 1);
    }
  }

  private cacheToken(tokenData: DailyTokenData): void {
    const cacheKey = this.getCacheKey(tokenData.room_name, tokenData.user_name);
    this.cache[cacheKey] = tokenData;
    this.saveCacheToStorage();
  }

  private scheduleTokenRefresh(tokenData: DailyTokenData): void {
    const cacheKey = this.getCacheKey(tokenData.room_name, tokenData.user_name);
    const refreshAt = tokenData.expires_at - tokenData.refresh_threshold;
    const now = Date.now();
    const delay = refreshAt - now;

    // Clear any existing timeout
    const existingTimeout = this.refreshTimeouts.get(cacheKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (delay > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          await this.refreshToken(tokenData.room_name, tokenData.user_name);
          Logger.log("Successfully refreshed Daily token for:", {
            roomName: tokenData.room_name,
            userName: tokenData.user_name,
          });
        } catch (error) {
          Logger.error("Failed to auto-refresh Daily token:", error);
        }
      }, delay);

      this.refreshTimeouts.set(cacheKey, timeoutId);
    }
  }

  private isTokenValid(tokenData: DailyTokenData): boolean {
    const now = Date.now();
    return now < tokenData.expires_at - tokenData.refresh_threshold;
  }

  private getCacheKey(roomName: string, userName: string): string {
    return `${roomName}:${userName}`;
  }

  private loadCacheFromStorage(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          this.cache = JSON.parse(cached);
        }
      }
    } catch (error) {
      Logger.warn("Failed to load Daily token cache from storage:", error);
      this.cache = {};
    }
  }

  private saveCacheToStorage(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
      }
    } catch (error) {
      Logger.warn("Failed to save Daily token cache to storage:", error);
    }
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let hasExpired = false;

    Object.keys(this.cache).forEach((key) => {
      const tokenData = this.cache[key];
      if (now >= tokenData.expires_at) {
        delete this.cache[key];
        hasExpired = true;

        // Clear any scheduled refresh
        const timeoutId = this.refreshTimeouts.get(key);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.refreshTimeouts.delete(key);
        }
      }
    });

    if (hasExpired) {
      this.saveCacheToStorage();
    }
  }

  /**
   * Clean up all resources when manager is no longer needed
   */
  dispose(): void {
    // Clear all scheduled timeouts
    this.refreshTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.refreshTimeouts.clear();

    // Clear cache
    this.cache = {};
    this.saveCacheToStorage();
  }
}

// Export singleton instance
export const dailyTokenManager = new DailyTokenManager();

// Export class for testing
export { DailyTokenManager };
