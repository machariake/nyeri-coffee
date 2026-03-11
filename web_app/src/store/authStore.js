import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';

let API_URL = process.env.REACT_APP_API_URL || 'https://nyeri-coffee-1.onrender.com/api';
// Ensure URL always ends with /api
if (!API_URL.endsWith('/api')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api';
}

// Set up axios defaults
axios.defaults.baseURL = API_URL;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      greeting: null,
      dailyTip: null,
      _isHydrated: false,

      // Initialize auth from storage
      initializeAuth: () => {
        const { token } = get();
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      },

      // Login
      login: async (identifier, password, language = 'en', loginType = 'email') => {
        set({ isLoading: true });
        try {
          const payload = {
            password,
            language,
          };
          
          // Add email or phoneNumber based on loginType
          if (loginType === 'email') {
            payload.email = identifier;
          } else {
            payload.phoneNumber = identifier;
          }

          const response = await axios.post('/auth/login', payload);

          if (response.data.success) {
            const { token, user, welcome } = response.data.data;

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              greeting: welcome?.greeting,
              dailyTip: welcome?.dailyTip,
            });

            toast.success(response.data.message);
            return true;
          }
        } catch (error) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Login failed');
          return false;
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await axios.post('/auth/register', userData);

          if (response.data.success) {
            const { token, user } = response.data.data;
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            toast.success(response.data.message);
            return true;
          }
        } catch (error) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Registration failed');
          return false;
        }
      },

      // Logout
      logout: () => {
        delete axios.defaults.headers.common['Authorization'];
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          greeting: null,
          dailyTip: null,
        });
        toast.success('Logged out successfully');
      },

      // Update profile
      updateProfile: async (data) => {
        try {
          const response = await axios.put('/users/profile/update', data);
          if (response.data.success) {
            set((state) => ({
              user: { ...state.user, ...data },
            }));
            toast.success('Profile updated successfully');
            return true;
          }
        } catch (error) {
          toast.error(error.response?.data?.message || 'Update failed');
          return false;
        }
      },

      // Update language preference
      updateLanguage: async (language) => {
        try {
          const response = await axios.put('/auth/language', { language });
          if (response.data.success) {
            set((state) => ({
              user: { ...state.user, preferredLanguage: language },
              greeting: response.data.data.greeting,
            }));
            return true;
          }
        } catch (error) {
          toast.error('Failed to update language');
          return false;
        }
      },

      // Refresh greeting
      refreshGreeting: async (language) => {
        try {
          const response = await axios.get(`/auth/greeting?lang=${language}`);
          if (response.data.success) {
            set({
              greeting: response.data.data.greeting,
              dailyTip: response.data.data.dailyTip,
            });
          }
        } catch (error) {
          console.error('Failed to refresh greeting:', error);
        }
      },

      // Change password
      changePassword: async (currentPassword, newPassword) => {
        try {
          const response = await axios.post('/auth/change-password', {
            currentPassword,
            newPassword,
          });
          if (response.data.success) {
            toast.success('Password changed successfully');
            return true;
          }
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to change password');
          return false;
        }
      },

      setHydrated: () => set({ _isHydrated: true }),
    }),
    {
      name: 'cncms-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (state && !error) {
          // Set token in axios headers if exists
          if (state.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          }
          // Mark as hydrated
          state.setHydrated();
        }
      },
    }
  )
);
