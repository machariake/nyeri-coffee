import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { CheckCircle, XCircle, Loader2, Server, Wifi, Shield } from 'lucide-react';
import axios from 'axios';

const AdminDebug = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [apiStatus, setApiStatus] = useState('checking');
  const [apiResponse, setApiResponse] = useState(null);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    checkAPI();
  }, []);

  const checkAPI = async () => {
    try {
      const response = await axios.get('/system/settings');
      setApiStatus('connected');
      setApiResponse(response.data);
    } catch (error) {
      setApiStatus('error');
      setErrors([
        error.message,
        error.response?.status ? `Status: ${error.response.status}` : '',
        error.code || ''
      ].filter(Boolean));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        System Diagnostics
      </h1>

      {/* Auth Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" /> Authentication Status
        </h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span>User Role: {user?.role || 'None'}</span>
          </div>
          {user && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <p>Email: {user.email}</p>
              <p>Name: {user.fullName}</p>
              {token && <p>Token: {token.substring(0, 20)}...</p>}
            </div>
          )}
        </div>
      </div>

      {/* API Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="w-5 h-5" /> API Connection
        </h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {apiStatus === 'connected' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : apiStatus === 'checking' ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span>API Status: {apiStatus.toUpperCase()}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            <p>API URL: {axios.defaults.baseURL}</p>
          </div>
          {apiResponse && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 font-semibold mb-2">
                API Response (System Settings):
              </p>
              <pre className="text-xs text-green-700 dark:text-green-300 overflow-auto">
                {JSON.stringify(apiResponse.data, null, 2)}
              </pre>
            </div>
          )}
          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                Errors:
              </p>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5" /> Quick Actions
        </h2>
        <div className="flex gap-2">
          <button
            onClick={checkAPI}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Re-check Connection
          </button>
          <button
            onClick={() => window.location.href = '/admin/applications'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go to Admin Console
          </button>
          <button
            onClick={() => window.location.href = '/admin/settings'}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Support Settings
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Direct Links</h2>
        <ul className="space-y-2 text-blue-600 dark:text-blue-400">
          <li>
            <a href="/admin/applications" className="hover:underline">
              → Admin Applications (/admin/applications)
            </a>
          </li>
          <li>
            <a href="/admin/settings" className="hover:underline">
              → Support Settings (/admin/settings)
            </a>
          </li>
          <li>
            <a href="/help" className="hover:underline">
              → Help & Support (/help)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDebug;
