/**
 * Production Theme Selector Component
 *
 * Provides theme switching functionality for the main application
 * Integ        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center px-4 py-2 border border-white/20 rounded-lg shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30 transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
        >
          <span className="mr-2">🎨</span>
          {themeMode === 'team' && selectedTeam
            ? selectedTeam.name
            : 'Default Theme'
          }h the existing theme system and team data
 */

import { useTranslation } from '@/hooks/useTranslation';
import { loadTeamLogo, teams } from '@/theme/data/teams';
import {
  applyThemeAtom,
  selectedTeamAtom,
  setSelectedTeamAtom,
  setThemeModeAtom,
  themeModeAtom,
} from '@/theme/state';
import { useAtom } from 'jotai';
import { useCallback, useState } from 'react';

interface ThemeSelectorProps {
  /** Whether to show as compact dropdown or full panel */
  variant?: 'compact' | 'panel';
  /** Additional CSS classes */
  className?: string;
  /** Callback when theme changes */
  onThemeChange?: (teamId: string | null, mode: 'default' | 'team') => void;
}

export function ThemeSelector({
  variant = 'compact',
  className = '',
  onThemeChange,
}: ThemeSelectorProps) {
  const { language } = useTranslation();
  const [themeMode] = useAtom(themeModeAtom);
  const [selectedTeam] = useAtom(selectedTeamAtom);
  const [, setThemeMode] = useAtom(setThemeModeAtom);
  const [, setSelectedTeam] = useAtom(setSelectedTeamAtom);
  const [, applyTheme] = useAtom(applyThemeAtom);

  const [isOpen, setIsOpen] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState<string | null>(null);

  // Popular teams for quick selection
  const popularTeams = teams.filter((team) =>
    [
      'barcelona',
      'real-madrid',
      'manchester-united',
      'arsenal',
      'liverpool',
      'chelsea',
      'bayern-munchen',
      'paris-saint-germain',
      'manchester-city',
      'juventus',
    ].includes(team.id),
  );

  const handleModeChange = useCallback(
    async (newMode: 'default' | 'team') => {
      setThemeMode(newMode);

      if (newMode === 'default') {
        setSelectedTeam(null);
      }

      await applyTheme();
      onThemeChange?.(selectedTeam?.id || null, newMode);
    },
    [setThemeMode, setSelectedTeam, applyTheme, onThemeChange, selectedTeam],
  );

  const handleTeamSelect = useCallback(
    async (teamId: string) => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      setLoadingTeam(teamId);

      try {
        // Ensure we're in team mode
        if (themeMode !== 'team') {
          setThemeMode('team');
        }

        // Load team logo for display purposes
        const logoUrl = await loadTeamLogo(teamId);
        team.logoPath = logoUrl;

        // Set the selected team
        setSelectedTeam(team);

        // Apply theme changes
        await applyTheme();

        onThemeChange?.(teamId, 'team');

        // Close dropdown in compact mode
        if (variant === 'compact') {
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Failed to load team:', error);
      } finally {
        setLoadingTeam(null);
      }
    },
    [
      setSelectedTeam,
      setThemeMode,
      applyTheme,
      onThemeChange,
      themeMode,
      variant,
    ],
  );

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center px-4 py-2 border border-white/20 rounded-lg shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30 transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
        >
          <span className="mr-2">🎨</span>
          {themeMode === 'team' && selectedTeam
            ? selectedTeam.name
            : 'Default Theme'}
          <svg
            className="ml-2 h-4 w-4"
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

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 z-20 max-h-96 overflow-y-auto">
              <div className="p-4">
                <h3
                  className={`text-lg font-bold text-gray-900 mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}
                >
                  Select Theme
                </h3>

                {/* Mode Toggle */}
                <div className="mb-4">
                  <div className="flex rounded-lg bg-gray-100 p-1">
                    <button
                      onClick={() => handleModeChange('default')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        themeMode === 'default'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => handleModeChange('team')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        themeMode === 'team'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Team
                    </button>
                  </div>
                </div>

                {/* Team Selection */}
                {themeMode === 'team' && (
                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'font-arabic' : ''}`}
                    >
                      {'Popular Teams'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {popularTeams.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => handleTeamSelect(team.id)}
                          disabled={loadingTeam === team.id}
                          className={`p-2 text-sm rounded-lg border transition-colors ${
                            selectedTeam?.id === team.id
                              ? 'bg-blue-50 border-blue-300 text-blue-900'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          } ${loadingTeam === team.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {loadingTeam === team.id ? (
                            <div className="flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            team.name
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Panel variant for settings pages
  return (
    <div
      className={`bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 ${className}`}
    >
      <h3
        className={`text-lg font-bold text-gray-900 mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}
      >
        {'Theme Settings'}
      </h3>

      {/* Mode Selection */}
      <div className="mb-6">
        <label
          className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'font-arabic' : ''}`}
        >
          {'Theme Mode'}
        </label>
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => handleModeChange('default')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              themeMode === 'default'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {'Default Theme'}
          </button>
          <button
            onClick={() => handleModeChange('team')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              themeMode === 'team'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {'Team Theme'}
          </button>
        </div>
      </div>

      {/* Team Selection Panel */}
      {themeMode === 'team' && (
        <div>
          <label
            className={`block text-sm font-medium text-gray-700 mb-3 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            {'Select Team'}
          </label>

          {selectedTeam && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center text-white text-sm font-bold">
                  {selectedTeam.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    {selectedTeam.name}
                  </p>
                  <p className="text-sm text-blue-600">{selectedTeam.league}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {popularTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleTeamSelect(team.id)}
                disabled={loadingTeam === team.id}
                className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                  selectedTeam?.id === team.id
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                } ${loadingTeam === team.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingTeam === team.id ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{team.name}</div>
                    <div className="text-xs opacity-75">{team.league}</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{'Current'}:</span>{' '}
          {themeMode === 'team' && selectedTeam
            ? `${selectedTeam.name} (${selectedTeam.league})`
            : 'Default Theme'}
        </p>
      </div>
    </div>
  );
}

export default ThemeSelector;
