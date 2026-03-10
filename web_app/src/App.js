import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

import './i18n';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import NewApplication from './pages/NewApplication';
import Certificates from './pages/Certificates';
import CertificateDetail from './pages/CertificateDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import HelpSupport from './pages/HelpSupport';
import AdminApplications from './pages/admin/AdminApplications';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSettingsSimple from './pages/admin/AdminSettingsSimple';
import AdminDebug from './pages/admin/AdminDebug';
import SupportContacts from './pages/admin/SupportContacts';
import DebugAuth from './pages/DebugAuth';
import NotFound from './pages/NotFound';
import MaintenanceMode from './pages/MaintenanceMode';

// Components
import WhatsAppButton from './components/WhatsAppButton';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Protected Route Component with Maintenance Check
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, _isHydrated } = useAuthStore();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(!_isHydrated);

  useEffect(() => {
    // Wait for hydration
    if (_isHydrated) {
      const checkMaintenance = async () => {
        try {
          const response = await axios.get(`${API_URL}/system/settings`);
          if (response.data.success) {
            const maintenanceMode = response.data.data.maintenance_mode;
            // Only show maintenance to non-admin users
            setIsMaintenance(maintenanceMode && user?.role !== 'admin');
          }
        } catch (error) {
          console.error('Error checking maintenance:', error);
        } finally {
          setLoading(false);
        }
      };

      if (isAuthenticated) {
        checkMaintenance();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, user?.role, _isHydrated]);

  // Show loading while hydrating or checking maintenance
  if (loading || !_isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (isMaintenance) {
    return <MaintenanceMode />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  const { initializeAuth } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/new" element={<NewApplication />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminApplications />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/contacts" element={<SupportContacts />} />
            <Route path="/admin/settings" element={<AdminSettingsSimple />} />
            <Route path="/admin/debug" element={<AdminDebug />} />
            <Route path="/debug-auth" element={<DebugAuth />} />

            <Route path="/certificates" element={<Certificates />} />
            <Route path="/certificates/:id" element={<CertificateDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/help" element={<HelpSupport />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      
      {/* WhatsApp Floating Button */}
      <WhatsAppButton />
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#1f2937' : '#fff',
            color: isDarkMode ? '#fff' : '#1f2937',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
