import React, { useState } from 'react';
import { Table, Input, Button, Space, Popconfirm, Typography, Empty } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';

const ClientTable = ({ clients, onEdit, onDelete, loading }) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const navigate = useNavigate();

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Rechercher ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Rechercher
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Réinitialiser
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const viewClientMaterials = (client) => {
    navigate(`/client-materials/${client.id}`, { 
      state: { clientName: client.nomClient, clientId: client.id } 
    });
  };

  const columns = [
    {
      title: 'Nom du client',
      dataIndex: 'nomClient',
      key: 'nomClient',
      ...getColumnSearchProps('nomClient'),
    },
    {
      title: 'Numéro d\'enregistrement fiscal',
      dataIndex: 'numeroFiscal',
      key: 'numeroFiscal',
      ...getColumnSearchProps('numeroFiscal'),
    },
    {
      title: 'Adresse',
      dataIndex: 'adresse',
      key: 'adresse',
    },
    {
      title: 'Numéro de téléphone',
      dataIndex: 'telephone',
      key: 'telephone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(record)}
          >
            Modifier
          </Button>
          <Button
            type="default"
            icon={<InboxOutlined />}
            onClick={() => viewClientMaterials(record)}
          >
            Matières Premières
          </Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce client?"
            onConfirm={() => onDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Liste des clients</Typography.Title>
      <Table 
        columns={columns} 
        dataSource={clients || []} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: <Empty description="Aucun client trouvé" />
        }}
      />
    </div>
  );
};

export default ClientTable;
