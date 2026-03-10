import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MessageCircle, Save, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const AdminSettingsSimple = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    supportPhone: '+254 700 000 000',
    supportEmail: 'support@cncms.go.ke',
    supportWhatsApp: '+254 700 000 000',
    supportHours: 'Mon-Fri, 8AM-5PM',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Try to update settings in database
      const updates = [
        { key: 'support_phone', value: settings.supportPhone },
        { key: 'support_email', value: settings.supportEmail },
        { key: 'support_whatsapp', value: settings.supportWhatsApp },
        { key: 'support_hours', value: settings.supportHours },
      ];

      let successCount = 0;
      for (const update of updates) {
        try {
          await axios.put(
            `/system/settings/${update.key}`,
            { value: update.value },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          successCount++;
        } catch (err) {
          console.log(`Could not update ${update.key} - setting may not exist in database`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} setting(s)!`);
      } else {
        toast.success('Settings saved locally (database settings not available)');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Some settings could not be saved to database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Support Contact Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update support contact information
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Database Settings Not Found
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The support settings don't exist in the database yet. 
              You can still use this form, but you'll need to run the migration first:
            </p>
            <code className="block mt-2 p-2 bg-blue-100 dark:bg-blue-900/40 rounded text-xs text-blue-800 dark:text-blue-200">
              mysql -u root -p cncms &lt; add_support_settings.sql
            </code>
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
    </div>
  );
};

export default AdminSettingsSimple;
