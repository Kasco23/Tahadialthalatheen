import { Logger } from "./logger";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { Tables, ParticipantRow } from "./types/supabase";

// Hook to subscribe to strikes for a session
export function useStrikes(sessionId: string | null) {
  const [strikes, setStrikes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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
          {} as Record<string, number>
        );

        setStrikes(strikesMap);
      } catch (error) {
        Logger.error("Error fetching strikes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrikes();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("strikes_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Strikes",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          Logger.log("Strikes update:", payload);

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
          } else if (payload.eventType === "DELETE") {
            type StrikeRow = { participant_id: string; strikes: number };
            const oldData = payload.old as unknown as StrikeRow;
            setStrikes((prev) => {
              const updated = { ...prev };
              delete updated[oldData.participant_id];
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { strikes, loading };
}

// Hook to subscribe to segment config for a session
export function useSegmentConfig(sessionId: string | null) {
  const [segmentConfig, setSegmentConfig] = useState<Tables<"SegmentConfig">[]>(
    []
  );
  const [loading, setLoading] = useState(true);

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

    // Subscribe to real-time updates
    const channel = supabase
      .channel("segment_config_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "SegmentConfig",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          Logger.log("SegmentConfig update:", payload);

          if (payload.eventType === "INSERT") {
            const newData = payload.new as Tables<"SegmentConfig">;
            setSegmentConfig((prev) => [...prev, newData]);
          } else if (payload.eventType === "UPDATE") {
            const newData = payload.new as Tables<"SegmentConfig">;
            setSegmentConfig((prev) =>
              prev.map((config) =>
                config.config_id === newData.config_id ? newData : config
              )
            );
          } else if (payload.eventType === "DELETE") {
            const oldData = payload.old as Tables<"SegmentConfig">;
            setSegmentConfig((prev) =>
              prev.filter((config) => config.config_id !== oldData.config_id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { segmentConfig, loading };
}

// Hook to subscribe to participant data with powerups and Profile information
export function useParticipants(sessionId: string | null) {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Initial fetch - include Profile data for video participant display
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from("Participants")
          .select(
            `
            *,
            Profiles!profile_id (
              id,
              name,
              username,
              flag,
              team_url,
              avatar_url
            )
          `
          )
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

    // Subscribe to real-time updates
    const channel = supabase
      .channel("participants_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Participants",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          Logger.log("Participant update:", payload);

          // Refetch participant with Profile data to ensure we have complete information
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            try {
              const participantId = payload.new.participant_id;
              const { data, error } = await supabase
                .from("Participants")
                .select(
                  `
                  *,
                  Profiles!profile_id (
                    id,
                    name,
                    username,
                    flag,
                    team_url,
                    avatar_url
                  )
                `
                )
                .eq("participant_id", participantId)
                .single();

              if (error) throw error;

              if (payload.eventType === "INSERT") {
                setParticipants((prev) => [...prev, data]);
              } else if (payload.eventType === "UPDATE") {
                setParticipants((prev) =>
                  prev.map((participant) =>
                    participant.participant_id === data.participant_id
                      ? data
                      : participant
                  )
                );
              }
            } catch (error) {
              Logger.error("Error refetching participant with Profile:", error);
            }
          } else if (payload.eventType === "DELETE") {
            const oldData = payload.old as Tables<"Participants">;
            setParticipants((prev) =>
              prev.filter(
                (participant) =>
                  participant.participant_id !== oldData.participant_id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { participants, loading };
}
