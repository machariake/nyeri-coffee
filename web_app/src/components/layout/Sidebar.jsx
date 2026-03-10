import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileText,
  Award,
  User,
  Settings,
  Bell,
  Menu,
  X,
  Sprout,
  HelpCircle,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const { user } = useAuthStore();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { path: '/applications', icon: FileText, label: t('navigation.applications') },
    { path: '/certificates', icon: Award, label: t('navigation.certificates') },
    { path: '/notifications', icon: Bell, label: t('navigation.notifications') },
    { path: '/profile', icon: User, label: t('navigation.profile') },
    { path: '/settings', icon: Settings, label: t('navigation.settings') },
    { path: '/help', icon: HelpCircle, label: 'Help & Support' },
  ];

  // Add admin-only items
  if (user?.role === 'admin') {
    navItems.unshift({
      path: '/admin/applications',
      icon: ShieldCheck,
      label: 'Admin Console'
    });
    navItems.push(
      {
        path: '/admin/contacts',
        icon: Phone,
        label: 'Edit Contacts'
      },
      {
        path: '/admin/settings',
        icon: Settings,
        label: 'Support Settings'
      }
    );
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 
                  border-r border-gray-200 dark:border-gray-700 z-40
                  transition-all duration-300 ${
                    sidebarCollapsed ? 'w-20' : 'w-64'
                  }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b 
                      border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 
                            rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-green-600 dark:text-green-400 text-lg leading-tight">
                AgriCertify
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role?.toUpperCase()}
              </p>
            </div>
          </div>
        )}
        
        {sidebarCollapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 
                          rounded-xl flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6 text-white" />
          </div>
        )}
        
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
                          (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all
                         ${isActive 
                           ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                           : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                         ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-green-600 dark:text-green-400' : ''}`} />
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse button at bottom */}
      {sidebarCollapsed && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
