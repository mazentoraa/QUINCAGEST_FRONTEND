import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, message, Modal, Table, Space, Tooltip } from 'antd';
import { RollbackOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ClientService from '../services/ClientService';

const { Content } = Layout;
const { Title } = Typography;
const { confirm } = Modal;

const ClientTrashPage = () => {
  const [deleted_clients, set_deleted_clients] = useState([]);
  const [loading, set_loading] = useState(false);

  useEffect(() => {
    fetch_deleted_clients();
  }, []);

  const fetch_deleted_clients = async () => {
    set_loading(true);
    try {
      const data = await ClientService.get_deleted_clients();
      set_deleted_clients(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Erreur lors du chargement de la corbeille');
      console.error(error);
      set_deleted_clients([]);
    } finally {
      set_loading(false);
    }
  };

  const handle_restore_client = async (client_id, client_name) => {
    set_loading(true);
    try {
      await ClientService.restore_client(client_id);
      message.success(`Client "${client_name}" restauré avec succès`);
      fetch_deleted_clients();
    } catch (error) {
      message.error('Erreur lors de la restauration du client');
      console.error(error);
    } finally {
      set_loading(false);
    }
  };

  const handle_permanent_delete = async (client_id, client_name) => {
    confirm({
      title: 'Suppression définitive',
      icon: <ExclamationCircleOutlined />,
      content: `Êtes-vous sûr de vouloir supprimer définitivement le client "${client_name}" ? Cette action est irréversible.`,
      okText: 'Supprimer définitivement',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        set_loading(true);
        try {
          await ClientService.permanent_delete_client(client_id);
          message.success(`Client "${client_name}" supprimé définitivement`);
          fetch_deleted_clients();
        } catch (error) {
          message.error('Erreur lors de la suppression définitive');
          console.error(error);
        } finally {
          set_loading(false);
        }
      },
    });
  };

  const columns = [
    {
      title: 'Code Client',
      dataIndex: 'code_client',
      key: 'code_client',
      width: 120,
    },
    {
      title: 'Nom du Client',
      dataIndex: 'nom_client',
      key: 'nom_client',
    },
    {
      title: 'Numéro Fiscal',
      dataIndex: 'numero_fiscal',
      key: 'numero_fiscal',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      key: 'telephone',
    },
    {
      title: 'Date de suppression',
      dataIndex: 'deleted_at',
      key: 'deleted_at',
      render: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Restaurer le client">
            <Button
              type="primary"
              ghost
              icon={<RollbackOutlined />} // ✅ icône corrigée
              onClick={() => handle_restore_client(record.id, record.nom_client)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer définitivement">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handle_permanent_delete(record.id, record.nom_client)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Title level={2}>
            Corbeille des Clients ({deleted_clients.length})
          </Title>
          <Button onClick={fetch_deleted_clients} loading={loading}>
            Actualiser
          </Button>
        </div>

        {deleted_clients.length === 0 && !loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#999'
          }}>
            <DeleteOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <p>Aucun client dans la corbeille</p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={deleted_clients}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} clients supprimés`,
            }}
            scroll={{ x: 1000 }}
          />
        )}

        {deleted_clients.length > 0 && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '4px'
          }}>
            <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: '8px' }} />
            <strong>Note:</strong> Les clients dans la corbeille peuvent être restaurés ou supprimés définitivement. 
            La suppression définitive est irréversible.
          </div>
        )}
      </div>
    </Content>
  );
};

export default ClientTrashPage;
