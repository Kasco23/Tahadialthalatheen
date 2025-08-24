/**
 * Procedural texture generation system for background layers
 *
 * Creates various texture patterns that render beneath the hex grid
 * to add visual depth and material feel
 */

export type TextureType = 'carbon' | 'metallic' | 'paper' | 'halftone';

export interface TextureConfig {
  /** Type of texture to generate */
  type: TextureType;
  /** Scale factor for texture pattern */
  scale: number;
  /** Opacity of texture layer */
  opacity: number;
  /** Animation speed (0 = static) */
  animationSpeed: number;
  /** Base color for texture */
  baseColor: string;
  /** Accent color for texture */
  accentColor: string;
  /** Additional colors for enhanced texture generation */
  additionalColors?: string[];
  /** Full color palette for advanced texture effects */
  palette?: {
    colors: string[];
    weights: number[];
  };
}

/**
 * Generate texture as Canvas ImageData
 */
export function generateTexture(
  width: number,
  height: number,
  config: TextureConfig,
  animationTime = 0,
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context for texture generation');
  }

  switch (config.type) {
    case 'carbon':
      return generateCarbonFiber(ctx, width, height, config, animationTime);
    case 'metallic':
      return generateMetallic(ctx, width, height, config, animationTime);
    case 'paper':
      return generatePaperFiber(ctx, width, height, config, animationTime);
    case 'halftone':
      return generateHalftoneDots(ctx, width, height, config, animationTime);
    default:
      return generateCarbonFiber(ctx, width, height, config, animationTime);
  }
}

/**
 * Generate enhanced carbon fiber texture pattern
 * Based on real carbon fiber weave with diagonal fiber bundles
 * Enhanced to use team color palettes for consistent theming
 */
