import React from "react";

interface StadiumBackgroundProps {
  children: React.ReactNode;
  variant?: "default" | "night" | "sunset" | "dark" | "bright";
  animated?: boolean;
}

/**
 * Professional 3D Stadium Background Component
 * 
 * Creates a modern, layered stadium atmosphere with:
 * - 3D perspective and depth
 * - Animated stadium lights
 * - Crowd silhouettes
 * - Pitch with realistic markings
 * - Glassmorphism effects
 * - Responsive design for mobile and desktop
 */
export const StadiumBackground: React.FC<StadiumBackgroundProps> = ({
  children,
  variant = "default",
}) => {
  // Color schemes for different variants
  const variants = {
    default: {
      sky: "from-blue-900 via-blue-800 to-blue-700",
      pitch: "from-green-600 via-green-700 to-green-800",
      light: "yellow-200",
      accent: "yellow-400",
    },
    night: {
      sky: "from-slate-900 via-slate-800 to-slate-700",
      pitch: "from-green-700 via-green-800 to-green-900",
      light: "blue-200",
      accent: "blue-400",
    },
    sunset: {
      sky: "from-orange-900 via-purple-800 to-blue-900",
      pitch: "from-green-600 via-green-700 to-emerald-800",
      light: "orange-200",
      accent: "orange-400",
    },
    dark: {
      sky: "from-slate-900 via-slate-800 to-slate-700",
      pitch: "from-green-700 via-green-800 to-green-900",
      light: "blue-200",
      accent: "blue-400",
    },
    bright: {
      sky: "from-sky-900 via-sky-800 to-sky-700",
      pitch: "from-green-500 via-green-600 to-green-700",
      light: "yellow-300",
      accent: "yellow-500",
    },
  };

  const colors = variants[variant];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Sky Background with Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${colors.sky}`} />

      {/* Stadium Stands - Top Layer with Perspective */}
      <div className="absolute inset-x-0 top-0 h-48 overflow-hidden">
        {/* Upper Stands */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-transparent"
          style={{
            transform: "perspective(1000px) rotateX(15deg)",
            transformOrigin: "top center",
          }}
        >
          {/* Crowd Silhouettes */}
          <div className="absolute inset-0 opacity-30">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 200"
              preserveAspectRatio="xMidYMid slice"
            >
              {[...Array(60)].map((_, i) => (
                <g key={i} opacity={0.6 + Math.random() * 0.4}>
                  <ellipse
                    cx={i * 20 + 10}
                    cy={180 + Math.random() * 10}
                    rx={4 + Math.random() * 2}
                    ry={15 + Math.random() * 5}
                    fill="#1a1a1a"
                  />
                  <circle
                    cx={i * 20 + 10}
                    cy={165 + Math.random() * 5}
                    r={4 + Math.random() * 2}
                    fill="#1a1a1a"
                  />
                </g>
              ))}
            </svg>
          </div>

          {/* Stadium Lights - Professional Towers */}
          <div className="absolute top-4 left-[10%] w-2 h-16 bg-gray-700">
            <div
              className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-${colors.light} rounded-full blur-xl animate-pulse`}
              style={{ animationDuration: "3s" }}
            />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full" />
          </div>
          <div className="absolute top-4 right-[10%] w-2 h-16 bg-gray-700">
            <div
              className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-${colors.light} rounded-full blur-xl animate-pulse`}
              style={{ animationDuration: "3s", animationDelay: "1s" }}
            />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full" />
          </div>
          <div className="absolute top-4 left-[30%] w-2 h-16 bg-gray-700">
            <div
              className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-${colors.light} rounded-full blur-xl animate-pulse`}
              style={{ animationDuration: "3s", animationDelay: "0.5s" }}
            />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full" />
          </div>
          <div className="absolute top-4 right-[30%] w-2 h-16 bg-gray-700">
            <div
              className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-${colors.light} rounded-full blur-xl animate-pulse`}
              style={{ animationDuration: "3s", animationDelay: "1.5s" }}
            />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Pitch Area */}
      <div className="absolute inset-0 top-48">
        {/* Pitch Background with Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${colors.pitch}`} />

        {/* Horizontal Grass Stripes - Subtle */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 40px, transparent 40px, transparent 80px)",
          }}
        />

        {/* Pitch Markings - Clean and Minimal */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Center Line */}
          <line
            x1="50%"
            y1="0%"
            x2="50%"
            y2="100%"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Center Circle */}
          <circle
            cx="50%"
            cy="50%"
            r="80"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Center Spot */}
          <circle cx="50%" cy="50%" r="4" fill="white" opacity="0.5" />

          {/* Left Penalty Area */}
          <rect
            x="5%"
            y="calc(50% - 120px)"
            width="120"
            height="240"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Left Goal Area */}
          <rect
            x="5%"
            y="calc(50% - 60px)"
            width="60"
            height="120"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Right Penalty Area */}
          <rect
            x="calc(95% - 120px)"
            y="calc(50% - 120px)"
            width="120"
            height="240"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Right Goal Area */}
          <rect
            x="calc(95% - 60px)"
            y="calc(50% - 60px)"
            width="60"
            height="120"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Corner Arcs */}
          <circle
            cx="5%"
            cy="5%"
            r="15"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
            strokeDasharray="23.56 70.68"
            transform="rotate(-90 60 60)"
          />
          <circle
            cx="95%"
            cy="5%"
            r="15"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
            strokeDasharray="23.56 70.68"
            transform="rotate(0 1140 60)"
          />
          <circle
            cx="5%"
            cy="95%"
            r="15"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
            strokeDasharray="23.56 70.68"
            transform="rotate(180 60 900)"
          />
          <circle
            cx="95%"
            cy="95%"
            r="15"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.5"
            strokeDasharray="23.56 70.68"
            transform="rotate(90 1140 900)"
          />
        </svg>

        {/* Ambient Lighting Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top lighting */}
          <div
            className={`absolute top-0 left-1/4 w-64 h-64 bg-${colors.light} rounded-full opacity-10 blur-3xl`}
          />
          <div
            className={`absolute top-0 right-1/4 w-64 h-64 bg-${colors.light} rounded-full opacity-10 blur-3xl`}
          />
          {/* Center spotlight */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-${colors.light} rounded-full opacity-5 blur-3xl animate-pulse`}
            style={{ animationDuration: "4s" }}
          />
        </div>
      </div>

      {/* Content Container with Glassmorphism */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>

      {/* Bottom Shadow for Depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
    </div>
  );
};

export default StadiumBackground;
