/**
 * Hexagonal grid coordinate system and utilities
 *
 * Uses axial coordinates (q, r) for efficient hex calculations
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

import type { HexCoordinate } from '../types';

export interface HexLayout {
  /** Size of hexagon (radius from center to vertex) */
  size: number;
  /** Origin point for hex grid */
  origin: { x: number; y: number };
  /** Orientation: flat-top (false) or pointy-top (true) */
  pointyTop: boolean;
}

export interface HexPixel {
  x: number;
  y: number;
}

/**
 * Convert hex coordinates to pixel coordinates
 */
export function hexToPixel(hex: HexCoordinate, layout: HexLayout): HexPixel {
  const { q, r } = hex;
  const { size, origin, pointyTop } = layout;

  let x: number, y: number;

  if (pointyTop) {
    // Pointy-top orientation
    x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    y = size * ((3 / 2) * r);
  } else {
    // Flat-top orientation
    x = size * ((3 / 2) * q);
    y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
  }

  return {
    x: x + origin.x,
    y: y + origin.y,
  };
}

/**
 * Convert pixel coordinates to hex coordinates
 */
export function pixelToHex(pixel: HexPixel, layout: HexLayout): HexCoordinate {
  const { x, y } = pixel;
  const { size, origin, pointyTop } = layout;

  // Translate to grid origin
  const pt = {
    x: (x - origin.x) / size,
    y: (y - origin.y) / size,
  };

  let q: number, r: number;

  if (pointyTop) {
    // Pointy-top orientation
    q = (Math.sqrt(3) / 3) * pt.x - (1 / 3) * pt.y;
    r = (2 / 3) * pt.y;
  } else {
    // Flat-top orientation
    q = (2 / 3) * pt.x;
    r = (-1 / 3) * pt.x + (Math.sqrt(3) / 3) * pt.y;
  }

  return hexRound({ q, r });
}

/**
 * Round fractional hex coordinates to nearest integer hex
 */
export function hexRound(hex: { q: number; r: number }): HexCoordinate {
  let q = Math.round(hex.q);
  let r = Math.round(hex.r);
  const s = Math.round(-hex.q - hex.r); // s = -q - r

  const qDiff = Math.abs(q - hex.q);
  const rDiff = Math.abs(r - hex.r);
  const sDiff = Math.abs(s - (-hex.q - hex.r));

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }

  return { q, r };
}

/**
 * Calculate distance between two hex coordinates
 */
export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
}

/**
 * Get all hex coordinates within a radius from center
 */
export function hexRange(
  center: HexCoordinate,
  radius: number,
): HexCoordinate[] {
  const results: HexCoordinate[] = [];

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);

    for (let r = r1; r <= r2; r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }

  return results;
}

/**
 * Get hex coordinates that are visible within viewport bounds
 */
export function getVisibleHexes(
  viewport: { x: number; y: number; width: number; height: number },
  layout: HexLayout,
): HexCoordinate[] {
  // Calculate hex coordinates for viewport corners
  const corners = [
    { x: viewport.x, y: viewport.y },
    { x: viewport.x + viewport.width, y: viewport.y },
    { x: viewport.x, y: viewport.y + viewport.height },
    { x: viewport.x + viewport.width, y: viewport.y + viewport.height },
  ];

  const hexCorners = corners.map((corner) => pixelToHex(corner, layout));

  // Find bounding box in hex coordinates
  const minQ = Math.min(...hexCorners.map((h) => h.q));
  const maxQ = Math.max(...hexCorners.map((h) => h.q));
  const minR = Math.min(...hexCorners.map((h) => h.r));
  const maxR = Math.max(...hexCorners.map((h) => h.r));

  // Add padding to ensure we cover viewport completely
  const padding = 2;
  const results: HexCoordinate[] = [];

  for (let q = minQ - padding; q <= maxQ + padding; q++) {
    for (let r = minR - padding; r <= maxR + padding; r++) {
      // Check if this hex might be visible in the viewport
      const pixel = hexToPixel({ q, r }, layout);

      // Expand check area to include hex size
      const hexRadius = layout.size;
      if (
        pixel.x >= viewport.x - hexRadius &&
        pixel.x <= viewport.x + viewport.width + hexRadius &&
        pixel.y >= viewport.y - hexRadius &&
        pixel.y <= viewport.y + viewport.height + hexRadius
      ) {
        results.push({ q, r });
      }
    }
  }

  return results;
}

/**
 * Get the 6 vertices of a hexagon in pixel coordinates
 */
export function getHexVertices(
  hex: HexCoordinate,
  layout: HexLayout,
): HexPixel[] {
  const center = hexToPixel(hex, layout);
  const vertices: HexPixel[] = [];

  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i + (layout.pointyTop ? 0 : 30);
    const angleRad = (Math.PI / 180) * angleDeg;

    vertices.push({
      x: center.x + layout.size * Math.cos(angleRad),
      y: center.y + layout.size * Math.sin(angleRad),
    });
  }

  return vertices;
}

/**
 * Calculate optimal hex size based on density and viewport
 */
export function calculateOptimalHexSize(
  viewport: { width: number; height: number },
  targetDensity: 'sparse' | 'medium' | 'dense' = 'medium',
): number {
  const area = viewport.width * viewport.height;

  // Target number of hexes based on density
  const targetHexCount = {
    sparse: Math.floor(area / 50000), // ~1 hex per 50k pixels
    medium: Math.floor(area / 25000), // ~1 hex per 25k pixels
    dense: Math.floor(area / 12500), // ~1 hex per 12.5k pixels
  }[targetDensity];

  // Calculate hex size from target count
  // Area of hex = 3 * sqrt(3) / 2 * size^2
  const hexArea = area / Math.max(targetHexCount, 10);
  const size = Math.sqrt(hexArea / ((3 * Math.sqrt(3)) / 2));

  // Clamp to reasonable bounds
  return Math.max(8, Math.min(50, size));
}

/**
 * Create a hash from hex coordinates for deterministic randomness
 */
export function hexHash(hex: HexCoordinate): number {
  // Simple hash function for consistent pseudo-randomness
  const { q, r } = hex;
  let hash = (q * 374761393 + r * 668265263) & 0x7fffffff;
  hash = (hash ^ (hash >> 13)) * 1274126177;
  return (hash ^ (hash >> 16)) & 0x7fffffff;
}

/**
 * Get pseudo-random value [0, 1) based on hex coordinates
 */
export function hexRandom(hex: HexCoordinate, seed = 0): number {
  const hash = hexHash(hex) + seed;
  return (hash % 2147483647) / 2147483647;
}
