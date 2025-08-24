/**
 * Main theme system exports
 *
 * Comprehensive theming system for React + Vite + Tailwind applications
 * Features: theme modes, team color extraction, hexagonal backgrounds, WCAG compliance
 */

// Core types and configuration
export type {
  ColorPalette,
  ContrastResult,
  HexCoordinate,
  HexGridConfig,
  HSL,
  Point,
  RGB,
  Team,
  TexturePattern,
  ThemeConfig,
  ThemeMode,
  TextureType as ThemeTextureType,
  ThemeTokens,
} from './types';

// Core theme utilities
export {
  applyThemeTokens,
  generateColorScale,
  hexToRgb,
  hslToRgb,
  rgbToHex,
  rgbToHsl,
} from './core/tokens';

export {
  adjustForContrast,
  checkContrast,
  getAccessibleTextColor,
  getContrastRatio,
  getRelativeLuminance,
} from './core/contrast';

export {
  clearThemeStorage,
  loadSelectedTeam,
  loadTextureType,
  loadThemeMode,
  saveSelectedTeam,
  saveTextureType,
  saveThemeMode,
} from './core/storage';

// State management atoms (specific exports to avoid circular dependencies)
export {
  activeThemeConfigAtom,
  applyThemeAtom,
  baseThemeTokensAtom,
  extractedPaletteAtom,
  selectedTeamAtom,
  textureTypeAtom,
  themeModeAtom,
} from './state/themeAtoms';

// Theme provider
export { ThemeProvider } from './components/ThemeProvider';

// Color palette extraction
export {
  combinePalettes,
  createPreviewPalette,
  ensureMinimumColors,
  extractTeamPalette,
  getDominantColor,
  normalizePalette,
} from './palette';

// Hexagonal background system
export {
  calculateOptimalHexSize,
  createAdaptiveDensity,
  createColorFlow,
  generatePalettePreview,
  generateTexture,
  getHexColor,
  getHexVertices,
  getOptimalTextureSize,
  getVisibleHexes,
  HexBackground,
  hexDistance,
  hexHash,
  hexRandom,
  hexRange,
  hexToPixel,
  interpolateColorDistribution,
  pixelToHex,
  texturePresets,
  ThemedHexBackground,
  type ColorDistribution,
  type DistributionConfig,
  type HexBackgroundProps,
  type HexLayout,
  type HexPixel,
  type TextureConfig,
  type TextureType,
  type ThemedHexBackgroundProps,
} from './background';

// UI Components
// export { ThemeControls, type ThemeControlsProps } from './components'; // Temporarily disabled due to CSS issues
export { SimpleThemeControls } from './components/SimpleThemeControls';

// Demo component (for development/showcase)
export { ThemeDemo } from './demo/ThemeDemo';
