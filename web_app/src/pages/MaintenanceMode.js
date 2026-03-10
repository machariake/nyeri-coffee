import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const MaintenanceMode = () => {
  const [maintenanceMessage, setMaintenanceMessage] = useState('System is currently under maintenance. Please try again later.');

  useEffect(() => {
    // Fetch maintenance message
    const fetchMaintenanceInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/system/settings`);
        if (response.data.success) {
          setMaintenanceMessage(response.data.data.maintenance_message || maintenanceMessage);
        }
      } catch (error) {
        console.error('Error fetching maintenance info:', error);
      }
    };

    fetchMaintenanceInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Maintenance Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Under Maintenance
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            {maintenanceMessage}
          </p>

          {/* Info Box */}
          <div className="bg-orange-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center mb-3">
              <svg
                className="w-8 h-8 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              We're working hard to improve our services.
              <br />
              Please check back soon.
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-400">
            © 2025 County Government of Nyeri
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
