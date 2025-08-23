/**
 * WCAG contrast calculation and accessibility utilities
 */

import type { ContrastResult, RGB } from '../types';
import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from './tokens';

/**
 * Calculate relative luminance according to WCAG 2.1
 * https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
export function getRelativeLuminance(rgb: RGB): number {
  // Convert sRGB to linear RGB
  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(rgb.r);
  const gLinear = toLinear(rgb.g);
  const bLinear = toLinear(rgb.b);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 */
export function checkContrast(
  foreground: string,
  background: string,
  isLargeText = false,
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  // WCAG 2.1 requirements
  const aaThreshold = isLargeText ? 3.0 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7.0;

  let level: ContrastResult['level'];
  if (ratio >= aaaThreshold) {
    level = 'AAA';
  } else if (ratio >= aaThreshold) {
    level = 'AA';
  } else {
    level = 'FAIL';
  }

  return {
    ratio,
    passes: ratio >= aaThreshold,
    level,
  };
}

/**
 * Adjust color lightness to meet minimum contrast ratio
 */
export function adjustForContrast(
  foreground: string,
  background: string,
  minRatio = 4.5,
  maxAdjustment = 40,
): string {
  const currentRatio = getContrastRatio(foreground, background);

  if (currentRatio >= minRatio) {
    return foreground; // Already meets contrast
  }

  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  const fgHsl = rgbToHsl(fgRgb);
  const bgLuminance = getRelativeLuminance(bgRgb);

  // Determine if we should lighten or darken the foreground
  const shouldLighten = bgLuminance < 0.5;

  const adjustedHsl = { ...fgHsl };
  let attempts = 0;
  const maxAttempts = 20;
  const step = shouldLighten ? 5 : -5;

  while (attempts < maxAttempts) {
    // Adjust lightness
    adjustedHsl.l = Math.max(0, Math.min(100, adjustedHsl.l + step));

    // Check if we've exceeded max adjustment
    const lightnessDiff = Math.abs(adjustedHsl.l - fgHsl.l);
    if (lightnessDiff > maxAdjustment) {
      break;
    }

    // Convert back and check contrast
    const adjustedRgb = hslToRgb(adjustedHsl);
    const adjustedHex = rgbToHex(adjustedRgb);
    const newRatio = getContrastRatio(adjustedHex, background);

    if (newRatio >= minRatio) {
      return adjustedHex;
    }

    attempts++;
  }

  // If adjustment failed, return high-contrast fallback
  return getContrastFallback(background);
}

/**
 * Get high-contrast fallback color for a given background
 */
export function getContrastFallback(background: string): string {
  const bgRgb = hexToRgb(background);
  const luminance = getRelativeLuminance(bgRgb);

  // Use white for dark backgrounds, dark gray for light backgrounds
  return luminance < 0.5 ? '#ffffff' : '#1f2937';
}

/**
 * Generate accessible text color for any background
 */
export function getAccessibleTextColor(
  background: string,
  preferredColor?: string,
): string {
  if (preferredColor) {
    const result = checkContrast(preferredColor, background);
    if (result.passes) {
      return preferredColor;
    }

    // Try to adjust the preferred color
    const adjusted = adjustForContrast(preferredColor, background);
    const adjustedResult = checkContrast(adjusted, background);
    if (adjustedResult.passes) {
      return adjusted;
    }
  }

  // Fall back to high-contrast color
  return getContrastFallback(background);
}

/**
 * Calculate average color from a palette (for background contrast calculation)
 */
export function getAverageColor(colors: string[], weights?: number[]): string {
  if (colors.length === 0) return '#000000';

  const totalWeight = weights
    ? weights.reduce((a, b) => a + b, 0)
    : colors.length;
  let totalR = 0,
    totalG = 0,
    totalB = 0;

  colors.forEach((color, index) => {
    const rgb = hexToRgb(color);
    const weight = weights ? weights[index] : 1;
    const normalizedWeight = weight / totalWeight;

    totalR += rgb.r * normalizedWeight;
    totalG += rgb.g * normalizedWeight;
    totalB += rgb.b * normalizedWeight;
  });

  return rgbToHex({
    r: Math.round(totalR),
    g: Math.round(totalG),
    b: Math.round(totalB),
  });
}

/**
 * Generate semantic color variants with proper contrast
 */
export function generateSemanticColors(background: string): {
  success: string;
  warning: string;
  error: string;
} {
  const baseColors = {
    success: '#10b981', // Emerald 500
    warning: '#f59e0b', // Amber 500
    error: '#ef4444', // Red 500
  };

  return {
    success: adjustForContrast(baseColors.success, background, 4.5),
    warning: adjustForContrast(baseColors.warning, background, 4.5),
    error: adjustForContrast(baseColors.error, background, 4.5),
  };
}
