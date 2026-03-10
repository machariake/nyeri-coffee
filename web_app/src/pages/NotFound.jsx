import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertTriangle className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-gray-800 dark:text-white mb-4">
          404
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Page not found
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 
                     text-white rounded-xl hover:bg-green-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          {t('actions.goHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
