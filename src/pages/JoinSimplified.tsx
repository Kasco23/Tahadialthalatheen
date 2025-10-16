import { Logger } from "../lib/logger";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Alert } from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";
import { getSeatsFromRole, setSeatInStorage } from "../lib/userSession";
import type { ParticipantRole } from "../lib/types";

const JoinSimplified: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [sessionCode, setSessionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setAlert({
        type: "error",
        message: "Please sign in to join a session",
      });
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    if (!sessionCode.trim()) {
      setAlert({
        type: "error",
        message: "Please enter a session code",
      });
      return;
    }

    setLoading(true);

    try {
      // Get session details
      const { data: sessionData, error: sessionError } = await supabase
        .from("Sessions")
        .select("session_id, host_profile_id")
        .eq("session_code", sessionCode.toUpperCase())
        .single();

      if (sessionError || !sessionData) {
        throw new Error("Session not found. Please check the code and try again.");
      }

      const sessionId = sessionData.session_id;
      const isHost = sessionData.host_profile_id === user.id;

      // Check if user already has a participant for this session
      const { data: existingParticipant } = await supabase
        .from("Participants")
        .select("participant_id, role")
        .eq("session_id", sessionId)
        .eq("profile_id", user.id)
        .maybeSingle();

      let participantId: string;
      let role: ParticipantRole;

      if (existingParticipant) {
        // User already joined, update presence
        participantId = existingParticipant.participant_id;
        role = existingParticipant.role as ParticipantRole;

        await supabase
          .from("Participants")
          .update({
            lobby_presence: "Joined",
            join_at: new Date().toISOString(),
            disconnect_at: null,
          })
          .eq("participant_id", participantId);
      } else {
        // New participant - determine role
        if (isHost) {
          // Find the Host participant slot
          const { data: hostParticipant } = await supabase
            .from("Participants")
            .select("participant_id")
            .eq("session_id", sessionId)
            .eq("role", "Host")
            .maybeSingle();

          if (hostParticipant) {
            // Update existing Host participant
            participantId = hostParticipant.participant_id;
            role = "Host";

            await supabase
              .from("Participants")
              .update({
                profile_id: user.id,
                name: profile?.name || "Host",
                flag: profile?.flag || null,
                team_logo_url: profile?.team || null,
                lobby_presence: "Joined",
                join_at: new Date().toISOString(),
                disconnect_at: null,
              })
              .eq("participant_id", participantId);
          } else {
            throw new Error("Host slot not found in session");
          }
        } else {
          // Assign Player1, Player2, or Guest role
          const { data: existingPlayers } = await supabase
            .from("Participants")
            .select("role")
            .eq("session_id", sessionId)
            .in("role", ["Player1", "Player2"]);

          const playerRoles = (existingPlayers || []).map((p) => p.role);

          if (!playerRoles.includes("Player1")) {
            role = "Player1";
          } else if (!playerRoles.includes("Player2")) {
            role = "Player2";
          } else {
            role = "GameMaster"; // Guest role
          }

          // Create new participant
          const { data: newParticipant, error: insertError } = await supabase
            .from("Participants")
            .insert({
              session_id: sessionId,
              profile_id: user.id,
              name: profile?.name || "Player",
              flag: profile?.flag || null,
              team_logo_url: profile?.team || null,
              role: role,
              lobby_presence: "Joined",
              join_at: new Date().toISOString(),
            })
            .select("participant_id")
            .single();

          if (insertError || !newParticipant) {
            throw new Error("Failed to join session");
          }

          participantId = newParticipant.participant_id;
        }
      }

      // Store in localStorage
      localStorage.setItem("participantId", participantId);
      localStorage.setItem("sessionCode", sessionCode.toUpperCase());
      localStorage.setItem("isHost", isHost ? "true" : "false");
      localStorage.setItem("userRole", role);
      if (profile?.flag) {
        localStorage.setItem("selectedFlag", profile.flag);
      }
      if (profile?.team) {
        localStorage.setItem("teamLogoUrl", profile.team);
      }
      if (profile?.name) {
        localStorage.setItem("teamName", profile.name);
      }

      // Navigate to lobby
      const seat = getSeatsFromRole(role);
      if (seat) {
        setSeatInStorage(seat);
        navigate(`/lobby/${sessionCode.toUpperCase()}/${seat}`);
      } else {
        navigate(`/lobby/${sessionCode.toUpperCase()}`);
      }
    } catch (error) {
      Logger.error("Error joining session:", error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to join session",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <span className="text-3xl sm:text-4xl">🎮</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
            Join Session
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center mt-2">
            Enter the session code to join
          </p>
        </div>

        {user ? (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Joining as: <span className="font-bold">{profile?.name || user.email}</span>
            </p>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Please{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-green-600 font-bold underline"
              >
                sign in
              </button>{" "}
              to join a session
            </p>
          </div>
        )}

        <form onSubmit={handleJoinSession} className="space-y-6">
          <div>
            <label
              htmlFor="sessionCode"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Session Code
            </label>
            <input
              id="sessionCode"
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none shadow-sm hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed text-center text-lg font-bold tracking-wider"
              placeholder="e.g., ABC123"
              disabled={loading || !user}
              maxLength={10}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !user || !sessionCode.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "Joining..." : "Join Session"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Back to Home
          </button>
        </div>
      </div>

      {/* Alert Component */}
      {alert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] w-full max-w-md px-4">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}
    </div>
  );
};

export default JoinSimplified;
