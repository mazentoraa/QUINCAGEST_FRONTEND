import React, { useState } from 'react';
import { Table, Input, Button, Space, Popconfirm, Typography, Empty } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';

const ClientTable = ({ clients, on_edit, on_delete, loading }) => {
  const [search_text, set_search_text] = useState('');
  const [searched_column, set_searched_column] = useState('');
  const navigate = useNavigate();

  const handle_search = (selectedKeys, confirm, dataIndex) => {
    confirm();
    set_search_text(selectedKeys[0]);
    set_searched_column(dataIndex);
  };

  const handle_reset = (clearFilters) => {
    clearFilters();
    set_search_text('');
  };

  const get_column_search_props = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Rechercher ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handle_search(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handle_search(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Rechercher
          </Button>
          <Button onClick={() => handle_reset(clearFilters)} size="small" style={{ width: 90 }}>
            Réinitialiser
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
    render: (text) =>
      searched_column === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[search_text]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const view_client_materials = (client) => {
    navigate(`/client-materials/${client.id}`, { 
      state: { client_name: client.nom_client, client_id: client.id } 
    });
  };

  const columns = [
    {
      title: 'Nom du client',
      dataIndex: 'nom_client',
      key: 'nom_client',
      ...get_column_search_props('nom_client'),
    },
    {
      title: 'Numéro d\'enregistrement fiscal',
      dataIndex: 'numero_fiscal',
      key: 'numero_fiscal',
      ...get_column_search_props('numero_fiscal'),
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
            onClick={() => on_edit(record)}
          >
            Modifier
          </Button>
          <Button
            type="default"
            icon={<InboxOutlined />}
            onClick={() => view_client_materials(record)}
          >
            Matières
          </Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce client?"
            onConfirm={() => on_delete(record.id)}
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
