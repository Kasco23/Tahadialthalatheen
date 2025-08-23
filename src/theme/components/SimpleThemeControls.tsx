/**
 * Simple Theme Controls component without CSS modules
 * Basic version for integration testing
 */

import { useAtom } from 'jotai';
import { teams } from '../data/teams';
import {
  isThemeUIOpenAtom,
  selectedTeamAtom,
  setSelectedTeamAtom,
  setThemeModeAtom,
  themeModeAtom,
  toggleThemeUIAtom,
} from '../state';
import './SimpleThemeControls.css';

export function SimpleThemeControls() {
  const [isOpen] = useAtom(isThemeUIOpenAtom);
  const [themeMode] = useAtom(themeModeAtom);
  const [selectedTeam] = useAtom(selectedTeamAtom);
  const [, setThemeMode] = useAtom(setThemeModeAtom);
  const [, setSelectedTeam] = useAtom(setSelectedTeamAtom);
  const [, toggleThemeUI] = useAtom(toggleThemeUIAtom);

  const toggleOpen = () => {
    toggleThemeUI();
  };

  const handleModeChange = () => {
    setThemeMode(themeMode === 'default' ? 'team' : 'default');
  };

  const handleTeamSelect = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    setSelectedTeam(team || null);
  };

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
                    className={`teamButton ${selectedTeam?.id === team.id ? 'selected' : ''}`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="themeStatus">
            Theme system integrated successfully! 🎉
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
