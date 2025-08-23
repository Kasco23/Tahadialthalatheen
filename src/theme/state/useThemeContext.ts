/**
 * Custom hook for accessing theme context
 */

import { useAtomValue } from 'jotai';
import { activeThemeConfigAtom } from './themeAtoms';

export function useThemeContext() {
  const themeConfig = useAtomValue(activeThemeConfigAtom);

  return {
    themeConfig,
  };
}
