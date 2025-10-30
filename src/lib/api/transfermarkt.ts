/**
 * Transfermarkt API Client
 *
 * Wrapper for Transfermarkt Open API (transfermarkt-api.fly.dev)
 * No authentication required.
 *
 * @see /docs/Database/TransferMarktOpenapi.json for full OpenAPI spec
 */

// ============================================================================
// TypeScript Types (extracted from OpenAPI spec)
// ============================================================================

export interface PlayerSearchResult {
  id: string;
  name: string;
  position: string;
  club: {
    id: string;
    name: string;
  };
  age: number | null;
  nationalities: string[];
  marketValue: number | null;
}

export interface PlayerSearch {
  updatedAt: string;
  query: string;
  pageNumber: number;
  lastPageNumber: number;
  results: PlayerSearchResult[];
}

export interface PlayerProfile {
  updatedAt: string;
  id: string;
  url: string;
  name: string;
  description: string;
  fullName: string | null;
  nameInHomeCountry: string | null;
  imageUrl: string | null;
  dateOfBirth: string | null; // ISO date format
  placeOfBirth: {
    city: string | null;
    country: string | null;
  };
  age: number | null;
  height: number | null; // in cm
  citizenship: string[];
  isRetired: boolean;
  retiredSince: string | null;
  position: {
    main: string | null;
    other: string[] | null;
  };
  foot: string | null;
  shirtNumber: string | null;
  club: {
    id: string | null;
    name: string;
    joined: string | null;
    contractExpires: string | null;
    contractOption: string | null;
    lastClubId: string | null;
    lastClubName: string | null;
    mostGamesFor: string | null;
  };
  marketValue: number | null;
  agent: {
    name: string | null;
    url: string | null;
  } | null;
  outfitter: string | null;
  socialMedia: string[] | null;
}

export interface PlayerTransfer {
  id: string;
  clubFrom: {
    id: string;
    name: string;
  };
  clubTo: {
    id: string;
    name: string;
  };
  date: string; // ISO date format
  upcoming: boolean;
  season: string;
  marketValue: number | null;
  fee: number | null;
}

export interface PlayerTransfers {
  updatedAt: string;
  id: string;
  transfers: PlayerTransfer[];
  youthClubs: string[] | null;
}

export interface PlayerStat {
  competitionId: string;
  competitionName: string;
  seasonId: string;
  clubId: string;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
  yellowCards: number | null;
  redCards: number | null;
  minutesPlayed: number | null;
}

export interface PlayerStats {
  updatedAt: string;
  id: string;
  stats: PlayerStat[];
}

export interface PlayerAchievement {
  title: string;
  count: number;
  details: Array<{
    season: {
      id: string | null;
      name: string;
    };
    competition: {
      id: string | null;
      name: string;
    } | null;
    club: {
      id: string | null;
      name: string;
    } | null;
  }>;
}

export interface PlayerAchievements {
  updatedAt: string;
  id: string;
  achievements: PlayerAchievement[];
}

export interface JerseyNumber {
  season: string;
  club: string;
  jerseyNumber: number;
}

export interface PlayerJerseyNumbers {
  updatedAt: string;
  id: string;
  jerseyNumbers: JerseyNumber[];
}

export interface ClubSearchResult {
  id: string;
  url: string;
  name: string;
  country: string;
  squad: number;
  marketValue: number | null;
}

export interface ClubSearch {
  updatedAt: string;
  query: string;
  pageNumber: number;
  lastPageNumber: number;
  results: ClubSearchResult[];
}

export interface ClubPlayer {
  id: string;
  name: string;
  position: string;
  dateOfBirth: string | null;
  age: number | null;
  nationality: string[];
  currentClub: string | null;
  height: number | null;
  foot: string | null;
  joinedOn: string | null;
  joined: string | null;
  signedFrom: string | null;
  contract: string | null;
  marketValue: number | null;
  status: string | null;
}

export interface ClubPlayers {
  updatedAt: string;
  id: string;
  players: ClubPlayer[];
}

export interface CompetitionSearchResult {
  id: string;
  name: string;
  country: string;
  clubs: number;
  players: number;
  totalMarketValue: number | null;
  meanMarketValue: number | null;
  continent: string | null;
}

export interface CompetitionSearch {
  updatedAt: string;
  query: string;
  pageNumber: number;
  lastPageNumber: number;
  results: CompetitionSearchResult[];
}

