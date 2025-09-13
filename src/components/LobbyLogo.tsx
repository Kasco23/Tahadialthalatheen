import React from "react";

interface LobbyLogoProps {
  logoUrl: string;
  teamName: string;
  className?: string;
}

export const LobbyLogo: React.FC<LobbyLogoProps> = ({
  logoUrl,
  teamName,
  className = "",
}) => {
  return (
    <div
      className={`relative w-8 h-8 flex-shrink-0 ${className}`}
      title={teamName}
    >
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        className="w-full h-full object-contain rounded"
        style={{
          // Optimize rendering for crisp logos
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          // Ensure SVGs render properly
          WebkitBackfaceVisibility: 'hidden',
          WebkitTransform: 'translateZ(0)',
        }}
        onError={(e) => {
          // Hide broken images gracefully
          e.currentTarget.style.display = "none";
        }}
      />
      {/* Subtle border for better definition */}
      <div className="absolute inset-0 rounded border border-white/10 pointer-events-none" />
    </div>
  );
};