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
 * Generate carbon fiber texture pattern
 */
function generateCarbonFiber(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: TextureConfig,
  animationTime: number,
): ImageData {
  const { scale, baseColor, accentColor, animationSpeed } = config;
  const fiberWidth = 4 * scale;
  const fiberSpacing = 8 * scale;
  const offset = animationTime * animationSpeed * 10;

  // Clear canvas
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Draw fiber patterns in both directions
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = fiberWidth;
  ctx.globalAlpha = 0.3;

  // Horizontal fibers
  for (
    let y = offset % (fiberSpacing * 2);
    y < height + fiberSpacing;
    y += fiberSpacing * 2
  ) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Vertical fibers (offset pattern)
  ctx.globalAlpha = 0.2;
  for (
    let x = (offset * 0.7) % (fiberSpacing * 2);
    x < width + fiberSpacing;
    x += fiberSpacing * 2
  ) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Add subtle diagonal weave
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = fiberWidth * 0.5;
  for (let i = 0; i < width + height; i += fiberSpacing * 3) {
    ctx.beginPath();
    ctx.moveTo(i - offset * 0.3, 0);
    ctx.lineTo(i - offset * 0.3 - height, height);
    ctx.stroke();
  }

  return ctx.getImageData(0, 0, width, height);
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
    scale: 1.0,
    opacity: 0.15,
    animationSpeed: 0.1,
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
