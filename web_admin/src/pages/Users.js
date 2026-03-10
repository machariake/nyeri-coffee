import React, { useState } from 'react';
import { Table, Button, Input, Tag, Space, Modal, Form, Select, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const Users = () => {
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', searchText],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/users?search=${searchText}`);
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => axios.post(`${API_URL}/users`, data),
    onSuccess: () => {
      message.success('User created successfully');
      queryClient.invalidateQueries(['users']);
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`${API_URL}/users/${id}`),
    onSuccess: () => {
      message.success('User deleted successfully');
      queryClient.invalidateQueries(['users']);
    },
  });

  const handleCreate = (values) => {
    createMutation.mutate(values);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user?',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone_number',
      key: 'phone_number',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : role === 'officer' ? 'blue' : 'green'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Ward',
      dataIndex: 'ward',
      key: 'ward',
      render: (ward) => ward || '-',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Applications',
      dataIndex: 'application_count',
      key: 'application_count',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>User Management</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingUser(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          Add User
        </Button>
      </div>

      <Input
        placeholder="Search users..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 300 }}
      />

      <Table
        columns={columns}
        dataSource={usersData?.users || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: usersData?.pagination?.total,
          pageSize: 20,
        }}
      />

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select>
              <Select.Option value="farmer">Farmer</Select.Option>
              <Select.Option value="officer">Officer</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="ward" label="Ward">
            <Input />
          </Form.Item>
          <Form.Item name="subCounty" label="Sub-County">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
