/**
 * Color distribution system for hexagonal grid
 *
 * Distributes theme colors across hex grid using weighted probability
 * and creates natural color flow patterns
 */

import type { ColorPalette, HexCoordinate } from '../types';
import { hexRandom } from './hexGrid';

export interface ColorDistribution {
  /** Color value (hex string) */
  color: string;
  /** Alpha/opacity value [0, 1] */
  alpha: number;
  /** Color intensity [0, 1] */
  intensity: number;
}

export interface DistributionConfig {
  /** Color palette with weights */
  palette: ColorPalette;
  /** Base alpha range */
  alphaRange: [number, number];
  /** Intensity variation range */
  intensityRange: [number, number];
  /** Color clustering factor (higher = more clustered) */
  clustering: number;
  /** Animation seed for temporal variation */
  animationSeed: number;
}

/**
 * Calculate color distribution for a hex coordinate
 */
export function getHexColor(
  hex: HexCoordinate,
  config: DistributionConfig,
): ColorDistribution {
  const { palette, alphaRange, intensityRange, clustering, animationSeed } =
    config;

  if (palette.colors.length === 0) {
    return {
      color: '#22c55e',
      alpha: 0.1,
      intensity: 0.5,
    };
  }

  // Generate deterministic random values for this hex
  const random1 = hexRandom(hex, animationSeed);
  const random2 = hexRandom(hex, animationSeed + 1);

  // Select color based on weighted probability
  const selectedColor = selectWeightedColor(palette, random1);

  // Calculate alpha with some spatial coherence
  const alphaVariation = createSpatialVariation(hex, 0.3, animationSeed + 10);
  const alpha = lerp(alphaRange[0], alphaRange[1], alphaVariation);

  // Calculate intensity with clustering effect
  const intensityBase = random2;
  const clusteringEffect = createClusteringEffect(
    hex,
    clustering,
    animationSeed + 20,
  );
  const intensity = lerp(
    intensityRange[0],
    intensityRange[1],
    intensityBase * clusteringEffect,
  );

  return {
    color: selectedColor,
    alpha: Math.max(0, Math.min(1, alpha)),
    intensity: Math.max(0, Math.min(1, intensity)),
  };
}

/**
 * Select color from palette based on weighted probability
 */
function selectWeightedColor(
  palette: ColorPalette,
  randomValue: number,
): string {
  if (palette.colors.length === 1) {
    return palette.colors[0];
  }

  // Calculate cumulative weights
  const totalWeight = palette.weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) {
    // Equal probability fallback
    const index = Math.floor(randomValue * palette.colors.length);
    return palette.colors[index];
  }

  // Weighted selection
  let cumulativeWeight = 0;
  const target = randomValue * totalWeight;

  for (let i = 0; i < palette.colors.length; i++) {
    cumulativeWeight += palette.weights[i];
    if (target <= cumulativeWeight) {
      return palette.colors[i];
    }
  }

  // Fallback to last color
  return palette.colors[palette.colors.length - 1];
}

/**
 * Create spatial variation using multiple octaves of noise
 */
function createSpatialVariation(
  hex: HexCoordinate,
  intensity: number,
  seed: number,
): number {
  // Simple multi-octave noise using hex coordinates
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  const octaves = 3;

  for (let i = 0; i < octaves; i++) {
    const noiseValue = hexNoise(
      { q: hex.q * frequency, r: hex.r * frequency },
      seed + i,
    );
    value += noiseValue * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  // Normalize and apply intensity
  value = (value + 1) / 2; // Convert from [-1, 1] to [0, 1]
  return lerp(1 - intensity, 1, value);
}

/**
 * Create clustering effect for color intensity
 */
function createClusteringEffect(
  hex: HexCoordinate,
  clustering: number,
  seed: number,
): number {
  if (clustering <= 0) return 1;

  // Create cluster centers using deterministic noise
  const clusterScale = 0.1;
  const clusterNoise = hexNoise(
    { q: hex.q * clusterScale, r: hex.r * clusterScale },
    seed,
  );

  // Convert noise to clustering effect
  const clusterValue = (clusterNoise + 1) / 2; // [0, 1]
  return lerp(1 - clustering, 1, clusterValue);
}

/**
 * Simple noise function based on hex coordinates
 */
function hexNoise(hex: { q: number; r: number }, seed: number): number {
  // Create pseudo-random gradient vectors
  const hash = (hex.q * 374761393 + hex.r * 668265263 + seed) & 0x7fffffff;

  // Extract fractional parts
  const fracQ = hex.q - Math.floor(hex.q);
  const fracR = hex.r - Math.floor(hex.r);

  // Simple gradient noise approximation
  const gradient = (hash % 1000) / 500 - 1; // [-1, 1]
  const dot = fracQ * gradient + fracR * (1 - gradient);

  // Smooth the result
  return Math.sin(dot * Math.PI) * 0.5;
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Create color flow between related hexes for animation
 */
export function createColorFlow(
  hexes: HexCoordinate[],
  config: DistributionConfig,
  flowDirection: { x: number; y: number } = { x: 1, y: 0.5 },
): Map<string, ColorDistribution> {
  const colorMap = new Map<string, ColorDistribution>();

  hexes.forEach((hex) => {
    // Calculate flow influence
    const flowInfluence =
      (hex.q * flowDirection.x + hex.r * flowDirection.y) * 0.1;
    const flowSeed = Math.floor(config.animationSeed + flowInfluence);

    const modifiedConfig = {
      ...config,
      animationSeed: flowSeed,
    };

    const hexKey = `${hex.q},${hex.r}`;
    colorMap.set(hexKey, getHexColor(hex, modifiedConfig));
  });

  return colorMap;
}

/**
 * Calculate color transitions for smooth animation
 */
export function interpolateColorDistribution(
  from: ColorDistribution,
  to: ColorDistribution,
  progress: number,
): ColorDistribution {
  return {
    color: progress < 0.5 ? from.color : to.color, // Discrete color change at midpoint
    alpha: lerp(from.alpha, to.alpha, progress),
    intensity: lerp(from.intensity, to.intensity, progress),
  };
}

/**
 * Create adaptive density based on viewport and performance
 */
export function createAdaptiveDensity(
  viewport: { width: number; height: number },
  performance: 'low' | 'medium' | 'high' = 'medium',
): {
  hexSize: number;
  maxHexes: number;
  renderDistance: number;
} {
  const area = viewport.width * viewport.height;

  const configs = {
    low: {
      hexSize: Math.max(20, Math.min(40, Math.sqrt(area) / 30)),
      maxHexes: 500,
      renderDistance: 100,
    },
    medium: {
      hexSize: Math.max(15, Math.min(30, Math.sqrt(area) / 40)),
      maxHexes: 1000,
      renderDistance: 150,
    },
    high: {
      hexSize: Math.max(10, Math.min(25, Math.sqrt(area) / 50)),
      maxHexes: 2000,
      renderDistance: 200,
    },
  };

  return configs[performance];
}

/**
 * Generate color palette preview for UI
 */
export function generatePalettePreview(
  palette: ColorPalette,
  count = 20,
): ColorDistribution[] {
  const preview: ColorDistribution[] = [];

  for (let i = 0; i < count; i++) {
    const hex: HexCoordinate = { q: i % 5, r: Math.floor(i / 5) };

    const config: DistributionConfig = {
      palette,
      alphaRange: [0.1, 0.8],
      intensityRange: [0.3, 1.0],
      clustering: 0.2,
      animationSeed: 42,
    };

    preview.push(getHexColor(hex, config));
  }

  return preview;
}
