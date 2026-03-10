import React, { useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag, DatePicker, Select, Button, Space } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const COLORS = ['#2E7D32', '#4CAF50', '#81C784', '#A5D6A7', '#66BB6A', '#43A047'];

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const { token } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', dateRange, selectedWard],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/reports/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    },
  });

  // Applications by Ward
  const { data: wardStats } = useQuery({
    queryKey: ['ward-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/reports/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    },
  });

  // Performance metrics
  const { data: performance } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/reports/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    },
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'processing',
      under_review: 'warning',
      approved: 'success',
      rejected: 'error',
      expired: 'default',
    };
    return colors[status] || 'default';
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.reduce((acc, u) => acc + u.count, 0) || 0,
      icon: <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      color: '#e6f7ff',
    },
    {
      title: 'Total Applications',
      value: stats?.applications?.reduce((acc, a) => acc + a.count, 0) || 0,
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#f6ffed',
    },
    {
      title: 'Pending Review',
      value: stats?.applications?.find(a => a.status === 'submitted')?.count || 0,
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      color: '#fffbe6',
    },
    {
      title: 'Approved',
      value: stats?.applications?.find(a => a.status === 'approved')?.count || 0,
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#f6ffed',
    },
  ];

  const applicationColumns = [
    {
      title: 'Application ID',
      dataIndex: 'app_id',
      key: 'app_id',
    },
    {
      title: 'Applicant',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  const pieData = stats?.applications?.map(a => ({
    name: a.status.replace('_', ' ').toUpperCase(),
    value: a.count,
  })) || [];

  return (
    <div>
      <Title level={3}>Dashboard</Title>
      
      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card loading={isLoading}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    background: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  {card.icon}
                </div>
                <Statistic
                  title={card.title}
                  value={card.value}
                  valueStyle={{ fontSize: 28, fontWeight: 'bold' }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Application Status Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Monthly Applications Trend">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2E7D32" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card title="Recent Applications">
        <Table
          columns={applicationColumns}
          dataSource={stats?.recentActivity || []}
          rowKey="app_id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
