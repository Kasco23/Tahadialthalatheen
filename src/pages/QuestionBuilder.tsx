import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Category = 'competitions' | 'clubs' | 'players';

interface CompetitionResult {
  id: string;
  name: string;
  country: string;
  clubs: number;
  players: number;
  totalMarketValue: number | null;
  continent: string | null;
}

interface ClubResult {
  id: string;
  name: string;
  country: string;
  squad: number;
  marketValue: number | null;
}

interface PlayerResult {
  id: string;
  name: string;
  position: string;
  club: {
    id: string;
    name: string;
  };
  age: number | null;
  nationalities: string[];
  marketValue: number | null;
}

const TOP_5_LEAGUES = ['GB1', 'ES1', 'IT1', 'L1', 'FR1']; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
const TOP_10_LEAGUES = [...TOP_5_LEAGUES, 'PO1', 'NL1', 'BE1', 'RU1', 'TR1']; // + Portugal, Netherlands, Belgium, Russia, Turkey

export default function QuestionBuilder() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('competitions');
  const [loading, setLoading] = useState(false);
  
  // Competition filters
  const [compName, setCompName] = useState('');
  const [compSeason, setCompSeason] = useState('2025');
  const [compContinent, setCompContinent] = useState('');
  const [compCountry, setCompCountry] = useState('');
  const [compTopLeagues, setCompTopLeagues] = useState<'all' | 'top5' | 'top10'>('all');
  
  // Club filters
  const [clubName, setClubName] = useState('');
  const [clubCountry, setClubCountry] = useState('');
  
  // Player filters
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [playerNationality, setPlayerNationality] = useState('');
  
  // Results
  const [competitions, setCompetitions] = useState<CompetitionResult[]>([]);
  const [clubs, setClubs] = useState<ClubResult[]>([]);
  const [players, setPlayers] = useState<PlayerResult[]>([]);

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(1)}K`;
    return `€${value}`;
  };

  const searchCompetitions = async () => {
    if (!compName) {
      alert('Please enter a competition name');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(
        `/.netlify/functions/transfermarkt-proxy?endpoint=${encodeURIComponent(
          `/competitions/search/${encodeURIComponent(compName)}?page_number=1`
        )}`
      );
      const data = await res.json();
      
      let results = data.results || [];
      
      // Apply filters
      if (compContinent) {
        results = results.filter((c: CompetitionResult) => 
          c.continent?.toLowerCase().includes(compContinent.toLowerCase())
        );
      }
      
      if (compCountry) {
        results = results.filter((c: CompetitionResult) => 
          c.country.toLowerCase().includes(compCountry.toLowerCase())
        );
      }
      
      // Top leagues filter
      if (compTopLeagues === 'top5') {
        results = results.filter((c: CompetitionResult) => TOP_5_LEAGUES.includes(c.id));
      } else if (compTopLeagues === 'top10') {
        results = results.filter((c: CompetitionResult) => TOP_10_LEAGUES.includes(c.id));
      }
      
      setCompetitions(results);
    } catch (error) {
      console.error('Error searching competitions:', error);
      alert('Failed to search competitions');
    } finally {
      setLoading(false);
    }
  };

  const searchClubs = async () => {
    if (!clubName) {
      alert('Please enter a club name');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(
        `/.netlify/functions/transfermarkt-proxy?endpoint=${encodeURIComponent(
          `/clubs/search/${encodeURIComponent(clubName)}?page_number=1`
        )}`
      );
      const data = await res.json();
      
      let results = data.results || [];
      
      if (clubCountry) {
        results = results.filter((c: ClubResult) => 
          c.country.toLowerCase().includes(clubCountry.toLowerCase())
        );
      }
      
      setClubs(results);
    } catch (error) {
      console.error('Error searching clubs:', error);
      alert('Failed to search clubs');
    } finally {
      setLoading(false);
    }
  };

  const searchPlayers = async () => {
    if (!playerName) {
      alert('Please enter a player name');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(
        `/.netlify/functions/transfermarkt-proxy?endpoint=${encodeURIComponent(
          `/players/search/${encodeURIComponent(playerName)}?page_number=1`
        )}`
      );
      const data = await res.json();
      
      let results = data.results || [];
      
      if (playerPosition) {
        results = results.filter((p: PlayerResult) => 
          p.position.toLowerCase().includes(playerPosition.toLowerCase())
        );
      }
      
      if (playerNationality) {
        results = results.filter((p: PlayerResult) => 
          p.nationalities.some(n => n.toLowerCase().includes(playerNationality.toLowerCase()))
        );
      }
      
      setPlayers(results);
    } catch (error) {
      console.error('Error searching players:', error);
      alert('Failed to search players');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (category === 'competitions') {
      searchCompetitions();
    } else if (category === 'clubs') {
      searchClubs();
    } else if (category === 'players') {
      searchPlayers();
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
        <h1 className="text-4xl font-bold mb-2">Question Builder</h1>
        <p className="text-gray-400">
          Search football data to create quiz questions
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Category Selection */}
        <div className="card bg-gray-800 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">📂 Select Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                className={`btn ${category === 'competitions' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCategory('competitions')}
              >
                🏆 Competitions
              </button>
              <button
                className={`btn ${category === 'clubs' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCategory('clubs')}
              >
                🏟️ Clubs
              </button>
              <button
                className={`btn ${category === 'players' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCategory('players')}
              >
                ⚽ Players
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-gray-800 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">🔍 Filters</h2>
            
            {/* Competition Filters */}
            {category === 'competitions' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Competition Name *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Premier League, Champions League"
                      className="input input-bordered"
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Season</span>
                    </label>
                    <input
                      type="text"
                      placeholder="2025"
                      className="input input-bordered"
                      value={compSeason}
                      onChange={(e) => setCompSeason(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Continent</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Europe, South America"
                      className="input input-bordered"
                      value={compContinent}
                      onChange={(e) => setCompContinent(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Country</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., England, Spain"
                      className="input input-bordered"
                      value={compCountry}
                      onChange={(e) => setCompCountry(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Top Leagues Filter</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={compTopLeagues}
                      onChange={(e) => setCompTopLeagues(e.target.value as 'all' | 'top5' | 'top10')}
                    >
                      <option value="all">All Leagues</option>
                      <option value="top5">Top 5 Leagues Only</option>
                      <option value="top10">Top 10 Leagues Only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Club Filters */}
            {category === 'clubs' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Club Name *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Barcelona, Manchester United"
                      className="input input-bordered"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Country</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Spain, England"
                      className="input input-bordered"
                      value={clubCountry}
                      onChange={(e) => setClubCountry(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Player Filters */}
            {category === 'players' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Player Name *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Messi, Ronaldo"
                      className="input input-bordered"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Position</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Forward, Midfielder"
                      className="input input-bordered"
                      value={playerPosition}
                      onChange={(e) => setPlayerPosition(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Nationality</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Argentina, Portugal"
                      className="input input-bordered"
                      value={playerNationality}
                      onChange={(e) => setPlayerNationality(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <button
              className="btn btn-primary btn-lg mt-6"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Searching...
                </>
              ) : (
                '🔍 Search'
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="card bg-gray-800 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">📊 Results</h2>
            
            {loading && (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            )}
            
            {/* Competition Results */}
            {!loading && category === 'competitions' && competitions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Competition Name</th>
                      <th>Country</th>
                      <th>Continent</th>
                      <th>Clubs</th>
                      <th>Players</th>
                      <th>Total Market Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitions.map((comp) => (
                      <tr key={comp.id}>
                        <td className="font-mono text-sm">{comp.id}</td>
                        <td className="font-semibold">{comp.name}</td>
                        <td>{comp.country}</td>
                        <td>{comp.continent || 'N/A'}</td>
                        <td>{comp.clubs}</td>
                        <td>{comp.players.toLocaleString()}</td>
                        <td>{formatCurrency(comp.totalMarketValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-sm text-gray-400 mt-4">
                  Found {competitions.length} competition(s)
                </div>
              </div>
            )}
            
            {/* Club Results */}
            {!loading && category === 'clubs' && clubs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Club Name</th>
                      <th>Country</th>
                      <th>Squad Size</th>
                      <th>Market Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((club) => (
                      <tr key={club.id}>
                        <td className="font-mono text-sm">{club.id}</td>
                        <td className="font-semibold">{club.name}</td>
                        <td>{club.country}</td>
                        <td>{club.squad}</td>
                        <td>{formatCurrency(club.marketValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-sm text-gray-400 mt-4">
                  Found {clubs.length} club(s)
                </div>
              </div>
            )}
            
            {/* Player Results */}
            {!loading && category === 'players' && players.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Player Name</th>
                      <th>Position</th>
                      <th>Club</th>
                      <th>Age</th>
                      <th>Nationality</th>
                      <th>Market Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr key={player.id}>
                        <td className="font-mono text-sm">{player.id}</td>
                        <td className="font-semibold">{player.name}</td>
                        <td>{player.position}</td>
                        <td>{player.club.name}</td>
                        <td>{player.age || 'N/A'}</td>
                        <td>{player.nationalities.join(', ')}</td>
                        <td>{formatCurrency(player.marketValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-sm text-gray-400 mt-4">
                  Found {players.length} player(s)
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {!loading && 
             ((category === 'competitions' && competitions.length === 0) ||
              (category === 'clubs' && clubs.length === 0) ||
              (category === 'players' && players.length === 0)) && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No results yet</p>
                <p className="text-sm mt-2">Use the filters above and click Search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
