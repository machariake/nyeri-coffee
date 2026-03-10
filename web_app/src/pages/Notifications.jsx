import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Trash2 } from 'lucide-react';

const Notifications = () => {
  const { t } = useTranslation();

  // Mock notifications - in real app, fetch from API
  const notifications = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('notifications.title')}
        </h1>
        {notifications.length > 0 && (
          <button className="flex items-center gap-2 text-green-600 hover:text-green-700">
            <Check className="w-4 h-4" />
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('notifications.noNotifications')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm
                        border border-gray-200 dark:border-gray-700
                        flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 
                                rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {notification.message}
                  </p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