function generateCarbonFiber(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: TextureConfig,
  animationTime: number,
): ImageData {
  const {
    scale,
    baseColor,
    accentColor,
    animationSpeed,
    additionalColors = [],
  } = config;
  const bundleWidth = 12 * scale; // Wider fiber bundles
  const bundleSpacing = 24 * scale; // Space between bundles
  const fiberWidth = 1.5 * scale; // Individual fiber thickness
  const offset = animationTime * animationSpeed * 5; // Slower animation

  // Parse colors
  const base = hexToRgb(baseColor);
  const accent = hexToRgb(accentColor);

  // Parse additional colors for enhanced theming
  const additionalRgb = additionalColors.map(hexToRgb);

  // Create darker base for carbon fiber
  const carbonBase = {
    r: Math.max(0, base.r - 40),
    g: Math.max(0, base.g - 40),
    b: Math.max(0, base.b - 40),
  };

  // Clear canvas with darker base
  ctx.fillStyle = `rgb(${carbonBase.r}, ${carbonBase.g}, ${carbonBase.b})`;
  ctx.fillRect(0, 0, width, height);

  // Save context for restoration
  ctx.save();

  // Generate the weave pattern using pixel manipulation for better control
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      // Calculate fiber bundle positions
      const bundleX = Math.floor((x + offset) / bundleSpacing);
      const bundleY = Math.floor((y + offset * 0.7) / bundleSpacing);

      // Create checkerboard weave pattern
      const isOverWeave = (bundleX + bundleY) % 2 === 0;

      // Calculate position within bundle
      const localX = (x + offset) % bundleSpacing;
      const localY = (y + offset * 0.7) % bundleSpacing;

      // Base color
      let r = carbonBase.r;
      let g = carbonBase.g;
      let b = carbonBase.b;

      // Add fiber structure
      if (localX < bundleWidth && localY < bundleWidth) {
        // We're in a fiber bundle
        let fiberIntensity = 0;
        let colorIndex = 0; // Which color to use for this fiber bundle

        if (isOverWeave) {
          // Horizontal fibers (lighter when on top)
          const fiberY = localY % (bundleWidth / 4);
          if (fiberY < fiberWidth) {
            fiberIntensity = 0.6 - (fiberY / fiberWidth) * 0.3;

            // Add individual fiber texture
            const individualFiber = Math.sin(x * 0.5) * 0.1;
            fiberIntensity += individualFiber;

            // Add metallic highlights using team colors
            const highlight = Math.sin((x + y * 0.3 + offset * 2) * 0.1) * 0.2;
            fiberIntensity += Math.max(0, highlight);

            // Use different team colors for variation
            colorIndex = bundleX % (additionalRgb.length + 2); // Include base and accent
          }
        } else {
          // Vertical fibers (darker when underneath)
          const fiberX = localX % (bundleWidth / 4);
          if (fiberX < fiberWidth) {
            fiberIntensity = 0.3 - (fiberX / fiberWidth) * 0.1;

            // Add individual fiber texture
            const individualFiber = Math.sin(y * 0.5) * 0.1;
            fiberIntensity += individualFiber;

            // Subtle under-weave reflection
            const underReflection =
              Math.sin((x * 0.2 + y + offset) * 0.15) * 0.1;
            fiberIntensity += Math.max(0, underReflection * 0.5);

            // Use different team colors for variation
            colorIndex = bundleY % (additionalRgb.length + 2);
          }
        }

        // Apply fiber intensity with team color variation
        fiberIntensity = Math.max(0, Math.min(1, fiberIntensity));

        if (fiberIntensity > 0) {
          let targetColor;

          // Select color based on bundle position and available team colors
          if (colorIndex === 0) {
            targetColor = accent;
          } else if (colorIndex === 1) {
            targetColor = base;
          } else {
            // Use additional team colors if available
            const additionalIndex = (colorIndex - 2) % additionalRgb.length;
            targetColor = additionalRgb[additionalIndex] || accent;
          }

          // Blend with selected team color
          r = Math.floor(
            carbonBase.r + (targetColor.r - carbonBase.r) * fiberIntensity,
          );
          g = Math.floor(
            carbonBase.g + (targetColor.g - carbonBase.g) * fiberIntensity,
          );
          b = Math.floor(
            carbonBase.b + (targetColor.b - carbonBase.b) * fiberIntensity,
          );

          // Add team-aware shimmer effect
          const shimmer = Math.sin((x + y + offset * 3) * 0.05) * 0.1;
          if (shimmer > 0 && additionalRgb.length > 0) {
            // Use brightest team color for shimmer
            const shimmerColor = additionalRgb.reduce((brightest, color) => {
              const brightness = color.r + color.g + color.b;
              const brightestValue = brightest.r + brightest.g + brightest.b;
              return brightness > brightestValue ? color : brightest;
            }, targetColor);

            r = Math.min(255, r + shimmer * shimmerColor.r * 0.2);
            g = Math.min(255, g + shimmer * shimmerColor.g * 0.2);
            b = Math.min(255, b + shimmer * shimmerColor.b * 0.2);
          } else if (shimmer > 0) {
            // Fallback shimmer
            r = Math.min(255, r + shimmer * 30);
            g = Math.min(255, g + shimmer * 30);
            b = Math.min(255, b + shimmer * 30);
          }
        }
      }

      // Add subtle noise for texture
      const noise = (Math.random() - 0.5) * 8;
      r = Math.max(0, Math.min(255, r + noise));
      g = Math.max(0, Math.min(255, g + noise));
      b = Math.max(0, Math.min(255, b + noise));

      data[index] = r; // Red
      data[index + 1] = g; // Green
      data[index + 2] = b; // Blue
      data[index + 3] = 255; // Alpha
    }
  }

  // Restore context and return enhanced image data
  ctx.restore();
  return imageData;
}

/**
 * Generate metallic brushed texture
 */
function generateMetallic(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: TextureConfig,
  animationTime: number,
): ImageData {
  const { scale, baseColor, accentColor, animationSpeed } = config;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const brushDirection = Math.PI / 4; // 45-degree brush
  const brushStrength = 0.3;
  const offset = animationTime * animationSpeed * 20;

  // Parse base color
  const base = hexToRgb(baseColor);
  const accent = hexToRgb(accentColor);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      // Calculate brush pattern
      const brushPos =
        (x * Math.cos(brushDirection) + y * Math.sin(brushDirection)) * scale +
        offset;
      const brushNoise =
        (Math.sin(brushPos * 0.1) + Math.sin(brushPos * 0.03)) * 0.5;
      const brushIntensity = Math.abs(brushNoise) * brushStrength;

      // Add random metallic sparkle
      const sparkle = Math.random() * 0.1;

      // Blend colors
      const mixFactor = brushIntensity + sparkle;
      data[index] = Math.floor(base.r + (accent.r - base.r) * mixFactor); // R
      data[index + 1] = Math.floor(base.g + (accent.g - base.g) * mixFactor); // G
      data[index + 2] = Math.floor(base.b + (accent.b - base.b) * mixFactor); // B
      data[index + 3] = 255; // A
    }
  }

  return imageData;
}

