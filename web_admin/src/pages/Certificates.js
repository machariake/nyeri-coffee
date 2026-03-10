import React, { useState } from 'react';
import { Table, Input, Tag, Button, Space, Modal, QRCode } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://nyeri-coffee-1.onrender.com/api';

const Certificates = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: certsData, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/certificates`);
      return response.data.data;
    },
  });

  const columns = [
    {
      title: 'Certificate No',
      dataIndex: 'certificate_number',
      key: 'certificate_number',
    },
    {
      title: 'Nursery Name',
      dataIndex: 'nursery_name',
      key: 'nursery_name',
    },
    {
      title: 'Owner',
      dataIndex: 'owner_name',
      key: 'owner_name',
    },
    {
      title: 'Issue Date',
      dataIndex: 'issue_date',
      key: 'issue_date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const isExpired = new Date(record.expiry_date) < new Date();
        const isRevoked = record.is_revoked;
        
        if (isRevoked) return <Tag color="red">REVOKED</Tag>;
        if (isExpired) return <Tag color="default">EXPIRED</Tag>;
        return <Tag color="success">ACTIVE</Tag>;
      },
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
              setSelectedCert(record);
              setIsModalOpen(true);
            }}
          >
            View
          </Button>
          <Button
            icon={<DownloadOutlined />}
            size="small"
            href={`${API_URL}/certificates/download/${record.certificate_number}`}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  const filteredCerts = certsData?.certificates?.filter(cert =>
    cert.certificate_number?.toLowerCase().includes(searchText.toLowerCase()) ||
    cert.nursery_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    cert.owner_name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <h2>Certificates</h2>
      
      <Input
        placeholder="Search certificates..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 300 }}
      />

      <Table
        columns={columns}
        dataSource={filteredCerts || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: certsData?.pagination?.total,
          pageSize: 20,
        }}
      />

      <Modal
        title="Certificate Details"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
      >
        {selectedCert && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
                padding: 32,
                borderRadius: 16,
                color: 'white',
                marginBottom: 24,
              }}
            >
              <h2 style={{ color: 'white', margin: 0 }}>COFFEE NURSERY</h2>
              <h1 style={{ color: 'white', margin: '8px 0' }}>CERTIFICATE</h1>
              <p style={{ opacity: 0.9 }}>{selectedCert.certificate_number}</p>
              <h3 style={{ color: 'white', marginTop: 16 }}>
                {selectedCert.nursery_name}
              </h3>
              <p style={{ opacity: 0.9 }}>{selectedCert.owner_name}</p>
            </div>
            
            <QRCode
              value={selectedCert.certificate_number}
              size={150}
            />
            <p style={{ marginTop: 8, color: '#666' }}>Scan to verify</p>
            
            <div style={{ marginTop: 24, textAlign: 'left' }}>
              <p><strong>Issue Date:</strong> {new Date(selectedCert.issue_date).toLocaleDateString()}</p>
              <p><strong>Expiry Date:</strong> {new Date(selectedCert.expiry_date).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Certificates;
