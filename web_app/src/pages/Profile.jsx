import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { t } = useTranslation();
  const { user, token, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    ward: user?.ward || '',
    subCounty: user?.subCounty || '',
    idNumber: user?.idNumber || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put(
        '/users/profile/update',
        formData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        await updateProfile(formData);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      ward: user?.ward || '',
      subCounty: user?.subCounty || '',
      idNumber: user?.idNumber || '',
    });
    setIsEditing(false);
  };

  const profileItems = [
    { icon: User, label: t('auth.fullName'), value: isEditing ? formData.fullName : user?.fullName, key: 'fullName' },
    { icon: Mail, label: t('auth.email'), value: user?.email, key: 'email', editable: false },
    { icon: Phone, label: t('auth.phoneNumber'), value: isEditing ? formData.phoneNumber : user?.phoneNumber, key: 'phoneNumber' },
    { icon: MapPin, label: t('profile.ward'), value: isEditing ? formData.ward : user?.ward, key: 'ward' },
    { icon: MapPin, label: t('profile.subCounty'), value: isEditing ? formData.subCounty : user?.subCounty, key: 'subCounty' },
    { icon: User, label: t('auth.idNumber'), value: isEditing ? formData.idNumber : user?.idNumber, key: 'idNumber' },
    { icon: Calendar, label: t('profile.memberSince'), value: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString() : '-', key: 'createdAt', editable: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('profile.title')}
        </h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg
                       hover:bg-green-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Edit Profile
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

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.fullName}</h2>
            <p className="text-green-100">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                      border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {t('profile.personalInfo')}
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {profileItems.map((item) => (
            <div key={item.key} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700
                              rounded-lg flex items-center justify-center">
                <item.icon className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                {isEditing && item.editable !== false ? (
                  <input
                    type={item.key === 'email' ? 'email' : item.key === 'phoneNumber' ? 'tel' : 'text'}
                    value={formData[item.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="font-medium text-gray-800 dark:text-white">
                    {item.value || '-'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
