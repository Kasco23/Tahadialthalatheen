import { Logger } from "./logger";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { Tables } from "./types";

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
        },
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
    [],
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
                config.config_id === newData.config_id ? newData : config,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            const oldData = payload.old as Tables<"SegmentConfig">;
            setSegmentConfig((prev) =>
              prev.filter((config) => config.config_id !== oldData.config_id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { segmentConfig, loading };
}

// Hook to subscribe to participant data with powerups
export function useParticipants(sessionId: string | null) {
  const [participants, setParticipants] = useState<Tables<"Participant">[]>([]);
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

    // Subscribe to real-time updates
    const channel = supabase
      .channel("participants_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Participant",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          Logger.log("Participant update:", payload);

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { participants, loading };
}
