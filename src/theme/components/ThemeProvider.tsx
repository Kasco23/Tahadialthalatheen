/**
 * Theme Provider component that initializes and manages the theme system
 */

import { useAtom } from 'jotai';
import React, { useEffect } from 'react';
import { activeThemeConfigAtom, applyThemeAtom } from '../state/themeAtoms';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme Provider that applies theme tokens to CSS variables on mount and updates
 */
export function ThemeProvider({
  children,
}: ThemeProviderProps): React.JSX.Element {
  const [, applyTheme] = useAtom(applyThemeAtom);
  const [themeConfig] = useAtom(activeThemeConfigAtom);

  // Apply theme on mount and when config changes
  useEffect(() => {
    applyTheme();
  }, [applyTheme, themeConfig]);

  return <>{children}</>;
}

export default ThemeProvider;
