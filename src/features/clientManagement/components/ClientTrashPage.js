import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, message, Modal, Table, Space, Tooltip, Card, Empty, Alert } from 'antd';
import { RollbackOutlined, DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined, WarningOutlined, RestoreOutlined, CloseOutlined } from '@ant-design/icons';
import ClientService from '../services/ClientService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { confirm } = Modal;

const ClientTrashPage = () => {
  const [deleted_clients, set_deleted_clients] = useState([]);
  const [loading, set_loading] = useState(false);
  const [showInfoMessage, setShowInfoMessage] = useState(true);

  useEffect(() => {
    fetch_deleted_clients();
    
    // Timer pour faire disparaître le message après 10 secondes
    const timer = setTimeout(() => {
      setShowInfoMessage(false);
    }, 10000);

    // Nettoyer le timer si le composant est démonté
    return () => clearTimeout(timer);
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
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WarningOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
          <span style={{ fontSize: '18px', fontWeight: 600 }}>Suppression définitive</span>
        </div>
      ),
      icon: null,
      content: (
        <div style={{ paddingLeft: '28px' }}>
          <Text style={{ fontSize: '16px' }}>
            Êtes-vous sûr de vouloir supprimer définitivement le client{' '}
            <strong style={{ color: '#1890ff' }}>"{client_name}"</strong> ?
          </Text>
          <br />
          <Text type="danger" style={{ fontSize: '14px' }}>
            Cette action est irréversible et toutes les données seront perdues.
          </Text>
        </div>
      ),
      okText: 'Supprimer définitivement',
      okType: 'danger',
      cancelText: 'Annuler',
      okButtonProps: {
        size: 'large',
        style: { borderRadius: '8px', fontWeight: 600 }
      },
      cancelButtonProps: {
        size: 'large',
        style: { borderRadius: '8px', fontWeight: 600 }
      },
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
      width: '15%',
      render: (code) => (
        <Text strong style={{ color: '#1890ff', fontFamily: 'monospace' }}>
          {code}
        </Text>
      ),
    },
    {
      title: 'Nom du Client',
      dataIndex: 'nom_client',
      key: 'nom_client',
      width: '25%',
      render: (nom) => (
        <Text strong style={{ fontSize: '15px' }}>
          {nom}
        </Text>
      ),
    },
    {
      title: 'N° Fiscal',
      dataIndex: 'numero_fiscal',
      key: 'numero_fiscal',
      width: '15%',
      render: (numero) => (
        <Text style={{ fontFamily: 'monospace', color: '#64748b' }}>
          {numero || '-'}
        </Text>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '20%',
      ellipsis: {
        showTitle: false,
      },
      render: (email) => (
        <Tooltip placement="topLeft" title={email}>
          <Text style={{ color: '#64748b' }}>
            {email || '-'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      key: 'telephone',
      width: '15%',
      render: (tel) => (
        <Text style={{ fontFamily: 'monospace', color: '#64748b' }}>
          {tel || '-'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Restaurer" placement="top">
            <Button
              type="primary"
              ghost
              icon={<RollbackOutlined />}
              onClick={() => handle_restore_client(record.id, record.nom_client)}
              size="small"
              style={{
                borderRadius: '8px',
                borderColor: '#52c41a',
                color: '#52c41a',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#52c41a';
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#52c41a';
                e.target.style.transform = 'translateY(0)';
              }}
            />
          </Tooltip>
          <Tooltip title="Supprimer définitivement" placement="top">
            <Button
              danger
              ghost
              icon={<DeleteOutlined />}
              onClick={() => handle_permanent_delete(record.id, record.nom_client)}
              size="small"
              style={{
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#ff4d4f';
                e.target.style.color = '#ffffff';
                e.target.style.borderColor = '#ff4d4f';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#ff4d4f';
                e.target.style.borderColor = '#ff4d4f';
                e.target.style.transform = 'translateY(0)';
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Content 
      style={{ 
        padding: '40px 60px', 
        backgroundColor: '#f8fafc', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}
    >
      {/* Message d'information temporaire */}
      {showInfoMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          maxWidth: '400px',
          animation: 'slideInRight 0.5s ease-out'
        }}>
          <Alert
            message="Information importante"
            description="Les clients dans la corbeille peuvent être restaurés ou supprimés définitivement. La suppression définitive est irréversible et toutes les données seront perdues."
            type="warning"
            showIcon
            closable
            onClose={() => setShowInfoMessage(false)}
            style={{
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              border: '1px solid #faad14'
            }}
            closeIcon={
              <CloseOutlined style={{ color: '#d48806' }} />
            }
          />
        </div>
      )}

      {/* En-tête modernisé */}
      <div style={{ 
        marginBottom: '40px',
        padding: '32px 0',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
              boxShadow: '0 8px 25px rgba(239, 68, 68, 0.25)',
              position: 'relative'
            }}>
              <DeleteOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderRadius: '10px',
                backgroundColor: '#f59e0b',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ 
                  color: '#ffffff', 
                  fontSize: '10px', 
                  fontWeight: 'bold' 
                }}>
                  {deleted_clients.length}
                </span>
              </div>
            </div>
            
            <div>
              <Title level={1} style={{ 
                margin: 0, 
                fontWeight: 700,
                color: '#ef4444',
                fontSize: '36px',
                letterSpacing: '-1px',
                background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Corbeille des Clients
              </Title>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginTop: '8px'
              }}>
                <Text style={{ 
                  color: '#64748b', 
                  fontSize: '18px',
                  fontWeight: 500
                }}>
                  {deleted_clients.length} client{deleted_clients.length !== 1 ? 's' : ''} supprimé{deleted_clients.length !== 1 ? 's' : ''}
                </Text>
                {deleted_clients.length > 0 && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    animation: 'pulse 2s infinite'
                  }}></div>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetch_deleted_clients} 
            loading={loading}
            size="large"
            style={{
              borderRadius: '12px',
              height: '48px',
              padding: '0 20px',
              border: '2px solid #1890ff',
              color: '#1890ff',
              fontWeight: 600,
              background: '#ffffff',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontSize: '15px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1890ff';
              e.target.style.color = '#ffffff';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(24, 144, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.color = '#1890ff';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <Card
        bordered={false}
        style={{
          borderRadius: '24px',
          padding: '0',
          background: '#ffffff',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Décoration de fond */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(248, 113, 113, 0.02) 100%)',
          borderRadius: '50%',
          transform: 'translate(50%, -50%)',
          pointerEvents: 'none'
        }}></div>

        {deleted_clients.length === 0 && !loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              marginBottom: '24px'
            }}>
              <DeleteOutlined style={{ 
                fontSize: '48px', 
                color: '#94a3b8'
              }} />
            </div>
            <Title level={3} style={{ 
              color: '#64748b',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              Corbeille vide
            </Title>
            <Text style={{ 
              color: '#94a3b8',
              fontSize: '16px'
            }}>
              Aucun client dans la corbeille pour le moment
            </Text>
          </div>
        ) : (
          <div style={{ padding: '40px' }}>
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
                style: { marginTop: '24px' }
              }}
              style={{
                position: 'relative',
                zIndex: 1
              }}
              rowClassName={(record, index) => 
                index % 2 === 0 ? 'even-row' : 'odd-row'
              }
            />
          </div>
        )}
      </Card>

      {/* CSS pour les animations et styles personnalisés */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .even-row {
          background-color: #fafbfc;
        }
        
        .odd-row {
          background-color: #ffffff;
        }
        
        .even-row:hover,
        .odd-row:hover {
          background-color: #f0f9ff !important;
        }
      `}</style>
    </Content>
  );
};

export default ClientTrashPage;