import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type MetaBallsProps = {
  colors?: string[];
  speed?: number;
  enableMouseInteraction?: boolean;
  ballCount?: number;
  ballSize?: number;
};

const MetaBalls: React.FC<MetaBallsProps> = ({
  colors = ['#ffffff', '#3b82f6'],
  speed = 0.3,
  enableMouseInteraction = true,
  ballCount = 8,
  ballSize = 60,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + speed);
    }, 50);
    return () => clearInterval(interval);
  }, [speed]);

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!enableMouseInteraction) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const generateBalls = () => {
    const balls = [];
    for (let i = 0; i < ballCount; i++) {
      const color = colors[i % colors.length];
      const phase = (i / ballCount) * Math.PI * 2;
      const radius = 100 + i * 20;
      const x = Math.cos(time * 0.02 + phase) * radius;
      const y = Math.sin(time * 0.03 + phase) * radius;

      balls.push(
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          animate={{
            x: x + (enableMouseInteraction ? mousePosition.x * 0.1 : 0),
            y: y + (enableMouseInteraction ? mousePosition.y * 0.1 : 0),
            scale: [1, 1.2, 1],
          }}
          transition={{
            scale: {
              duration: 2 + i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            x: { type: 'spring', stiffness: 50, damping: 20 },
            y: { type: 'spring', stiffness: 50, damping: 20 },
          }}
          style={{
            width: ballSize,
            height: ballSize,
            background: `radial-gradient(circle, ${color}80, ${color}20, transparent)`,
            filter: 'blur(2px)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />,
      );
    }
    return balls;
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black/10"
      onMouseMove={handleMouseMove}
      style={{
        background: `radial-gradient(circle at center, ${colors[0]}10, transparent 70%)`,
      }}
    >
      {generateBalls()}

      {/* Central attraction point */}
      <motion.div
        className="absolute w-4 h-4 rounded-full pointer-events-none"
        animate={{
          x: enableMouseInteraction ? mousePosition.x : '50%',
          y: enableMouseInteraction ? mousePosition.y : '50%',
          scale: [1, 1.5, 1],
        }}
        transition={{
          scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
          x: { type: 'spring', stiffness: 100, damping: 20 },
          y: { type: 'spring', stiffness: 100, damping: 20 },
        }}
        style={{
          background: `linear-gradient(45deg, ${colors[0]}, ${colors[1] || colors[0]})`,
          boxShadow: `0 0 20px ${colors[0]}50`,
          left: enableMouseInteraction ? 0 : '50%',
          top: enableMouseInteraction ? 0 : '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
};

export default MetaBalls;
