import { useAtomValue, useSetAtom } from 'jotai';
import { languageAtom, toggleLanguageAtom } from '@/state/languageAtoms';
import { useTranslation } from '@/hooks/useTranslation';
import { debugLog } from '@/utils/debugLog';

/**
 * Language toggle component that allows switching between English and Arabic
 */
export default function LanguageToggle() {
  const { t } = useTranslation();
  const language = useAtomValue(languageAtom);
  const toggleLanguage = useSetAtom(toggleLanguageAtom);

  const handleToggle = () => {
    debugLog('LanguageToggle', 'toggle', {
      from: language,
      to: language === 'en' ? 'ar' : 'en',
    });
    toggleLanguage();
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 hover:border-white/40 transition-all backdrop-blur-sm"
        title={t('switchLanguage')}
      >
        <span className="text-sm font-medium">
          {language === 'en' ? 'العربية' : 'English'}
        </span>
        <div className="w-5 h-5 rounded-full bg-accent2/80 flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {language.toUpperCase()}
          </span>
        </div>
      </button>
    </div>
  );
}
