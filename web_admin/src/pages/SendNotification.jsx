import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Typography, message, Table, Tag, Space, Modal, Radio } from 'antd';
import { SendOutlined, BellOutlined, UserOutlined, UsergroupAddOutlined, RocketOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../store/authStore';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SendNotification = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [notificationType, setNotificationType] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fetch all users for selection
  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await apiClient.get('/users', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 1000 }
      });
      return response.data.data.users;
    },
  });

  // Send notification mutation
  const sendMutation = useMutation({
    mutationFn: async (notificationData) => {
      const response = await apiClient.post('/notifications/send', notificationData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      message.success('Notification sent successfully! 🎉');
      form.resetFields();
      queryClient.invalidateQueries(['notification-history']);
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to send notification');
    },
  });

  // Fetch notification history
  const { data: notificationHistory } = useQuery({
    queryKey: ['notification-history'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.data;
    },
  });

  const handleSubmit = async (values) => {
    let userIds = [];
    
    if (notificationType === 'all') {
      // Send to all users
      userIds = users?.map(u => u.id) || [];
    } else if (notificationType === 'farmers') {
      // Send to all farmers
      userIds = users?.filter(u => u.role === 'farmer').map(u => u.id) || [];
    } else if (notificationType === 'officers') {
      // Send to all officers
      userIds = users?.filter(u => u.role === 'officer').map(u => u.id) || [];
    } else if (notificationType === 'specific' && selectedUsers.length > 0) {
      // Send to specific users
      userIds = selectedUsers;
    }

    if (userIds.length === 0) {
      message.error('No users selected');
      return;
    }

    // Send to each user
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title: values.title,
      message: values.message,
      type: values.type,
    }));

    sendMutation.mutate({ notifications });
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          status_change: 'blue',
          approval: 'green',
          rejection: 'red',
          reminder: 'orange',
          system: 'purple',
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
    },
    {
      title: 'Recipients',
      dataIndex: 'recipient_count',
      key: 'recipient_count',
    },
    {
      title: 'Sent At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <Title level={4}><BellOutlined /> Send Push Notifications</Title>

      <Card 
        title={<><RocketOutlined /> Compose Notification</>}
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Notification Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="e.g., Application Approved!" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Notification Message"
            rules={[{ required: true, message: 'Please enter a message' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Enter your notification message..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Notification Type"
            rules={[{ required: true, message: 'Please select a type' }]}
            initialValue="system"
          >
            <Select>
              <Option value="system">📢 System Announcement</Option>
              <Option value="status_change">🔄 Status Update</Option>
              <Option value="approval">✅ Approval</Option>
              <Option value="rejection">❌ Rejection</Option>
              <Option value="reminder">⏰ Reminder</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Select Recipients"
            rules={[{ required: true, message: 'Please select recipients' }]}
          >
            <Radio.Group
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="all">
                <UsergroupAddOutlined /> All Users
              </Radio.Button>
              <Radio.Button value="farmers">
                🌱 Farmers Only
              </Radio.Button>
              <Radio.Button value="officers">
                👮 Officers Only
              </Radio.Button>
              <Radio.Button value="specific">
                <UserOutlined /> Specific Users
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {notificationType === 'specific' && (
            <Form.Item
              label="Select Users"
              rules={[{ required: notificationType === 'specific', message: 'Please select at least one user' }]}
            >
              <Select
                mode="multiple"
                placeholder="Search and select users"
                value={selectedUsers}
                onChange={setSelectedUsers}
                style={{ width: '100%' }}
                maxTagCount="responsive"
              >
                {users?.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.full_name} ({user.email}) - {user.role}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={sendMutation.isLoading}
              icon={<SendOutlined />}
            >
              Send Notification to {notificationType === 'all' ? 'All Users' : notificationType}
            </Button>
            <Text style={{ marginLeft: 12, color: '#999' }}>
              {notificationType === 'all' 
                ? `Will send to ${users?.length || 0} users`
                : notificationType === 'farmers'
                ? `Will send to ${users?.filter(u => u.role === 'farmer').length || 0} farmers`
                : notificationType === 'officers'
                ? `Will send to ${users?.filter(u => u.role === 'officer').length || 0} officers`
                : selectedUsers.length > 0
                ? `Will send to ${selectedUsers.length} selected users`
                : 'Select recipients'}
            </Text>
          </Form.Item>
        </Form>
      </Card>

      <Card title={<><SendOutlined /> Notification History</>}>
        <Table
          columns={columns}
          dataSource={notificationHistory}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default SendNotification;
