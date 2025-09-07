import { useFlagIcons } from '../lib/flagIcons';

/**
 * Flag component that loads flag-icons CSS on demand
 */
export const Flag: React.FC<{ 
  code: string; 
  className?: string; 
}> = ({ code, className = '' }) => {
  const loaded = useFlagIcons();
  
  if (!loaded) {
    // Return a placeholder while loading
    return <span className={`inline-block w-6 h-4 bg-gray-300 ${className}`}></span>;
  }
  
  return <span className={`fi fi-${code} ${className}`}></span>;
};
