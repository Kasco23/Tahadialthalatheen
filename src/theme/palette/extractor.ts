/**
 * SVG color extraction utilities
 */

import { normalizeColor } from '../core/tokens';
import type { ColorPalette } from '../types';

/**
 * Extract colors directly from SVG markup by parsing fill and stroke attributes
 */
export function extractColorsFromSVG(svgText: string): ColorPalette {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('SVG parsing failed');
    }

    return extractColorsFromDocument(doc);
  } catch (error) {
    console.warn('SVG color extraction failed:', error);
    return { colors: [], weights: [] };
  }
}

/**
 * Extract colors from parsed SVG document
 */
function extractColorsFromDocument(doc: Document): ColorPalette {
  const colorCount = new Map<string, number>();

  // Create tree walker to traverse all elements
  const walker = document.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT, null);

  let node = walker.nextNode();

  while (node) {
    const element = node as Element;

    // Extract colors from various attributes
    const colorAttributes = ['fill', 'stroke'];

    colorAttributes.forEach((attr) => {
      const colorValue = element.getAttribute(attr);
      if (colorValue) {
        processColorValue(colorValue, colorCount);
      }
    });

    // Also check style attribute for inline styles
    const style = element.getAttribute('style');
    if (style) {
      extractColorsFromStyleString(style, colorCount);
    }

    // Check CSS class-based colors (basic extraction)
    const className = element.getAttribute('class');
    if (className) {
      // This is a simplified approach - in real apps you might want to
      // resolve computed styles, but for SVG logos this should be sufficient
      extractColorsFromClassName(className, colorCount);
    }

    node = walker.nextNode();
  }

  return rankColors(colorCount);
}

/**
 * Process individual color value and add to count map
 */
function processColorValue(
  colorValue: string,
  colorCount: Map<string, number>,
): void {
  // Skip non-color values
  if (
    !colorValue ||
    colorValue === 'none' ||
    colorValue === 'transparent' ||
    colorValue === 'currentColor' ||
    colorValue.startsWith('url(')
  ) {
    return;
  }

  try {
    const normalized = normalizeColor(colorValue);

    // Skip very dark or very light colors (likely backgrounds or outlines)
    if (isSignificantColor(normalized)) {
      const currentCount = colorCount.get(normalized) || 0;
      colorCount.set(normalized, currentCount + 1);
    }
  } catch {
    // Skip invalid colors
    console.debug('Skipping invalid color:', colorValue);
  }
}

/**
 * Extract colors from CSS style string
 */
function extractColorsFromStyleString(
  style: string,
  colorCount: Map<string, number>,
): void {
  // Match fill: and stroke: declarations
  const fillMatch = style.match(/fill:\s*([^;]+)/);
  const strokeMatch = style.match(/stroke:\s*([^;]+)/);

  if (fillMatch) {
    processColorValue(fillMatch[1].trim(), colorCount);
  }

  if (strokeMatch) {
    processColorValue(strokeMatch[1].trim(), colorCount);
  }
}

/**
 * Basic extraction from class names (for CSS-based coloring)
 */
function extractColorsFromClassName(
  className: string,
  colorCount: Map<string, number>,
): void {
  // This is a very basic implementation - in practice you'd want to resolve
  // actual CSS rules, but many SVG logos use inline styles anyway
  const colorKeywords = [
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
    'pink',
    'brown',
    'black',
    'white',
    'gray',
    'grey',
  ];

  colorKeywords.forEach((keyword) => {
    if (className.toLowerCase().includes(keyword)) {
      processColorValue(keyword, colorCount);
    }
  });
}

/**
 * Check if color is significant (not too dark/light, has some saturation)
 */
function isSignificantColor(hexColor: string): boolean {
  if (!hexColor.startsWith('#') || hexColor.length !== 7) {
    return false;
  }

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate brightness and saturation
  const brightness = (r + g + b) / 3;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  // Skip colors that are too dark, too light, or too desaturated
  return (
    brightness > 20 && // Not too dark
    brightness < 235 && // Not too light
    saturation > 0.1
  ); // Has some saturation
}

/**
 * Convert color count map to ranked palette
 */
function rankColors(colorCount: Map<string, number>): ColorPalette {
  if (colorCount.size === 0) {
    return { colors: [], weights: [] };
  }

  // Sort by frequency (most common first)
  const sortedEntries = Array.from(colorCount.entries()).sort(
    ([, a], [, b]) => b - a,
  );

  // Take top 6 colors maximum (for performance and visual clarity)
  const topColors = sortedEntries.slice(0, 6);

  const colors = topColors.map(([color]) => color);
  const weights = topColors.map(([, weight]) => weight);

  return { colors, weights };
}

/**
 * Load SVG from URL and extract colors
 */
export async function extractColorsFromSVGUrl(
  url: string,
): Promise<ColorPalette> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch SVG: ${response.status}`);
    }

    const svgText = await response.text();
    return extractColorsFromSVG(svgText);
  } catch (error) {
    console.error('Failed to extract colors from SVG URL:', error);
    return { colors: [], weights: [] };
  }
}

/**
 * Extract colors with caching to avoid repeated processing
 */
const colorExtractionCache = new Map<string, ColorPalette>();

export async function extractColorsFromSVGUrlCached(
  url: string,
): Promise<ColorPalette> {
  const cached = colorExtractionCache.get(url);
  if (cached) {
    return cached;
  }

  const palette = await extractColorsFromSVGUrl(url);
  colorExtractionCache.set(url, palette);

  return palette;
}