export interface CompetitionClub {
  id: string;
  name: string;
}

export interface CompetitionClubs {
  updatedAt: string;
  id: string;
  name: string;
  seasonId: string;
  clubs: CompetitionClub[];
}

// ============================================================================
// Error Types
// ============================================================================

export class TransfermarktAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = "TransfermarktAPIError";
  }
}

// ============================================================================
// API Client
// ============================================================================

export interface TransfermarktClientOptions {
  baseUrl?: string;
  timeout?: number; // in milliseconds
}

export class TransfermarktClient {
  private baseUrl: string;
  private timeout: number;

  constructor(options: TransfermarktClientOptions = {}) {
    this.baseUrl = options.baseUrl || "https://transfermarkt-api.fly.dev";
    this.timeout = options.timeout || 10000; // 10 seconds default
  }

  /**
   * Generic fetch wrapper with error handling and timeout
   */
  private async fetchWithTimeout<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new TransfermarktAPIError(
          `API request failed: ${response.statusText}`,
          response.status,
          endpoint,
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof TransfermarktAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new TransfermarktAPIError(
            `Request timeout after ${this.timeout}ms`,
            408,
            endpoint,
            error,
          );
        }

        throw new TransfermarktAPIError(
          `Network error: ${error.message}`,
          undefined,
          endpoint,
          error,
        );
      }

      throw new TransfermarktAPIError(
        "Unknown error occurred",
        undefined,
        endpoint,
        error,
      );
    }
  }

  // ==========================================================================
  // Player Methods
  // ==========================================================================

  /**
   * Search for players by name
   * @param playerName - Player name to search for
   * @param pageNumber - Page number for pagination (default: 1)
   * @returns PlayerSearch object with results
   *
   * @example
   * const results = await client.searchPlayer('Thierry Henry');
   * console.log(results.results[0].id); // Player ID for further queries
   */
  async searchPlayer(
    playerName: string,
    pageNumber: number = 1,
  ): Promise<PlayerSearch> {
    const endpoint = `/players/search/${encodeURIComponent(playerName)}?page_number=${pageNumber}`;
    return this.fetchWithTimeout<PlayerSearch>(endpoint);
  }

  /**
   * Get detailed player profile
   * @param playerId - Transfermarkt player ID
   * @returns PlayerProfile with full details
   *
   * @example
   * const profile = await client.getPlayerProfile('3207');
   * console.log(profile.fullName, profile.club.name);
   */
  async getPlayerProfile(playerId: string): Promise<PlayerProfile> {
    const endpoint = `/players/${encodeURIComponent(playerId)}/profile`;
    return this.fetchWithTimeout<PlayerProfile>(endpoint);
  }

  /**
   * Get player transfer history
   * @param playerId - Transfermarkt player ID
   * @returns PlayerTransfers with all transfers and youth clubs
   *
   * @example
   * const transfers = await client.getPlayerTransfers('3207');
   * const clubs = transfers.transfers.map(t => t.clubTo.name);
   */
  async getPlayerTransfers(playerId: string): Promise<PlayerTransfers> {
    const endpoint = `/players/${encodeURIComponent(playerId)}/transfers`;
    return this.fetchWithTimeout<PlayerTransfers>(endpoint);
  }

  /**
   * Get player statistics (goals, assists, appearances by competition/season)
   * @param playerId - Transfermarkt player ID
   * @returns PlayerStats with career statistics
   *
   * @example
   * const stats = await client.getPlayerStats('3207');
   * const totalGoals = stats.stats.reduce((sum, s) => sum + (s.goals || 0), 0);
   */
  async getPlayerStats(playerId: string): Promise<PlayerStats> {
    const endpoint = `/players/${encodeURIComponent(playerId)}/stats`;
    return this.fetchWithTimeout<PlayerStats>(endpoint);
  }

  /**
   * Get player achievements (trophies, titles, awards)
   * @param playerId - Transfermarkt player ID
   * @returns PlayerAchievements with all career achievements
   *
   * @example
   * const achievements = await client.getPlayerAchievements('3207');
   * const trophies = achievements.achievements.filter(a => a.title.includes('Winner'));
   */
  async getPlayerAchievements(playerId: string): Promise<PlayerAchievements> {
    const endpoint = `/players/${encodeURIComponent(playerId)}/achievements`;
    return this.fetchWithTimeout<PlayerAchievements>(endpoint);
  }

  /**
   * Get player jersey numbers by club and season
   * @param playerId - Transfermarkt player ID
   * @returns PlayerJerseyNumbers with all jersey numbers worn
   *
   * @example
   * const jerseys = await client.getPlayerJerseyNumbers('3207');
   * const arsenalNumber = jerseys.jerseyNumbers.find(j => j.club.includes('Arsenal'));
   */
  async getPlayerJerseyNumbers(playerId: string): Promise<PlayerJerseyNumbers> {
    const endpoint = `/players/${encodeURIComponent(playerId)}/jersey_numbers`;
    return this.fetchWithTimeout<PlayerJerseyNumbers>(endpoint);
  }

  // ==========================================================================
  // Club Methods
  // ==========================================================================

  /**
   * Search for clubs by name
   * @param clubName - Club name to search for
   * @param pageNumber - Page number for pagination (default: 1)
   * @returns ClubSearch object with results
   *
   * @example
   * const results = await client.searchClub('Arsenal');
   * console.log(results.results[0].id); // Club ID for further queries
   */
  async searchClub(
    clubName: string,
    pageNumber: number = 1,
  ): Promise<ClubSearch> {
    const endpoint = `/clubs/search/${encodeURIComponent(clubName)}?page_number=${pageNumber}`;
    return this.fetchWithTimeout<ClubSearch>(endpoint);
  }

  /**
   * Get club players for a specific season
   * @param clubId - Transfermarkt club ID
   * @param seasonId - Optional season ID (e.g., '2023'). If omitted, returns current squad.
   * @returns ClubPlayers with squad list
   *
   * @example
   * const squad = await client.getClubPlayers('11', '2023');
   * const forwards = squad.players.filter(p => p.position === 'Centre-Forward');
   */
  async getClubPlayers(
    clubId: string,
    seasonId?: string,
  ): Promise<ClubPlayers> {
    const seasonParam = seasonId
      ? `?season_id=${encodeURIComponent(seasonId)}`
      : "";
    const endpoint = `/clubs/${encodeURIComponent(clubId)}/players${seasonParam}`;
    return this.fetchWithTimeout<ClubPlayers>(endpoint);
  }

  // ==========================================================================
  // Competition Methods
  // ==========================================================================

  /**
   * Search for competitions by name
   * @param competitionName - Competition name to search for
   * @param pageNumber - Page number for pagination (default: 1)
   * @returns CompetitionSearch object with results
   *
   * @example
   * const results = await client.searchCompetition('Premier League');
   * console.log(results.results[0].id); // Competition ID
   */
  async searchCompetition(
    competitionName: string,
    pageNumber: number = 1,
  ): Promise<CompetitionSearch> {
    const endpoint = `/competitions/search/${encodeURIComponent(competitionName)}?page_number=${pageNumber}`;
    return this.fetchWithTimeout<CompetitionSearch>(endpoint);
  }

  /**
   * Get all clubs in a competition for a specific season
   * @param competitionId - Transfermarkt competition ID
   * @param seasonId - Optional season ID. If omitted, returns current season.
   * @returns CompetitionClubs with club list
   *
   * @example
   * const clubs = await client.getCompetitionClubs('GB1', '2023');
   * console.log(clubs.clubs.length); // Number of clubs in Premier League 2023
   */
  async getCompetitionClubs(
    competitionId: string,
    seasonId?: string,
  ): Promise<CompetitionClubs> {
    const seasonParam = seasonId
      ? `?season_id=${encodeURIComponent(seasonId)}`
      : "";
    const endpoint = `/competitions/${encodeURIComponent(competitionId)}/clubs${seasonParam}`;
    return this.fetchWithTimeout<CompetitionClubs>(endpoint);
  }
}

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default client instance
 * Can be used directly or create a new instance with custom options
 *
 * @example
 * import { transfermarktClient } from '@/lib/api/transfermarkt';
 * const results = await transfermarktClient.searchPlayer('Messi');
 *
 * @example
 * import { TransfermarktClient } from '@/lib/api/transfermarkt';
 * const client = new TransfermarktClient({ timeout: 5000 });
 */
export const transfermarktClient = new TransfermarktClient();
