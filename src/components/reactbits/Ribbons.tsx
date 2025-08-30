import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface RibbonsProps {
  colors?: string[];
  animated?: boolean;
  speed?: number;
}

const Ribbons: React.FC<RibbonsProps> = ({
  colors = ['#ff9346', '#7cff67', '#ffee51', '#5227FF'],
  animated = true,
  speed = 1,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-none"
      onMouseMove={handleMouseMove}
    >
      {colors.map((color, index) => {
        const offset = (index - colors.length / 2) * 40;
        return (
          <motion.div
            key={index}
            className="absolute pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              width: '200%',
              height: '8px',
              borderRadius: '4px',
              filter: 'blur(1px)',
            }}
            animate={
              animated
                ? {
                    x: mousePosition.x - 100 + offset,
                    y: mousePosition.y + offset,
                    rotate: Math.sin(Date.now() * 0.001 * speed + index) * 15,
                  }
                : {}
            }
            transition={{
              type: 'spring',
              stiffness: 50,
              damping: 20,
            }}
            initial={{
              x: 0,
              y: 100 + offset,
            }}
          />
        );
      })}

      {/* Floating particles for extra visual interest */}
      {colors.map((color, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          animate={
            animated
              ? {
                  x: [0, 100, 200, 0],
                  y: [0, -50, 100, 0],
                  scale: [1, 1.5, 0.8, 1],
                  opacity: [0.8, 1, 0.6, 0.8],
                }
              : {}
          }
          transition={{
            duration: 3 + index * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            left: `${20 + index * 15}%`,
            top: `${30 + (index % 2) * 20}%`,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
};

export default Ribbons;
