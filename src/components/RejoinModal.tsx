import React, { useState } from "react";
import { Flag } from "./Flag";

export interface RejoinParticipant {
  participant_id: string;
  role: string;
  session_presence: string;
  Profiles?: {
    name?: string | null;
    flag?: string | null;
    team_url?: string | null;
  } | null;
}

interface RejoinModalProps {
  isOpen: boolean;
  participants: RejoinParticipant[];
  onClose: () => void;
  onRejoin: (
    participantId: string,
    password: string,
    updateConfig: boolean
  ) => Promise<void>;
  isLoading: boolean;
}

const RejoinModal: React.FC<RejoinModalProps> = ({
  isOpen,
  participants,
  onClose,
  onRejoin,
  isLoading,
}) => {
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [password, setPassword] = useState("");
  const [updateConfig, setUpdateConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedParticipant = participants.find(
    (p) => p.participant_id === selectedParticipantId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedParticipantId) {
      setError("Please select a participant");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    try {
      await onRejoin(selectedParticipantId, password, updateConfig);
      setPassword("");
      setSelectedParticipantId(null);
      setUpdateConfig(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rejoin");
    }
  };

  const handleClose = () => {
    setPassword("");
    setSelectedParticipantId(null);
    setUpdateConfig(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              👋 Rejoin Session
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Participant
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {participants.map((participant) => (
                  <button
                    key={participant.participant_id}
                    type="button"
                    onClick={() =>
                      setSelectedParticipantId(participant.participant_id)
                    }
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedParticipantId === participant.participant_id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {participant.Profiles?.team_url && (
                        <img
                          src={participant.Profiles.team_url}
                          alt={participant.Profiles.name || "Player"}
                          className="w-12 h-12 object-contain"
                        />
                      )}
                      {participant.Profiles?.flag && (
                        <div className="w-12 h-8">
                          <Flag code={participant.Profiles.flag} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {participant.Profiles?.name || "Guest"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participant.role}
                          {participant.session_presence === "Joined" && (
                            <span className="ml-2 text-green-600">
                              🟢 Online
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedParticipant && (
              <>
                <div className="mb-6">
                  <label
                    htmlFor="rejoin-password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="rejoin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateConfig}
                      onChange={(e) => setUpdateConfig(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-700">
                      I want to update my name, flag, or logo
                    </span>
                  </label>
                </div>
              </>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !selectedParticipantId || !password}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Rejoining...
                  </span>
                ) : updateConfig ? (
                  "Rejoin & Update"
                ) : (
                  "Rejoin Session"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RejoinModal;
