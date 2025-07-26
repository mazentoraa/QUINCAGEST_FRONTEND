// pages/ClientTrashPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Layout, Typography, Button, message, Modal,
  Table, Space, Tooltip, Card, Alert
} from 'antd';
import {
  RollbackOutlined, DeleteOutlined, ExclamationCircleOutlined,
  ReloadOutlined, WarningOutlined, CloseOutlined
} from '@ant-design/icons';
import ClientService from '../services/ClientService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { confirm } = Modal;

const ClientTrashPage = () => {
  const [deletedClients, setDeletedClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInfoMessage, setShowInfoMessage] = useState(true);

  useEffect(() => {
    fetchDeletedClients();
    const timer = setTimeout(() => setShowInfoMessage(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const fetchDeletedClients = async () => {
    setLoading(true);
    try {
      const data = await ClientService.get_deleted_clients();
      setDeletedClients(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Erreur de chargement de la corbeille');
      setDeletedClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id, name) => {
    setLoading(true);
    try {
      await ClientService.restore_client(id);
      message.success(`Client "${name}" restauré`);
      fetchDeletedClients();
    } catch {
      message.error('Erreur lors de la restauration');
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = (id, name) => {
    confirm({
      title: 'Confirmer la suppression définitive',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <Text>
          Êtes-vous sûr de vouloir supprimer définitivement{" "}
          <strong>{name}</strong> ? Cette action est irréversible.
        </Text>
      ),
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        setLoading(true);
        try {
          await ClientService.permanent_delete_client(id);
          message.success(`Client "${name}" supprimé définitivement`);
          fetchDeletedClients();
        } catch {
          message.error('Erreur lors de la suppression');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code_client',
      render: code => <Text style={{ fontFamily: 'monospace', color: '#1e40af' }}>{code}</Text>,
    },
    {
      title: 'Nom',
      dataIndex: 'nom_client',
      render: name => <Text strong>{name}</Text>,
    },
    {
      title: 'N° Fiscal',
      dataIndex: 'numero_fiscal',
      render: nf => nf || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      render: email => email || '-',
    },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      render: tel => tel || '-',
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Restaurer">
            <Button
              type="text"
              icon={<RollbackOutlined />}
              onClick={() => handleRestore(record.id, record.nom_client)}
            />
          </Tooltip>
          <Tooltip title="Supprimer définitivement">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handlePermanentDelete(record.id, record.nom_client)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: '40px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {showInfoMessage && (
        <Alert
          type="warning"
          showIcon
          closable
          message="Les clients supprimés peuvent être restaurés ou définitivement supprimés."
          onClose={() => setShowInfoMessage(false)}
          icon={<WarningOutlined />}
          style={{
            marginBottom: 24,
            borderRadius: 8,
            backgroundColor: '#fffbea',
            border: '1px solid #fde68a',
          }}
          closeIcon={<CloseOutlined style={{ color: '#d97706' }} />}
        />
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#dc2626' }}>Corbeille des Clients</Title>
          <Text type="secondary">
            {deletedClients.length} client{deletedClients.length !== 1 ? 's' : ''} supprimé{deletedClients.length !== 1 ? 's' : ''}
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchDeletedClients}
          loading={loading}
        >
          Actualiser
        </Button>
      </div>

      <Card bordered style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={deletedClients}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total}`,
          }}
          locale={{
            emptyText: 'Aucun client dans la corbeille',
          }}
          rowClassName={(record, index) =>
            index % 2 === 0 ? 'even-row' : 'odd-row'
          }
        />
      </Card>

      {/* Inline CSS pour effet alterné de lignes */}
      <style jsx>{`
        .even-row {
          background-color: #f8fafc;
        }
        .odd-row {
          background-color: #ffffff;
        }
        .even-row:hover,
        .odd-row:hover {
          background-color: #e0f2fe !important;
        }
      `}</style>
    </Content>
  );
};

export default ClientTrashPage;
