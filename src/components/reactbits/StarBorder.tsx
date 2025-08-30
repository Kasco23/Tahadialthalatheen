/**
 * StarBorder Component
 * Animated star border effect inspired by ReactBits
 * Features team color integration and smooth animations
 */

import React from "react";

type StarBorderProps<T extends React.ElementType> =
  React.ComponentPropsWithoutRef<T> & {
    as?: T;
    className?: string;
    children?: React.ReactNode;
    teamColors?: string[];
    speed?: React.CSSProperties['animationDuration'];
    thickness?: number;
  }

const StarBorder = <T extends React.ElementType = "button">({
  as,
  className = "",
  teamColors = ['#FEBE10', '#FFFFFF', '#1E3A8A'], // Default Real Madrid colors
  speed = "6s",
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || "button";
  
  // Use primary team color for the star effect
  const primaryColor = teamColors[0] || '#FEBE10';
  const secondaryColor = teamColors[1] || '#FFFFFF';
  const accentColor = teamColors[2] || '#1E3A8A';

  return (
    <Component 
      className={`relative inline-block overflow-hidden rounded-[20px] group transition-all duration-300 hover:scale-105 ${className}`} 
      {...(rest as any)}
      style={{
        padding: `${thickness}px`,
        ...(rest as any).style,
      }}
    >
      {/* Top star movement */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0 group-hover:opacity-90 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${primaryColor}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      
      {/* Bottom star movement */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0 group-hover:opacity-90 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${primaryColor}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      
      {/* Secondary accent stars */}
      <div
        className="absolute w-[200%] h-[30%] opacity-40 top-[20%] left-[-150%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${accentColor}, transparent 15%)`,
          animationDuration: `calc(${speed} * 1.5)`,
          animationDelay: '1s',
        }}
      />
      
      <div
        className="absolute w-[200%] h-[30%] opacity-40 bottom-[20%] right-[-150%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${accentColor}, transparent 15%)`,
          animationDuration: `calc(${speed} * 1.5)`,
          animationDelay: '1s',
        }}
      />

      {/* Main content container */}
      <div 
        className="relative z-10 rounded-[20px] transition-all duration-300 group-hover:shadow-lg"
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.9) 100%)`,
          border: `1px solid ${primaryColor}40`,
          boxShadow: `0 4px 20px ${primaryColor}20`,
        }}
      >
        <div 
          className="text-center text-[16px] py-[16px] px-[26px] rounded-[20px] font-medium transition-all duration-300 group-hover:text-shadow-lg"
          style={{ 
            color: secondaryColor,
            textShadow: `0 0 10px ${primaryColor}60`
          }}
        >
          {children}
        </div>
        
        {/* Inner glow effect */}
        <div 
          className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${primaryColor}, transparent 70%)`
          }}
        />
      </div>
      
      {/* Corner accents */}
      <div 
        className="absolute top-2 left-2 w-3 h-3 rounded-full opacity-60 animate-pulse"
        style={{ backgroundColor: accentColor }}
      />
      <div 
        className="absolute top-2 right-2 w-3 h-3 rounded-full opacity-60 animate-pulse"
        style={{ 
          backgroundColor: accentColor,
          animationDelay: '0.5s'
        }}
      />
      <div 
        className="absolute bottom-2 left-2 w-3 h-3 rounded-full opacity-60 animate-pulse"
        style={{ 
          backgroundColor: accentColor,
          animationDelay: '1s'
        }}
      />
      <div 
        className="absolute bottom-2 right-2 w-3 h-3 rounded-full opacity-60 animate-pulse"
        style={{ 
          backgroundColor: accentColor,
          animationDelay: '1.5s'
        }}
      />
    </Component>
  );
};

export default StarBorder;