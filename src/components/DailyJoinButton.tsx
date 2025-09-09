import { useState } from "react";
import { useAtom } from "jotai";
import { useDaily } from "@daily-co/daily-react";
import { dailyRoomUrlAtom, dailyTokenAtom, dailyUserNameAtom } from "../atoms";
import { createDailyToken } from "../lib/mutations";

interface DailyJoinButtonProps {
  sessionCode: string;
  participantName: string;
}

export const DailyJoinButton: React.FC<DailyJoinButtonProps> = ({
  sessionCode,
  participantName,
}) => {
  const daily = useDaily();
  const [dailyRoomUrl] = useAtom(dailyRoomUrlAtom);
  const [, setDailyToken] = useAtom(dailyTokenAtom);
  const [, setDailyUserName] = useAtom(dailyUserNameAtom);
  
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinDaily = async () => {
    if (!dailyRoomUrl) {
      setJoinError("No Daily room available. Host needs to create a room first.");
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      // Create a token for joining the Daily room
      const tokenResponse = await createDailyToken(sessionCode, participantName);
      setDailyToken(tokenResponse.token);
      setDailyUserName(participantName);

      // Join the Daily room using the Daily instance
      await daily?.join({
        url: dailyRoomUrl,
        token: tokenResponse.token,
        userName: participantName,
      });

      console.log("Successfully joined Daily room:", {
        roomUrl: dailyRoomUrl,
        userName: participantName,
      });
    } catch (error) {
      console.error("Failed to join Daily room:", error);
      setJoinError(
        error instanceof Error ? error.message : "Failed to join video call"
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveDaily = async () => {
    if (daily) {
      await daily.leave();
      setDailyToken(null);
      setDailyUserName(null);
      console.log("Left Daily room");
    }
  };

  const isInCall = daily?.meetingState() === "joined-meeting";

  return (
    <div className="space-y-2">
      {joinError && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {joinError}
        </div>
      )}
      
      {!isInCall ? (
        <button
          onClick={handleJoinDaily}
          disabled={isJoining || !dailyRoomUrl}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isJoining || !dailyRoomUrl
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isJoining ? "Joining..." : "Join Video Call"}
        </button>
      ) : (
        <button
          onClick={handleLeaveDaily}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Leave Video Call
        </button>
      )}

      {!dailyRoomUrl && (
        <p className="text-sm text-gray-500">
          Waiting for host to create video room...
        </p>
      )}
    </div>
  );
};