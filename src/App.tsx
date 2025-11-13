import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { DailyProvider } from "@daily-co/daily-react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { getDeviceId } from "./lib/blobsManager";
import { Logger } from "./lib/logger";

// Lazy load all page components for better code splitting
const Homepage = lazy(() => import("./pages/Homepage"));
const GameSetup = lazy(() => import("./pages/GameSetup"));
const JoinPage = lazy(() => import("./pages/JoinSimplified"));
const Lobby = lazy(() => import("./pages/Lobby"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Results = lazy(() => import("./pages/Results"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const FlagSelection = lazy(() => import("./pages/FlagSelection"));
const TeamSelection = lazy(() => import("./pages/TeamSelection"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const CreateQuestions = lazy(() => import("./pages/CreateQuestions"));
const AskFootball = lazy(() => import("./pages/AskFootball"));

function App() {
  // ✨ PHASE 2.4: Initialize device ID on app startup
  useEffect(() => {
    const initializeDeviceId = () => {
      const deviceId = getDeviceId();
      Logger.log("🔧 Device ID initialized:", deviceId);
    };

    initializeDeviceId();
  }, []);

  return (
    <AuthProvider>
      <DailyProvider>
        <Router>
          <Suspense fallback={<div className="p-6">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/create-questions" element={<CreateQuestions />} />
              <Route path="/ask" element={<AskFootball />} />
              <Route path="/select-flag" element={<FlagSelection />} />
              <Route path="/select-team" element={<TeamSelection />} />
              <Route path="/gamesetup/:sessionCode" element={<GameSetup />} />
              <Route path="/join" element={<JoinPage />} />
              <Route path="/lobby/:sessionCode/:seat?" element={<Lobby />} />
              <Route path="/quiz/:sessionCode" element={<Quiz />} />
              <Route path="/results/:sessionCode" element={<Results />} />
              <Route path="/results" element={<Results />} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster position="top-right" />
      </DailyProvider>
    </AuthProvider>
  );
}

export default App;
