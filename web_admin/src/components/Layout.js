import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  theme,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NotificationOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = AntLayout;

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: '/applications',
      icon: <FileTextOutlined />,
      label: 'Applications',
    },
    {
      key: '/certificates',
      icon: <SafetyCertificateOutlined />,
      label: 'Certificates',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
    {
      key: '/promotions',
      icon: <NotificationOutlined />,
      label: 'Promotions & Alerts',
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: 'Send Notifications',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'System Settings',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'profile') {
      // Handle profile
    } else {
      navigate(key);
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: 'white', fontSize: 18 }}>🌱</span>
              </div>
              <span style={{ fontWeight: 600, fontSize: 16, color: '#2E7D32' }}>
                AgriCertify
              </span>
            </div>
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'white', fontSize: 18 }}>🌱</span>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                style: { fontSize: 18, cursor: 'pointer' },
                onClick: () => setCollapsed(!collapsed),
              }
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={5} size="small">
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
            </Badge>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleMenuClick }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2E7D32' }} />
                {!collapsed && (
                  <span style={{ fontWeight: 500 }}>{user?.fullName || 'Admin'}</span>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
