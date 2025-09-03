import { useAtom } from 'jotai';
import { activeThemeConfigAtom } from '@/theme/state/themeAtoms';

export const useTheme = () => {
  const [themeConfig] = useAtom(activeThemeConfigAtom);

  return {
    currentTheme: themeConfig.tokens,
    themeConfig,
    // Add more theme utilities as needed
  };
};
