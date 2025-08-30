/**
 * BlobCursor Component
 * Interactive blob cursor that follows mouse movement
 * Inspired by ReactBits with team color integration
 */

"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";

export interface BlobCursorProps {
  blobType?: "circle" | "square";
  teamColors?: string[];
  trailCount?: number;
  sizes?: number[];
  innerSizes?: number[];
  opacities?: number[];
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  filterId?: string;
  filterStdDeviation?: number;
  filterColorMatrixValues?: string;
  useFilter?: boolean;
  fastDuration?: number;
  slowDuration?: number;
  fastEase?: string;
  slowEase?: string;
  zIndex?: number;
  className?: string;
}

export default function BlobCursor({
  blobType = "circle",
  teamColors = ['#FEBE10', '#FFFFFF', '#1E3A8A'], // Default Real Madrid colors
  trailCount = 3,
  sizes = [60, 125, 75],
  innerSizes = [20, 35, 25],
  opacities = [0.6, 0.6, 0.6],
  shadowBlur = 5,
  shadowOffsetX = 10,
  shadowOffsetY = 10,
  filterId = "blob",
  filterStdDeviation = 30,
  filterColorMatrixValues = "1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 35 -10",
  useFilter = true,
  fastDuration = 0.1,
  slowDuration = 0.5,
  fastEase = "power3.out",
  slowEase = "power1.out",
  zIndex = 100,
  className = ''
}: BlobCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<(HTMLDivElement | null)[]>([]);

  const updateOffset = useCallback(() => {
    if (!containerRef.current) return { left: 0, top: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }, []);

  const handleMove = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      const { left, top } = updateOffset();
      const x = "clientX" in e ? e.clientX : e.touches[0].clientX;
      const y = "clientY" in e ? e.clientY : e.touches[0].clientY;

      blobsRef.current.forEach((el, i) => {
        if (!el) return;
        const isLead = i === 0;
        gsap.to(el, {
          x: x - left,
          y: y - top,
          duration: isLead ? fastDuration : slowDuration,
          ease: isLead ? fastEase : slowEase,
        });
      });
    },
    [updateOffset, fastDuration, slowDuration, fastEase, slowEase]
  );

  useEffect(() => {
    const onResize = () => updateOffset();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateOffset]);

  // Get color for each blob from team colors
  const getBlobColor = (index: number) => {
    return teamColors[index % teamColors.length] || teamColors[0];
  };

  const getInnerColor = () => {
    // Use the lightest team color or white for inner color
    const lightColor = teamColors.find(color => 
      color.toLowerCase() === '#ffffff' || 
      color.toLowerCase() === 'white'
    ) || teamColors[1] || 'rgba(255,255,255,0.8)';
    
    return lightColor.startsWith('#') ? `${lightColor}CC` : lightColor;
  };

  const getShadowColor = (index: number) => {
    const baseColor = getBlobColor(index);
    // Convert hex to rgba for shadow
    if (baseColor.startsWith('#')) {
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.4)`;
    }
    return `rgba(0,0,0,0.4)`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      className={`relative top-0 left-0 w-full h-full ${className}`}
      style={{ zIndex }}
    >
      {useFilter && (
        <svg className="absolute w-0 h-0">
          <filter id={filterId}>
            <feGaussianBlur
              in="SourceGraphic"
              result="blur"
              stdDeviation={filterStdDeviation}
            />
            <feColorMatrix in="blur" values={filterColorMatrixValues} />
          </filter>
        </svg>
      )}

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden select-none cursor-default"
        style={{ filter: useFilter ? `url(#${filterId})` : undefined }}
      >
        {Array.from({ length: trailCount }).map((_, i) => {
          const blobColor = getBlobColor(i);
          const shadowColor = getShadowColor(i);
          
          return (
            <div
              key={i}
              ref={(el) => {
                blobsRef.current[i] = el;
              }}
              className="absolute will-change-transform transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{
                width: sizes[i],
                height: sizes[i],
                borderRadius: blobType === "circle" ? "50%" : "0",
                backgroundColor: blobColor,
                opacity: opacities[i],
                boxShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px 0 ${shadowColor}`,
              }}
            >
              <div
                className="absolute transition-all duration-300"
                style={{
                  width: innerSizes[i],
                  height: innerSizes[i],
                  top: (sizes[i] - innerSizes[i]) / 2,
                  left: (sizes[i] - innerSizes[i]) / 2,
                  backgroundColor: getInnerColor(),
                  borderRadius: blobType === "circle" ? "50%" : "0",
                }}
              />
              
              {/* Team color accent ring */}
              <div
                className="absolute animate-pulse"
                style={{
                  width: sizes[i] + 10,
                  height: sizes[i] + 10,
                  top: -5,
                  left: -5,
                  borderRadius: blobType === "circle" ? "50%" : "0",
                  border: `2px solid ${teamColors[2] || teamColors[0]}40`,
                  opacity: 0.3,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}