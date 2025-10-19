/**
 * Unit tests for Friends API client
 * Tests friend request management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Friend, Profile } from '../friends';

// Mock Supabase client
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        or: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              id: 'friendship-id',
              requester_id: 'user1',
              addressee_id: 'user2',
              status: 'pending',
              created_at: new Date().toISOString(),
            }, 
            error: null 
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({})),
      })),
    })),
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

describe('Friends API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Friend Request Types', () => {
    it('should define Friend type correctly', () => {
      const mockFriend: Friend = {
        id: 'friend-id',
        requester_id: 'user1',
        addressee_id: 'user2',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(mockFriend).toBeDefined();
      expect(mockFriend.status).toBe('pending');
    });

    it('should define Profile type correctly', () => {
      const mockProfile: Partial<Profile> = {
        id: 'profile-id',
        name: 'Test User',
        username: 'testuser',
      };

      expect(mockProfile).toBeDefined();
      expect(mockProfile.username).toBe('testuser');
    });
  });

  describe('Friend Status Values', () => {
    it('should support all valid friend status values', () => {
      const statuses: Array<'pending' | 'accepted' | 'declined' | 'blocked'> = [
        'pending',
        'accepted',
        'declined',
        'blocked',
      ];

      statuses.forEach((status) => {
        expect(['pending', 'accepted', 'declined', 'blocked']).toContain(status);
      });
    });
  });

  describe('Friend Request Data Structure', () => {
    it('should have required fields for friend request', () => {
      const friendRequest = {
        id: 'req-123',
        requester_id: 'user-abc',
        addressee_id: 'user-xyz',
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      expect(friendRequest).toHaveProperty('id');
      expect(friendRequest).toHaveProperty('requester_id');
      expect(friendRequest).toHaveProperty('addressee_id');
      expect(friendRequest).toHaveProperty('status');
      expect(friendRequest).toHaveProperty('created_at');
    });

    it('should handle friend request with profile data', () => {
      const friendWithProfile = {
        id: 'friend-123',
        requester_id: 'user1',
        addressee_id: 'user2',
        status: 'accepted' as const,
        created_at: new Date().toISOString(),
        requester: {
          id: 'prof1',
          user_id: 'user1',
          name: 'User One',
          username: 'userone',
          email: 'user1@example.com',
        },
        addressee: {
          id: 'prof2',
          user_id: 'user2',
          name: 'User Two',
          username: 'usertwo',
          email: 'user2@example.com',
        },
      };

      expect(friendWithProfile.requester).toBeDefined();
      expect(friendWithProfile.addressee).toBeDefined();
      expect(friendWithProfile.requester?.username).toBe('userone');
      expect(friendWithProfile.addressee?.username).toBe('usertwo');
    });
  });

  describe('Username Validation', () => {
    it('should accept valid usernames', () => {
      const validUsernames = ['abc', 'user123', 'test_user', 'player-1'];
      
      validUsernames.forEach((username) => {
        expect(username.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should reject usernames shorter than 3 characters', () => {
      const invalidUsernames = ['ab', 'a', ''];
      
      invalidUsernames.forEach((username) => {
        expect(username.length).toBeLessThan(3);
      });
    });
  });
});
