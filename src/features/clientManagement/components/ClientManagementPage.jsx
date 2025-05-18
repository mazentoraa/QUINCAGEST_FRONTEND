import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, message, Modal, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ClientTable from './ClientTable';
import ClientForm from './ClientForm';
import ClientService from '../services/ClientService';

const { Content } = Layout;
const { Title } = Typography;

const ClientManagementPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await ClientService.getAllClients();
      setClients(data);
    } catch (error) {
      message.error('Erreur lors du chargement des clients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setCurrentClient(null);
    setIsEditing(false);
    setFormVisible(true);
  };

  const handleEditClient = (client) => {
    setCurrentClient(client);
    setIsEditing(true);
    setFormVisible(true);
  };

  const handleDeleteClient = async (clientId) => {
    setLoading(true);
    try {
      await ClientService.deleteClient(clientId);
      message.success('Client supprimé avec succès');
      fetchClients();
    } catch (error) {
      message.error('Erreur lors de la suppression du client');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (values) => {
    setLoading(true);
    try {
      if (isEditing) {
        await ClientService.updateClient(currentClient.id, values);
        message.success('Client mis à jour avec succès');
      } else {
        await ClientService.createClient(values);
        message.success('Client ajouté avec succès');
      }
      setFormVisible(false);
      fetchClients();
    } catch (error) {
      message.error('Erreur lors de l\'enregistrement du client');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setFormVisible(false);
  };

  return (
    <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Title level={2}>Gestion des Clients</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddClient}
          >
            Ajouter un client
          </Button>
        </div>
        
        <ClientTable
          clients={clients}
          loading={loading}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
        />

        <Modal
          title={isEditing ? "Modifier un client" : "Ajouter un client"}
          open={formVisible}
          onCancel={handleFormCancel}
          footer={null}
          width={800}
        >
          <ClientForm
            initialValues={currentClient}
            onFinish={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={loading}
            isEdit={isEditing}
          />
        </Modal>
      </div>
    </Content>
  );
};

export default ClientManagementPage;
