import { useEffect, useState } from 'react';

let flagIconsLoaded = false;

/**
 * Custom hook to load flag-icons CSS dynamically only when needed
 */
export const useFlagIcons = () => {
  const [loaded, setLoaded] = useState(flagIconsLoaded);

  useEffect(() => {
    if (flagIconsLoaded) return;

    // Create and inject CSS link for flag-icons
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/css/flag-icons.min.css';
    link.onload = () => {
      flagIconsLoaded = true;
      setLoaded(true);
    };
    document.head.appendChild(link);
  }, []);

  return loaded;
};
