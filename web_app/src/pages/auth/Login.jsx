import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Sprout, Loader2, Mail, Phone } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [loginType, setLoginType] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (loginType === 'email') {
      if (!formData.email) {
        newErrors.email = t('errors.required');
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t('errors.invalidEmail');
      }
    } else {
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = t('errors.required');
      } else if (formData.phoneNumber.length < 10) {
        newErrors.phoneNumber = t('errors.invalidPhone');
      }
    }
    
    if (!formData.password) {
      newErrors.password = t('errors.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const identifier = loginType === 'email' ? formData.email : formData.phoneNumber;
    const success = await login(identifier, formData.password, i18n.language, loginType);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 
                            rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('app.name')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t('app.tagline')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <button
                type="button"
                onClick={() => setLoginType('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg
                           transition-all ${loginType === 'email'
                             ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm'
                             : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
              >
                <Mail className="w-4 h-4" />
                <span className="font-medium">{t('auth.email')}</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginType('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg
                           transition-all ${loginType === 'phone'
                             ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm'
                             : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
              >
                <Phone className="w-4 h-4" />
                <span className="font-medium">{t('auth.phoneNumber')}</span>
              </button>
            </div>

            {/* Email or Phone Input */}
            {loginType === 'email' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700
                                 dark:text-gray-300 mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border
                             ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-green-500 focus:border-transparent
                             transition-all`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700
                                 dark:text-gray-300 mb-1">
                  {t('auth.phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border
                             ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-green-500 focus:border-transparent
                             transition-all`}
                  placeholder="0712345678"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                )}
              </div>
            )}

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
                  className={`w-full px-4 py-3 rounded-xl border 
                             ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-green-500 focus:border-transparent
                             transition-all pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                             text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 
                                                   focus:ring-green-500" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {t('auth.rememberMe')}
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-green-600 hover:text-green-700"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 
                         text-white font-semibold rounded-xl hover:from-green-600 
                         hover:to-green-700 focus:outline-none focus:ring-2 
                         focus:ring-green-500 focus:ring-offset-2 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('auth.login')}...
                </>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              {t('auth.register')}
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center mt-8 text-xs text-gray-400">
            {t('app.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
