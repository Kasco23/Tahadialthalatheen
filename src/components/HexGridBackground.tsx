/**
 * SVG-based hexagonal grid background component
 * 
 * Renders a repeating hexagon pattern with team color palettes and optional glow effects.
 * Simpler alternative to the complex Canvas-based HexBackground system.
 */

import React from 'react';

export interface HexGridBackgroundProps {
  /** Array of 2-7 colors for team palette. If only 1 color, uses as stroke. */
  colors: string[];
  /** Background color */
  backgroundColor?: string;
  /** Stroke width for hexagons */
  strokeWidth?: number;
  /** Size of hexagon pattern */
  patternSize?: number;
  /** Enable glow animation */
  glow?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generate SVG hexagon path with given size
 */
function generateHexagonPath(size: number): string {
  const points: [number, number][] = [];
  const centerX = size;
  const centerY = size;
  
  // Generate 6 vertices of hexagon (pointy-top orientation)
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    const x = centerX + (size * 0.5) * Math.cos(angleRad);
    const y = centerY + (size * 0.5) * Math.sin(angleRad);
    points.push([x, y]);
  }
  
  return `M ${points.map(([x, y]) => `${x},${y}`).join(' L ')} Z`;
}

/**
 * Create linear gradient for multiple colors
 */
function createGradient(colors: string[], id: string): React.ReactElement {
  if (colors.length < 2) {
    return <React.Fragment></React.Fragment>;
  }
  
  const stops = colors.map((color, index) => {
    const offset = (index / (colors.length - 1)) * 100;
    return (
      <stop
        key={index}
        offset={`${offset}%`}
        stopColor={color}
      />
    );
  });
  
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      {stops}
    </linearGradient>
  );
}

/**
 * SVG-based hexagonal grid background component
 */
export const HexGridBackground: React.FC<HexGridBackgroundProps> = ({
  colors,
  backgroundColor = '#0A1E40',
  strokeWidth = 1.5,
  patternSize = 40,
  glow = false,
  className = '',
}) => {
  // Validate colors array
  if (!colors || colors.length === 0) {
    console.warn('HexGridBackground: colors array is empty, using default');
    colors = ['#22c55e'];
  }
  
  if (colors.length > 7) {
    console.warn('HexGridBackground: too many colors, limiting to 7');
    colors = colors.slice(0, 7);
  }
  
  const hexPath = generateHexagonPath(patternSize);
  const patternId = `hex-pattern-${Math.random().toString(36).substr(2, 9)}`;
  const gradientId = `hex-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine stroke and fill based on color count
  let strokeColor: string;
  let fillColor: string | undefined;
  
  if (colors.length === 1) {
    // Single color: use as stroke only
    strokeColor = colors[0];
    fillColor = 'none';
  } else {
    // Multiple colors: create gradient for stroke
    strokeColor = `url(#${gradientId})`;
    fillColor = 'none';
  }
  
  // Animation class for glow effect
  const animationClass = glow 
    ? 'animate-[glow_2s_ease-in-out_infinite_alternate]' 
    : '';
  
  return (
    <div 
      className={`fixed inset-0 z-[-10] pointer-events-none ${className}`}
      style={{ backgroundColor }}
    >
      <svg
        width="100%"
        height="100%"
        className={`w-full h-full ${animationClass}`}
      >
        <defs>
          {/* Create gradient if we have multiple colors */}
          {colors.length > 1 && createGradient(colors, gradientId)}
          
          {/* Define the hexagon pattern */}
          <pattern
            id={patternId}
            x="0"
            y="0"
            width={patternSize * 1.5}
            height={patternSize * Math.sqrt(3)}
            patternUnits="userSpaceOnUse"
          >
            {/* Main hexagon */}
            <path
              d={hexPath}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            
            {/* Offset hexagon to create proper tiling */}
            <path
              d={hexPath}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              transform={`translate(${patternSize * 0.75}, ${patternSize * Math.sqrt(3) * 0.5})`}
            />
          </pattern>
        </defs>
        
        {/* Apply pattern to full viewport */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
        />
      </svg>
    </div>
  );
};

export default HexGridBackground;