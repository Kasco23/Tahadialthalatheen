import { render, screen } from "@testing-library/react";
import { vi, beforeEach } from "vitest";
import { ParticipantTile } from "./ParticipantTile";
import type { Database } from "../lib/types/supabase";

// Mock Daily React hooks
vi.mock("@daily-co/daily-react", () => ({
  useParticipantProperty: vi.fn(() => "Test User"),
  useVideoTrack: vi.fn(() => ({ track: null, state: "off" })),
  useDaily: vi.fn(() => ({
    updateParticipant: vi.fn(),
  })),
  DailyVideo: ({ sessionId }: { sessionId: string }) => (
    <div data-testid={`video-${sessionId}`}>Video</div>
  ),
}));

// Get the mock for use in tests
import { useDaily } from "@daily-co/daily-react";

type ParticipantRow = Database["public"]["Tables"]["Participant"]["Row"];

describe("ParticipantTile", () => {
  const mockPlayersByName = new Map<string, ParticipantRow>([
    [
      "test user",
      {
        participant_id: "test-participant",
        session_id: "test-session",
        name: "Test User",
        role: "Player1",
        flag: "us",
        team_logo_url: "",
        lobby_presence: "Joined",
        video_presence: false,
        join_at: new Date().toISOString(),
        disconnect_at: null,
        powerup_alhabeed: null,
        powerup_bellegoal: null,
        powerup_pass_used: null,
        powerup_slippyg: null,
      },
    ],
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not show moderation controls when user is not host", () => {
    render(
      <ParticipantTile
        participantId="other-participant"
        playersByName={mockPlayersByName}
        isHost={false}
        currentUserParticipantId="test-participant"
      />,
    );

    expect(screen.queryByTitle(/Mute/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Remove/)).not.toBeInTheDocument();
  });

  it("should not show moderation controls for current user's own tile", () => {
    render(
      <ParticipantTile
        participantId="test-participant"
        playersByName={mockPlayersByName}
        isHost={true}
        currentUserParticipantId="test-participant"
      />,
    );

    expect(screen.queryByTitle(/Mute/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Remove/)).not.toBeInTheDocument();
  });

  it("should show moderation controls when host views other participant", () => {
    render(
      <ParticipantTile
        participantId="other-participant"
        playersByName={mockPlayersByName}
        isHost={true}
        currentUserParticipantId="test-participant"
      />,
    );

    // Name may fallback to Unknown Participant under current mocks
    expect(screen.getByTitle(/Mute/)).toBeInTheDocument();
    expect(screen.getByTitle(/Remove.*from call/)).toBeInTheDocument();
  });

  it("should not show moderation controls without call object", () => {
    // Mock useDaily to return null (no call object)
    (useDaily as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
    
    render(
      <ParticipantTile
        participantId="other-participant"
        playersByName={mockPlayersByName}
        isHost={true}
        currentUserParticipantId="test-participant"
      />,
    );

    expect(screen.queryByTitle(/Mute/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Remove/)).not.toBeInTheDocument();
  });
});
