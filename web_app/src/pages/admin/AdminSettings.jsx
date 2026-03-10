import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MessageCircle, Save, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const AdminSettings = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    supportPhone: '',
    supportEmail: '',
    supportWhatsApp: '',
    supportHours: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/system/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          supportPhone: data.support_phone || '+254 700 000 000',
          supportEmail: data.support_email || 'support@cncms.go.ke',
          supportWhatsApp: data.support_whatsapp || '+254 700 000 000',
          supportHours: data.support_hours || 'Mon-Fri, 8AM-5PM',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings. Make sure backend is running.');
      // Set default values even if load fails
      setSettings({
        supportPhone: '+254 700 000 000',
        supportEmail: 'support@cncms.go.ke',
        supportWhatsApp: '+254 700 000 000',
        supportHours: 'Mon-Fri, 8AM-5PM',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update each setting
      const updates = [
        { key: 'support_phone', value: settings.supportPhone },
        { key: 'support_email', value: settings.supportEmail },
        { key: 'support_whatsapp', value: settings.supportWhatsApp },
        { key: 'support_hours', value: settings.supportHours },
      ];

      for (const update of updates) {
        await axios.put(
          `/system/settings/${update.key}`,
          { value: update.value },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
      }

      toast.success('Contact information updated successfully!');
      loadSettings();
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Error Loading Settings
          </h2>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Support Contact Settings
        </h1>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Support Contact Information
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              These details will be displayed on the Help & Support page and WhatsApp button. 
              Users can contact support using these details.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
          Contact Details
        </h2>

        <div className="space-y-6">
          {/* Support Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Support Phone Number
              </div>
            </label>
            <input
              type="tel"
              value={settings.supportPhone}
              onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
              placeholder="+254 700 000 000"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Phone number displayed on Help page for voice calls
            </p>
          </div>

          {/* Support Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Support Email Address
              </div>
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              placeholder="support@cncms.go.ke"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Email address for support inquiries
            </p>
          </div>

          {/* Support WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Number
              </div>
            </label>
            <input
              type="tel"
              value={settings.supportWhatsApp}
              onChange={(e) => setSettings({ ...settings, supportWhatsApp: e.target.value })}
              placeholder="+254 700 000 000"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              WhatsApp number for chat support (include country code, no spaces or +)
            </p>
          </div>

          {/* Support Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Support Hours
            </label>
            <input
              type="text"
              value={settings.supportHours}
              onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
              placeholder="Mon-Fri, 8AM-5PM"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Business hours displayed to users
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg
                       hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
          Preview (How it appears to users)
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Call Us</p>
              <p className="font-medium text-gray-800 dark:text-white">{settings.supportPhone}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{settings.supportHours}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email Us</p>
              <p className="font-medium text-gray-800 dark:text-white">{settings.supportEmail}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">We respond within 24 hours</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">WhatsApp</p>
              <p className="font-medium text-gray-800 dark:text-white">{settings.supportWhatsApp}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Quick support via chat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
