import { useState } from "react";

/**
 * Custom hook for managing Join form state
 * 
 * Separates state management from Join.tsx to improve code organization.
 * This hook manages all form fields, loading states, and modal states.
 */

export interface UseJoinFormReturn {
  // Tab and step state
  activeTab: "host" | "player";
  setActiveTab: (tab: "host" | "player") => void;
  currentStep: "role" | "details" | "flag" | "team";
  setCurrentStep: (step: "role" | "details" | "flag" | "team") => void;

  // Alert state
  alert: { type: "error" | "success" | "info"; message: string } | null;
  setAlert: (alert: { type: "error" | "success" | "info"; message: string } | null) => void;

  // Host form state
  sessionCode: string;
  setSessionCode: (code: string) => void;
  hostPassword: string;
  setHostPassword: (password: string) => void;
  hostLoading: boolean;
  setHostLoading: (loading: boolean) => void;
  hostSelectedFlag: string;
  setHostSelectedFlag: (flag: string) => void;
  hostTeamLogoUrl: string;
  setHostTeamLogoUrl: (url: string) => void;
  hostTeamName: string;
  setHostTeamName: (name: string) => void;

  // Player form state
  playerSessionCode: string;
  setPlayerSessionCode: (code: string) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  playerPassword: string;
  setPlayerPassword: (password: string) => void;
  selectedFlag: string;
  setSelectedFlag: (flag: string) => void;
  teamLogoUrl: string;
  setTeamLogoUrl: (url: string) => void;
  teamName: string;
  setTeamName: (name: string) => void;
  playerLoading: boolean;
  setPlayerLoading: (loading: boolean) => void;

  // Preset modal state
  showPresetModal: boolean;
  setShowPresetModal: (show: boolean) => void;
  presetModalLoading: boolean;
  setPresetModalLoading: (loading: boolean) => void;

  // Rejoin modal state
  showRejoinModal: boolean;
  setShowRejoinModal: (show: boolean) => void;
  rejoinLoading: boolean;
  setRejoinLoading: (loading: boolean) => void;
}

export function useJoinForm(): UseJoinFormReturn {
  // Tab and step state
  const [activeTab, setActiveTab] = useState<"host" | "player">("host");
  const [currentStep, setCurrentStep] = useState<
    "role" | "details" | "flag" | "team"
  >("role");

  // Alert state
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  // Host form state
  const [sessionCode, setSessionCode] = useState("");
  const [hostPassword, setHostPassword] = useState("");
  const [hostLoading, setHostLoading] = useState(false);
  const [hostSelectedFlag, setHostSelectedFlag] = useState("");
  const [hostTeamLogoUrl, setHostTeamLogoUrl] = useState("");
  const [hostTeamName, setHostTeamName] = useState("");

  // Player form state
  const [playerSessionCode, setPlayerSessionCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerPassword, setPlayerPassword] = useState("");
  const [selectedFlag, setSelectedFlag] = useState("");
  const [teamLogoUrl, setTeamLogoUrl] = useState("");
  const [teamName, setTeamName] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);

  // Preset modal state
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetModalLoading, setPresetModalLoading] = useState(false);

  // Rejoin modal state
  const [showRejoinModal, setShowRejoinModal] = useState(false);
  const [rejoinLoading, setRejoinLoading] = useState(false);

  return {
    activeTab,
    setActiveTab,
    currentStep,
    setCurrentStep,
    alert,
    setAlert,
    sessionCode,
    setSessionCode,
    hostPassword,
    setHostPassword,
    hostLoading,
    setHostLoading,
    hostSelectedFlag,
    setHostSelectedFlag,
    hostTeamLogoUrl,
    setHostTeamLogoUrl,
    hostTeamName,
    setHostTeamName,
    playerSessionCode,
    setPlayerSessionCode,
    playerName,
    setPlayerName,
    playerPassword,
    setPlayerPassword,
    selectedFlag,
    setSelectedFlag,
    teamLogoUrl,
    setTeamLogoUrl,
    teamName,
    setTeamName,
    playerLoading,
    setPlayerLoading,
    showPresetModal,
    setShowPresetModal,
    presetModalLoading,
    setPresetModalLoading,
    showRejoinModal,
    setShowRejoinModal,
    rejoinLoading,
    setRejoinLoading,
  };
}
