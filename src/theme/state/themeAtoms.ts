/**
 * Jotai atoms for theme state management
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { DEFAULT_TOKENS } from '../core/defaultTokens';
import {
  loadSelectedTeam,
  loadTextureType,
  loadThemeMode,
} from '../core/storage';
import { applyThemeTokens, generateThemeTokens } from '../core/tokens';
import type {
  ColorPalette,
  Team,
  TextureType,
  ThemeConfig,
  ThemeMode,
  ThemeTokens,
} from '../types';

// Base atoms with localStorage persistence
export const themeModeAtom = atomWithStorage<ThemeMode>(
  'theme-mode',
  loadThemeMode(),
);

export const textureTypeAtom = atomWithStorage<TextureType>(
  'theme-texture-type',
  loadTextureType(),
);

export const selectedTeamAtom = atomWithStorage<Team | null>(
  'theme-selected-team',
  loadSelectedTeam(),
);

// Runtime-only atoms (not persisted)
export const extractedPaletteAtom = atom<ColorPalette | null>(null);

export const isThemeUIOpenAtom = atom<boolean>(false);

// Base theme tokens atom
export const baseThemeTokensAtom = atom<ThemeTokens>(
  generateThemeTokens(DEFAULT_TOKENS),
);

// Derived atom for active theme configuration
export const activeThemeConfigAtom = atom<ThemeConfig>((get) => {
  const mode = get(themeModeAtom);
  const selectedTeam = get(selectedTeamAtom);
  const extractedPalette = get(extractedPaletteAtom);
  const texture = get(textureTypeAtom);
  const baseTokens = get(baseThemeTokensAtom);

  // Generate theme tokens based on current state
  let tokens: ThemeTokens;

  if (mode === 'team') {
    if (extractedPalette && extractedPalette.colors.length > 0) {
      // Use extracted palette colors (from hardcoded team palettes)
      const [primary, secondary, accent] = extractedPalette.colors;

      tokens = generateThemeTokens({
        ...baseTokens,
        primary: primary || baseTokens.primary,
        secondary: secondary || primary || baseTokens.secondary,
        accent: accent || secondary || primary || baseTokens.accent,
      });
    } else if (selectedTeam) {
      // Fallback to team's hardcoded colors if no extracted palette yet
      tokens = generateThemeTokens({
        ...baseTokens,
        primary: selectedTeam.primaryColor || baseTokens.primary,
        secondary: selectedTeam.secondaryColor || baseTokens.secondary,
        accent: selectedTeam.accentColor || baseTokens.accent,
      });
    } else {
      // No team selected in team mode, use default
      tokens = baseTokens;
    }
  } else {
    // Use default tokens
    tokens = baseTokens;
  }

  return {
    mode,
    selectedTeam,
    extractedPalette,
    texture,
    tokens,
  };
});

// Write-only atom for applying theme to DOM
export const applyThemeAtom = atom(null, (get, _set, _update: void) => {
  const config = get(activeThemeConfigAtom);
  applyThemeTokens(config.tokens);
});

// Action atoms for theme operations
export const setThemeModeAtom = atom(null, (_get, set, mode: ThemeMode) => {
  set(themeModeAtom, mode);

  // Clear extracted palette when switching to default mode
  if (mode === 'default') {
    set(extractedPaletteAtom, null);
  }

  set(applyThemeAtom); // Trigger theme application
});

export const setSelectedTeamAtom = atom(
  null,
  async (_get, set, team: Team | null) => {
    set(selectedTeamAtom, team);

    // Clear extracted palette when team changes
    set(extractedPaletteAtom, null);

    // If switching to team mode, ensure mode is set and load team palette
    if (team) {
      set(themeModeAtom, 'team');

      // Automatically load the team's hardcoded color palette
      try {
        // Dynamic import to avoid circular dependencies
        const { getTeamColorPalette } = await import('../data/teams');
        const palette = getTeamColorPalette(team.id);
        set(extractedPaletteAtom, palette);
      } catch (error) {
        console.error('Failed to load team color palette:', error);
      }
    }

    set(applyThemeAtom); // Trigger theme application
  },
);

export const setExtractedPaletteAtom = atom(
  null,
  (_get, set, palette: ColorPalette | null) => {
    set(extractedPaletteAtom, palette);
    set(applyThemeAtom); // Trigger theme application
  },
);

export const setTextureTypeAtom = atom(
  null,
  (_get, set, texture: TextureType) => {
    set(textureTypeAtom, texture);
    // Note: Texture changes don't require theme token updates,
    // only background re-render which is handled by the background component
  },
);

export const toggleThemeUIAtom = atom(null, (get, set, _update: void) => {
  set(isThemeUIOpenAtom, !get(isThemeUIOpenAtom));
});

// Computed atoms for specific theme properties
export const currentPrimaryColorAtom = atom((get) => {
  const config = get(activeThemeConfigAtom);
  return config.tokens.primary;
});

export const currentBackgroundColorAtom = atom((get) => {
  const config = get(activeThemeConfigAtom);
  return config.tokens.bgPrimary;
});

export const isTeamModeAtom = atom((get) => {
  const mode = get(themeModeAtom);
  return mode === 'team';
});

export const hasExtractedPaletteAtom = atom((get) => {
  const palette = get(extractedPaletteAtom);
  return palette !== null && palette.colors.length > 0;
});
