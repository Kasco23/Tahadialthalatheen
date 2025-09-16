import { Logger } from "../lib/logger";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Tables } from "../lib/types";t { Logger } from "./logger";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Tables } from "./types";

// Types for enhanced realtime functionality
export interface GameActionPayload {
  action: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface ChatMessagePayload {
  message: string;
  userId: string;
  timestamp: string;
}

export interface PresenceData {
  user_id: string;
  name?: string;
  role?: string;
  flag?: string;
  last_seen: string;
  [key: string]: unknown;
}

// Enhanced realtime hook that combines broadcasts, presence, and postgres changes
export function useEnhancedRealtime(sessionId: string | null) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize unified channel for the session
  useEffect(() => {
    if (!sessionId) return;

    const sessionChannel = supabase.channel(`session_${sessionId}`, {
      config: {
        presence: { key: sessionId },
        broadcast: { self: true },
      },
    });

    sessionChannel
      .on("broadcast", { event: "game_action" }, (payload) => {
        Logger.log("Game action broadcast:", payload);
      })
      .on("broadcast", { event: "chat_message" }, (payload) => {
        Logger.log("Chat message broadcast:", payload);
      })
      .on("presence", { event: "sync" }, () => {
        Logger.log("Presence synced");
      })
      .subscribe((status) => {
        Logger.log(`Session channel status: ${status}`);
        setIsConnected(status === "SUBSCRIBED");
      });

    setChannel(sessionChannel);

    return () => {
      sessionChannel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
    };
  }, [sessionId]);

  // Broadcast helpers
  const sendGameAction = useCallback(
    (action: string, data: Record<string, unknown>) => {
      if (!channel) return;

      channel.send({
        type: "broadcast",
        event: "game_action",
        payload: { action, data, timestamp: new Date().toISOString() },
      });
    },
    [channel],
  );

  const sendChatMessage = useCallback(
    (message: string, userId: string) => {
      if (!channel) return;

      channel.send({
        type: "broadcast",
        event: "chat_message",
        payload: { message, userId, timestamp: new Date().toISOString() },
      });
    },
    [channel],
  );

  // Presence helpers
  const trackPresence = useCallback(
    (presenceData: PresenceData) => {
      if (!channel) return;

      return channel.track({
        ...presenceData,
        last_seen: new Date().toISOString(),
      });
    },
    [channel],
  );

  const untrackPresence = useCallback(() => {
    if (!channel) return;

    return channel.untrack();
  }, [channel]);

  return {
    channel,
    isConnected,
    sendGameAction,
    sendChatMessage,
    trackPresence,
    untrackPresence,
  };
}

