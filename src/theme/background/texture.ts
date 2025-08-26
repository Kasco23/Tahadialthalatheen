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
 * Enhanced with 3D depth, realistic lighting, and team color integration
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
  const bundleWidth = 16 * scale; // Wider fiber bundles for better visibility
  const bundleSpacing = 32 * scale; // More space between bundles
  const fiberWidth = 2 * scale; // Thicker individual fibers
  const offset = animationTime * animationSpeed * 3; // Smoother animation

  // Parse colors
  const base = hexToRgb(baseColor);
  const accent = hexToRgb(accentColor);

  // Parse additional colors for enhanced theming
  const additionalRgb = additionalColors.map(hexToRgb);

  // Create much darker base for realistic carbon fiber
  const carbonBase = {
    r: Math.max(8, Math.floor(base.r * 0.15)), // Much darker base
    g: Math.max(8, Math.floor(base.g * 0.15)),
    b: Math.max(8, Math.floor(base.b * 0.15)),
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

      // Calculate fiber bundle positions with diagonal offset for realism
      const bundleX = Math.floor((x + offset) / bundleSpacing);
      const bundleY = Math.floor((y + offset * 0.8) / bundleSpacing);

      // Create checkerboard weave pattern
      const isOverWeave = (bundleX + bundleY) % 2 === 0;

      // Calculate position within bundle
      const localX = (x + offset) % bundleSpacing;
      const localY = (y + offset * 0.8) % bundleSpacing;

      // Base color
      let r = carbonBase.r;
      let g = carbonBase.g;
      let b = carbonBase.b;

      // Add enhanced fiber structure with 3D depth
      if (localX < bundleWidth && localY < bundleWidth) {
        // We're in a fiber bundle
        let fiberIntensity = 0;
        let depthFactor = 0;
        let colorIndex = 0; // Which color to use for this fiber bundle

        if (isOverWeave) {
          // Horizontal fibers (lighter when on top) - enhanced 3D effect
          const fiberY = localY % (bundleWidth / 6); // More fibers per bundle
          if (fiberY < fiberWidth) {
            // Base intensity with stronger contrast
            fiberIntensity = 0.8 - (fiberY / fiberWidth) * 0.4;
            
            // 3D depth effect - fibers appear rounded
            const depthCurve = Math.sin((fiberY / fiberWidth) * Math.PI);
            depthFactor = depthCurve * 0.3;
            fiberIntensity += depthFactor;

            // Add detailed individual fiber texture
            const individualFiber = Math.sin(x * 0.8) * 0.15;
            fiberIntensity += individualFiber;

            // Enhanced metallic highlights using team colors
            const highlight = Math.sin((x + y * 0.4 + offset * 2) * 0.12) * 0.4;
            const specular = Math.pow(Math.max(0, highlight), 2) * 0.6; // Sharper specular highlights
            fiberIntensity += specular;

            // Use different team colors for variation
            colorIndex = bundleX % (additionalRgb.length + 2);
          }
        } else {
          // Vertical fibers (darker when underneath) - enhanced shadow effect
          const fiberX = localX % (bundleWidth / 6);
          if (fiberX < fiberWidth) {
            // Base intensity with stronger shadow
            fiberIntensity = 0.4 - (fiberX / fiberWidth) * 0.2;
            
            // 3D shadow effect
            const shadowCurve = Math.sin((fiberX / fiberWidth) * Math.PI);
            depthFactor = -shadowCurve * 0.2; // Negative for shadow
            fiberIntensity += depthFactor;

            // Add individual fiber texture
            const individualFiber = Math.sin(y * 0.8) * 0.1;
            fiberIntensity += individualFiber;

            // Subtle under-weave reflection with team color tint
            const underReflection = Math.sin((x * 0.3 + y + offset) * 0.18) * 0.15;
            fiberIntensity += Math.max(0, underReflection * 0.7);

            // Use different team colors for variation
            colorIndex = bundleY % (additionalRgb.length + 2);
          }
        }

        // Apply fiber intensity with enhanced team color variation
        fiberIntensity = Math.max(0, Math.min(1.2, fiberIntensity)); // Allow slight overbrightness

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

          // Enhanced color blending with stronger team color presence
          const blendStrength = Math.min(1, fiberIntensity * 1.2);
          r = Math.floor(
            carbonBase.r + (targetColor.r - carbonBase.r) * blendStrength,
          );
          g = Math.floor(
            carbonBase.g + (targetColor.g - carbonBase.g) * blendStrength,
          );
          b = Math.floor(
            carbonBase.b + (targetColor.b - carbonBase.b) * blendStrength,
          );

          // Enhanced team-aware shimmer effect with better brightness
          const shimmer = Math.sin((x + y + offset * 4) * 0.06) * 0.25;
          if (shimmer > 0.1 && additionalRgb.length > 0) {
            // Use brightest team color for shimmer with better selection
            const shimmerColor = additionalRgb.reduce((brightest, color) => {
              const brightness = color.r * 0.299 + color.g * 0.587 + color.b * 0.114; // Proper luminance
              const brightestValue = brightest.r * 0.299 + brightest.g * 0.587 + brightest.b * 0.114;
              return brightness > brightestValue ? color : brightest;
            }, targetColor);

            const shimmerStrength = (shimmer - 0.1) * 0.4;
            r = Math.min(255, r + shimmerStrength * shimmerColor.r * 0.4);
            g = Math.min(255, g + shimmerStrength * shimmerColor.g * 0.4);
            b = Math.min(255, b + shimmerStrength * shimmerColor.b * 0.4);
          } else if (shimmer > 0.1) {
            // Enhanced fallback shimmer
            const shimmerStrength = (shimmer - 0.1) * 0.3;
            r = Math.min(255, r + shimmerStrength * 60);
            g = Math.min(255, g + shimmerStrength * 60);
            b = Math.min(255, b + shimmerStrength * 60);
          }
        }
      }

      // Add fine-grain noise for realistic texture with reduced intensity
      const noise = (Math.random() - 0.5) * 6;
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
    scale: 1.5, // Larger scale for better visibility of enhanced details
    opacity: 0.35, // Higher opacity to show enhanced 3D effects
    animationSpeed: 0.03, // Slower animation for more premium feel
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
