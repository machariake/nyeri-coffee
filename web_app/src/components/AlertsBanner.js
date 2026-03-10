import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const AlertsBanner = ({ userRole }) => {
  const [alerts, setAlerts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, promotionsRes] = await Promise.all([
          axios.get(`${API_URL}/system/alerts?role=${userRole}`),
          axios.get(`${API_URL}/system/promotions?role=${userRole}`),
        ]);

        if (alertsRes.data.success) {
          setAlerts(alertsRes.data.data);
        }
        if (promotionsRes.data.success) {
          setPromotions(promotionsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching alerts/promotions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

  if (loading || (alerts.length === 0 && promotions.length === 0)) {
    return null;
  }

  const getAlertColors = (type) => {
    const colors = {
      info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' },
      success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' },
      warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-500' },
      error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' },
      urgent: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' },
    };
    return colors[type] || colors.info;
  };

  const getAlertIcon = (type) => {
    const icons = {
      info: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      success: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      urgent: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    };
    return icons[type] || icons.info;
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className={`${getAlertColors('warning').bg} border ${getAlertColors('warning').border} rounded-xl p-4`}>
          <div className="flex items-center mb-3">
            <span className={getAlertColors('warning').icon}>{getAlertIcon('warning')}</span>
            <span className={`ml-2 font-semibold ${getAlertColors('warning').text}`}>Important Alerts</span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const colors = getAlertColors(alert.alert_type);
              return (
                <div
                  key={alert.id}
                  className="bg-white rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-start">
                    <span className={colors.icon}>{getAlertIcon(alert.alert_type)}</span>
                    <div className="ml-3 flex-1">
                      <h4 className={`font-semibold ${colors.text}`}>{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      {alert.end_date && (
                        <p className="text-xs text-gray-400 mt-2">
                          Valid until: {new Date(alert.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <div className={`${getAlertColors('info').bg} border ${getAlertColors('info').border} rounded-xl p-4`}>
          <div className="flex items-center mb-3">
            <svg className={`w-5 h-5 ${getAlertColors('info').icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className={`ml-2 font-semibold ${getAlertColors('info').text}`}>Promotions & Updates</span>
          </div>
          <div className="space-y-3">
            {promotions.map((promo) => {
              const colors = getAlertColors(promo.promotion_type);
              return (
                <div
                  key={promo.id}
                  className="bg-white rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-start">
                    <span className={colors.icon}>{getAlertIcon(promo.promotion_type)}</span>
                    <div className="ml-3 flex-1">
                      <h4 className={`font-semibold ${colors.text}`}>{promo.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{promo.message}</p>
                      {promo.end_date && (
                        <p className="text-xs text-gray-400 mt-2">
                          Valid until: {new Date(promo.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsBanner;
