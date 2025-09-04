import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import GameSetup from './pages/GameSetup';
import Join from './pages/Join';
import Lobby from './pages/Lobby';
import Quiz from './pages/Quiz';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/gamesetup/:sessionCode" element={<GameSetup />} />
        <Route path="/join" element={<Join />} />
        <Route path="/lobby/:sessionCode" element={<Lobby />} />
        <Route path="/quiz/:sessionCode" element={<Quiz />} />
        <Route path="/results/:sessionCode" element={<Results />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
