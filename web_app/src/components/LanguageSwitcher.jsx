import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { supportedLanguages } from '../i18n';
import { useAuthStore } from '../store/authStore';

const LanguageSwitcher = ({ variant = 'dropdown' }) => {
  const { i18n, t } = useTranslation();
  const { user, updateLanguage } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = supportedLanguages.find(
    (lang) => lang.code === i18n.language
  ) || supportedLanguages[0];

  const handleLanguageChange = async (langCode) => {
    if (langCode === i18n.language) {
      setIsOpen(false);
      return;
    }

    // Update i18n
    await i18n.changeLanguage(langCode);
    
    // Update user preference if logged in
    if (user) {
      await updateLanguage(langCode);
    }
    
    setIsOpen(false);
  };

  if (variant === 'select') {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('settings.language')}
        </label>
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.nativeName}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 
                   dark:hover:bg-gray-700 transition-colors"
        title={t('navigation.language')}
      >
        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentLanguage.flag}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg 
                          shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-2 text-left
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                           ${i18n.language === lang.code 
                             ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                             : 'text-gray-700 dark:text-gray-300'}`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm">{lang.nativeName}</span>
                </span>
                {i18n.language === lang.code && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
