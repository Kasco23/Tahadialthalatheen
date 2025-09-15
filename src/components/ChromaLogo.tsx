import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface ChromaLogoProps {
  logoUrl: string;
  teamName: string;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ChromaLogo: React.FC<ChromaLogoProps> = ({
  logoUrl,
  teamName,
  isSelected = false,
  onClick,
  className = "",
  size = "md",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);

  // Size configurations
  const sizes = {
    sm: { container: "w-16 h-16 min-w-16 min-h-16", radius: 60 },
    md: { container: "w-20 h-20 min-w-20 min-h-20", radius: 80 },
    lg: { container: "w-24 h-24 min-w-24 min-h-24", radius: 100 },
  };

  const { container, radius } = sizes[size];

  useEffect(() => {
    const card = cardRef.current;
    const spotlight = spotlightRef.current;
    const fade = fadeRef.current;

    if (!card || !spotlight || !fade) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered.current) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update CSS custom properties for the spotlight effect
      gsap.set(card, {
        "--mouse-x": `${x}px`,
        "--mouse-y": `${y}px`,
      });
    };

    const handleMouseEnter = () => {
      isHovered.current = true;

      // Fade in the spotlight effect
      gsap.to(spotlight, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });

      // Scale up effect
      gsap.to(card, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      isHovered.current = false;

      // Fade out the spotlight effect
      gsap.to(spotlight, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      });

      // Scale back to normal
      gsap.to(card, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`relative ${container} rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer group flex-shrink-0 ${
        isSelected
          ? "border-blue-500 shadow-lg shadow-blue-200"
          : "border-gray-200 hover:border-gray-300"
      } ${className}`}
      style={
        {
          "--mouse-x": "50%",
          "--mouse-y": "50%",
          "--radius": `${radius}px`,
          background: isSelected
            ? "linear-gradient(145deg, #3B82F6, #1E40AF)"
            : "linear-gradient(145deg, #F8FAFC, #E2E8F0)",
        } as React.CSSProperties
      }
    >
      {/* Spotlight Effect */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 z-20"
        style={{
          background: `radial-gradient(circle ${radius}px at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.4), transparent 70%)`,
        }}
      />

      {/* Logo Container */}
      <div className="relative z-10 w-full h-full p-3 flex flex-col items-center justify-center">
        <div className="flex-1 flex items-center justify-center w-full max-w-full max-h-full">
          <img
            src={logoUrl}
            alt={teamName}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            style={{
              filter: isSelected ? "brightness(1.1) contrast(1.1)" : "none",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          />
        </div>

        {/* Team name - only show on hover or if selected */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
          {teamName}
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 z-30">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Chromatic aberration effect on hover */}
      <div
        ref={fadeRef}
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-300 z-15"
        style={{
          background: `radial-gradient(circle ${radius * 0.8}px at var(--mouse-x) var(--mouse-y), 
            rgba(255,0,255,0.1), 
            rgba(0,255,255,0.1) 30%, 
            transparent 60%)`,
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
};

export default ChromaLogo;
