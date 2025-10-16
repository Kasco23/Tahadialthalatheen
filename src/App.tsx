import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { DailyProvider } from "@daily-co/daily-react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy load all page components for better code splitting
const Homepage = lazy(() => import("./pages/Homepage"));
const GameSetup = lazy(() => import("./pages/GameSetup"));
const Join = lazy(() => import("./pages/Join"));
const Lobby = lazy(() => import("./pages/Lobby"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Results = lazy(() => import("./pages/Results"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const FlagSelection = lazy(() => import("./pages/FlagSelection"));
const TeamSelection = lazy(() => import("./pages/TeamSelection"));

function App() {
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
              <Route path="/select-flag" element={<FlagSelection />} />
              <Route path="/select-team" element={<TeamSelection />} />
              <Route path="/gamesetup/:sessionCode" element={<GameSetup />} />
              <Route path="/join" element={<Join />} />
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
