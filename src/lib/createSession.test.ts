import { createSession } from "./mutations";
import { supabase } from "./supabaseClient";
import { vi, type MockedFunction } from "vitest";

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("createSession uses DB trigger to create session_code", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates session and returns DB-generated session_code, then creates host participant", async () => {
    const fromMock = (
      supabase as unknown as { from: MockedFunction<() => unknown> }
    ).from;

    // Session insert -> select -> single returns session with session_code set by trigger
    const singleInsert = vi.fn().mockResolvedValue({
      data: { session_id: "new-id", session_code: "A1B2C3!" },
      error: null,
    });
    const insertSelect = vi.fn().mockReturnValue({ single: singleInsert });
    const insertMockSession = vi.fn().mockReturnValue({ select: insertSelect });

    // Participant insert returns ok
    const insertMockParticipant = vi
      .fn()
      .mockResolvedValue({ data: null, error: null });

    // First call to from('Session'), second to from('Participant')
    fromMock
      .mockReturnValueOnce({ insert: insertMockSession })
      .mockReturnValueOnce({ insert: insertMockParticipant });

    const result = await createSession("plaintext-pass", "Host");

    expect(result.sessionCode).toBe("A1B2C3!");
    expect(result.sessionId).toBe("new-id");

    // Ensure we inserted Session without providing session_code (DB trigger handles it)
    expect(insertMockSession).toHaveBeenCalledWith({
      host_password: "plaintext-pass",
      phase: "Setup",
      game_state: "pre-quiz",
    });

    // Ensure participant was created for the new session as both GameMaster and Host
    expect(insertMockParticipant).toHaveBeenCalledWith([
      {
        session_id: "new-id",
        name: "GameMaster",
        role: "GameMaster",
        lobby_presence: "Joined",
      },
      {
        session_id: "new-id",
        name: "Host",
        role: "Host",
        lobby_presence: "NotJoined",
      },
    ]);
  });
});
