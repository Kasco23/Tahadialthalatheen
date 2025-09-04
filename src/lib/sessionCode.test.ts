import { getSessionIdByCode } from '../lib/mutations';
import { supabase } from '../lib/supabaseClient';

// Mock supabase client
jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('Session Code Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should convert session code to session ID', async () => {
    const mockSessionId = '550e8400-e29b-41d4-a716-446655440000';
    const mockSessionCode = 'ABC123';

    // Mock successful response
    const mockSingle = jest.fn().mockResolvedValue({
      data: { session_id: mockSessionId },
      error: null
    });

    const mockEq = jest.fn().mockReturnValue({
      single: mockSingle
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: mockEq
    });

    const mockFrom = jest.fn().mockReturnValue({
      select: mockSelect
    });

    (supabase as any).from = mockFrom;

    const result = await getSessionIdByCode(mockSessionCode);

    expect(mockFrom).toHaveBeenCalledWith('Session');
    expect(mockSelect).toHaveBeenCalledWith('session_id');
    expect(mockEq).toHaveBeenCalledWith('session_code', 'ABC123');
    expect(result).toBe(mockSessionId);
  });

  it('should handle session not found error', async () => {
    const mockError = { message: 'Session not found' };

    // Mock error response
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: mockError
    });

    const mockEq = jest.fn().mockReturnValue({
      single: mockSingle
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: mockEq
    });

    const mockFrom = jest.fn().mockReturnValue({
      select: mockSelect
    });

    (supabase as any).from = mockFrom;

    await expect(getSessionIdByCode('INVALID')).rejects.toThrow('Session not found: Session not found');
  });
});