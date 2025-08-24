/**
 * Simple Theme Controls component without CSS modules
 * Basic version for integration testing
 */

import { useAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { loadTeamLogo, teams } from '../data/teams';
import {
  isThemeUIOpenAtom,
  selectedTeamAtom,
  setSelectedTeamAtom,
  setThemeModeAtom,
  themeModeAtom,
  toggleThemeUIAtom,
  applyThemeAtom,
  setExtractedPaletteAtom,
} from '../state';
import './SimpleThemeControls.css';

export function SimpleThemeControls() {
  const [isOpen] = useAtom(isThemeUIOpenAtom);
  const [themeMode] = useAtom(themeModeAtom);
  const [selectedTeam] = useAtom(selectedTeamAtom);
  const [, setThemeMode] = useAtom(setThemeModeAtom);
  const [, setSelectedTeam] = useAtom(setSelectedTeamAtom);
  const [, toggleThemeUI] = useAtom(toggleThemeUIAtom);
  const [, applyTheme] = useAtom(applyThemeAtom);
  const [, setExtractedPalette] = useAtom(setExtractedPaletteAtom);

  const [loadingTeam, setLoadingTeam] = useState<string | null>(null);

  const toggleOpen = () => {
    toggleThemeUI();
  };

  const handleModeChange = () => {
    setThemeMode(themeMode === 'default' ? 'team' : 'default');
  };

  const handleTeamSelect = useCallback(
    async (teamId: string) => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      setLoadingTeam(teamId);

      try {
        // Load team logo
        const logoUrl = await loadTeamLogo(teamId);
        team.logoPath = logoUrl; // Update team object with loaded logo
        setSelectedTeam(team);

        // If in team mode and we have a logo, extract palette
        if (themeMode === 'team' && logoUrl) {
          try {
            // Dynamic import of palette extraction to avoid bundling in main chunk
            const { extractTeamPalette } = await import('../palette');
            const palette = await extractTeamPalette(logoUrl);
            setExtractedPalette(palette);
            await applyTheme();
          } catch (error) {
            console.error('Failed to extract team palette:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load team:', error);
      } finally {
        setLoadingTeam(null);
      }
    },
    [themeMode, setSelectedTeam, setExtractedPalette, applyTheme],
  );

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
    ].includes(team.id),
  );

  return (
    <div>
      <button onClick={toggleOpen} className="themeButton">
        🎨 Theme {selectedTeam ? `(${selectedTeam.name})` : ''}
      </button>

      {isOpen && (
        <div className="themePanel">
          <h3 className="themeTitle">Theme System</h3>

          <div className="themeSection">
            <label className="themeLabel">Mode: {themeMode}</label>
            <button onClick={handleModeChange} className="themeModeButton">
              Switch to {themeMode === 'default' ? 'Team' : 'Default'}
            </button>
          </div>

          {themeMode === 'team' && (
            <div className="themeSection">
              <label className="themeLabel">Quick Team Select:</label>
              <div className="teamGrid">
                {popularTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamSelect(team.id)}
                    disabled={loadingTeam === team.id}
                    className={`teamButton ${selectedTeam?.id === team.id ? 'selected' : ''}`}
                  >
                    {loadingTeam === team.id ? 'Loading...' : team.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="themeStatus">
            Theme system with lazy loading! 🎉
            <br />
            <small>
              {teams.length} teams available • Hexagonal backgrounds active
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
