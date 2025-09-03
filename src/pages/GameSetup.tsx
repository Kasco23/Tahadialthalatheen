import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GameSetup: React.FC = () => {
  const navigate = useNavigate();
  const [hostPassword, setHostPassword] = useState('');
  const [segments, setSegments] = useState({
    WDYK: 4, // What Do You Know
    AUCT: 2, // Auction
    BELL: 10, // Bell
    UPDW: 10, // Up Down
    REMO: 4  // Remote
  });

  const handleSegmentChange = (segment: keyof typeof segments, value: string) => {
    const numValue = parseInt(value) || 0;
    setSegments(prev => ({
      ...prev,
      [segment]: numValue
    }));
  };

  const handleCreateDailyRoom = () => {
    // Mock handler for Daily.co room creation
    alert('Creating Daily Room... (Mock implementation)');
    console.log('Daily Room creation would happen here');
  };

  const handleStartQuiz = () => {
    // For testing, use the first available session
    navigate('/quiz/67B35Y');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🎮 Game Setup
        </h1>

        <form className="space-y-6">
          {/* Host Password Input */}
          <div>
            <label htmlFor="hostPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Host Password
            </label>
            <input
              type="password"
              id="hostPassword"
              value={hostPassword}
              onChange={(e) => setHostPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              placeholder="Enter host password"
            />
          </div>

          {/* Segment Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Counts</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 items-center">
                <label htmlFor="wdyk" className="text-sm font-medium text-gray-700">
                  WDYK (What Do You Know)
                </label>
                <input
                  type="number"
                  id="wdyk"
                  min="0"
                  value={segments.WDYK}
                  onChange={(e) => handleSegmentChange('WDYK', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <label htmlFor="auct" className="text-sm font-medium text-gray-700">
                  AUCT (Auction)
                </label>
                <input
                  type="number"
                  id="auct"
                  min="0"
                  value={segments.AUCT}
                  onChange={(e) => handleSegmentChange('AUCT', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <label htmlFor="bell" className="text-sm font-medium text-gray-700">
                  BELL (Bell)
                </label>
                <input
                  type="number"
                  id="bell"
                  min="0"
                  value={segments.BELL}
                  onChange={(e) => handleSegmentChange('BELL', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <label htmlFor="updw" className="text-sm font-medium text-gray-700">
                  UPDW (Up Down)
                </label>
                <input
                  type="number"
                  id="updw"
                  min="0"
                  value={segments.UPDW}
                  onChange={(e) => handleSegmentChange('UPDW', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <label htmlFor="remo" className="text-sm font-medium text-gray-700">
                  REMO (Remote)
                </label>
                <input
                  type="number"
                  id="remo"
                  min="0"
                  value={segments.REMO}
                  onChange={(e) => handleSegmentChange('REMO', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleCreateDailyRoom}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105"
            >
              📹 Create Daily Room
            </button>

            <button
              type="button"
              onClick={handleStartQuiz}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105"
            >
              🚀 Start Quiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameSetup;
