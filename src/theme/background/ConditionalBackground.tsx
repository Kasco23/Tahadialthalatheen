/**
 * Conditional background component that renders different backgrounds based on theme mode
 */

import React from 'react';
import { useThemeContext } from '../state';
import { ThemedHexBackground } from './ThemedHexBackground';

export interface ConditionalBackgroundProps {
  /** Animation enabled for hex background */
  animated?: boolean;
  /** Performance mode for hex background */
  performance?: 'low' | 'medium' | 'high';
  /** Custom CSS class */
  className?: string;
}

/**
 * Default background component for non-team themes
 */
const DefaultBackground: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`fixed inset-0 z-[-10] ${className}`}>
      {/* Static gradient background for default theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* Subtle animated overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-slate-700/10 to-transparent animate-pulse [animation-duration:4s]" />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-45" />
    </div>
  );
};

/**
 * Conditional background component that switches between default and themed backgrounds
 */
export const ConditionalBackground: React.FC<ConditionalBackgroundProps> = ({
  animated = true,
  performance = 'medium',
  className = '',
}) => {
  const { themeConfig } = useThemeContext();

  // Show hex background only in team mode
  if (themeConfig.mode === 'team') {
    return (
      <ThemedHexBackground
        animated={animated}
        performance={performance}
        className={className}
      />
    );
  }

  // Show default background in default mode
  return <DefaultBackground className={className} />;
};
