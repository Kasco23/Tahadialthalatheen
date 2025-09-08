import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface League {
  name: string;
  displayName: string;
  teams: Team[];
}

interface Team {
  name: string;
  displayName: string;
  logoUrl: string;
}

interface LogoResponse {
  categories: Record<string, {
    displayName: string;
    leagueLogo?: string;
    teams: { name: string; url: string }[];
  }>;
}

interface LogoSelectorProps {
  selectedLogoUrl?: string;
  onLogoSelect: (logoUrl: string, teamName: string) => void;
  title?: string;
  className?: string;
}

const LogoSelector: React.FC<LogoSelectorProps> = ({
  selectedLogoUrl,
  onLogoSelect,
  title = "Choose Your Team Logo",
  className = ""
}) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('list-logos');
      
      if (error) {
        throw new Error(error.message || 'Failed to fetch logos');
      }

      const response = data as LogoResponse;
      
      // Convert categories to leagues format
      const leaguesArray: League[] = Object.entries(response.categories || {}).map(([key, value]) => ({
        name: key,
        displayName: value.displayName,
        teams: value.teams.map(team => ({
          name: team.name.toLowerCase().replace(/\s+/g, '-'), // Create a consistent name format
          displayName: team.name,
          logoUrl: team.url
        }))
      }));
      
      setLeagues(leaguesArray);
    } catch (err) {
      console.error('Error fetching logos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team logos');
    } finally {
      setLoading(false);
    }
  };

  // Filter teams based on search term
  const filteredLeagues = leagues.map(league => ({
    ...league,
    teams: league.teams.filter(team =>
      team.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      league.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(league => league.teams.length > 0);

  // Auto-expand functionality removed per user request

  // Find selected team info
  const getSelectedTeamInfo = () => {
    for (const league of leagues) {
      for (const team of league.teams) {
        if (team.logoUrl === selectedLogoUrl) {
          return { team, league };
        }
      }
    }
    return null;
  };

  const selectedTeamInfo = getSelectedTeamInfo();

  if (loading) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
          {title}
        </h3>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading logos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
          {title}
        </h3>
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchLogos}
            className="text-red-700 hover:text-red-900 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
        {title}
      </h3>

      {/* Selected Logo Display */}
      {selectedTeamInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <img
              src={selectedTeamInfo.team.logoUrl}
              alt={selectedTeamInfo.team.displayName}
              className="w-8 h-8 object-contain"
            />
            <div>
              <p className="font-medium text-blue-800">
                {selectedTeamInfo.team.displayName}
              </p>
              <p className="text-sm text-blue-600">
                {selectedTeamInfo.league.displayName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search teams or leagues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Leagues and Teams */}
      <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
        {filteredLeagues.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            {searchTerm ? 'No teams found' : 'No teams available'}
          </div>
        ) : (
          filteredLeagues.map((league) => (
            <div key={league.name} className="border-b border-gray-100 last:border-b-0">
              {/* League Header */}
              <button
                type="button"
                onClick={() => setExpandedLeague(
                  expandedLeague === league.name ? null : league.name
                )}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors duration-150"
                aria-expanded={expandedLeague === league.name}
              >
                <span className="font-medium text-gray-800">
                  {league.displayName}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {league.teams.length} teams
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                      expandedLeague === league.name ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Teams Grid */}
              {expandedLeague === league.name && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {league.teams.map((team) => (
                      <button
                        key={team.name}
                        type="button"
                        onClick={() => onLogoSelect(team.logoUrl, team.displayName)}
                        className={`p-3 border rounded-lg hover:shadow-md transition-all duration-150 ${
                          selectedLogoUrl === team.logoUrl
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        title={team.displayName}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <img
                            src={team.logoUrl}
                            alt={team.displayName}
                            className="w-10 h-10 object-contain"
                            loading="lazy"
                          />
                          <span className="text-xs text-center text-gray-700 font-medium leading-tight">
                            {team.displayName}
                          </span>
                        </div>
                        {selectedLogoUrl === team.logoUrl && (
                          <div className="mt-2 flex justify-center">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogoSelector;
