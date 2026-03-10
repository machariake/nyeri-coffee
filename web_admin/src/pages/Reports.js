import React, { useState } from 'react';
import { Card, Row, Col, DatePicker, Button, Table, Statistic, Space } from 'antd';
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
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://nyeri-coffee-1.onrender.com/api';

const COLORS = ['#2E7D32', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9'];

const Reports = () => {
  const [dateRange, setDateRange] = useState([null, null]);

  const { data: reportData } = useQuery({
    queryKey: ['reports', dateRange],
    queryFn: async () => {
      const params = {};
      if (dateRange[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
      
      const response = await axios.get(`${API_URL}/reports/applications`, { params });
      return response.data.data;
    },
  });

  const { data: perfData } = useQuery({
    queryKey: ['performance'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/reports/performance`);
      return response.data.data;
    },
  });

  const { RangePicker } = DatePicker;

  const statusData = reportData?.applications?.reduce((acc, app) => {
    const status = app.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) || {};

  const pieData = Object.entries(statusData).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value,
  }));

  const wardData = reportData?.applications?.reduce((acc, app) => {
    const ward = app.ward || 'Unknown';
    acc[ward] = (acc[ward] || 0) + 1;
    return acc;
  }, {});

  const wardChartData = Object.entries(wardData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const columns = [
    {
      title: 'Officer',
      dataIndex: 'officer_name',
      key: 'officer_name',
    },
    {
      title: 'Total Reviewed',
      dataIndex: 'total_reviewed',
      key: 'total_reviewed',
    },
    {
      title: 'Approved',
      dataIndex: 'approved',
      key: 'approved',
    },
    {
      title: 'Rejected',
      dataIndex: 'rejected',
      key: 'rejected',
    },
    {
      title: 'Avg. Processing (days)',
      dataIndex: 'avg_processing_days',
      key: 'avg_processing_days',
      render: (days) => days ? Number(days).toFixed(1) : '-',
    },
  ];

  return (
    <div>
      <h2>Reports & Analytics</h2>

      {/* Date Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button type="primary" onClick={() => {}}>
            Generate Report
          </Button>
        </Space>
      </Card>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Applications"
              value={reportData?.summary?.total || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Approved"
              value={reportData?.summary?.approved || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={reportData?.summary?.rejected || 0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={reportData?.summary?.pending || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
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
                  outerRadius={100}
                  dataKey="value"
                  label
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
          <Card title="Applications by Ward">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wardChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2E7D32" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Officer Performance */}
      <Card title="Officer Performance">
        <Table
          columns={columns}
          dataSource={perfData?.officerPerformance || []}
          rowKey="officer_name"
          pagination={false}
        />
      </Card>

      {/* Processing Time */}
      <Card style={{ marginTop: 24 }}>
        <Statistic
          title="Average Processing Time"
          value={perfData?.averageProcessingTime || 0}
          suffix="days"
          precision={1}
        />
      </Card>
    </div>
  );
};

export default Reports;
