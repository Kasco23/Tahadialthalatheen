import { useAtomValue } from 'jotai';
import { languageAtom } from '@/state/languageAtoms';
import { getTranslation, type Translations } from '@/lib/translations';

/**
 * Hook for getting translated text based on current language
 */
export const useTranslation = () => {
  const language = useAtomValue(languageAtom);

  const t = (key: keyof Translations): string => {
    return getTranslation(language, key);
  };

  return { t, language };
};
