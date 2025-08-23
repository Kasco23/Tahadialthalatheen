/**
 * Core theme token management and CSS variable utilities
 */

import type { HSL, RGB, ThemeTokens } from '../types';

// CSS variable names for theme tokens
export const CSS_VARIABLES = {
  // Primary palette
  PRIMARY: '--theme-primary',
  SECONDARY: '--theme-secondary',
  ACCENT: '--theme-accent',

  // Backgrounds
  BG_PRIMARY: '--theme-bg-primary',
  BG_SECONDARY: '--theme-bg-secondary',
  SURFACE: '--theme-surface',

  // Text
  TEXT: '--theme-text',
  TEXT_MUTED: '--theme-text-muted',
  TEXT_INVERSE: '--theme-text-inverse',

  // UI elements
  BORDER: '--theme-border',
  FOCUS_RING: '--theme-focus-ring',

  // Semantic
  SUCCESS: '--theme-success',
  WARNING: '--theme-warning',
  ERROR: '--theme-error',

  // Color scales (programmatically generated)
  PRIMARY_SCALE: '--theme-primary-', // + 50, 100, 200, etc.
  SECONDARY_SCALE: '--theme-secondary-',
  ACCENT_SCALE: '--theme-accent-',
} as const;

// Default theme tokens
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

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const l = (max + min) / 2;

  if (diff === 0) {
    return { h: 0, s: 0, l };
  }

  const s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = (g - b) / diff + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / diff + 2;
      break;
    case b:
      h = (r - g) / diff + 4;
      break;
    default:
      h = 0;
  }
  h /= 6;

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Generate color scale from base color (50-900)
 */
export function generateColorScale(baseColor: string): Record<string, string> {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb);

  const scale: Record<string, string> = {};

  // Generate lightness values for standard scale
  const lightnesses = {
    '50': 95,
    '100': 90,
    '200': 80,
    '300': 70,
    '400': 60,
    '500': hsl.l, // Base color
    '600': Math.max(hsl.l - 10, 40),
    '700': Math.max(hsl.l - 20, 30),
    '800': Math.max(hsl.l - 30, 20),
    '900': Math.max(hsl.l - 40, 10),
  };

  Object.entries(lightnesses).forEach(([key, lightness]) => {
    const scaledHsl: HSL = { ...hsl, l: lightness };
    const scaledRgb = hslToRgb(scaledHsl);
    scale[key] = rgbToHex(scaledRgb);
  });

  return scale;
}

/**
 * Apply theme tokens to CSS variables
 */
export function applyThemeTokens(tokens: ThemeTokens): void {
  const root = document.documentElement;

  // Apply base colors
  root.style.setProperty(CSS_VARIABLES.PRIMARY, tokens.primary);
  root.style.setProperty(CSS_VARIABLES.SECONDARY, tokens.secondary);
  root.style.setProperty(CSS_VARIABLES.ACCENT, tokens.accent);

  // Apply backgrounds
  root.style.setProperty(CSS_VARIABLES.BG_PRIMARY, tokens.bgPrimary);
  root.style.setProperty(CSS_VARIABLES.BG_SECONDARY, tokens.bgSecondary);
  root.style.setProperty(CSS_VARIABLES.SURFACE, tokens.surface);

  // Apply text colors
  root.style.setProperty(CSS_VARIABLES.TEXT, tokens.text);
  root.style.setProperty(CSS_VARIABLES.TEXT_MUTED, tokens.textMuted);
  root.style.setProperty(CSS_VARIABLES.TEXT_INVERSE, tokens.textInverse);

  // Apply UI colors
  root.style.setProperty(CSS_VARIABLES.BORDER, tokens.border);
  root.style.setProperty(CSS_VARIABLES.FOCUS_RING, tokens.focusRing);

  // Apply semantic colors
  root.style.setProperty(CSS_VARIABLES.SUCCESS, tokens.success);
  root.style.setProperty(CSS_VARIABLES.WARNING, tokens.warning);
  root.style.setProperty(CSS_VARIABLES.ERROR, tokens.error);

  // Apply color scales
  Object.entries(tokens.primaryScale).forEach(([shade, color]) => {
    root.style.setProperty(`${CSS_VARIABLES.PRIMARY_SCALE}${shade}`, color);
  });

  Object.entries(tokens.secondaryScale).forEach(([shade, color]) => {
    root.style.setProperty(`${CSS_VARIABLES.SECONDARY_SCALE}${shade}`, color);
  });

  Object.entries(tokens.accentScale).forEach(([shade, color]) => {
    root.style.setProperty(`${CSS_VARIABLES.ACCENT_SCALE}${shade}`, color);
  });
}

/**
 * Generate complete theme tokens with color scales
 */
export function generateThemeTokens(
  baseTokens: Partial<ThemeTokens>,
): ThemeTokens {
  const tokens = { ...DEFAULT_TOKENS, ...baseTokens };

  // Generate color scales
  tokens.primaryScale = generateColorScale(tokens.primary);
  tokens.secondaryScale = generateColorScale(tokens.secondary);
  tokens.accentScale = generateColorScale(tokens.accent);

  return tokens;
}

/**
 * Normalize color string to hex format
 */
export function normalizeColor(color: string): string {
  if (color.startsWith('#')) {
    // Expand 3-digit hex to 6-digit
    if (color.length === 4) {
      return (
        '#' +
        color
          .slice(1)
          .split('')
          .map((c) => c + c)
          .join('')
      );
    }
    return color.toLowerCase();
  }

  // Handle rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return rgbToHex({ r: parseInt(r), g: parseInt(g), b: parseInt(b) });
  }

  // Handle named colors (basic set)
  const namedColors: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
  };

  return namedColors[color.toLowerCase()] || color;
}
