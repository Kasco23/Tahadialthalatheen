/**
 * Default theme tokens (separated to avoid circular dependencies)
 */

import type { ThemeTokens } from '../types';

export const DEFAULT_TOKENS: ThemeTokens = {
  primary: '#22c55e', // Green (existing brand-grad)
  secondary: '#38bdf8', // Blue (existing accent2)
  accent: '#6a5acd', // Violet (existing accent)

  bgPrimary: '#0f172a', // Dark (existing brand-dark)
  bgSecondary: '#1e293b', // Slightly lighter dark
  surface: '#334155', // Card surfaces

  text: '#f8fafc', // Light text (existing brand-light)
  textMuted: '#94a3b8', // Muted text
  textInverse: '#0f172a', // Dark text on light backgrounds

  border: 'rgba(148, 163, 184, 0.2)', // Subtle borders
  focusRing: '#22c55e', // Match primary

  success: '#10b981', // Green
  warning: '#f59e0b', // Amber
  error: '#ef4444', // Red

  primaryScale: {}, // Will be generated
  secondaryScale: {},
  accentScale: {},
};
