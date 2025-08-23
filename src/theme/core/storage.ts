/**
 * Local storage utilities for theme persistence
 */

import type { Team, TextureType, ThemeMode } from '../types';

const STORAGE_KEYS = {
  THEME_MODE: 'theme-mode',
  SELECTED_TEAM: 'theme-selected-team',
  TEXTURE_TYPE: 'theme-texture-type',
} as const;

/**
 * Save theme mode to localStorage
 */
export function saveThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  } catch (error) {
    console.warn('Failed to save theme mode to localStorage:', error);
  }
}

/**
 * Load theme mode from localStorage
 */
export function loadThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    return saved === 'team' || saved === 'default' ? saved : 'default';
  } catch (error) {
    console.warn('Failed to load theme mode from localStorage:', error);
    return 'default';
  }
}

/**
 * Save selected team to localStorage
 */
export function saveSelectedTeam(team: Team | null): void {
  try {
    if (team) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_TEAM, JSON.stringify(team));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_TEAM);
    }
  } catch (error) {
    console.warn('Failed to save selected team to localStorage:', error);
  }
}

/**
 * Load selected team from localStorage
 */
export function loadSelectedTeam(): Team | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_TEAM);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load selected team from localStorage:', error);
    return null;
  }
}

/**
 * Save texture type to localStorage
 */
export function saveTextureType(texture: TextureType): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEXTURE_TYPE, texture);
  } catch (error) {
    console.warn('Failed to save texture type to localStorage:', error);
  }
}

/**
 * Load texture type from localStorage
 */
export function loadTextureType(): TextureType {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TEXTURE_TYPE);
    const validTextures: TextureType[] = [
      'carbon',
      'metallic',
      'paper',
      'halftone',
    ];
    return validTextures.includes(saved as TextureType)
      ? (saved as TextureType)
      : 'carbon';
  } catch (error) {
    console.warn('Failed to load texture type from localStorage:', error);
    return 'carbon';
  }
}

/**
 * Clear all theme-related data from localStorage
 */
export function clearThemeStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear theme storage:', error);
  }
}
