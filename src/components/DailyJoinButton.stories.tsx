import type { Meta, StoryObj } from "@storybook/react";
import { Provider } from "jotai";
import { DailyProvider } from "@daily-co/daily-react";
import { DailyJoinButton } from "./DailyJoinButton";
import { dailyRoomUrlAtom } from "../atoms";

// Mock Daily functionality
const mockDaily = {
  meetingState: () => "left-meeting",
  join: () => Promise.resolve(),
  leave: () => Promise.resolve(),
};

// Custom decorator to provide both Jotai and Daily context
const withProviders = (Story: React.ComponentType, context: any) => {
  const initialValues: Array<[any, any]> = [];
  
  // Set initial Daily room URL based on story parameters
  if (context.parameters?.dailyRoomUrl) {
    initialValues.push([dailyRoomUrlAtom, context.parameters.dailyRoomUrl]);
  }

  return (
    <Provider initialValues={initialValues}>
      <DailyProvider>
        <div className="p-4 bg-blue-600 min-h-48 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <Story />
          </div>
        </div>
      </DailyProvider>
    </Provider>
  );
};

const meta: Meta<typeof DailyJoinButton> = {
  title: "Components/DailyJoinButton",
  component: DailyJoinButton,
  decorators: [withProviders],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    sessionCode: "ABC123",
    participantName: "John Doe",
  },
};

export default meta;
type Story = StoryObj<typeof DailyJoinButton>;

export const NoRoomAvailable: Story = {
  parameters: {
    dailyRoomUrl: null,
  },
};

export const RoomAvailable: Story = {
  parameters: {
    dailyRoomUrl: "https://example.daily.co/room-abc123",
  },
};

export const LongParticipantName: Story = {
  args: {
    sessionCode: "XYZ789",
    participantName: "Very Long Participant Name That Should Still Work",
  },
  parameters: {
    dailyRoomUrl: "https://example.daily.co/room-xyz789",
  },
};