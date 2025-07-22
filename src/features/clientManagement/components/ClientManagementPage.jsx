import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, message, Modal, Card, Space, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import ClientTable from './ClientTable';
import ClientForm from './ClientForm';
import ClientService from '../services/ClientService';
import ClientModel from '../models/ClientModel';

const { Content } = Layout;
const { Title, Text } = Typography;

const ClientManagementPage = () => {
  const [clients, set_clients] = useState([]);
  const [loading, set_loading] = useState(false);
  const [form_visible, set_form_visible] = useState(false);
  const [current_client, set_current_client] = useState(null);
  const [is_editing, set_is_editing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetch_clients();
  }, []);

  const fetch_clients = async () => {
    set_loading(true);
    try {
      const data = await ClientService.get_all_clients();
      set_clients(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Erreur lors du chargement des clients');
      console.error(error);
      set_clients([]);
    } finally {
      set_loading(false);
    }
  };

  const handle_add_client = () => {
    set_current_client(ClientModel.create_empty());
    set_is_editing(false);
    set_form_visible(true);
  };

  const handle_edit_client = (client) => {
    set_current_client(client);
    set_is_editing(true);
    set_form_visible(true);
  };

  const handle_delete_client = async (client_id) => {
    set_loading(true);
    try {
      await ClientService.delete_client(client_id);
      message.success('Client déplacé vers la corbeille avec succès');
      fetch_clients();
    } catch (error) {
      message.error('Erreur lors de la suppression du client');
      console.error(error);
    } finally {
      set_loading(false);
    }
  };

  const handle_form_submit = async (values) => {
    set_loading(true);
    try {
      if (is_editing) {
        await ClientService.update_client(current_client.id, values);
        message.success('Client mis à jour avec succès');
      } else {
        await ClientService.create_client(values);
        message.success('Client ajouté avec succès');
      }
      set_form_visible(false);
      fetch_clients();
    } catch (error) {
      message.error("Erreur lors de l'enregistrement du client");
      console.error(error);
    } finally {
      set_loading(false);
    }
  };

  const handle_form_cancel = () => {
    set_form_visible(false);
  };

  const handle_go_to_trash = () => {
    navigate('/clients/trash');
  };

  return (
    <Content 
      style={{ 
        padding: '40px 60px', 
        backgroundColor: '#f8fafc', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}
    >
      {/* En-tête avec statistiques modernisé */}
      <div style={{ 
        marginBottom: '40px',
        padding: '32px 0',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              boxShadow: '0 8px 25px rgba(24, 144, 255, 0.25)',
              position: 'relative'
            }}>
              <TeamOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderRadius: '10px',
                backgroundColor: '#52c41a',
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
                  {clients.length}
                </span>
              </div>
            </div>
            
            <div>
              <Title level={1} style={{ 
                margin: 0, 
                fontWeight: 700,
                color: '#1890ff',
                fontSize: '30px',
                letterSpacing: '-1px',
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none'
              }}>
                Gestion des Clients
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
                  {clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}
                </Text>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#52c41a',
                  animation: 'pulse 2s infinite'
                }}></div>
              </div>
            </div>
          </div>
          
          {/* Statistiques rapides */}
         
        </div>
      </div>

      {/* Contenu principal avec design amélioré */}
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
          background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(64, 169, 255, 0.02) 100%)',
          borderRadius: '50%',
          transform: 'translate(50%, -50%)',
          pointerEvents: 'none'
        }}></div>

        {/* Barre d'actions modernisée */}
        <div style={{ 
          padding: '32px 40px',
          borderBottom: '2px solid #f1f5f9',
          background: 'linear-gradient(90deg, #fafbfc 0%, #f8fafc 100%)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <div>
              <Title level={3} style={{ 
                margin: 0, 
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '22px',
                marginBottom: '8px'
              }}>
                Liste des clients
              </Title>
              <Text style={{ 
                color: '#64748b', 
                fontSize: '16px',
                fontWeight: 400
              }}>
                Gérez vos clients et leurs informations de manière centralisée
              </Text>
            </div>
            
            <Space size="large">
              <Button 
                icon={<DeleteOutlined />} 
                onClick={handle_go_to_trash}
                size="large"
                style={{
                  borderRadius: '12px',
                  height: '48px',
                  padding: '0 20px',
                  border: '2px solid #ef4444',
                  color: '#ef4444',
                  fontWeight: 600,
                  background: '#ffffff',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '15px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#dc2626';
                  e.target.style.color = '#ffffff';
                  e.target.style.background = '#ef4444';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#ef4444';
                  e.target.style.color = '#ef4444';
                  e.target.style.background = '#ffffff';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)';
                }}
              >
                Corbeille
              </Button>

              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handle_add_client}
                size="large"
                style={{
                  borderRadius: '12px',
                  height: '48px',
                  padding: '0 24px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '15px',
                  boxShadow: '0 6px 20px rgba(24, 144, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 30px rgba(24, 144, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 20px rgba(24, 144, 255, 0.3)';
                }}
              >
                Ajouter un client
              </Button>
            </Space>
          </div>
        </div>

        {/* Table des clients avec padding amélioré */}
        <div style={{ padding: '40px' }}>
          <ClientTable
            clients={clients}
            loading={loading}
            on_edit={handle_edit_client}
            on_delete={handle_delete_client}
          />
        </div>
      </Card>

      {/* Modal du formulaire modernisée */}
      <Modal
        title={
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#1e293b',
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
            </div>
            {is_editing ? "Modifier un client" : "Ajouter un client"}
          </div>
        }
        open={form_visible}
        onCancel={handle_form_cancel}
        footer={null}
        width={900}
        destroyOnClose
        style={{ top: 40 }}
        styles={{
          content: {
            borderRadius: '24px',
            overflow: 'hidden',
            padding: 0,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)'
          },
          header: {
            padding: '32px 40px 24px',
            borderBottom: '2px solid #f1f5f9',
            background: 'linear-gradient(90deg, #fafbfc 0%, #f8fafc 100%)'
          },
          body: {
            padding: '32px 40px 40px',
            background: '#ffffff'
          }
        }}
      >
        <ClientForm
          initial_values={current_client}
          on_finish={handle_form_submit}
          on_cancel={handle_form_cancel}
          loading={loading}
          is_edit={is_editing}
        />
      </Modal>

      {/* CSS pour l'animation pulse */}
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
      `}</style>
    </Content>
  );
};

export default ClientManagementPage;