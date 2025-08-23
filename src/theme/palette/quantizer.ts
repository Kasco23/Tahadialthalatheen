/**
 * Canvas-based color quantization fallback for complex SVGs
 */

import { rgbToHex } from '../core/tokens';
import type { ColorPalette } from '../types';

/**
 * Extract colors from SVG using Canvas rasterization as fallback
 * This is used when direct SVG parsing fails or produces insufficient results
 */
export async function extractColorsFromSVGCanvas(
  svgUrl: string,
): Promise<ColorPalette> {
  try {
    const img = await loadImageFromSVG(svgUrl);
    const canvas = createCanvasFromImage(img);
    const imageData = getImageDataFromCanvas(canvas);

    return quantizeImageData(imageData);
  } catch (error) {
    console.error('Canvas color extraction failed:', error);
    return { colors: [], weights: [] };
  }
}

/**
 * Load SVG as an image element
 */
function loadImageFromSVG(svgUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load SVG as image'));

    // Set CORS to handle cross-origin SVGs if needed
    img.crossOrigin = 'anonymous';
    img.src = svgUrl;
  });
}

/**
 * Create canvas and draw image onto it
 */
function createCanvasFromImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use a reasonable size for color sampling (too large = slow, too small = inaccurate)
  const maxSize = 200;
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);

  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  // Draw image onto canvas
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas;
}

/**
 * Extract image data from canvas
 */
function getImageDataFromCanvas(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Simple color quantization using median cut algorithm
 */
function quantizeImageData(imageData: ImageData, maxColors = 6): ColorPalette {
  const pixels: Array<[number, number, number]> = [];

  // Sample pixels (skip transparent ones)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    // Skip transparent pixels and very light/dark pixels
    if (a > 128 && isSignificantPixel(r, g, b)) {
      pixels.push([r, g, b]);
    }
  }

  if (pixels.length === 0) {
    return { colors: [], weights: [] };
  }

  // Use median cut to find dominant colors
  const colorBuckets = medianCut(pixels, maxColors);

  // Convert buckets to palette
  const colors: string[] = [];
  const weights: number[] = [];

  colorBuckets.forEach((bucket) => {
    if (bucket.length > 0) {
      const avgColor = getAverageColor(bucket);
      colors.push(rgbToHex({ r: avgColor[0], g: avgColor[1], b: avgColor[2] }));
      weights.push(bucket.length);
    }
  });

  return { colors, weights };
}

/**
 * Check if pixel is significant (similar to SVG extraction logic)
 */
function isSignificantPixel(r: number, g: number, b: number): boolean {
  const brightness = (r + g + b) / 3;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  return (
    brightness > 20 && // Not too dark
    brightness < 235 && // Not too light
    saturation > 0.1
  ); // Has some saturation
}

/**
 * Median cut algorithm for color quantization
 */
function medianCut(
  pixels: Array<[number, number, number]>,
  maxColors: number,
): Array<Array<[number, number, number]>> {
  if (maxColors === 1 || pixels.length <= maxColors) {
    return [pixels];
  }

  // Find the dimension with the largest range
  const ranges = [
    getRange(pixels, 0), // R
    getRange(pixels, 1), // G
    getRange(pixels, 2), // B
  ];

  const largestDim = ranges.indexOf(Math.max(...ranges));

  // Sort by the largest dimension
  pixels.sort((a, b) => a[largestDim] - b[largestDim]);

  // Split at median
  const median = Math.floor(pixels.length / 2);
  const left = pixels.slice(0, median);
  const right = pixels.slice(median);

  // Recursively quantize each half
  const leftColors = Math.floor(maxColors / 2);
  const rightColors = maxColors - leftColors;

  return [...medianCut(left, leftColors), ...medianCut(right, rightColors)];
}

/**
 * Get range of values for a specific color dimension
 */
function getRange(
  pixels: Array<[number, number, number]>,
  dimension: number,
): number {
  let min = 255;
  let max = 0;

  pixels.forEach((pixel) => {
    const value = pixel[dimension];
    min = Math.min(min, value);
    max = Math.max(max, value);
  });

  return max - min;
}

/**
 * Calculate average color of a bucket
 */
function getAverageColor(
  pixels: Array<[number, number, number]>,
): [number, number, number] {
  if (pixels.length === 0) {
    return [0, 0, 0];
  }

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  pixels.forEach(([r, g, b]) => {
    totalR += r;
    totalG += g;
    totalB += b;
  });

  return [
    Math.round(totalR / pixels.length),
    Math.round(totalG / pixels.length),
    Math.round(totalB / pixels.length),
  ];
}