/**
 * Generate paper fiber texture
 */
function generatePaperFiber(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: TextureConfig,
  animationTime: number,
): ImageData {
  const { scale, baseColor, animationSpeed } = config;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const base = hexToRgb(baseColor);
  const fiberDensity = 0.02 * scale;
  const offset = animationTime * animationSpeed * 5;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      // Create fiber-like noise
      const noise1 =
        Math.sin((x + offset) * fiberDensity) *
        Math.cos(y * fiberDensity * 0.7);
      const noise2 =
        Math.sin(x * fiberDensity * 1.3) *
        Math.cos((y + offset * 0.7) * fiberDensity);
      const fiberNoise = (noise1 + noise2) * 0.1;

      // Add random paper grain
      const grain = (Math.random() - 0.5) * 0.05;

      const variation = fiberNoise + grain;

      data[index] = Math.max(0, Math.min(255, base.r + variation * 50)); // R
      data[index + 1] = Math.max(0, Math.min(255, base.g + variation * 50)); // G
      data[index + 2] = Math.max(0, Math.min(255, base.b + variation * 50)); // B
      data[index + 3] = 255; // A
    }
  }

  return imageData;
}

/**
 * Generate halftone dot pattern
 */
function generateHalftoneDots(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: TextureConfig,
  animationTime: number,
): ImageData {
  const { scale, baseColor, accentColor, animationSpeed } = config;
  const dotSpacing = 12 * scale;
  const maxDotRadius = dotSpacing * 0.4;
  const offset = animationTime * animationSpeed * 30;

  // Clear canvas
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = accentColor;

  for (let y = 0; y < height + dotSpacing; y += dotSpacing) {
    for (let x = 0; x < width + dotSpacing; x += dotSpacing) {
      // Offset alternate rows for better pattern
      const xPos = x + (Math.floor(y / dotSpacing) % 2) * dotSpacing * 0.5;
      const yPos = y;

      // Calculate dot size based on distance and animation
      const centerX = width / 2;
      const centerY = height / 2;
      const distance = Math.sqrt((xPos - centerX) ** 2 + (yPos - centerY) ** 2);
      const normalizedDistance =
        distance / Math.sqrt(centerX ** 2 + centerY ** 2);

      // Animate dot size
      const pulseEffect = Math.sin(offset + distance * 0.01) * 0.3 + 0.7;
      const dotRadius =
        maxDotRadius * (1 - normalizedDistance * 0.5) * pulseEffect;

      if (dotRadius > 0) {
        ctx.beginPath();
        ctx.arc(xPos, yPos, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return ctx.getImageData(0, 0, width, height);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Create texture configuration presets
 */
export const texturePresets: Record<
  TextureType,
  Omit<TextureConfig, 'baseColor' | 'accentColor'>
> = {
  carbon: {
    type: 'carbon',
    scale: 1.2, // Slightly larger scale for better detail visibility
    opacity: 0.25, // Higher opacity to show enhanced details
    animationSpeed: 0.05, // Slower animation for more subtle effect
  },
  metallic: {
    type: 'metallic',
    scale: 1.0,
    opacity: 0.2,
    animationSpeed: 0.05,
  },
  paper: {
    type: 'paper',
    scale: 1.0,
    opacity: 0.1,
    animationSpeed: 0.02,
  },
  halftone: {
    type: 'halftone',
    scale: 1.0,
    opacity: 0.25,
    animationSpeed: 0.3,
  },
};

/**
 * Optimize texture size based on viewport and performance
 */
export function getOptimalTextureSize(
  viewport: { width: number; height: number },
  performance: 'low' | 'medium' | 'high' = 'medium',
): { width: number; height: number } {
  const maxSizes = {
    low: 512,
    medium: 1024,
    high: 2048,
  };

  const maxSize = maxSizes[performance];
  const aspectRatio = viewport.width / viewport.height;

  if (viewport.width <= maxSize && viewport.height <= maxSize) {
    return viewport;
  }

  if (aspectRatio > 1) {
    // Landscape
    return {
      width: maxSize,
      height: Math.round(maxSize / aspectRatio),
    };
  } else {
    // Portrait or square
    return {
      width: Math.round(maxSize * aspectRatio),
      height: maxSize,
    };
  }
}
