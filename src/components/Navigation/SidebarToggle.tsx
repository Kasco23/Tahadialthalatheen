import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Magnet from '@/components/ReactBits/Magnet';

interface SidebarToggleProps {
  onClick: () => void;
  className?: string;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <Magnet magnetStrength={3} padding={30}>
      <button
        onClick={onClick}
        className={`
          fixed top-4 left-4 z-60 p-3 rounded-lg 
          bg-theme-surface/90 backdrop-blur-sm 
          border border-theme-primary/20
          text-theme-text hover:text-theme-primary
          hover:bg-theme-primary/10 
          transition-all duration-200 ease-in-out
          shadow-lg hover:shadow-xl
          lg:hidden
          ${className}
        `}
        aria-label="Toggle Sidebar"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>
    </Magnet>
  );
};
