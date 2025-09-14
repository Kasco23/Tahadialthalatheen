import { getSessionIdByCode } from "../lib/mutations";
import { supabase } from "../lib/supabaseClient";

// Mock supabase client
import { vi } from "vitest";

// Mock supabase client
vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe("Session Code Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should convert session code to session ID", async () => {
    const mockSessionId = "550e8400-e29b-41d4-a716-446655440000";
    const mockSessionCode = "ABC123";

    // Mock successful response
    const mockSingle = vi.fn().mockResolvedValue({
      data: { session_id: mockSessionId },
      error: null,
    });

    const mockEq = vi.fn().mockReturnValue({
      single: mockSingle,
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from = mockFrom;

    const result = await getSessionIdByCode(mockSessionCode);

    expect(mockFrom).toHaveBeenCalledWith("Session");
    expect(mockSelect).toHaveBeenCalledWith("session_id");
    expect(mockEq).toHaveBeenCalledWith("session_code", "ABC123");
    expect(result).toBe(mockSessionId);
  });

  it("should handle session not found error", async () => {
    const mockError = { message: "Session not found" };

    // Mock error response
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    });

    const mockEq = vi.fn().mockReturnValue({
      single: mockSingle,
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from = mockFrom;

    await expect(getSessionIdByCode("INVALID")).rejects.toThrow(
      "Session not found: Session not found",
    );
  });
});
