import React from "react";

/**
 * StadiumBackground Component
 * 
 * A reusable background component that creates an immersive football stadium atmosphere
 * with animated gradients, lighting effects, and subtle animations.
 * 
 * Features:
 * - Animated gradient background simulating stadium lights
 * - Subtle pitch-like grid overlay
 * - Pulsing light effects
 * - Optimized for performance with CSS animations
 */

interface StadiumBackgroundProps {
  /** Color theme variant */
  variant?: "default" | "dark" | "bright";
  /** Whether to show animated effects */
  animated?: boolean;
  /** Children components to render on top */
  children?: React.ReactNode;
  /** Additional className for customization */
  className?: string;
}

export const StadiumBackground: React.FC<StadiumBackgroundProps> = ({
  variant = "default",
  animated = true,
  children,
  className = "",
}) => {
  // Define color schemes for different variants
  const variantStyles = {
    default: {
      background: `
        radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.12) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(5, 150, 105, 0.08) 0%, transparent 60%),
        linear-gradient(135deg, 
          #0a1f0f 0%,
          #0d2818 15%,
          #1a3d2e 35%,
          #0f2419 60%,
          #0a1a12 80%,
          #000000 100%
        )
      `,
      accentColor: "rgba(34, 197, 94, 0.6)",
    },
    dark: {
      background: `
        radial-gradient(circle at 20% 30%, rgba(5, 150, 105, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(4, 120, 87, 0.08) 0%, transparent 50%),
        linear-gradient(135deg, 
          #000000 0%,
          #0a1a12 25%,
          #0f2419 50%,
          #0a1a12 75%,
          #000000 100%
        )
      `,
      accentColor: "rgba(5, 150, 105, 0.5)",
    },
    bright: {
      background: `
        radial-gradient(circle at 20% 30%, rgba(52, 211, 153, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 60%),
        linear-gradient(135deg, 
          #0f2419 0%,
          #1a3d2e 20%,
          #15482e 40%,
          #1a3d2e 60%,
          #0f2419 80%,
          #0a1f0f 100%
        )
      `,
      accentColor: "rgba(52, 211, 153, 0.7)",
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${className}`}
      style={{
        background: currentVariant.background,
      }}
    >
      {/* Stadium Floodlights Effect - Top Corners */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-0 left-0 w-96 h-96 ${animated ? "animate-pulse" : ""}`}
          style={{
            background: `radial-gradient(circle, ${currentVariant.accentColor} 0%, transparent 70%)`,
            opacity: 0.4,
            animationDuration: "4s",
          }}
        />
        <div
          className={`absolute top-0 right-0 w-96 h-96 ${animated ? "animate-pulse" : ""}`}
          style={{
            background: `radial-gradient(circle, ${currentVariant.accentColor} 0%, transparent 70%)`,
            opacity: 0.3,
            animationDuration: "5s",
            animationDelay: "1s",
          }}
        />
      </div>

      {/* Pitch Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, 
              rgba(255, 255, 255, 0.5) 0px, 
              rgba(255, 255, 255, 0.5) 1px, 
              transparent 1px, 
              transparent 60px
            ),
            repeating-linear-gradient(90deg, 
              rgba(255, 255, 255, 0.5) 0px, 
              rgba(255, 255, 255, 0.5) 1px, 
              transparent 1px, 
              transparent 60px
            )
          `,
        }}
      />

      {/* Animated Gradient Overlay */}
      {animated && (
        <>
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `
                linear-gradient(45deg, 
                  transparent 0%,
                  rgba(34, 197, 94, 0.1) 50%,
                  transparent 100%
                )
              `,
              animation: "shimmer 8s ease-in-out infinite",
            }}
          />
          <style>
            {`
              @keyframes shimmer {
                0%, 100% {
                  transform: translateX(-100%) translateY(-100%) rotate(45deg);
                  opacity: 0;
                }
                50% {
                  transform: translateX(100%) translateY(100%) rotate(45deg);
                  opacity: 0.2;
                }
              }
            `}
          </style>
        </>
      )}

      {/* Stadium Atmosphere - Bottom Glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: `linear-gradient(to top, 
            rgba(0, 0, 0, 0.7) 0%, 
            rgba(5, 150, 105, 0.1) 20%,
            transparent 100%
          )`,
        }}
      />

      {/* Top Ambient Light */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, 
            rgba(0, 0, 0, 0.5) 0%, 
            rgba(16, 185, 129, 0.05) 30%,
            transparent 100%
          )`,
        }}
      />

      {/* Spotlight Effects - Moving Beams */}
      {animated && (
        <>
          <div
            className="absolute top-0 left-1/4 w-2 h-full opacity-10"
            style={{
              background: `linear-gradient(to bottom, 
                ${currentVariant.accentColor} 0%, 
                transparent 40%
              )`,
              animation: "beam1 10s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-0 right-1/3 w-2 h-full opacity-10"
            style={{
              background: `linear-gradient(to bottom, 
                ${currentVariant.accentColor} 0%, 
                transparent 40%
              )`,
              animation: "beam2 12s ease-in-out infinite",
            }}
          />
          <style>
            {`
              @keyframes beam1 {
                0%, 100% { opacity: 0.05; transform: translateX(0); }
                50% { opacity: 0.15; transform: translateX(20px); }
              }
              @keyframes beam2 {
                0%, 100% { opacity: 0.08; transform: translateX(0); }
                50% { opacity: 0.12; transform: translateX(-20px); }
              }
            `}
          </style>
        </>
      )}

      {/* Content Container */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default StadiumBackground;
