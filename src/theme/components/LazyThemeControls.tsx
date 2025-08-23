/**
 * Lazy-loaded Theme Controls component
 * This component will be code-split to reduce main bundle size
 */

import { useAtom } from 'jotai';
import React, { useCallback, useEffect, useState } from 'react';
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

export function LazyThemeControls() {
  const [isOpen] = useAtom(isThemeUIOpenAtom);
  const [themeMode] = useAtom(themeModeAtom);
  const [selectedTeam] = useAtom(selectedTeamAtom);
  const [, setThemeMode] = useAtom(setThemeModeAtom);
  const [, setSelectedTeam] = useAtom(setSelectedTeamAtom);
  const [, toggleThemeUI] = useAtom(toggleThemeUIAtom);
  const [, applyTheme] = useAtom(applyThemeAtom);
  const [, setExtractedPalette] = useAtom(setExtractedPaletteAtom);
  
  const [teamLogos, setTeamLogos] = useState<Map<string, string>>(new Map());
  const [loadingTeam, setLoadingTeam] = useState<string | null>(null);

  const toggleOpen = () => {
    toggleThemeUI();
  };

  const handleModeChange = () => {
    setThemeMode(themeMode === 'default' ? 'team' : 'default');
  };

  const handleTeamSelect = useCallback(async (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    setLoadingTeam(teamId);
    
    try {
      // Load team logo if not already loaded
      if (!teamLogos.has(teamId)) {
        const logoUrl = await loadTeamLogo(teamId);
        setTeamLogos(prev => new Map(prev.set(teamId, logoUrl)));
        team.logoPath = logoUrl; // Update team object with loaded logo
      } else {
        team.logoPath = teamLogos.get(teamId) || '';
      }

      setSelectedTeam(team);

      // If in team mode and we have a logo, extract palette
      if (themeMode === 'team' && team.logoPath) {
        try {
          // Dynamic import of palette extraction
          const { extractTeamPalette } = await import('../palette');
          const palette = await extractTeamPalette(team.logoPath);
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
  }, [teamLogos, themeMode, setSelectedTeam, setExtractedPalette, applyTheme]);

  // Preload logos for popular teams
  useEffect(() => {
    const popularTeamIds = [
      'barcelona',
      'real-madrid', 
      'manchester-united',
      'arsenal',
      'liverpool',
      'chelsea',
      'bayern-munchen',
      'paris-saint-germain',
    ];

    popularTeamIds.forEach(async (teamId) => {
      if (!teamLogos.has(teamId)) {
        try {
          const logoUrl = await loadTeamLogo(teamId);
          setTeamLogos(prev => new Map(prev.set(teamId, logoUrl)));
        } catch (error) {
          console.warn(`Failed to preload logo for ${teamId}:`, error);
        }
      }
    });
  }, [teamLogos]);

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