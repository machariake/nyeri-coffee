import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Spin, Layout } from 'antd';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Applications from './pages/Applications';
import Certificates from './pages/Certificates';
import Reports from './pages/Reports';
import Promotions from './pages/Promotions';
import SystemSettings from './pages/SystemSettings';
import SendNotification from './pages/SendNotification';
import LayoutComponent from './components/Layout';

function App() {
  const { isAuthenticated, user, _isHydrated } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while hydrating from localStorage
  if (!_isHydrated) {
    return (
      <Layout style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <Spin size="large" tip="Loading..." />
      </Layout>
    );
  }

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    // Only allow admin access
    if (user?.role !== 'admin') {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LayoutComponent />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="applications" element={<Applications />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="reports" element={<Reports />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="notifications" element={<SendNotification />} />
      </Route>
    </Routes>
  );
}

export default App;
