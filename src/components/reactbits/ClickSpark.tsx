/**
 * ClickSpark Component
 * Interactive click effects that create sparks on click
 * Inspired by ReactBits with team color integration
 */

import React, { useRef, useEffect, useCallback } from "react";

interface ClickSparkProps {
  teamColors?: string[];
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  extraScale?: number;
  children?: React.ReactNode;
  className?: string;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
  color: string;
  size: number;
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  teamColors = ['#FEBE10', '#FFFFFF', '#1E3A8A'], // Default Real Madrid colors
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1.0,
  children,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let resizeTimeout: NodeJS.Timeout;

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(parent);

    resizeCanvas();

    return () => {
      ro.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, []);

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case "linear":
          return t;
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark: Spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) {
          return false;
        }

        const progress = elapsed / duration;
        const eased = easeFunc(progress);

        const distance = eased * sparkRadius * extraScale;
        const lineLength = spark.size * (1 - eased);
        const opacity = 1 - eased;

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        // Create gradient for spark trail
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, spark.color);
        gradient.addColorStop(1, `${spark.color}00`); // Transparent

        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(1, 3 * (1 - eased));
        ctx.lineCap = 'round';
        ctx.globalAlpha = opacity;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Add glow effect
        ctx.shadowBlur = 10 * (1 - eased);
        ctx.shadowColor = spark.color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        return true;
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [sparkRadius, duration, easeFunc, extraScale]);

  const getSparkColor = (index: number): string => {
    const color = teamColors[index % teamColors.length];
    
    // Convert hex to rgba if needed
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.9)`;
    }
    
    return color;
  };

  const getSparkSize = (index: number): number => {
    // Vary spark sizes for more dynamic effect
    const sizeVariations = [1.2, 0.8, 1.0, 1.5, 0.9];
    return sparkSize * (sizeVariations[index % sizeVariations.length] || 1);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = performance.now();
    
    // Create multiple spark bursts with different colors
    const sparkGroups = Math.ceil(sparkCount / teamColors.length);
    const newSparks: Spark[] = [];
    
    for (let group = 0; group < teamColors.length && newSparks.length < sparkCount; group++) {
      const groupColor = getSparkColor(group);
      const sparksInGroup = Math.min(sparkGroups, sparkCount - newSparks.length);
      
      for (let i = 0; i < sparksInGroup; i++) {
        const totalIndex = group * sparkGroups + i;
        newSparks.push({
          x,
          y,
          angle: (2 * Math.PI * totalIndex) / sparkCount,
          startTime: now + group * 50, // Stagger the groups slightly
          color: groupColor,
          size: getSparkSize(totalIndex)
        });
      }
    }

    sparksRef.current.push(...newSparks);
    
    // Add a brief visual feedback at click point
    const canvas2D = canvasRef.current;
    const ctx = canvas2D?.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = teamColors[0];
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  };

  return (
    <div
      className={`relative w-full h-full cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />
      {children}
      
      {/* Click instruction overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm pointer-events-none z-20 flex items-center gap-2">
        <span className="animate-bounce">✨</span>
        <span>Click anywhere to create sparks</span>
      </div>
    </div>
  );
};

export default ClickSpark;