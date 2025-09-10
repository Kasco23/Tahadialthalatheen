import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { DailyProvider } from "@daily-co/daily-react";
import { DailyJoinButton } from "./DailyJoinButton";

// Mock the mutations module
jest.mock("../lib/mutations", () => ({
  createDailyToken: jest.fn().mockResolvedValue({ token: "mock-token" }),
  clearDailyToken: jest.fn(),
  getDailyTokenInfo: jest.fn().mockReturnValue({
    token: "mock-token",
    room_name: "ABC123",
    user_name: "Test User",
    created_at: Date.now(),
    expires_at: Date.now() + (2 * 60 * 60 * 1000), // 2 hours from now
    refresh_threshold: 5 * 60 * 1000, // 5 minutes
  }),
}));

// Mock Daily.co
jest.mock("@daily-co/daily-react", () => ({
  DailyProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="daily-provider">{children}</div>
  ),
  useDaily: () => ({
    meetingState: () => "left-meeting",
    join: jest.fn(),
    leave: jest.fn(),
  }),
}));

describe("DailyJoinButton", () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider>
        <DailyProvider>{component}</DailyProvider>
      </Provider>
    );
  };

  it("renders join button when not in call", () => {
    renderWithProviders(
      <DailyJoinButton sessionCode="ABC123" participantName="Test User" />
    );

    expect(screen.getByText("Join Video Call")).toBeInTheDocument();
  });

  it("shows waiting message when no Daily room URL is available", () => {
    renderWithProviders(
      <DailyJoinButton sessionCode="ABC123" participantName="Test User" />
    );

    expect(
      screen.getByText("Waiting for host to create video room...")
    ).toBeInTheDocument();
  });

  it("disables join button when no room URL", () => {
    renderWithProviders(
      <DailyJoinButton sessionCode="ABC123" participantName="Test User" />
    );

    const joinButton = screen.getByText("Join Video Call");
    expect(joinButton).toBeDisabled();
  });
});