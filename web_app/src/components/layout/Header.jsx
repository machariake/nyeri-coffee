import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../LanguageSwitcher';

const Header = () => {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 
                       dark:border-gray-700 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {t('app.name')}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                     transition-colors"
          title={isDarkMode ? 'Light mode' : 'Dark mode'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 
                        dark:border-gray-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              {user?.fullName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
          
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 
                          rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 
                       text-gray-500 hover:text-red-600 transition-colors"
            title={t('auth.logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
