import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type ShimmerProps = {
  colors?: string[];
  speed?: number;
  intensity?: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
};

const Shimmer: React.FC<ShimmerProps> = ({
  colors = ['#ffffff', '#3b82f6'],
  speed = 1,
  intensity = 0.8,
  direction = 'diagonal',
}) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + speed * 0.1);
    }, 50);
    return () => clearInterval(interval);
  }, [speed]);

  const getGradientDirection = () => {
    switch (direction) {
      case 'horizontal':
        return '90deg';
      case 'vertical':
        return '180deg';
      case 'diagonal':
        return '135deg';
      default:
        return '135deg';
    }
  };

  const createShimmerLayers = () => {
    return colors.map((color, index) => {
      const offset = (index * 120) % 360;
      const shimmerX = Math.sin(time + offset * 0.01) * 100;
      const shimmerY = Math.cos(time + offset * 0.01) * 50;

      return (
        <motion.div
          key={index}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(${getGradientDirection()}, 
              transparent 0%, 
              ${color}${Math.floor(intensity * 100).toString(16)} 25%, 
              ${color}${Math.floor(intensity * 255).toString(16)} 50%, 
              ${color}${Math.floor(intensity * 100).toString(16)} 75%, 
              transparent 100%)`,
            opacity: 0.6,
            mixBlendMode: 'screen',
          }}
          animate={{
            x: shimmerX,
            y: shimmerY,
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 3 + index * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      );
    });
  };

  const createParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      const color = colors[i % colors.length];
      const x = (i % 5) * 20;
      const y = Math.floor(i / 5) * 25;

      particles.push(
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full pointer-events-none"
          animate={{
            x: [x, x + 50, x],
            y: [y, y - 30, y],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
          style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
            left: `${x}%`,
            top: `${y}%`,
          }}
        />,
      );
    }
    return particles;
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base shimmer layers */}
      {createShimmerLayers()}

      {/* Floating particles */}
      {createParticles()}

      {/* Central glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${colors[0]}20, transparent 60%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

export default Shimmer;
