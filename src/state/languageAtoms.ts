import { atom } from 'jotai';

export type Language = 'en' | 'ar';

// Language atom - defaults to English as per requirements
export const languageAtom = atom<Language>('en');

// Derived atom for checking if current language is Arabic
export const isArabicAtom = atom((get) => get(languageAtom) === 'ar');

// Atom for toggling language
export const toggleLanguageAtom = atom(null, (get, set) => {
  const currentLang = get(languageAtom);
  set(languageAtom, currentLang === 'en' ? 'ar' : 'en');
});
