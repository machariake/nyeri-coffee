import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import swTranslations from './locales/sw.json';
import frTranslations from './locales/fr.json';

const resources = {
  en: {
    translation: enTranslations
  },
  sw: {
    translation: swTranslations
  },
  fr: {
    translation: frTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', nativeName: 'Kiswahili' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' }
];
