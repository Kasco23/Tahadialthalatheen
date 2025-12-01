import { render, screen } from "@testing-library/react";
import { vi, beforeEach } from "vitest";
import { ParticipantTile } from "./ParticipantTile";
import type { Database } from "../lib/types/supabase";

// Mock Daily React hooks
vi.mock("@daily-co/daily-react", () => ({
  useParticipantProperty: vi.fn(() => "Test User"),
  useVideoTrack: vi.fn(() => ({ track: null, state: "off" })),
  DailyVideo: ({ sessionId }: { sessionId: string }) => (
    <div data-testid={`video-${sessionId}`}>Video</div>
  ),
}));

type ParticipantRow = Database["public"]["Tables"]["Participants"]["Row"] & {
  Profiles?: {
    name?: string | null;
    flag?: string | null;
    team?: string | null;
  } | null;
};

describe("ParticipantTile", () => {
  const mockPlayersByName = new Map<string, ParticipantRow>([
    [
      "test user",
      {
        participant_id: "test-participant",
        session_id: "test-session",
        name: "Test User",
        role: "Home",
        flag: "us",
        team_logo_url: "",
        session_presence: "Joined",
        video_presence: false,
        join_at: new Date().toISOString(),
        disconnect_at: null,
        lastHeartbeat: new Date().toISOString(),
        password: null,
        profile_id: "test-profile-id",
        powerup_alhabeed: null,
        powerup_bellegoal: null,
        powerup_pass_used: null,
        powerup_slippyg: null,
        Profiles: {
          name: "Test User from Profile",
          flag: "us",
          team: "Test Team",
        },
      },
    ],
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render participant tile without moderation controls", () => {
    render(
      <ParticipantTile
        participantId="test-participant"
        playersByName={mockPlayersByName}
      />,
    );

    // Moderation controls should never be present
    expect(screen.queryByTitle(/Mute/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Remove/)).not.toBeInTheDocument();
  });

  it("should display participant information correctly", () => {
    render(
      <ParticipantTile
        participantId="test-participant"
        playersByName={mockPlayersByName}
      />,
    );

    // Check that participant info is displayed from Profiles table
    expect(screen.getByText(/Test User from Profile/)).toBeInTheDocument();
  });

  it("should show connection status indicator", () => {
    const { container } = render(
      <ParticipantTile
        participantId="test-participant"
        playersByName={mockPlayersByName}
      />,
    );

    // Check for connection status indicator (green pulse dot)
    const connectionIndicator = container.querySelector(
      ".bg-green-500.rounded-full.animate-pulse",
    );
    expect(connectionIndicator).toBeInTheDocument();
  });

  it("should handle video status correctly", () => {
    render(
      <ParticipantTile
        participantId="test-participant"
        playersByName={mockPlayersByName}
      />,
    );

    // Since mock returns video state as "off", should show camera off indicator
    expect(screen.getByText(/Camera Off/)).toBeInTheDocument();
  });
});
