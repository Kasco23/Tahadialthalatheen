import { Logger } from "../lib/logger";
import React, { useState } from "react";
import { DailyProvider, useDaily, useDailyEvent } from "@daily-co/daily-react";
import { useDailyToken } from "../lib/useDailyToken";

// Daily.co event types with reason property
type EventWithReason = { reason?: string; [key: string]: unknown };

interface DailyCallWrapperProps {
  roomUrl: string;
  sessionCode: string;
  participantName: string;
  onJoined?: () => void;
  onLeft?: (reason?: string) => void;
  onError?: (error: string) => void;
  children: React.ReactNode;
}

const DailyCallContent: React.FC<
  Omit<DailyCallWrapperProps, "roomUrl" | "children"> & {
    children: React.ReactNode;
  }
> = ({ sessionCode, participantName, onJoined, onLeft, onError, children }) => {
  const daily = useDaily();
  const { token, isRefreshing } = useDailyToken({
    sessionCode,
    participantName,
  });
  const [isJoining, setIsJoining] = useState(false);
  const [isInCall, setIsInCall] = useState(false);

  // Event handlers
  useDailyEvent("joined-meeting", () => {
    Logger.log("Successfully joined Daily meeting");
    setIsInCall(true);
    setIsJoining(false);
    onJoined?.();
  });

  useDailyEvent("left-meeting", (event) => {
    Logger.log("Left Daily meeting", event);
    setIsInCall(false);
    setIsJoining(false);

    // Check if user was ejected
    if (event && "reason" in event) {
      const reason = (event as unknown as EventWithReason).reason;
      if (reason === "ejected" || reason === "hidden") {
        onLeft?.(reason);
      }
    }
    onLeft?.();
  });

  useDailyEvent("error", (error) => {
    Logger.error("Daily call error:", error);
    setIsJoining(false);
    const errorMessage =
      typeof error === "string" ? error : "An error occurred during the call";
    onError?.(errorMessage);
  });

  useDailyEvent("participant-left", (event) => {
    Logger.log("Participant left:", event);
    if (event && "reason" in event) {
      const reason = (event as unknown as EventWithReason).reason;
      if (reason === "ejected" || reason === "hidden") {
        Logger.log(`Participant was ${reason}`);
      }
    }
  });

  // Join call function
  const joinCall = async () => {
    if (!daily || !token || isJoining || isRefreshing) return;

    setIsJoining(true);
    try {
      await daily.join({
        token,
        userName: participantName,
      });
    } catch (error) {
      Logger.error("Failed to join Daily call:", error);
      setIsJoining(false);
      onError?.(error instanceof Error ? error.message : "Failed to join call");
    }
  };

  // Leave call function
  const leaveCall = async () => {
    if (!daily) return;

    try {
      await daily.leave();
    } catch (error) {
      Logger.error("Error leaving call:", error);
    }
  };

  // Expose join/leave functions to children
  const contextValue = {
    daily,
    isJoining,
    isInCall,
    joinCall,
    leaveCall,
    token,
    isRefreshing,
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            dailyContext: contextValue,
          } as React.HTMLProps<HTMLElement>);
        }
        return child;
      })}
    </div>
  );
};

export const DailyCallWrapper: React.FC<DailyCallWrapperProps> = ({
  roomUrl,
  sessionCode,
  participantName,
  onJoined,
  onLeft,
  onError,
  children,
}) => {
  if (!roomUrl) {
    return <div>{children}</div>;
  }

  return (
    <DailyProvider url={roomUrl}>
      <DailyCallContent
        sessionCode={sessionCode}
        participantName={participantName}
        onJoined={onJoined}
        onLeft={onLeft}
        onError={onError}
      >
        {children}
      </DailyCallContent>
    </DailyProvider>
  );
};

export default DailyCallWrapper;