// Enhanced strikes hook with broadcast support
export function useStrikes(sessionId: string | null) {
  const [strikes, setStrikes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { sendGameAction } = useEnhancedRealtime(sessionId);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchStrikes = async () => {
      try {
        const { data, error } = await supabase
          .from("Strikes")
          .select("participant_id, strikes")
          .eq("session_id", sessionId)
          .eq("segment_code", "WDYK");

        if (error) throw error;

        const strikesMap = data.reduce(
          (acc, strike) => {
            acc[strike.participant_id] = strike.strikes;
            return acc;
          },
          {} as Record<string, number>,
        );

        setStrikes(strikesMap);
      } catch (error) {
        Logger.error("Error fetching strikes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrikes();

    // Enhanced subscription with broadcast support
    const channel = supabase
      .channel(`strikes_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Strikes",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          Logger.log("Strikes DB update:", payload);

          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            type StrikeRow = { participant_id: string; strikes: number };
            const newData = payload.new as unknown as StrikeRow;

            setStrikes((prev) => ({
              ...prev,
              [newData.participant_id]: newData.strikes,
            }));

            // Broadcast strike change for immediate UI updates
            sendGameAction("strike_updated", {
              participantId: newData.participant_id,
              strikes: newData.strikes,
            });
          } else if (payload.eventType === "DELETE") {
            type StrikeRow = { participant_id: string; strikes: number };
            const oldData = payload.old as unknown as StrikeRow;

            setStrikes((prev) => {
              const updated = { ...prev };
              delete updated[oldData.participant_id];
              return updated;
            });

            sendGameAction("strike_removed", {
              participantId: oldData.participant_id,
            });
          }
        },
      )
      .on("broadcast", { event: "game_action" }, (payload) => {
        const { action, data } = payload.payload;

        // Handle real-time strike updates via broadcast
        if (action === "strike_updated") {
          setStrikes((prev) => ({
            ...prev,
            [data.participantId]: data.strikes,
          }));
        } else if (action === "strike_removed") {
          setStrikes((prev) => {
            const updated = { ...prev };
            delete updated[data.participantId];
            return updated;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, sendGameAction]);

  return { strikes, loading };
}

// Enhanced segment config hook
export function useSegmentConfig(sessionId: string | null) {
  const [segmentConfig, setSegmentConfig] = useState<Tables<"SegmentConfig">[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const { sendGameAction } = useEnhancedRealtime(sessionId);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchSegmentConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("SegmentConfig")
          .select("*")
          .eq("session_id", sessionId);

        if (error) throw error;
        setSegmentConfig(data || []);
      } catch (error) {
        Logger.error("Error fetching segment config:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSegmentConfig();

    // Enhanced subscription
    const channel = supabase
      .channel(`segment_config_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "SegmentConfig",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          Logger.log("SegmentConfig DB update:", payload);

          if (payload.eventType === "INSERT") {
            const newData = payload.new as Tables<"SegmentConfig">;
            setSegmentConfig((prev) => [...prev, newData]);

            sendGameAction("segment_config_added", newData);
          } else if (payload.eventType === "UPDATE") {
            const newData = payload.new as Tables<"SegmentConfig">;
            setSegmentConfig((prev) =>
              prev.map((config) =>
                config.config_id === newData.config_id ? newData : config,
              ),
            );

            sendGameAction("segment_config_updated", newData);
          } else if (payload.eventType === "DELETE") {
            const oldData = payload.old as Tables<"SegmentConfig">;
            setSegmentConfig((prev) =>
              prev.filter((config) => config.config_id !== oldData.config_id),
            );

            sendGameAction("segment_config_removed", {
              configId: oldData.config_id,
            });
          }
        },
      )
      .on("broadcast", { event: "game_action" }, (payload) => {
        const { action, data } = payload.payload;

        // Handle broadcast updates for immediate UI sync
        if (action === "segment_config_added") {
          setSegmentConfig((prev) => [...prev, data]);
        } else if (action === "segment_config_updated") {
          setSegmentConfig((prev) =>
            prev.map((config) =>
              config.config_id === data.config_id ? data : config,
            ),
          );
        } else if (action === "segment_config_removed") {
          setSegmentConfig((prev) =>
            prev.filter((config) => config.config_id !== data.configId),
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, sendGameAction]);

  return { segmentConfig, loading };
}

// Enhanced participants hook with native presence
export function useParticipants(sessionId: string | null) {
  const [participants, setParticipants] = useState<Tables<"Participant">[]>([]);
  const [presenceState, setPresenceState] = useState<
    Record<string, PresenceData>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from("Participant")
          .select("*")
          .eq("session_id", sessionId);

        if (error) throw error;
        setParticipants(data || []);
      } catch (error) {
        Logger.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();

    // Enhanced subscription with native presence
    const channel = supabase
      .channel(`participants_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Participant",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          Logger.log("Participant DB update:", payload);

          if (payload.eventType === "INSERT") {
            const newData = payload.new as Tables<"Participant">;
            setParticipants((prev) => [...prev, newData]);
          } else if (payload.eventType === "UPDATE") {
            const newData = payload.new as Tables<"Participant">;
            setParticipants((prev) =>
              prev.map((participant) =>
                participant.participant_id === newData.participant_id
                  ? newData
                  : participant,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            const oldData = payload.old as Tables<"Participant">;
            setParticipants((prev) =>
              prev.filter(
                (participant) =>
                  participant.participant_id !== oldData.participant_id,
              ),
            );
          }
        },
      )
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        Logger.log("Presence sync:", newState);

        // Convert RealtimePresenceState to our typed format
        const typedState: Record<string, PresenceData> = {};
        Object.entries(newState).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            // Extract the actual presence data from the Supabase presence object
            const presenceObj = presences[0] as unknown as PresenceData;
            typedState[key] = presenceObj;
          }
        });
        setPresenceState(typedState);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        Logger.log("User joined presence:", { key, newPresences });
        if (newPresences && newPresences.length > 0) {
          const presenceObj = newPresences[0] as unknown as PresenceData;
          setPresenceState((prev) => ({ ...prev, [key]: presenceObj }));
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        Logger.log("User left presence:", key);
        setPresenceState((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return {
    participants,
    presenceState,
    loading,
    // Helper to get combined participant + presence data
    participantsWithPresence: participants.map((participant) => ({
      ...participant,
      realtimePresence: presenceState[participant.participant_id] || null,
    })),
  };
}

// Chat functionality using broadcasts
export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      message: string;
      userId: string;
      timestamp: string;
      userName?: string;
    }>
  >([]);

  const { sendChatMessage } = useEnhancedRealtime(sessionId);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat_${sessionId}`)
      .on("broadcast", { event: "chat_message" }, (payload) => {
        const { message, userId, timestamp } = payload.payload;

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            message,
            userId,
            timestamp,
          },
        ]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    (message: string, userId: string) => {
      sendChatMessage(message, userId);
    },
    [sendChatMessage],
  );

  return { messages, sendMessage };
}
