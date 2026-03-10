import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, CloudSun, Sunset, Moon, Lightbulb } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Greeting = () => {
  const { t, i18n } = useTranslation();
  const { user, greeting, dailyTip, refreshGreeting } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Refresh greeting when language changes
    if (user?.preferredLanguage !== i18n.language) {
      refreshGreeting(i18n.language);
    }
  }, [i18n.language, user, refreshGreeting]);

  const getTimePeriod = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const getPeriodIcon = () => {
    const period = getTimePeriod();
    const iconClass = "w-8 h-8";
    
    switch (period) {
      case 'morning':
        return <Sun className={`${iconClass} text-yellow-500`} />;
      case 'afternoon':
        return <CloudSun className={`${iconClass} text-orange-500`} />;
      case 'evening':
        return <Sunset className={`${iconClass} text-purple-500`} />;
      case 'night':
        return <Moon className={`${iconClass} text-blue-500`} />;
      default:
        return <Sun className={`${iconClass} text-yellow-500`} />;
    }
  };

  const getGreetingText = () => {
    const period = getTimePeriod();
    const name = user?.fullName?.split(' ')[0] || '';
    
    if (greeting?.text) {
      return greeting.text;
    }
    
    return `${t(`greeting.${period}`)}${name ? `, ${name}` : ''}!`;
  };

  const getEmoji = () => {
    if (greeting?.emoji) return greeting.emoji;
    
    const period = getTimePeriod();
    const emojis = {
      morning: '☀️',
      afternoon: '🌤️',
      evening: '🌅',
      night: '🌙',
    };
    return emojis[period];
  };

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getPeriodIcon()}
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreetingText()} {getEmoji()}
            </h1>
          </div>
          
          <p className="text-green-100 text-lg mb-4">
            {t('greeting.welcomeBack')}!
          </p>

          {dailyTip && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold text-yellow-100">
                  {t('greeting.dailyTip')}
                </span>
              </div>
              <p className="text-green-50 text-sm">{dailyTip}</p>
            </div>
          )}
        </div>

        <div className="hidden md:block text-right">
          <p className="text-4xl font-bold">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-green-100">
            {currentTime.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Greeting;
