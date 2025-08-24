/**
 * Main palette extraction module that combines hardcoded palettes with SVG parsing fallback
 */

import type { ColorPalette } from '../types';
import { getTeamColorPalette } from '../data/teams';
import { extractColorsFromSVGUrlCached } from './extractor';
import { extractColorsFromSVGCanvas } from './quantizer';

/**
 * Extract color palette from team logo using hardcoded palettes
 * Falls back to dynamic extraction if team is not found in hardcoded palettes
 */
export async function extractTeamPalette(
  logoUrl: string,
): Promise<ColorPalette> {
  try {
    // Extract team ID from logo URL
    const teamId = extractTeamIdFromUrl(logoUrl);
    
    if (teamId) {
      // Try to get hardcoded palette first
      const hardcodedPalette = getTeamColorPalette(teamId);
      
      // If we have a hardcoded palette (not the default fallback), use it
      if (hardcodedPalette && teamId !== 'default') {
        console.debug('Using hardcoded palette for team:', teamId);
        return {
          colors: hardcodedPalette.colors,
          weights: hardcodedPalette.weights,
        };
      }
    }

    // Fallback to dynamic extraction for unknown teams
    console.debug('No hardcoded palette found, falling back to dynamic extraction for:', logoUrl);
    
    // First attempt: Direct SVG parsing
    const svgPalette = await extractColorsFromSVGUrlCached(logoUrl);

    // Check if we got good results from SVG parsing
    if (isGoodPalette(svgPalette)) {
      console.debug('Using SVG-extracted palette for:', logoUrl);
      return svgPalette;
    }

    // Second attempt: Canvas fallback
    console.debug(
      'SVG extraction insufficient, trying Canvas fallback for:',
      logoUrl,
    );
    const canvasPalette = await extractColorsFromSVGCanvas(logoUrl);

    if (isGoodPalette(canvasPalette)) {
      console.debug('Using Canvas-extracted palette for:', logoUrl);
      return canvasPalette;
    }

    // If both methods fail, return the best we have or default
    const bestPalette =
      svgPalette.colors.length >= canvasPalette.colors.length
        ? svgPalette
        : canvasPalette;

    console.warn('Limited color extraction results for:', logoUrl, bestPalette);
    return bestPalette.colors.length > 0 ? bestPalette : getTeamColorPalette('default');
  } catch (error) {
    console.error('Color extraction failed completely for:', logoUrl, error);
    return getTeamColorPalette('default');
  }
}

/**
 * Extract team ID from logo URL
 */
function extractTeamIdFromUrl(logoUrl: string): string | null {
  try {
    // Extract filename from URL (handle both relative and absolute URLs)
    const filename = logoUrl.split('/').pop();
    if (!filename) return null;
    
    // Remove file extension and return team ID
    return filename.replace(/\.(svg|png|jpg|jpeg|webp)$/i, '');
  } catch (error) {
    console.warn('Failed to extract team ID from URL:', logoUrl, error);
    return null;
  }
}

/**
 * Check if extracted palette has sufficient quality
 */
function isGoodPalette(palette: ColorPalette): boolean {
  // Good palette should have at least 2 colors with reasonable distribution
  if (palette.colors.length < 2) {
    return false;
  }

  // Check that colors are not too similar (basic diversity check)
  const uniqueColors = new Set(palette.colors);
  if (uniqueColors.size < 2) {
    return false;
  }

  // Check that we have some weight distribution (not all colors equally weighted)
  const totalWeight = palette.weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) {
    return false;
  }

  const maxWeight = Math.max(...palette.weights);
  const avgWeight = totalWeight / palette.weights.length;

  // Good palette should have some variance in weights
  return maxWeight > avgWeight * 1.5;
}

/**
 * Normalize palette by ensuring weights sum to 1 and sorting by weight
 */
export function normalizePalette(palette: ColorPalette): ColorPalette {
  if (palette.colors.length === 0) {
    return palette;
  }

  // Create pairs and sort by weight (descending)
  const pairs = palette.colors.map((color, index) => ({
    color,
    weight: palette.weights[index] || 1,
  }));

  pairs.sort((a, b) => b.weight - a.weight);

  // Calculate normalized weights
  const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0);

  return {
    colors: pairs.map((pair) => pair.color),
    weights: pairs.map((pair) =>
      totalWeight > 0 ? pair.weight / totalWeight : 1 / pairs.length,
    ),
  };
}

/**
 * Ensure palette has minimum required colors by duplicating if necessary
 */
export function ensureMinimumColors(
  palette: ColorPalette,
  minColors = 3,
): ColorPalette {
  if (palette.colors.length >= minColors) {
    return palette;
  }

  if (palette.colors.length === 0) {
    // Return default colors if extraction completely failed
    return {
      colors: ['#22c55e', '#38bdf8', '#6a5acd'],
      weights: [0.5, 0.3, 0.2],
    };
  }

  // Duplicate existing colors to reach minimum
  const colors = [...palette.colors];
  const weights = [...palette.weights];

  while (colors.length < minColors) {
    const sourceIndex =
      (colors.length - palette.colors.length) % palette.colors.length;
    colors.push(palette.colors[sourceIndex]);
    weights.push(palette.weights[sourceIndex] * 0.5); // Reduce weight for duplicates
  }

  return normalizePalette({ colors, weights });
}

/**
 * Create a preview palette with limited colors for UI display
 */
export function createPreviewPalette(
  palette: ColorPalette,
  maxColors = 4,
): ColorPalette {
  if (palette.colors.length <= maxColors) {
    return palette;
  }

  return {
    colors: palette.colors.slice(0, maxColors),
    weights: palette.weights.slice(0, maxColors),
  };
}

/**
 * Get the dominant color from a palette (highest weighted)
 */
export function getDominantColor(palette: ColorPalette): string | null {
  if (palette.colors.length === 0) {
    return null;
  }

  // Find index of highest weight
  let maxWeight = -1;
  let dominantIndex = 0;

  palette.weights.forEach((weight, index) => {
    if (weight > maxWeight) {
      maxWeight = weight;
      dominantIndex = index;
    }
  });

  return palette.colors[dominantIndex];
}

/**
 * Combine multiple palettes (useful for team competitions or mixed themes)
 */
export function combinePalettes(palettes: ColorPalette[]): ColorPalette {
  const colorCount = new Map<string, number>();

  palettes.forEach((palette) => {
    palette.colors.forEach((color, index) => {
      const weight = palette.weights[index] || 1;
      const currentWeight = colorCount.get(color) || 0;
      colorCount.set(color, currentWeight + weight);
    });
  });

  const entries = Array.from(colorCount.entries());
  entries.sort((a, b) => b[1] - a[1]); // Sort by weight descending

  return {
    colors: entries.map(([color]) => color),
    weights: entries.map(([, weight]) => weight),
  };
}
