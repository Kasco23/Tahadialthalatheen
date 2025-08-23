/**
 * Main background module exports
 */

export { HexBackground } from './HexBackground';
export type { HexBackgroundProps } from './HexBackground';

export { ThemedHexBackground } from './ThemedHexBackground';
export type { ThemedHexBackgroundProps } from './ThemedHexBackground';

export {
  calculateOptimalHexSize,
  getHexVertices,
  getVisibleHexes,
  hexDistance,
  hexHash,
  hexRandom,
  hexRange,
  hexToPixel,
  pixelToHex,
  type HexLayout,
  type HexPixel,
} from './hexGrid';

export {
  createAdaptiveDensity,
  createColorFlow,
  generatePalettePreview,
  getHexColor,
  interpolateColorDistribution,
  type ColorDistribution,
  type DistributionConfig,
} from './colorDistribution';

export {
  generateTexture,
  getOptimalTextureSize,
  texturePresets,
  type TextureConfig,
  type TextureType,
} from './texture';

// Re-export types from main types file
export type { HexCoordinate } from '../types';
