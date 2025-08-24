/**
 * Theme-aware hexagonal background wrapper
 * Connects to theme context and provides necessary props to HexBackground
 */

import React from 'react';
import { useThemeContext } from '../state';
import type { ColorPalette } from '../types';
import { HexBackground as BaseHexBackground } from './HexBackground';

export interface ThemedHexBackgroundProps {
  /** Animation enabled */
  animated?: boolean;
  /** Performance mode */
  performance?: 'low' | 'medium' | 'high';
  /** Custom CSS class */
  className?: string;
}

/**
 * Theme-aware hexagonal background component
 * Automatically uses palette and texture from theme context
 */
export const ThemedHexBackground: React.FC<ThemedHexBackgroundProps> = ({
  animated = true,
  performance = 'medium',
  className = '',
}) => {
  const { themeConfig } = useThemeContext();

  // Determine which palette to use based on theme mode and state
  let palette: ColorPalette;

  if (themeConfig.mode === 'team') {
    if (
      themeConfig.extractedPalette &&
      themeConfig.extractedPalette.colors.length > 0
    ) {
      // Use extracted palette (from hardcoded team palettes)
      palette = themeConfig.extractedPalette;
    } else if (themeConfig.selectedTeam) {
      // Fallback to team's hardcoded colors if no extracted palette yet
      palette = {
        colors: [
          themeConfig.selectedTeam.primaryColor,
          themeConfig.selectedTeam.secondaryColor,
          themeConfig.selectedTeam.accentColor,
        ],
        weights: [0.5, 0.3, 0.2],
      };
    } else {
      // No team selected in team mode, use default
      palette = {
        colors: ['#1f2937', '#374151', '#60a5fa'],
        weights: [0.4, 0.4, 0.2],
      };
    }
  } else {
    // Always use default palette in default mode
    palette = {
      colors: ['#1f2937', '#374151', '#60a5fa'],
      weights: [0.4, 0.4, 0.2],
    };
  }

  return (
    <BaseHexBackground
      key={`${themeConfig.mode}-${themeConfig.selectedTeam?.id || 'default'}`}
      palette={palette}
      textureType={themeConfig.texture}
      animated={animated}
      performance={performance}
      className={className}
    />
  );
};
