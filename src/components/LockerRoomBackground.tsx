import React from "react";

interface LockerRoomBackgroundProps {
  children: React.ReactNode;
  animated?: boolean;
  variant?: "default" | "dark" | "bright";
}

/**
 * LockerRoomBackground Component
 * 
 * A themed background component that simulates a professional football team's locker room.
 * Inspired by top clubs like Real Madrid, Atletico Madrid, Juventus, and Bayern Munich.
 * 
 * Features:
 * - Rows of lockers on both sides with jersey hangers
 * - Central tactical board for strategy display
 * - Benches for players
 * - Football equipment (boots, balls)
 * - Ambient warm lighting effects
 * - Optional animations for light fixtures
 * 
 * @param children - Content to render on top of the background
 * @param animated - Enable/disable lighting animations (default: true)
 * @param variant - Color scheme: default (warm), dark (minimal), bright (vibrant)
 */
export const LockerRoomBackground: React.FC<LockerRoomBackgroundProps> = ({
  children,
  animated = true,
  variant = "default",
}) => {
  // Color schemes for different variants
  const colorSchemes = {
    default: {
      bg: "linear-gradient(135deg, #2c1810 0%, #1a0f0a 50%, #0a0504 100%)",
      lockerBase: "#3d2817",
      lockerHighlight: "#5a3d2a",
      boardBg: "#1a3d1a",
      lightColor: "rgba(255, 220, 150, 0.4)",
      accentColor: "#d4a574",
    },
    dark: {
      bg: "linear-gradient(135deg, #1a1410 0%, #0f0a08 50%, #050302 100%)",
      lockerBase: "#2a1d12",
      lockerHighlight: "#3d2817",
      boardBg: "#0d2d0d",
      lightColor: "rgba(255, 220, 150, 0.2)",
      accentColor: "#a67c52",
    },
    bright: {
      bg: "linear-gradient(135deg, #4a3020 0%, #2c1810 50%, #1a0f0a 100%)",
      lockerBase: "#5a3d2a",
      lockerHighlight: "#7a5d4a",
      boardBg: "#2a4d2a",
      lightColor: "rgba(255, 220, 150, 0.6)",
      accentColor: "#f4c594",
    },
  };

  const colors = colorSchemes[variant];

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: colors.bg }}
    >
      {/* Overhead Lighting Effects */}
      {animated && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 animate-light-pulse"
            style={{
              background: `radial-gradient(circle, ${colors.lightColor} 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-20 animate-light-pulse-delayed"
            style={{
              background: `radial-gradient(circle, ${colors.lightColor} 0%, transparent 70%)`,
              animationDelay: "1.5s",
            }}
          />
        </div>
      )}

      {/* Left Locker Row */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 lg:w-40">
        <svg
          className="w-full h-full"
          viewBox="0 0 160 1000"
          preserveAspectRatio="none"
        >
          {/* Lockers */}
          {[0, 200, 400, 600, 800].map((y, index) => (
            <g key={`left-locker-${index}`}>
              {/* Locker box */}
              <rect
                x="10"
                y={y}
                width="140"
                height="180"
                fill={colors.lockerBase}
                stroke={colors.lockerHighlight}
                strokeWidth="2"
                rx="4"
              />
              {/* Locker door */}
              <rect
                x="15"
                y={y + 5}
                width="130"
                height="170"
                fill={colors.lockerHighlight}
                stroke={colors.accentColor}
                strokeWidth="1"
                rx="2"
              />
              {/* Door handle */}
              <rect
                x="125"
                y={y + 85}
                width="8"
                height="25"
                fill={colors.accentColor}
                rx="2"
              />
              {/* Ventilation slots */}
              <line
                x1="30"
                x2="130"
                y1={y + 20}
                y2={y + 20}
                stroke={colors.lockerBase}
                strokeWidth="1"
              />
              <line
                x1="30"
                x2="130"
                y1={y + 30}
                y2={y + 30}
                stroke={colors.lockerBase}
                strokeWidth="1"
              />
              <line
                x1="30"
                x2="130"
                y1={y + 40}
                y2={y + 40}
                stroke={colors.lockerBase}
                strokeWidth="1"
              />
              {/* Jersey hanger (alternating) */}
              {index % 2 === 0 && (
                <g>
                  <path
                    d={`M 60 ${y + 5} L 70 ${y + 15} L 90 ${y + 15} L 100 ${y + 5}`}
                    fill={index % 4 === 0 ? "#ff3333" : "#3333ff"}
                    stroke="#222"
                    strokeWidth="1"
                  />
                  <rect
                    x="65"
                    y={y + 15}
                    width="30"
                    height="40"
                    fill={index % 4 === 0 ? "#ff3333" : "#3333ff"}
                    stroke="#222"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Right Locker Row */}
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 lg:w-40">
        <svg
          className="w-full h-full"
          viewBox="0 0 160 1000"
          preserveAspectRatio="none"
        >
          {/* Lockers */}
          {[0, 200, 400, 600, 800].map((y, index) => (
            <g key={`right-locker-${index}`}>
              {/* Locker box */}
              <rect
                x="10"
                y={y}
                width="140"
                height="180"
                fill={colors.lockerBase}
                stroke={colors.lockerHighlight}
                strokeWidth="2"
                rx="4"
              />
              {/* Locker door */}
              <rect
                x="15"
                y={y + 5}
                width="130"
                height="170"
                fill={colors.lockerHighlight}
                stroke={colors.accentColor}
                strokeWidth="1"
                rx="2"
              />
              {/* Door handle */}
              <rect
                x="27"
                y={y + 85}
                width="8"
                height="25"
                fill={colors.accentColor}
                rx="2"
              />
              {/* Ventilation slots */}
              <line
                x1="30"
                x2="130"
                y1={y + 20}
                y2={y + 20}
                stroke={colors.lockerBase}
                strokeWidth="1"
              />
              <line
                x1="30"
                x2="130"
                y1={y + 30}
                y2={y + 30}
                stroke={colors.lockerBase}
                strokeWidth="1"
              />
              <line
                x1="30"
                x2="130"
                y1={y + 40}
                y2={y + 40}
                stroke={colors.lockerBase}
                strokeWidth="1"
              />
              {/* Jersey hanger (alternating) */}
              {index % 2 === 1 && (
                <g>
                  <path
                    d={`M 60 ${y + 5} L 70 ${y + 15} L 90 ${y + 15} L 100 ${y + 5}`}
                    fill={index % 4 === 1 ? "#ff3333" : "#3333ff"}
                    stroke="#222"
                    strokeWidth="1"
                  />
                  <rect
                    x="65"
                    y={y + 15}
                    width="30"
                    height="40"
                    fill={index % 4 === 1 ? "#ff3333" : "#3333ff"}
                    stroke="#222"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Central Tactical Board */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-64 md:w-80 lg:w-96 h-48 md:h-56 lg:h-64 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 400 300">
          {/* Board background */}
          <rect
            x="10"
            y="10"
            width="380"
            height="280"
            fill={colors.boardBg}
            stroke={colors.accentColor}
            strokeWidth="4"
            rx="8"
          />
          {/* Board frame */}
          <rect
            x="20"
            y="20"
            width="360"
            height="260"
            fill="none"
            stroke={colors.accentColor}
            strokeWidth="2"
            rx="4"
          />
          {/* Football pitch lines */}
          <line
            x1="200"
            y1="40"
            x2="200"
            y2="260"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <circle
            cx="200"
            cy="150"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          {/* Tactical markers (X's and O's) */}
          <g opacity="0.5">
            <circle cx="150" cy="100" r="8" fill="#ff3333" />
            <circle cx="250" cy="100" r="8" fill="#ff3333" />
            <circle cx="150" cy="200" r="8" fill="#ff3333" />
            <circle cx="250" cy="200" r="8" fill="#ff3333" />
            <path
              d="M 190 145 L 210 155 M 210 145 L 190 155"
              stroke="#3333ff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {/* Bottom Benches */}
      <div className="absolute bottom-0 left-0 right-0 h-32 md:h-40">
        <svg className="w-full h-full" viewBox="0 0 1200 160" preserveAspectRatio="none">
          {/* Bench supports and seats */}
          {[100, 400, 700, 1000].map((x, index) => (
            <g key={`bench-${index}`}>
              {/* Bench seat */}
              <rect
                x={x}
                y="60"
                width="180"
                height="20"
                fill="#6b4423"
                stroke="#4a2f1a"
                strokeWidth="2"
                rx="4"
              />
              {/* Wood grain effect */}
              <line
                x1={x + 20}
                y1="65"
                x2={x + 160}
                y2="65"
                stroke="#8b5a3c"
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1={x + 30}
                y1="75"
                x2={x + 150}
                y2="75"
                stroke="#8b5a3c"
                strokeWidth="1"
                opacity="0.5"
              />
              {/* Bench legs */}
              <rect
                x={x + 20}
                y="80"
                width="12"
                height="60"
                fill="#4a2f1a"
                rx="2"
              />
              <rect
                x={x + 148}
                y="80"
                width="12"
                height="60"
                fill="#4a2f1a"
                rx="2"
              />
              {/* Football equipment on alternating benches */}
              {index % 2 === 0 && (
                <g>
                  {/* Football boots */}
                  <ellipse
                    cx={x + 50}
                    cy="55"
                    rx="12"
                    ry="8"
                    fill="#222"
                    opacity="0.8"
                  />
                  <ellipse
                    cx={x + 70}
                    cy="55"
                    rx="12"
                    ry="8"
                    fill="#222"
                    opacity="0.8"
                  />
                  {/* Football */}
                  <circle
                    cx={x + 130}
                    cy="50"
                    r="10"
                    fill="#fff"
                    stroke="#222"
                    strokeWidth="1"
                  />
                  <path
                    d={`M ${x + 125} 45 Q ${x + 130} 48 ${x + 135} 45`}
                    fill="none"
                    stroke="#222"
                    strokeWidth="1"
                  />
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top warm glow */}
        <div
          className="absolute top-0 left-0 right-0 h-64 opacity-20"
          style={{
            background: `linear-gradient(180deg, ${colors.lightColor} 0%, transparent 100%)`,
          }}
        />
        {/* Side glows for depth */}
        <div
          className="absolute left-0 top-0 bottom-0 w-48 opacity-10"
          style={{
            background: `linear-gradient(90deg, ${colors.lightColor} 0%, transparent 100%)`,
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-48 opacity-10"
          style={{
            background: `linear-gradient(270deg, ${colors.lightColor} 0%, transparent 100%)`,
          }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">{children}</div>

      {/* CSS Animations */}
      <style>{`
        @keyframes light-pulse {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.25;
            transform: scale(1.1);
          }
        }

        .animate-light-pulse {
          animation: light-pulse 4s ease-in-out infinite;
        }

        .animate-light-pulse-delayed {
          animation: light-pulse 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
