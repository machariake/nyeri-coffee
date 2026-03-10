import React, { useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Switch, DatePicker, Tag, Space, Typography, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BellOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../store/authStore';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Promotions = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const response = await apiClient.get('/system/promotions');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/system/promotions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions']);
      message.success('Promotion created successfully');
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to create promotion');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/system/promotions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions']);
      message.success('Promotion updated successfully');
      setModalVisible(false);
      setEditingPromotion(null);
      form.resetFields();
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to update promotion');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/system/promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions']);
      message.success('Promotion deleted successfully');
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to delete promotion');
    },
  });

  const handleSubmit = (values) => {
    const data = {
      ...values,
      start_date: values.start_date ? values.start_date.toISOString() : null,
      end_date: values.end_date ? values.end_date.toISOString() : null,
    };

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (promotion) => {
    setEditingPromotion(promotion);
    form.setFieldsValue({
      ...promotion,
      start_date: promotion.start_date ? dayjs(promotion.start_date) : null,
      end_date: promotion.end_date ? dayjs(promotion.end_date) : null,
    });
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Type',
      dataIndex: 'promotion_type',
      key: 'promotion_type',
      render: (type) => {
        const colors = {
          info: 'blue',
          success: 'green',
          warning: 'orange',
          error: 'red',
          promo: 'purple',
        };
        return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: 'Show To',
      dataIndex: 'show_to',
      key: 'show_to',
      render: (showTo) => <Tag>{showTo}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Delete promotion?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}><BellOutlined /> Promotions</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingPromotion(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          New Promotion
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={promotions}
        loading={isLoading}
        rowKey="id"
      />

      <Modal
        title={editingPromotion ? 'Edit Promotion' : 'New Promotion'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPromotion(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter message' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="promotion_type"
            label="Type"
            initialValue="info"
          >
            <Select>
              <Option value="info">Info</Option>
              <Option value="success">Success</Option>
              <Option value="warning">Warning</Option>
              <Option value="error">Error</Option>
              <Option value="promo">Promotion</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            initialValue={0}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="show_to"
            label="Show To"
            initialValue="all"
          >
            <Select>
              <Option value="all">All Users</Option>
              <Option value="farmers">Farmers Only</Option>
              <Option value="officers">Officers Only</Option>
              <Option value="admins">Admins Only</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="start_date"
            label="Start Date"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="end_date"
            label="End Date"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingPromotion ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Promotions;
