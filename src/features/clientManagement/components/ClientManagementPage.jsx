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
      // Tri décroissant des clients par nom (Z vers A)
      const sorted_clients = Array.isArray(data) ? data.sort((a, b) => {
        // Tri par nom d'abord, puis par prénom, puis par ID - ORDRE DÉCROISSANT
        const name_a = (a.nom || '').toLowerCase();
        const name_b = (b.nom || '').toLowerCase();
        
        if (name_a !== name_b) {
          return name_b.localeCompare(name_a); // Inversé pour ordre décroissant
        }
        
        const firstname_a = (a.prenom || '').toLowerCase();
        const firstname_b = (b.prenom || '').toLowerCase();
        
        if (firstname_a !== firstname_b) {
          return firstname_b.localeCompare(firstname_a); // Inversé pour ordre décroissant
        }
        
        // Si même nom et prénom, trier par ID décroissant
        return (b.id || 0) - (a.id || 0); // Inversé pour ordre décroissant
      }) : [];
      
      set_clients(sorted_clients);
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
      fetch_clients(); // Le tri sera automatiquement appliqué lors du rechargement
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
      fetch_clients(); // Le tri sera automatiquement appliqué lors du rechargement
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
   
    >
      {/* Container unifié avec titre, boutons et tableau */}
      <div style={{ 
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 40px)' // Prend toute la hauteur moins le padding
      }}>
        
        {/* Barre d'actions avec titre */}
        <div style={{ 
          padding: '40px 40px 30px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              boxShadow: '0 6px 20px rgba(24, 144, 255, 0.25)',
              position: 'relative'
            }}>
              <TeamOutlined style={{ fontSize: '24px', color: '#ffffff' }} />
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '18px',
                height: '18px',
                borderRadius: '10px',
                backgroundColor: '#52c41a',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ 
                  color: '#ffffff', 
                  fontSize: '9px', 
                  fontWeight: 'bold' 
                }}>
                  {clients.length}
                </span>
              </div>
            </div>
            
            <div>
              <Title level={2} style={{ 
                margin: 0, 
                fontWeight: 600,
                color: '#1890ff',
                fontSize: "28px",
                letterSpacing: '-0.5px'
              }}>
                Gestion des Clients
              </Title>
              <Text style={{ 
                color: '#64748b', 
                fontSize: '14px'
              }}>
                {clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}
              </Text>
            </div>
          </div>

          <Space size="large">
            <Button 
              icon={<DeleteOutlined />} 
              onClick={handle_go_to_trash}
              style={{
                borderRadius: '8px',
                height: '40px',
                padding: '0 16px',
                border: '1px solid #ef4444',
                color: '#ef4444',
                fontWeight: 500,
                background: '#ffffff',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#dc2626';
                e.target.style.color = '#ffffff';
                e.target.style.background = '#ef4444';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#ef4444';
                e.target.style.color = '#ef4444';
                e.target.style.background = '#ffffff';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Corbeille
            </Button>

            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handle_add_client}
              style={{
                borderRadius: '8px',
                height: '40px',
                padding: '0 20px',
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #0f7ae5 0%, #2194ff 100%)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 20px rgba(24, 144, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
              }}
            >
              Ajouter un client
            </Button>
          </Space>
        </div>

        {/* Tableau des clients avec largeur augmentée */}
        <div style={{ 
          padding: '32px 40px 40px', 
          width: '100%',
          minHeight: 'calc(100vh - 200px)', // Étend la zone du tableau
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            width: '100%', 
            minHeight: '750px',
            flex: 1 // Prend tout l'espace disponible
          }}>
            <ClientTable
              clients={clients}
              loading={loading}
              on_edit={handle_edit_client}
              on_delete={handle_delete_client}
              scroll={{ x: 1800 }}
              size="large"
              style={{ 
                width: '100%',
                fontSize: '16px'
              }}
              pagination={{ 
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} clients`,
                // Optionnel: maintenir le tri même avec la pagination
                onChange: (page, pageSize) => {
                  // Le tri est déjà appliqué aux données, pas besoin d'action spéciale
                }
              }}
              // Configuration du tri par défaut dans le tableau
              defaultSorter={{
                columnKey: 'nom', // Ou la clé de votre colonne nom
                order: 'descend' // Changé en ordre décroissant
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal du formulaire */}
      <Modal
        title={
          <div style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1e293b',
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
            borderRadius: '16px',
            overflow: 'hidden',
            padding: 0,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)'
          },
          header: {
            padding: '24px 32px 20px',
            borderBottom: '1px solid #f1f5f9',
            background: '#fafbfc'
          },
          body: {
            padding: '24px 32px 32px',
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
    </Content>
  );
};

export default ClientManagementPage;