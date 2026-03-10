import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Sprout, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = t('errors.required');
    if (!formData.email) {
      newErrors.email = t('errors.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
    }
    if (!formData.phoneNumber) newErrors.phoneNumber = t('errors.required');
    if (!formData.password) newErrors.password = t('errors.required');
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordMismatch');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const success = await register(formData);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 
                            rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('auth.register')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t('app.tagline')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 
                               dark:text-gray-300 mb-1">
                {t('auth.fullName')}
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`input ${errors.fullName ? 'border-red-500' : ''}`}
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 
                               dark:text-gray-300 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 
                               dark:text-gray-300 mb-1">
                {t('auth.phoneNumber')}
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className={`input ${errors.phoneNumber ? 'border-red-500' : ''}`}
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 
                               dark:text-gray-300 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`input pr-12 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 
                               dark:text-gray-300 mb-1">
                {t('auth.confirmPassword')}
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 
                         text-white font-semibold rounded-xl hover:from-green-600 
                         hover:to-green-700 disabled:opacity-50 transition-colors
                         flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.register')}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
              {t('auth.login')}
            </Link>
          </p>

          <p className="text-center mt-8 text-xs text-gray-400">
            {t('app.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
