import { createSession } from "./mutations";
import { supabase } from "./supabaseClient";

jest.mock("./supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("createSession uses DB trigger to create session_code", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("creates session and returns DB-generated session_code, then creates host participant", async () => {
    const fromMock = (supabase as unknown as { from: jest.Mock }).from;

    // Session insert -> select -> single returns session with session_code set by trigger
    const singleInsert = jest
      .fn()
      .mockResolvedValue({
        data: { session_id: "new-id", session_code: "A1B2C3!" },
        error: null,
      });
    const insertSelect = jest.fn().mockReturnValue({ single: singleInsert });
    const insertMockSession = jest
      .fn()
      .mockReturnValue({ select: insertSelect });

    // Participant insert returns ok
    const insertMockParticipant = jest
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

    // Ensure participant was created for the new session as Host
    expect(insertMockParticipant).toHaveBeenCalledWith({
      session_id: "new-id",
      name: "Host",
      role: "Host",
      lobby_presence: "NotJoined",
    });
  });
});
