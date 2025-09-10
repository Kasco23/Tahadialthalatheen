import { useState } from "react";

interface League {
  id: string;
  displayName: string;
  leagueLogo?: string;
  teams: { name: string; url: string }[];
}

interface TeamLogoPickerProps {
  selectedUrl?: string;
  onSelect: (url: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  categories: League[];
}

const TeamLogoPicker: React.FC<TeamLogoPickerProps> = ({
  selectedUrl,
  onSelect,
  searchQuery = "",
  categories,
}) => {
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(),
  );

  // Filter teams based on search query
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      teams: category.teams.filter((team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.teams.length > 0);

  const toggleLeague = (leagueId: string) => {
    setExpandedLeagues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leagueId)) {
        newSet.delete(leagueId);
      } else {
        newSet.add(leagueId);
      }
      return newSet;
    });
  };

  if (categories.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No team logos available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input handled by parent */}

      {/* League sections */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="border rounded-lg overflow-hidden">
            {/* League header with logo */}
            <button
              type="button"
              onClick={() => toggleLeague(category.id)}
              className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                {category.leagueLogo && (
                  <img
                    src={category.leagueLogo}
                    alt={category.displayName}
                    className="w-6 h-6 object-contain"
                  />
                )}
                <span className="font-medium">{category.displayName}</span>
              </div>
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  expandedLeagues.has(category.id) ? "rotate-180" : ""
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
            </button>

            {/* Team logos grid */}
            {expandedLeagues.has(category.id) && (
              <div className="p-4 grid grid-cols-3 gap-4">
                {category.teams.map((team) => (
                  <button
                    key={team.url}
                    type="button"
                    onClick={() => onSelect(team.url)}
                    className={`p-2 rounded-lg border transition-all hover:shadow-md ${
                      selectedUrl === team.url
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={team.url}
                      alt={team.name}
                      className="w-full h-16 object-contain"
                    />
                    <div className="mt-1 text-xs text-center text-gray-600 truncate">
                      {team.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { TeamLogoPicker };
