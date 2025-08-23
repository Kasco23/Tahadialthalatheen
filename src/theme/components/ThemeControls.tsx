/**
 * Theme control panel component for switching modes and selecting teams
 */

import { useAtom } from 'jotai';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { generatePalettePreview } from '../background';
import { extractTeamPalette } from '../palette';
import {
  applyThemeAtom,
  selectedTeamAtom,
  textureTypeAtom,
  themeModeAtom,
} from '../state/themeAtoms';
import type { Team, TextureType } from '../types';
import styles from './ThemeControls.module.css';

export interface ThemeControlsProps {
  /** Available teams for selection */
  teams: Team[];
  /** Show texture selector */
  showTexture?: boolean;
  /** Compact layout */
  compact?: boolean;
  /** Custom CSS class */
  className?: string;
}

const TEXTURE_OPTIONS: Array<{
  value: TextureType;
  label: string;
  description: string;
}> = [
  {
    value: 'carbon',
    label: 'Carbon Fiber',
    description: 'Technical weave pattern',
  },
  {
    value: 'metallic',
    label: 'Metallic',
    description: 'Brushed metal surface',
  },
  {
    value: 'paper',
    label: 'Paper Fiber',
    description: 'Natural paper texture',
  },
  { value: 'halftone', label: 'Halftone', description: 'Dot pattern effect' },
];

/**
 * Theme controls component
 */
