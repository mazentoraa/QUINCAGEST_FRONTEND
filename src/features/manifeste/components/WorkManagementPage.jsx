import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Button, message, Table, Modal, 
  Form, Input, InputNumber, Select, Space, Popconfirm, Spin,
  Divider, Card, List, Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import debounce from 'lodash/debounce';
import WorkService from '../services/WorkService';
import ClientService from '../services/ClientService';
import ProductService from '../services/ProductService';
import WorkModel from '../models/WorkModel';
// Import the RawMaterialService
import RawMaterialService from '../services/RawMaterialService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const WorkManagementPage = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [form] = Form.useForm();
  
  // For client and product selection
  const [clientOptions, setClientOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  
  // Add new state for client materials
  const [clientMaterials, setClientMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  useEffect(() => {
    fetchWorks();
    fetchInitialOptions();
  }, []);

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const data = await WorkService.getAllWorks();
      setWorks(data);
    } catch (error) {
      message.error('Erreur lors du chargement des travaux');
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialOptions = async () => {
    try {
      // Fetch initial clients for dropdown
      const clients = await ClientService.getAllClients();
      setClientOptions(clients.map(client => ({
        label: client.nom_client,
        value: client.id
      })));
      
      // Fetch initial products for dropdown
      const products = await ProductService.getAllProducts();
      setProductOptions(products.map(product => ({
        label: product.nom_produit,
        value: product.id
      })));
    } catch (error) {
      message.error('Erreur lors du chargement des options');
    }
  };

  const handleSearch = async (value, type) => {
    if (value.length < 2) return;
    
    if (type === 'client') {
      setClientSearchLoading(true);
      try {
        const clients = await ClientService.searchClients(value);
        setClientOptions(clients.map(client => ({
          label: client.nom_client,
          value: client.id
        })));
      } catch (error) {
        console.error('Error searching clients:', error);
      } finally {
        setClientSearchLoading(false);
      }
    } else if (type === 'product') {
      setProductSearchLoading(true);
      try {
        const products = await ProductService.searchProducts(value);
        setProductOptions(products.map(product => ({
          label: product.nom_produit,
          value: product.id
        })));
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setProductSearchLoading(false);
      }
    }
  };

  const debouncedSearch = debounce(handleSearch, 500);

  const handleAdd = () => {
    form.resetFields();
    setEditingWork(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingWork(record);
    form.setFieldsValue({
      client_id: record.client_id,
      produit_id: record.produit_id,
      duree: record.duree,
      quantite: record.quantite,
      description: record.description
    });
    
    // Fetch materials for this client
    handleClientChange(record.client_id);
    
    // Pre-populate selected materials if record has matiere_usages
    if (record.matiere_usages && record.matiere_usages.length > 0) {
      const initialSelectedMaterials = record.matiere_usages.map(usage => ({
        materialId: usage.matiere_id,
        quantite: usage.quantite_utilisee
      }));
      setSelectedMaterials(initialSelectedMaterials);
    } else {
      setSelectedMaterials([]);
    }
    
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await WorkService.deleteWork(id);
      message.success('Travail supprimé avec succès');
      fetchWorks();
    } catch (error) {
      message.error('Erreur lors de la suppression');
    }
  };

  const handleClientChange = async (clientId) => {
    if (!clientId) return;
    
    setLoadingMaterials(true);
    try {
      console.log('Fetching materials for client ID:', clientId);
      const materials = await RawMaterialService.get_materials_by_client_id(clientId);
      console.log('Retrieved materials:', materials);
      setClientMaterials(materials);
      setSelectedMaterials([]); // Reset selected materials when client changes
    } catch (error) {
      console.error('Error fetching client materials:', error);
      message.error('Erreur lors du chargement des matières premières');
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleMaterialSelect = (materialId, quantite) => {
    const existingIndex = selectedMaterials.findIndex(m => m.materialId === materialId);
    
    if (existingIndex >= 0) {
      const updatedMaterials = [...selectedMaterials];
      updatedMaterials[existingIndex].quantite = quantite;
      setSelectedMaterials(updatedMaterials);
    } else {
      setSelectedMaterials([...selectedMaterials, { materialId, quantite }]);
    }
  };
  
  const handleRemoveMaterial = (materialId) => {
    setSelectedMaterials(selectedMaterials.filter(m => m.materialId !== materialId));
  };

  const handleSubmit = async (values) => {
    try {
      const workData = {
        ...values,
        materialsUsed: selectedMaterials
      };
      
      if (editingWork) {
        await WorkService.updateWork(editingWork.id, workData);
        message.success('Travail mis à jour avec succès');
      } else {
        await WorkService.createWork(workData);
        message.success('Travail ajouté avec succès');
      }
      setIsModalVisible(false);
      fetchWorks();
      
      setSelectedMaterials([]);
      setClientMaterials([]);
    } catch (error) {
      message.error('Erreur lors de l\'enregistrement');
    }
  };

  const columns = [
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client',
      render: (text, record) => (
        <Space>
          {record.client_name || record.client?.nom_client || 'N/A'}
          {record.client_id && (
            <Link to={`/clients/${record.client_id}`} style={{ color: 'inherit' }}>
              <ArrowRightOutlined style={{ fontSize: '12px' }} />
            </Link>
          )}
        </Space>
      ),
    },
    {
      title: 'Produit',
      dataIndex: 'produit_name',
      key: 'produit',
      render: (text, record) => (
        <Space>
          {record.produit_name || record.produit?.nom_produit || 'N/A'}
          {record.produit_id && (
            <Link to={`/products/${record.produit_id}`} style={{ color: 'inherit' }}>
              <ArrowRightOutlined style={{ fontSize: '12px' }} />
            </Link>
          )}
        </Space>
      ),
    },
    {
      title: 'Durée (heures)',
      dataIndex: 'duree',
      key: 'duree',
    },
    {
      title: 'Quantité',
      dataIndex: 'quantite',
      key: 'quantite',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Matériaux utilisés',
      key: 'materials',
      render: (_, record) => (
        record.matiere_usages && record.matiere_usages.length > 0 ? (
          <span>{record.matiere_usages.length} matière(s) utilisée(s)</span>
        ) : (
          <span>Aucun</span>
        )
      )
    },
    {
      title: 'Date de création',
      dataIndex: 'date_creation',
      key: 'date_creation',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Modifier
          </Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce travail?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button icon={<DeleteOutlined />} danger>
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Title level={2}>Gestion des Travaux</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            Ajouter un travail
          </Button>
        </div>
        
        <Table
          loading={loading}
          columns={columns}
          dataSource={works}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editingWork ? "Modifier un travail" : "Ajouter un travail"}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="client_id"
              label="Client"
              rules={[{ required: true, message: 'Veuillez sélectionner un client' }]}
            >
              <Select
                showSearch
                placeholder="Rechercher un client..."
                filterOption={false}
                onSearch={(value) => debouncedSearch(value, 'client')}
                onChange={(value) => {
                  console.log('Client selected:', value);
                  handleClientChange(value);
                }}
                loading={clientSearchLoading}
                notFoundContent={clientSearchLoading ? <Spin size="small" /> : null}
                options={clientOptions}
              />
            </Form.Item>

            {clientMaterials.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Divider orientation="left">Matières Premières Disponibles</Divider>
                <List
                  loading={loadingMaterials}
                  dataSource={clientMaterials}
                  renderItem={(material) => (
                    <List.Item>
                      <Card 
                        style={{ width: '100%' }} 
                        size="small"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Tag color="blue">{material.type_matiere || material.materialType}</Tag>
                            <span>{material.thickness}mm × {material.length}mm × {material.width}mm</span>
                            <div>
                              <Text type="secondary">Disponible: {material.remainingQuantity || material.quantite}</Text>
                            </div>
                          </div>
                          <div>
                            <InputNumber 
                              min={1} 
                              max={material.remainingQuantity || material.quantite} 
                              onChange={(value) => handleMaterialSelect(material.id, value)}
                              addonAfter="pièces"
                              placeholder="Qté"
                              style={{ width: 120 }}
                            />
                            <Button 
                              type="link"
                              onClick={() => handleRemoveMaterial(material.id)}
                            >
                              Retirer
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />

                {selectedMaterials.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5}>Matières sélectionnées</Title>
                    <List
                      size="small"
                      bordered
                      dataSource={selectedMaterials}
                      renderItem={(item) => {
                        const material = clientMaterials.find(m => m.id === item.materialId);
                        return (
                          <List.Item>
                            <Text>{material?.type_matiere || material?.materialType} ({material?.thickness}mm) - {item.quantite} pièce(s)</Text>
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <Form.Item
              name="produit_id"
              label="Produit"
              rules={[{ required: true, message: 'Veuillez sélectionner un produit' }]}
            >
              <Select
                showSearch
                placeholder="Rechercher un produit..."
                filterOption={false}
                onSearch={(value) => debouncedSearch(value, 'product')}
                loading={productSearchLoading}
                notFoundContent={productSearchLoading ? <Spin size="small" /> : null}
                options={productOptions}
              />
            </Form.Item>

            <Form.Item
              name="duree"
              label="Durée (heures)"
              rules={[{ required: true, message: 'Veuillez saisir la durée' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="quantite"
              label="Quantité"
              rules={[{ required: true, message: 'Veuillez saisir la quantité' }]}
            >
              <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={4} placeholder="Description du travail..." />
            </Form.Item>

            <Divider />

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={() => {
                  setIsModalVisible(false);
                  setSelectedMaterials([]);
                  setClientMaterials([]);
                }}>
                  Annuler
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingWork ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Content>
  );
};

export default WorkManagementPage;
