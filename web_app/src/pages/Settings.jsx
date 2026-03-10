import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Bell, Mail, MessageSquare, Shield } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Settings = () => {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  const notificationSettings = [
    { id: 'email', label: t('settings.emailNotifications'), icon: Mail },
    { id: 'sms', label: t('settings.smsNotifications'), icon: MessageSquare },
    { id: 'push', label: t('settings.pushNotifications'), icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        {t('settings.title')}
      </h1>

      {/* Language Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                      border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {t('settings.language')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {t('settings.selectLanguage')}
        </p>
        <LanguageSwitcher variant="select" />
      </div>

      {/* Appearance Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                      border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {t('settings.darkMode')}
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <Moon className="w-5 h-5 text-purple-500" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500" />
            )}
            <span className="text-gray-700 dark:text-gray-300">
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full 
                       transition-colors ${isDarkMode ? 'bg-green-600' : 'bg-gray-300'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white 
                         transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                      border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {t('settings.notifications')}
        </h2>
        <div className="space-y-4">
          {notificationSettings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <setting.icon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {setting.label}
                </span>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-green-600 
                          focus:ring-green-500 w-5 h-5"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Terms */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                      border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {t('settings.privacy')}
        </h2>
        <div className="space-y-3">
          <button className="flex items-center gap-3 w-full py-2 text-left
                           text-gray-700 dark:text-gray-300 hover:text-green-600">
            <Shield className="w-5 h-5" />
            {t('settings.privacy')}
          </button>
          <button className="flex items-center gap-3 w-full py-2 text-left
                           text-gray-700 dark:text-gray-300 hover:text-green-600">
            <Shield className="w-5 h-5" />
            {t('settings.terms')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