export const ThemeControls: React.FC<ThemeControlsProps> = ({
  teams,
  showTexture = true,
  compact = false,
  className = '',
}) => {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const [selectedTeam, setSelectedTeam] = useAtom(selectedTeamAtom);
  const [selectedTexture, setSelectedTexture] = useAtom(textureTypeAtom);
  const [, applyTheme] = useAtom(applyThemeAtom);

  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    if (!searchTerm.trim()) return teams;

    const term = searchTerm.toLowerCase();
    return teams.filter(
      (team) =>
        team.displayName.toLowerCase().includes(term) ||
        team.name.toLowerCase().includes(term) ||
        team.searchTerms.some((searchTeam) =>
          searchTeam.toLowerCase().includes(term),
        ),
    );
  }, [teams, searchTerm]);

  /**
   * Handle theme mode change
   */
  const handleModeChange = useCallback(
    async (mode: 'default' | 'team') => {
      setIsLoading(true);
      try {
        setThemeMode(mode);
        if (mode === 'default') {
          setSelectedTeam(null);
        }
        await applyTheme();
      } catch (error) {
        console.error('Failed to apply theme:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [setThemeMode, setSelectedTeam, applyTheme],
  );

  /**
   * Handle team selection
   */
  const handleTeamSelect = useCallback(
    async (team: Team) => {
      setIsLoading(true);
      try {
        setSelectedTeam(team);
        setThemeMode('team');
        setSearchTerm('');
        setIsExpanded(false);
        await applyTheme();
      } catch (error) {
        console.error('Failed to apply team theme:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [setSelectedTeam, setThemeMode, applyTheme],
  );

  /**
   * Handle texture change
   */
  const handleTextureChange = useCallback(
    (texture: TextureType) => {
      setSelectedTexture(texture);
    },
    [setSelectedTexture],
  );

  return (
    <div
      className={`${styles.themeControls} ${compact ? styles.compact : ''} ${className}`}
    >
      {/* Theme Mode Toggle */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Theme Mode</label>
        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleButton} ${themeMode === 'default' ? styles.active : ''}`}
            onClick={() => handleModeChange('default')}
            disabled={isLoading}
          >
            Default
          </button>
          <button
            className={`${styles.toggleButton} ${themeMode === 'team' ? styles.active : ''}`}
            onClick={() => handleModeChange('team')}
            disabled={isLoading}
          >
            Team
          </button>
        </div>
      </div>

      {/* Team Selector */}
      {themeMode === 'team' && (
        <div className={styles.section}>
          <label className={styles.sectionLabel}>
            Select Team
            {selectedTeam && (
              <span className={styles.selectedTeam}>
                {selectedTeam.displayName}
              </span>
            )}
          </label>

          <div className={styles.teamSelector}>
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className={styles.searchInput}
            />

            {isExpanded && (
              <div className={styles.teamDropdown}>
                <div className={styles.teamList}>
                  {filteredTeams.length > 0 ? (
                    filteredTeams.slice(0, 10).map((team) => (
                      <button
                        key={team.name}
                        className={`${styles.teamOption} ${
                          selectedTeam?.name === team.name
                            ? styles.selected
                            : ''
                        }`}
                        onClick={() => handleTeamSelect(team)}
                      >
                        <div className={styles.teamLogo}>
                          <img
                            src={team.logoPath}
                            alt={team.displayName}
                            className={styles.teamLogoImage}
                            loading="lazy"
                          />
                        </div>
                        <span className={styles.teamName}>
                          {team.displayName}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className={styles.noResults}>
                      No teams found matching "{searchTerm}"
                    </div>
                  )}
                </div>

                {filteredTeams.length > 10 && (
                  <div className={styles.moreResults}>
                    +{filteredTeams.length - 10} more teams
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Palette Preview */}
          {selectedTeam && (
            <div className={styles.palettePreview}>
              <div className={styles.previewLabel}>Color Palette</div>
              <React.Suspense
                fallback={<div className={styles.loadingSwatches} />}
              >
                <PaletteSwatches teamLogoPath={selectedTeam.logoPath} />
              </React.Suspense>
            </div>
          )}
        </div>
      )}

      {/* Texture Selector */}
      {showTexture && (
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Background Texture</label>
          <div className={styles.textureGrid}>
            {TEXTURE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.textureOption} ${
                  selectedTexture === option.value ? styles.active : ''
                }`}
                onClick={() => handleTextureChange(option.value)}
                title={option.description}
              >
                <div
                  className={`${styles.texturePreview} ${styles[option.value]}`}
                />
                <span className={styles.textureLabel}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span>Applying theme...</span>
        </div>
      )}

      {/* Close expanded sections when clicking outside */}
      {isExpanded && (
        <div className={styles.backdrop} onClick={() => setIsExpanded(false)} />
      )}
    </div>
  );
};

/**
 * Palette swatches component for team color preview
 */
const PaletteSwatches: React.FC<{ teamLogoPath: string }> = ({
  teamLogoPath,
}) => {
  const [swatches, setSwatches] = useState<
    Array<{ color: string; alpha: number }>
  >([]);
  const swatchesRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadPalette = async () => {
      try {
        const palette = await extractTeamPalette(teamLogoPath);
        if (!mounted) return;

        const preview = generatePalettePreview(palette, 6);
        setSwatches(preview.map((p) => ({ color: p.color, alpha: p.alpha })));
      } catch (error) {
        console.warn('Failed to load palette swatches:', error);
        if (mounted) {
          setSwatches([]);
        }
      }
    };

    loadPalette();

    return () => {
      mounted = false;
    };
  }, [teamLogoPath]);

  // Apply colors using JavaScript to avoid inline styles
  React.useEffect(() => {
    if (!swatchesRef.current) return;

    const swatchElements = swatchesRef.current.querySelectorAll('[data-color]');
    swatchElements.forEach((element: Element, index: number) => {
      const swatch = swatches[index];
      if (swatch && element instanceof HTMLElement) {
        element.style.backgroundColor = swatch.color;
        element.style.opacity = swatch.alpha.toString();
      }
    });
  }, [swatches]);

  if (swatches.length === 0) {
    return <div className={styles.loadingSwatches}>Loading colors...</div>;
  }

  return (
    <div ref={swatchesRef} className={styles.colorSwatches}>
      {swatches.map((swatch, index) => (
        <div
          key={index}
          className={`${styles.colorSwatch} ${styles.paletteSwatchStyle}`}
          data-color={swatch.color}
          data-alpha={swatch.alpha.toString()}
          title={swatch.color}
        />
      ))}
    </div>
  );
};
