/**
 * Core theme type definitions for the theming system
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorPalette {
  colors: string[]; // Hex color strings like '#ff0000'
  weights: number[]; // Relative weights/frequencies
}

export interface ThemeTokens {
  // Primary color palette
  primary: string;
  secondary: string;
  accent: string;

  // Background and surface colors
  bgPrimary: string;
  bgSecondary: string;
  surface: string;

  // Text colors
  text: string;
  textMuted: string;
  textInverse: string;

  // UI element colors
  border: string;
  focusRing: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;

  // Color scales (generated from primary colors)
  primaryScale: Record<string, string>; // 50, 100, 200, ..., 900
  secondaryScale: Record<string, string>;
  accentScale: Record<string, string>;
}

export type ThemeMode = 'default' | 'team';

export type TextureType = 'carbon' | 'metallic' | 'paper' | 'halftone';

export interface ThemeConfig {
  mode: ThemeMode;
  selectedTeam: Team | null;
  extractedPalette: ColorPalette | null;
  texture: TextureType;
  tokens: ThemeTokens;
}

export interface Team {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  logoPath: string;
  searchTerms: string[];
  league: string;
  category: 'club' | 'national' | 'league';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface HexCoordinate {
  q: number; // Axial coordinate q
  r: number; // Axial coordinate r
}

export interface Point {
  x: number;
  y: number;
}

export interface HexGridConfig {
  size: number; // Hex radius in pixels
  spacing: number; // Gap between hexes
  colors: string[]; // Distributed hex colors
  bounds: {
    // Viewport bounds
    width: number;
    height: number;
  };
}

export interface ContrastResult {
  ratio: number;
  passes: boolean;
  level: 'AA' | 'AAA' | 'FAIL';
}

export interface TexturePattern {
  canvas: HTMLCanvasElement;
  repeat: 'repeat' | 'no-repeat';
  opacity: number;
}
