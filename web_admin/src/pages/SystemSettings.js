import React, { useState, useEffect } from 'react';
import { Card, Form, Switch, Input, Button, Typography, Alert, Space, Divider, message, Row, Col } from 'antd';
import { SettingOutlined, WarningOutlined, CheckCircleOutlined, PhoneOutlined, MailOutlined, MessageOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../store/authStore';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SystemSettings = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/system/settings');
      return response.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const response = await apiClient.put(
        `/system/settings/${key}`,
        { value }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['system-settings']);
      message.success('Settings updated successfully');
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  const handleSubmit = (values) => {
    Object.keys(values).forEach((key) => {
      updateMutation.mutate({
        key,
        value: typeof values[key] === 'boolean' ? (values[key] ? 'true' : 'false') : values[key],
      });
    });
  };

  useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        maintenance_mode: settings.maintenance_mode,
        maintenance_message: settings.maintenance_message,
        allow_registrations: settings.allow_registrations,
        app_version: settings.app_version,
        support_phone: settings.support_phone || '+254 700 000 000',
        support_whatsapp: settings.support_whatsapp || '+254 700 000 000',
        support_email: settings.support_email || 'support@cncms.go.ke',
        support_hours: settings.support_hours || 'Mon-Fri, 8AM-5PM',
      });
    }
  }, [settings, form]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Title level={4}><SettingOutlined /> System Settings</Title>

      <Alert
        message="Maintenance Mode"
        description="When enabled, all users except admins will see a maintenance message and cannot access the system."
        type="warning"
        icon={<WarningOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          maintenance_mode: false,
          allow_registrations: true,
        }}
      >
        <Card title="Maintenance Mode" style={{ marginBottom: 24 }}>
          <Form.Item
            name="maintenance_mode"
            label="Enable Maintenance Mode"
            valuePropName="checked"
          >
            <Switch size="large" />
          </Form.Item>

          <Form.Item
            name="maintenance_message"
            label="Maintenance Message"
            tooltip="Message shown to users when system is under maintenance"
          >
            <TextArea rows={3} placeholder="Enter maintenance message..." />
          </Form.Item>
        </Card>

        <Card title="User Management" style={{ marginBottom: 24 }}>
          <Form.Item
            name="allow_registrations"
            label="Allow New Registrations"
            valuePropName="checked"
            tooltip="When disabled, new users cannot register"
          >
            <Switch size="large" />
          </Form.Item>
        </Card>

        <Card title="Application Info">
          <Form.Item
            name="app_version"
            label="App Version"
          >
            <Input disabled />
          </Form.Item>
        </Card>

        <Card 
          title={<><PhoneOutlined /> Support Contacts</>} 
          style={{ marginBottom: 24, borderColor: '#52c41a', borderWidth: 1 }}
        >
          <Alert
            message="Support Contact Information"
            description="These contacts will be displayed on the Help & Support page and WhatsApp button. Update them to change what users see."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="support_phone"
                label={<><PhoneOutlined /> Support Phone Number</>}
                tooltip="For voice calls"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="+254 700 000 000" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="support_whatsapp"
                label={<><MessageOutlined /> WhatsApp Number</>}
                tooltip="For chat support"
                rules={[{ required: true, message: 'Please enter WhatsApp number' }]}
              >
                <Input placeholder="+254 700 000 000" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="support_email"
                label={<><MailOutlined /> Email Address</>}
                tooltip="For support inquiries"
                rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}
              >
                <Input placeholder="support@cncms.go.ke" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="support_hours"
                label="Support Hours"
                tooltip="Business hours"
                rules={[{ required: true, message: 'Please enter support hours' }]}
              >
                <Input placeholder="Mon-Fri, 8AM-5PM" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div style={{ marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={updateMutation.isLoading}
            icon={<CheckCircleOutlined />}
          >
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SystemSettings;
