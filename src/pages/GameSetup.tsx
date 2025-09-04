import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, setSegmentConfig, createDailyRoom, getSegmentConfig } from '../lib/mutations';
import type { SegmentCode } from '../lib/types';

const GameSetup: React.FC = () => {
  const navigate = useNavigate();
  const [hostPassword, setHostPassword] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [segments, setSegments] = useState({
    WDYK: 4, // What Do You Know
    AUCT: 2, // Auction
    BELL: 10, // Bell
    UPDW: 10, // Up Down
    REMO: 4  // Remote
  });

  const handleSegmentChange = async (segment: keyof typeof segments, value: string) => {
    const numValue = parseInt(value) || 0;
    setSegments(prev => ({
      ...prev,
      [segment]: numValue
    }));

    // If session exists, update the config in Supabase immediately
    if (sessionId) {
      try {
        await setSegmentConfig(sessionId, [{
          segment_code: segment as SegmentCode,
          questions_count: numValue
        }]);
      } catch (error) {
        console.error('Failed to update segment config:', error);
      }
    }
  };

  const handleCreateDailyRoom = async () => {
    if (!hostPassword.trim()) {
      alert('Please enter a host password first');
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Create session
      const newSessionId = await createSession(hostPassword);
      setSessionId(newSessionId);
      
      // 2. Set segment configuration
      const segmentConfigs = Object.entries(segments).map(([code, count]) => ({
        segment_code: code as SegmentCode,
        questions_count: count
      }));
      await setSegmentConfig(newSessionId, segmentConfigs);
      
      // 3. Create Daily room
      await createDailyRoom(newSessionId);
      
      // 4. Fetch the created segment config to ensure UI is in sync
      const fetchedConfig = await getSegmentConfig(newSessionId);
      const configMap = fetchedConfig.reduce((acc, config) => {
        acc[config.segment_code] = config.questions_count;
        return acc;
      }, {} as Record<SegmentCode, number>);
      
      // Update local state with fetched config
      setSegments(prev => ({ ...prev, ...configMap }));
      
      alert(`Session created successfully! Session ID: ${newSessionId}`);
    } catch (error) {
      console.error('Error setting up game:', error);
      alert(`Error setting up game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (!sessionId) {
      alert('Please create a session first by clicking "Create Daily Room"');
      return;
    }
    // Navigate to the quiz with the actual session ID
    navigate(`/quiz/${sessionId}`);
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
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {isLoading ? '⏳ Creating...' : '📹 Create Daily Room'}
            </button>

            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={!sessionId}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105 disabled:transform-none"
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
