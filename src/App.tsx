import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { DailyProvider } from "@daily-co/daily-react";

// Lazy load all page components for better code splitting
const Homepage = lazy(() => import("./pages/Homepage"));
const GameSetup = lazy(() => import("./pages/GameSetup"));
const Join = lazy(() => import("./pages/Join"));
const Lobby = lazy(() => import("./pages/Lobby"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Results = lazy(() => import("./pages/Results"));

function App() {
  return (
    <DailyProvider>
      <Router>
        <Suspense fallback={<div className="p-6">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/gamesetup/:sessionCode" element={<GameSetup />} />
            <Route path="/join" element={<Join />} />
            <Route path="/lobby/:sessionCode" element={<Lobby />} />
            <Route path="/quiz/:sessionCode" element={<Quiz />} />
            <Route path="/results/:sessionCode" element={<Results />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </Suspense>
      </Router>
    </DailyProvider>
  );
}

export default App;
