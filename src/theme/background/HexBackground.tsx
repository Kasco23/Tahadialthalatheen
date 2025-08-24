/**
 * Canvas-based hexagonal background renderer
 *
 * Renders animated hexagonal grid with color distribution and texture layers
 */

import React, { useCallback, useEffect, useRef } from 'react';
import type { ColorPalette } from '../types';
import {
  type ColorDistribution,
  type DistributionConfig,
  createAdaptiveDensity,
  getHexColor,
} from './colorDistribution';
import styles from './HexBackground.module.css';
import { type HexLayout, getHexVertices, getVisibleHexes } from './hexGrid';
import type { TextureType } from './texture';
import {
  generateTexture,
  getOptimalTextureSize,
  texturePresets,
} from './texture';

export interface HexBackgroundProps {
  /** Color palette for hexagon distribution */
  palette: ColorPalette;
  /** Texture type for background layer */
  textureType: TextureType;
  /** Animation enabled */
  animated?: boolean;
  /** Performance mode */
  performance?: 'low' | 'medium' | 'high';
  /** Custom CSS class */
  className?: string;
}

/**
 * Hexagonal background component with Canvas rendering
 */
export const HexBackground: React.FC<HexBackgroundProps> = ({
  palette,
  textureType,
  animated = true,
  performance = 'medium',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textureCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const layoutRef = useRef<HexLayout | undefined>(undefined);
  const colorCacheRef = useRef<Map<string, ColorDistribution>>(new Map());

  /**
   * Initialize canvas and layout
   */
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const textureCanvas = textureCanvasRef.current;

    if (!canvas || !textureCanvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    textureCanvas.width = rect.width * dpr;
    textureCanvas.height = rect.height * dpr;

    // Scale context for retina displays
    const ctx = canvas.getContext('2d');
    const textureCtx = textureCanvas.getContext('2d');

    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    if (textureCtx) {
      textureCtx.scale(dpr, dpr);
    }

    // Calculate optimal hex layout
    const adaptiveDensity = createAdaptiveDensity(
      { width: rect.width, height: rect.height },
      performance,
    );

    layoutRef.current = {
      size: adaptiveDensity.hexSize,
      origin: { x: rect.width / 2, y: rect.height / 2 },
      pointyTop: false, // Flat-top hexagons
    };

    // Clear color cache on resize
    colorCacheRef.current.clear();
  }, [performance]);

  /**
   * Render texture background
   */
  const renderTexture = useCallback(
    (animationTime: number) => {
      const textureCanvas = textureCanvasRef.current;
      if (!textureCanvas || palette.colors.length === 0) return;

      const rect = textureCanvas.getBoundingClientRect();
      const textureSize = getOptimalTextureSize(
        { width: rect.width, height: rect.height },
        performance,
      );

      // Enhanced color selection for textures
      const textureConfig = {
        ...texturePresets[textureType],
        baseColor: palette.colors[0] || '#1f2937',
        accentColor: palette.colors[1] || '#374151',
        // Pass additional colors for enhanced texture generation
        additionalColors: palette.colors.slice(2) || [],
        palette: palette, // Pass full palette for advanced texture generation
      };

      try {
        const textureData = generateTexture(
          textureSize.width,
          textureSize.height,
          textureConfig,
          animationTime,
        );

        const ctx = textureCanvas.getContext('2d');
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, rect.width, rect.height);

          // Create temporary canvas for texture
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = textureSize.width;
          tempCanvas.height = textureSize.height;
          const tempCtx = tempCanvas.getContext('2d');

          if (tempCtx) {
            tempCtx.putImageData(textureData, 0, 0);

            // Scale and draw texture to main canvas
            ctx.globalAlpha = textureConfig.opacity;
            ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
            ctx.globalAlpha = 1;
          }
        }
      } catch (error) {
        console.warn('Texture rendering failed:', error);
      }
    },
    [palette, textureType, performance],
  );

  /**
   * Render hexagonal grid
   */
  const renderHexGrid = useCallback(
    (animationTime: number) => {
      const canvas = canvasRef.current;
      const layout = layoutRef.current;

      if (!canvas || !layout || palette.colors.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Get visible hexes
      const viewport = {
        x: -layout.size,
        y: -layout.size,
        width: rect.width + layout.size * 2,
        height: rect.height + layout.size * 2,
      };
      const visibleHexes = getVisibleHexes(viewport, layout);

      // Create distribution config
      const distributionConfig: DistributionConfig = {
        palette,
        alphaRange: [0.05, 0.3],
        intensityRange: [0.2, 0.8],
        clustering: 0.3,
        animationSeed: animated ? Math.floor(animationTime * 0.001) : 0,
      };

      // Render each hex
      visibleHexes.forEach((hex) => {
        const hexKey = `${hex.q},${hex.r}`;

        // Get cached color or calculate new one
        let colorDist = colorCacheRef.current.get(hexKey);
        if (!colorDist) {
          colorDist = getHexColor(hex, distributionConfig);
          colorCacheRef.current.set(hexKey, colorDist);
        }

        // Skip transparent hexes for performance
        if (colorDist.alpha < 0.01) return;

        const vertices = getHexVertices(hex, layout);

        // Create hex path
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();

        // Apply color with alpha and intensity
        const alpha = colorDist.alpha * colorDist.intensity;
        ctx.fillStyle = `${colorDist.color}${Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, '0')}`;
        ctx.fill();
      });

      // Limit cache size for memory management
      if (colorCacheRef.current.size > 5000) {
        const entries = Array.from(colorCacheRef.current.entries());
        colorCacheRef.current.clear();
        // Keep most recent 2500 entries
        entries.slice(-2500).forEach(([key, value]) => {
          colorCacheRef.current.set(key, value);
        });
      }
    },
    [palette, animated],
  );

  /**
   * Animation loop
   */
  const animate = useCallback(
    (currentTime: number) => {
      if (!animated) return;

      const deltaTime = currentTime - lastTimeRef.current;

      // Limit to ~30 FPS for performance
      if (deltaTime >= 33) {
        renderTexture(currentTime * 0.001);
        renderHexGrid(currentTime * 0.001);
        lastTimeRef.current = currentTime;
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [animated, renderTexture, renderHexGrid],
  );

  /**
   * Handle resize
   */
  const handleResize = useCallback(() => {
    initializeCanvas();
    renderTexture(0);
    renderHexGrid(0);
  }, [initializeCanvas, renderTexture, renderHexGrid]);

  /**
   * Initialize and start animation
   */
  useEffect(() => {
    initializeCanvas();

    // Initial render
    renderTexture(0);
    renderHexGrid(0);

    if (animated) {
      animationRef.current = requestAnimationFrame(animate);
    }

    // Add resize listener
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [
    initializeCanvas,
    renderTexture,
    renderHexGrid,
    animated,
    animate,
    handleResize,
  ]);

  /**
   * Update when palette or texture changes
   */
  useEffect(() => {
    colorCacheRef.current.clear();
    renderTexture(0);
    renderHexGrid(0);
  }, [palette, textureType, renderTexture, renderHexGrid]);

  return (
    <div className={`${styles.hexBackgroundContainer} ${className}`}>
      {/* Texture layer */}
      <canvas ref={textureCanvasRef} className={styles.hexBackgroundTexture} />

      {/* Hex grid layer */}
      <canvas ref={canvasRef} className={styles.hexBackgroundGrid} />
    </div>
  );
};
