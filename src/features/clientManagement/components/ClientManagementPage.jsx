import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import ClientTable from './ClientTable';
import ClientForm from './ClientForm';
import ClientService from '../services/ClientService';
import ClientModel from '../models/ClientModel';

const { Content } = Layout;
const { Title } = Typography;

const ClientManagementPage = () => {
  const [clients, set_clients] = useState([]);
  const [loading, set_loading] = useState(false);
  const [form_visible, set_form_visible] = useState(false);
  const [current_client, set_current_client] = useState(null);
  const [is_editing, set_is_editing] = useState(false);

  const navigate = useNavigate(); // ✅ React Router navigation

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
    navigate('/clients/trash'); // ✅ Navigation SPA
  };

  return (
    <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Title level={2}>Gestion des Clients</Title>
          <div>
            <Button 
              icon={<DeleteOutlined />}
              onClick={handle_go_to_trash}
              style={{ marginRight: '8px' }}
            >
              Corbeille
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handle_add_client}
            >
              Ajouter un client
            </Button>
          </div>
        </div>
        
        <ClientTable
          clients={clients}
          loading={loading}
          on_edit={handle_edit_client}
          on_delete={handle_delete_client}
        />

        <Modal
          title={is_editing ? "Modifier un client" : "Ajouter un client"}
          open={form_visible}
          onCancel={handle_form_cancel}
          footer={null}
          width={800}
        >
          <ClientForm
            initial_values={current_client}
            on_finish={handle_form_submit}
            on_cancel={handle_form_cancel}
            loading={loading}
            is_edit={is_editing}
          />
        </Modal>
      </div>
    </Content>
  );
};

export default ClientManagementPage;
