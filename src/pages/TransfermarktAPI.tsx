import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ApiResponse {
  status: number;
  data: unknown;
  error?: string;
  timestamp: string;
}

export default function TransfermarktAPI() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'competitions' | 'clubs' | 'players'>('competitions');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  // Competition state
  const [competitionName, setCompetitionName] = useState('');
  const [competitionId, setCompetitionId] = useState('');
  const [seasonId, setSeasonId] = useState('');

  // Club state
  const [clubName, setClubName] = useState('');
  const [clubId, setClubId] = useState('');

  // Player state
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);

  const makeRequest = async (endpoint: string) => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch(`/.netlify/functions/transfermarkt-proxy?endpoint=${encodeURIComponent(endpoint)}`);
      const data = await res.json();
      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setResponse({
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate('/')}
          className="btn btn-ghost btn-sm mb-4"
        >
          ← Back to Home
        </button>
        <h1 className="text-4xl font-bold mb-2">Transfermarkt API Testing</h1>
        <p className="text-gray-400">
          Proxied via Netlify Functions → <code className="text-blue-400">https://transfermarkt-api-jftx.onrender.com</code>
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="tabs tabs-boxed bg-gray-800 mb-6">
          <button
            className={`tab ${activeTab === 'competitions' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('competitions')}
          >
            🏆 Competitions
          </button>
          <button
            className={`tab ${activeTab === 'clubs' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('clubs')}
          >
            🏟️ Clubs
          </button>
          <button
            className={`tab ${activeTab === 'players' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            ⚽ Players
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="card bg-gray-800 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">
                {activeTab === 'competitions' && '🏆 Competition Endpoints'}
                {activeTab === 'clubs' && '🏟️ Club Endpoints'}
                {activeTab === 'players' && '⚽ Player Endpoints'}
              </h2>

              {/* Competition APIs */}
              {activeTab === 'competitions' && (
                <div className="space-y-4">
                  <div className="divider">Search Competitions</div>
                  <input
                    type="text"
                    placeholder="Competition name"
                    className="input input-bordered w-full"
                    value={competitionName}
                    onChange={(e) => setCompetitionName(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Page number"
                    className="input input-bordered w-full"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(Number(e.target.value))}
                  />
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      makeRequest(
                        `/competitions/search/${encodeURIComponent(competitionName)}?page_number=${pageNumber}`
                      )
                    }
                    disabled={loading || !competitionName}
                  >
                    Search Competitions
                  </button>

                  <div className="divider">Get Competition Clubs</div>
                  <input
                    type="text"
                    placeholder="Competition ID (e.g., GB1)"
                    className="input input-bordered w-full"
                    value={competitionId}
                    onChange={(e) => setCompetitionId(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Season ID (optional)"
                    className="input input-bordered w-full"
                    value={seasonId}
                    onChange={(e) => setSeasonId(e.target.value)}
                  />
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      makeRequest(
                        `/competitions/${competitionId}/clubs${seasonId ? `?season_id=${seasonId}` : ''}`
                      )
                    }
                    disabled={loading || !competitionId}
                  >
                    Get Competition Clubs
                  </button>
                </div>
              )}

              {/* Club APIs */}
              {activeTab === 'clubs' && (
                <div className="space-y-4">
                  <div className="divider">Search Clubs</div>
                  <input
                    type="text"
                    placeholder="Club name"
                    className="input input-bordered w-full"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Page number"
                    className="input input-bordered w-full"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(Number(e.target.value))}
                  />
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      makeRequest(
                        `/clubs/search/${encodeURIComponent(clubName)}?page_number=${pageNumber}`
                      )
                    }
                    disabled={loading || !clubName}
                  >
                    Search Clubs
                  </button>

                  <div className="divider">Club Details</div>
                  <input
                    type="text"
                    placeholder="Club ID (e.g., 985)"
                    className="input input-bordered w-full"
                    value={clubId}
                    onChange={(e) => setClubId(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary w-full"
                    onClick={() =>
                      makeRequest(`/clubs/${clubId}/profile`)
                    }
                    disabled={loading || !clubId}
                  >
                    Get Club Profile
                  </button>
                  <input
                    type="text"
                    placeholder="Season ID (optional)"
                    className="input input-bordered w-full"
                    value={seasonId}
                    onChange={(e) => setSeasonId(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary w-full"
                    onClick={() =>
                      makeRequest(
                        `/clubs/${clubId}/players${seasonId ? `?season_id=${seasonId}` : ''}`
                      )
                    }
                    disabled={loading || !clubId}
                  >
                    Get Club Players
                  </button>
                </div>
              )}

              {/* Player APIs */}
              {activeTab === 'players' && (
                <div className="space-y-4">
                  <div className="divider">Search Players</div>
                  <input
                    type="text"
                    placeholder="Player name"
                    className="input input-bordered w-full"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Page number"
                    className="input input-bordered w-full"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(Number(e.target.value))}
                  />
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      makeRequest(
                        `/players/search/${encodeURIComponent(playerName)}?page_number=${pageNumber}`
                      )
                    }
                    disabled={loading || !playerName}
                  >
                    Search Players
                  </button>

                  <div className="divider">Player Details</div>
                  <input
                    type="text"
                    placeholder="Player ID (e.g., 8198)"
                    className="input input-bordered w-full"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        makeRequest(`/players/${playerId}/profile`)
                      }
                      disabled={loading || !playerId}
                    >
                      Profile
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        makeRequest(
                          `/players/${playerId}/market_value`
                        )
                      }
                      disabled={loading || !playerId}
                    >
                      Market Value
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        makeRequest(`/players/${playerId}/transfers`)
                      }
                      disabled={loading || !playerId}
                    >
                      Transfers
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        makeRequest(
                          `/players/${playerId}/jersey_numbers`
                        )
                      }
                      disabled={loading || !playerId}
                    >
                      Jersey #
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        makeRequest(`/players/${playerId}/stats`)
                      }
                      disabled={loading || !playerId}
                    >
                      Stats
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        makeRequest(
                          `/players/${playerId}/injuries?page_number=${pageNumber}`
                        )
                      }
                      disabled={loading || !playerId}
                    >
                      Injuries
                    </button>
                    <button
                      className="btn btn-secondary btn-sm col-span-2"
                      onClick={() =>
                        makeRequest(
                          `/players/${playerId}/achievements`
                        )
                      }
                      disabled={loading || !playerId}
                    >
                      Achievements
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              )}
            </div>
          </div>

          {/* Response Panel */}
          <div className="card bg-gray-800 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">📋 API Response</h2>

              {!response && !loading && (
                <div className="text-center text-gray-400 py-12">
                  <p className="text-lg">No request made yet</p>
                  <p className="text-sm mt-2">Select an endpoint to test</p>
                </div>
              )}

              {response && (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        response.status === 200
                          ? 'badge-success'
                          : response.status === 0
                            ? 'badge-error'
                            : 'badge-warning'
                      } badge-lg`}
                    >
                      {response.status === 0 ? 'ERROR' : `Status ${response.status}`}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(response.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Error Message */}
                  {response.error && (
                    <div className="alert alert-error">
                      <span>❌ {response.error}</span>
                    </div>
                  )}

                  {/* Response Data */}
                  {response.data !== null && response.data !== undefined && (
                    <div className="mockup-code text-xs max-h-[600px] overflow-auto">
                      <pre>
                        <code>{JSON.stringify(response.data, null, 2)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
