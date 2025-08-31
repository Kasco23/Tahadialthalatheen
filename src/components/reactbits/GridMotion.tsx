/**
 * GridMotion Component  
 * Interactive grid animation inspired by ReactBits
 * Features mouse-following grid animations with team color integration
 * Includes iOS touch support and fallbacks
 */

import { useEffect, useRef, FC, useState } from "react";
import { isIOS } from "../../utils/device";
// Lazy load GSAP with error handling
const loadGSAP = async () => {
  try {
    const gsap = await import("gsap");
    return gsap.gsap;
  } catch (error) {
    console.warn('GSAP failed to load, using fallback animations:', error);
    return null;
  }
};

interface GridMotionProps {
  teamColors?: string[];
  gradientColor?: string;
  className?: string;
}

// CSS-based fallback animation for unsupported devices
function GridMotionFallback({ teamColors, gradientColor, className }: GridMotionProps) {
  const finalGradientColor = gradientColor || teamColors?.[0] || '#FEBE10';
  
  const teamItems = [
    'Team Spirit', 'Victory', 'Champions', 'Glory', 'Pride', 'Legacy', 'Honor',
    'Excellence', 'Passion', 'Strength', 'Unity', 'Triumph', 'Legend', 'Heroes',
    'Dreams', 'Power', 'Elite', 'Dynasty', 'Crown', 'Prestige', 'Success', 
    'Empire', 'Majesty', 'Conquest', 'Dominance', 'Superior', 'Pinnacle', 'Summit'
  ];

  return (
    <div className={`h-full w-full overflow-hidden relative ${className}`}>
      <div
        className="w-full h-screen overflow-hidden relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at center, ${finalGradientColor}40 0%, transparent 70%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        
        {/* Simplified grid for fallback */}
        <div className="relative z-10 grid grid-cols-4 gap-4 p-8 max-w-4xl">
          {teamItems.slice(0, 16).map((item, index) => (
            <div
              key={index}
              className="aspect-square flex items-center justify-center text-white/80 text-sm font-medium rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm animate-pulse"
              style={{
                animationDelay: `${index * 0.1}s`,
                backgroundColor: `${teamColors?.[index % (teamColors?.length || 1)] || '#FEBE10'}20`
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 text-white/50 text-xs">
          🎯 Optimized grid display for your device
        </div>
      </div>
    </div>
  );
}

const GridMotion: FC<GridMotionProps> = ({
  teamColors = ['#FEBE10', '#FFFFFF', '#1E3A8A'], // Default Real Madrid colors
  gradientColor,
  className = ''
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseXRef = useRef<number>(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const [gsapLoaded, setGsapLoaded] = useState<any>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Use first team color as gradient if not provided
  const finalGradientColor = gradientColor || teamColors[0] || '#FEBE10';

  // Create team-themed grid items
  const teamItems = [
    'Team Spirit', 'Victory', 'Champions', 'Glory', 'Pride', 'Legacy', 'Honor',
    'Excellence', 'Passion', 'Strength', 'Unity', 'Triumph', 'Legend', 'Heroes',
    'Dreams', 'Power', 'Elite', 'Dynasty', 'Crown', 'Prestige', 'Success', 
    'Empire', 'Majesty', 'Conquest', 'Dominance', 'Superior', 'Pinnacle', 'Summit'
  ];

  // Check support and load GSAP
  useEffect(() => {
    async function initializeAnimation() {
      try {
        // Check if device supports advanced animations
        if (isIOS()) {
          console.log('iOS detected - using simplified grid animation');
          setIsSupported(false);
          return;
        }

        // Try to load GSAP
        const gsap = await loadGSAP();
        if (!gsap) {
          setIsSupported(false);
          return;
        }

        setGsapLoaded(gsap);
        setIsSupported(true);
        console.log('✅ GSAP GridMotion initialized successfully');
      } catch (error) {
        console.warn('❌ GridMotion initialization failed:', error);
        setIsSupported(false);
      }
    }

    initializeAnimation();
  }, []);

  useEffect(() => {
    if (!gsapLoaded || !isSupported) return;

    try {
      gsapLoaded.ticker.lagSmoothing(0);

      const handleMouseMove = (e: MouseEvent): void => {
        mouseXRef.current = e.clientX;
      };

      const handleTouchMove = (e: TouchEvent): void => {
        if (e.touches.length > 0) {
          mouseXRef.current = e.touches[0].clientX;
        }
      };

      const updateMotion = (): void => {
        const maxMoveAmount = 300;
        const baseDuration = 0.8;
        const inertiaFactors = [0.6, 0.4, 0.3, 0.2];

        rowRefs.current.forEach((row, index) => {
          if (row) {
            const direction = index % 2 === 0 ? 1 : -1;
            const moveAmount =
              ((mouseXRef.current / window.innerWidth) * maxMoveAmount -
                maxMoveAmount / 2) *
              direction;

            gsapLoaded.to(row, {
              x: moveAmount,
              duration:
                baseDuration + inertiaFactors[index % inertiaFactors.length],
              ease: "power3.out",
              overwrite: "auto",
            });
          }
        });
      };

      const removeAnimationLoop = gsapLoaded.ticker.add(updateMotion);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("touchmove", handleTouchMove);
        removeAnimationLoop();
      };
    } catch (error) {
      console.warn('GSAP animation setup failed:', error);
      setIsSupported(false);
    }
  }, [gsapLoaded, isSupported]);

  // Return fallback for unsupported devices or failed GSAP load
  if (isSupported === false) {
    return <GridMotionFallback teamColors={teamColors} gradientColor={gradientColor} className={className} />;
  }

  // Generate color for each item based on team colors
  const getItemColor = (index: number) => {
    const colorIndex = index % teamColors.length;
    return teamColors[colorIndex];
  };

  const getItemBgColor = (index: number) => {
    // Alternate between darker shades of team colors
    const baseColor = teamColors[index % teamColors.length];
    return `${baseColor}20`; // Add transparency
  };

  return (
    <div 
      ref={gridRef} 
      className={`h-full w-full overflow-hidden relative ${className}`}
    >
      <section
        className="w-full h-screen overflow-hidden relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at center, ${finalGradientColor}40 0%, transparent 70%)`,
        }}
      >
        {/* Overlay gradient */}
        <div 
          className="absolute inset-0 pointer-events-none z-[4]"
          style={{
            background: `linear-gradient(45deg, ${finalGradientColor}10, transparent 50%, ${teamColors[1] || '#FFFFFF'}10)`
          }}
        />
        
        {/* Grid container */}
        <div className="gap-4 flex-none relative w-[150vw] h-[150vh] grid grid-rows-4 grid-cols-1 rotate-[-15deg] origin-center z-[2]">
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 grid-cols-7"
              style={{ willChange: "transform, filter" }}
              ref={(el) => {
                if (el) rowRefs.current[rowIndex] = el;
              }}
            >
              {Array.from({ length: 7 }, (_, itemIndex) => {
                const globalIndex = rowIndex * 7 + itemIndex;
                const content = teamItems[globalIndex] || `Item ${globalIndex + 1}`;
                const itemColor = getItemColor(globalIndex);
                const itemBg = getItemBgColor(globalIndex);
                
                return (
                  <div key={itemIndex} className="relative group">
                    <div 
                      className="relative w-full h-full overflow-hidden rounded-[10px] flex items-center justify-center text-white text-[1.2rem] font-bold transition-all duration-300 group-hover:scale-105 border shadow-lg"
                      style={{ 
                        backgroundColor: itemBg,
                        borderColor: `${itemColor}60`,
                        boxShadow: `0 4px 20px ${itemColor}30`
                      }}
                    >
                      {/* Gradient overlay */}
                      <div 
                        className="absolute inset-0 opacity-60"
                        style={{
                          background: `linear-gradient(135deg, ${itemColor}40, transparent 70%)`
                        }}
                      />
                      
                      {/* Content */}
                      <div 
                        className="relative z-10 p-4 text-center text-shadow transition-colors duration-300"
                        style={{ 
                          color: itemColor,
                          textShadow: `0 2px 10px ${itemColor}80`
                        }}
                      >
                        {content}
                      </div>
                      
                      {/* Hover glow effect */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-[10px]"
                        style={{
                          background: `radial-gradient(circle at center, ${itemColor}, transparent 70%)`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Mouse interaction hint */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/60 text-sm z-10 flex items-center gap-2">
          <span className="animate-pulse">🖱️</span>
          <span>Move your mouse to interact with the grid</span>
        </div>
      </section>
    </div>
  );
};

export default GridMotion;