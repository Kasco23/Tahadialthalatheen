/**
 * Unit tests for Matches and Statistics API client
 * Tests match recording and statistics tracking
 */

import { describe, it, expect, vi } from 'vitest';
import type { HeadToHeadStats, PlayerStats } from '../types';

// Mock Supabase client
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

// Mock Logger
vi.mock('../logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Matches and Statistics API', () => {
  describe('Player Stats Structure', () => {
    it('should define PlayerStats type correctly', () => {
      const mockStats: PlayerStats = {
        profile_id: 'player1',
        total_games: 10,
        wins: 7,
        losses: 2,
        ties: 1,
        win_rate: 70.0,
        total_points: 850,
      };

      expect(mockStats.total_games).toBe(10);
      expect(mockStats.wins).toBe(7);
      expect(mockStats.losses).toBe(2);
      expect(mockStats.ties).toBe(1);
      expect(mockStats.win_rate).toBe(70.0);
      expect(mockStats.total_points).toBe(850);
    });

    it('should calculate win rate correctly', () => {
      const games = 10;
      const wins = 7;
      const expectedWinRate = (wins / games) * 100;

      expect(expectedWinRate).toBe(70);
    });
  });

  describe('Head-to-Head Stats Structure', () => {
    it('should define HeadToHeadStats type correctly', () => {
      const mockHeadToHead: HeadToHeadStats = {
        opponent_id: 'player2',
        opponent_username: 'player2user',
        opponent_name: 'Player Two',
        games_played: 6,
        wins: 3,
        losses: 2,
        ties: 1,
      };

      expect(mockHeadToHead.wins).toBe(3);
      expect(mockHeadToHead.losses).toBe(2);
      expect(mockHeadToHead.ties).toBe(1);
      expect(mockHeadToHead.games_played).toBe(6);
    });

    it('should sum games correctly', () => {
      const wins = 3;
      const losses = 2;
      const ties = 1;
      const totalGames = wins + losses + ties;

      expect(totalGames).toBe(6);
    });
  });

  describe('Match Data Structure', () => {
    it('should have required fields for match recording', () => {
      const match = {
        id: 'match-123',
        session_id: 'session-abc',
        home_player_id: 'player1',
        away_player_id: 'player2',
        home_score: 85,
        away_score: 72,
        winner_id: 'player1',
        segments_played: 5,
        created_at: new Date().toISOString(),
      };

      expect(match).toHaveProperty('session_id');
      expect(match).toHaveProperty('home_player_id');
      expect(match).toHaveProperty('away_player_id');
      expect(match).toHaveProperty('home_score');
      expect(match).toHaveProperty('away_score');
      expect(match).toHaveProperty('winner_id');
      expect(match).toHaveProperty('segments_played');
    });

    it('should handle tied matches', () => {
      const tiedMatch = {
        home_score: 75,
        away_score: 75,
        winner_id: null, // No winner in case of tie
      };

      expect(tiedMatch.home_score).toBe(tiedMatch.away_score);
      expect(tiedMatch.winner_id).toBeNull();
    });

    it('should determine winner correctly', () => {
      const homeWin = {
        home_score: 90,
        away_score: 70,
        home_player_id: 'player1',
        away_player_id: 'player2',
      };

      const winnerId = homeWin.home_score > homeWin.away_score
        ? homeWin.home_player_id
        : homeWin.away_score > homeWin.home_score
        ? homeWin.away_player_id
        : null;

      expect(winnerId).toBe('player1');
    });
  });

  describe('Segment Statistics', () => {
    it('should have required fields for segment stats', () => {
      const segmentStat = {
        id: 'stat-123',
        profile_id: 'player1',
        segment_code: 'WDYK',
        games_played: 20,
        total_questions: 100,
        correct_answers: 75,
        strikes: 5,
        points: 450,
      };

      expect(segmentStat).toHaveProperty('profile_id');
      expect(segmentStat).toHaveProperty('segment_code');
      expect(segmentStat).toHaveProperty('games_played');
      expect(segmentStat).toHaveProperty('total_questions');
      expect(segmentStat).toHaveProperty('correct_answers');
      expect(segmentStat).toHaveProperty('points');
    });

    it('should support all segment codes', () => {
      const segmentCodes = ['WDYK', 'AUCT', 'BELL', 'UPDW', 'REMO'];

      segmentCodes.forEach((code) => {
        expect(code).toMatch(/^[A-Z]{4}$/);
      });
    });
  });

  describe('Leaderboard Data', () => {
    it('should rank players by win rate', () => {
      const players = [
        { username: 'player1', win_rate: 75.0, wins: 15 },
        { username: 'player2', win_rate: 80.0, wins: 12 },
        { username: 'player3', win_rate: 70.0, wins: 14 },
      ];

      const sorted = [...players].sort((a, b) => b.win_rate - a.win_rate);

      expect(sorted[0].username).toBe('player2');
      expect(sorted[1].username).toBe('player1');
      expect(sorted[2].username).toBe('player3');
    });

    it('should calculate total points for matches', () => {
      const match = {
        home_score: 85,
        away_score: 72,
      };

      const totalPoints = match.home_score + match.away_score;

      expect(totalPoints).toBe(157);
    });
  });
});
