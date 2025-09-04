import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setSegmentConfig, createDailyRoom, getSegmentConfig } from '../lib/mutations';
import type { SegmentCode } from '../lib/types';

const GameSetup: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isDailyRoomCreated, setIsDailyRoomCreated] = useState(false);
  const [segments, setSegments] = useState({
    WDYK: 4, // What Do You Know
    AUCT: 2, // Auction
    BELL: 10, // Bell
    UPDW: 10, // Up Down
    REMO: 4  // Remote
  });

  // Load existing segment configuration when component mounts
  useEffect(() => {
    if (sessionId) {
      loadSegmentConfig();
    }
  }, [sessionId]);

  const loadSegmentConfig = async () => {
    if (!sessionId) return;
    
    try {
      const fetchedConfig = await getSegmentConfig(sessionId);
      const configMap = fetchedConfig.reduce((acc, config) => {
        acc[config.segment_code] = config.questions_count;
        return acc;
      }, {} as Record<SegmentCode, number>);
      
      // Update local state with fetched config
      setSegments(prev => ({ ...prev, ...configMap }));
    } catch (error) {
      console.error('Failed to load segment config:', error);
    }
  };

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
    if (!sessionId) {
      alert('No session ID available. Please go back to homepage and create a session.');
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Set segment configuration
      const segmentConfigs = Object.entries(segments).map(([code, count]) => ({
        segment_code: code as SegmentCode,
        questions_count: count
      }));
      await setSegmentConfig(sessionId, segmentConfigs);
      
      // 2. Create Daily room
      await createDailyRoom(sessionId);
      
      setIsDailyRoomCreated(true);
      alert(`Daily room created successfully! Session ID: ${sessionId}`);
    } catch (error) {
      console.error('Error setting up game:', error);
      alert(`Error setting up game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (!sessionId) {
      alert('No session ID available. Please go back to homepage and create a session.');
      return;
    }
    if (!isDailyRoomCreated) {
      alert('Please create a Daily room first by clicking "Create Daily Room"');
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
        
        {sessionId && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              <strong>Session ID:</strong> {sessionId}
            </p>
          </div>
        )}

        <form className="space-y-6">
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
              disabled={!sessionId || !isDailyRoomCreated}
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
