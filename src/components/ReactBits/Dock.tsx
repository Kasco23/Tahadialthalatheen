import React from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';

interface DockProps {
  magnification?: number;
  distance?: number;
  children: React.ReactNode;
  className?: string;
}

interface DockIconProps {
  magnification?: number;
  distance?: number;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX?: MotionValue<number>;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

export default function Dock({
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  children,
  className = ''
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`mx-auto flex h-16 items-end gap-4 rounded-2xl bg-gray-950/90 backdrop-blur-sm px-4 pb-3 ${className}`}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<DockIconProps>, {
            mouseX,
            magnification,
            distance
          });
        }
        return child;
      })}
    </motion.div>
  );
}

export function DockIcon({
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  children,
  className = '',
  onClick,
  ...props
}: DockIconProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const fallbackMouseX = useMotionValue(Infinity);
  const mouseX = props.mouseX || fallbackMouseX;
  
  const distanceCalc = useTransform(
    mouseX,
    (val: number) => {
      const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
      return val - bounds.x - bounds.width / 2;
    }
  );

  const widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [40, 40 + magnification, 40]
  );

  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={`aspect-square cursor-pointer rounded-full bg-gray-200 flex items-center justify-center text-gray-800 hover:bg-gray-100 transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Export compound component pattern
Dock.Icon = DockIcon;