import React, { useState, useEffect } from 'react';
import { Phone, Mail, MessageCircle, Save, X, Edit2, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const SupportContacts = () => {
  const { token } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contacts, setContacts] = useState({
    phone: '+254 700 000 000',
    whatsapp: '+254 700 000 000',
    email: 'support@cncms.go.ke',
    hours: 'Mon-Fri, 8AM-5PM',
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await axios.get('/system/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.data.success) {
        const data = response.data.data;
        setContacts({
          phone: data.support_phone || '+254 700 000 000',
          whatsapp: data.support_whatsapp || '+254 700 000 000',
          email: data.support_email || 'support@cncms.go.ke',
          hours: data.support_hours || 'Mon-Fri, 8AM-5PM',
        });
      }
    } catch (error) {
      console.log('Could not load contacts from database');
      // Use defaults
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key: 'support_phone', value: contacts.phone },
        { key: 'support_whatsapp', value: contacts.whatsapp },
        { key: 'support_email', value: contacts.email },
        { key: 'support_hours', value: contacts.hours },
      ];

      for (const update of updates) {
        try {
          await axios.put(
            `/system/settings/${update.key}`,
            { value: update.value },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
        } catch (err) {
          console.log(`Setting ${update.key} may not exist yet`);
        }
      }

      toast.success('Contact information updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update some settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    loadContacts();
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Support Contacts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage support phone, WhatsApp, and email
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg
                       hover:bg-green-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Edit Contacts
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg
                         hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600
                         rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> These contacts appear on the Help & Support page and WhatsApp button.
          Update them here to change what users see across the application.
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Phone */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Phone Number</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">For voice calls</p>
            </div>
          </div>
          {isEditing ? (
            <input
              type="tel"
              value={contacts.phone}
              onChange={(e) => setContacts({ ...contacts, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="+254 700 000 000"
            />
          ) : (
            <p className="text-lg font-medium text-gray-800 dark:text-white">{contacts.phone}</p>
          )}
        </div>

        {/* WhatsApp */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">WhatsApp Number</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">For chat support</p>
            </div>
          </div>
          {isEditing ? (
            <input
              type="tel"
              value={contacts.whatsapp}
              onChange={(e) => setContacts({ ...contacts, whatsapp: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="+254 700 000 000"
            />
          ) : (
            <p className="text-lg font-medium text-gray-800 dark:text-white">{contacts.whatsapp}</p>
          )}
        </div>

        {/* Email */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Email Address</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">For support inquiries</p>
            </div>
          </div>
          {isEditing ? (
            <input
              type="email"
              value={contacts.email}
              onChange={(e) => setContacts({ ...contacts, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="support@cncms.go.ke"
            />
          ) : (
            <p className="text-lg font-medium text-gray-800 dark:text-white">{contacts.email}</p>
          )}
        </div>

        {/* Support Hours */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeWidth="2" d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Support Hours</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Business hours</p>
            </div>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={contacts.hours}
              onChange={(e) => setContacts({ ...contacts, hours: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Mon-Fri, 8AM-5PM"
            />
          ) : (
            <p className="text-lg font-medium text-gray-800 dark:text-white">{contacts.hours}</p>
          )}
        </div>
      </div>

      {/* Preview */}
      {!isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            Preview (How it appears to users)
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Call Us</p>
                <p className="font-medium text-sm">{contacts.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">WhatsApp</p>
                <p className="font-medium text-sm">{contacts.whatsapp}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-sm">{contacts.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportContacts;
