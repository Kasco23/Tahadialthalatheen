/**
 * Theme-aware hexagonal background wrapper
 * Connects to theme context and provides necessary props to HexBackground
 */

import React from 'react';
import { useThemeContext } from '../state';
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

  // Use extracted palette or fallback to default colors
  const palette = themeConfig.extractedPalette || {
    colors: ['#1f2937', '#374151', '#60a5fa'],
    weights: [0.4, 0.4, 0.2],
  };

  return (
    <BaseHexBackground
      palette={palette}
      textureType={themeConfig.texture}
      animated={animated}
      performance={performance}
      className={className}
    />
  );
};
