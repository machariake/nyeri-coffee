import React, { useState } from 'react';
import { Table, Input, Tag, Select, Space, Button, Modal, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const { Option } = Select;

const Applications = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['applications', statusFilter],
    queryFn: async () => {
      const url = `${API_URL}/applications${statusFilter ? `?status=${statusFilter}` : ''}`;
      const response = await axios.get(url);
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

  const columns = [
    {
      title: 'App ID',
      dataIndex: 'app_id',
      key: 'app_id',
    },
    {
      title: 'Nursery Name',
      dataIndex: 'nursery_name',
      key: 'nursery_name',
    },
    {
      title: 'Applicant',
      dataIndex: 'applicant_name',
      key: 'applicant_name',
    },
    {
      title: 'Ward',
      dataIndex: 'ward',
      key: 'ward',
      render: (ward) => ward || '-',
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
      title: 'Submitted',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedApp(record);
              setIsModalOpen(true);
            }}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const filteredApps = appsData?.applications?.filter(app =>
    app.nursery_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    app.applicant_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    app.app_id?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <h2>Applications</h2>
      
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search applications..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter || undefined}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="draft">Draft</Option>
          <Option value="submitted">Submitted</Option>
          <Option value="under_review">Under Review</Option>
          <Option value="approved">Approved</Option>
          <Option value="rejected">Rejected</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredApps || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: appsData?.pagination?.total,
          pageSize: 20,
        }}
      />

      <Modal
        title="Application Details"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedApp && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Application ID">{selectedApp.app_id}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedApp.status)}>
                {selectedApp.status.replace('_', ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nursery Name">{selectedApp.nursery_name}</Descriptions.Item>
            <Descriptions.Item label="Location">{selectedApp.nursery_location}</Descriptions.Item>
            <Descriptions.Item label="Applicant">{selectedApp.applicant_name}</Descriptions.Item>
            <Descriptions.Item label="Ward">{selectedApp.ward || '-'}</Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {selectedApp.submitted_at ? new Date(selectedApp.submitted_at).toLocaleDateString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Reviewed">
              {selectedApp.reviewed_at ? new Date(selectedApp.reviewed_at).toLocaleDateString() : '-'}
            </Descriptions.Item>
            {selectedApp.officer_name && (
              <Descriptions.Item label="Reviewed By">{selectedApp.officer_name}</Descriptions.Item>
            )}
            {selectedApp.officer_comments && (
              <Descriptions.Item label="Comments" span={2}>
                {selectedApp.officer_comments}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Applications;
