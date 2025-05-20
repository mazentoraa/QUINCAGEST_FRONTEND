import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Button, message, Table, Modal, 
  Form, Input, InputNumber, Select, Space, Popconfirm, Spin,
  Divider, Card, List, Tag, Badge
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ArrowRightOutlined, CheckOutlined 
} from '@ant-design/icons';
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
  
  // Add new state for client filter
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);

  // Add state for selected rows
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRowsData, setSelectedRowsData] = useState([]);

  useEffect(() => {
    fetchWorks();
    fetchInitialOptions();
  }, [selectedClientFilter]); // Re-fetch works when client filter changes

  const fetchWorks = async () => {
    setLoading(true);
    try {
      let data;
      if (selectedClientFilter) {
        // Fetch works for specific client
        data = await WorkService.getWorksByClientId(selectedClientFilter);
      } else {
        // Fetch all works
        data = await WorkService.getAllWorks();
      }
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

  // Improved function to handle selected works with their data
  const handleProcessSelectedWorks = async () => {
    if (selectedRowsData.length === 0) {
      message.warning('Veuillez sélectionner au moins un travail');
      return;
    }
    
    // Show loading state
    message.loading({ content: 'Récupération des détails...', key: 'materialsLoading' });
    
    try {
      // Process selected rows to include full material information
      const enrichedWorksData = await Promise.all(selectedRowsData.map(async (work) => {
        // Clone the work to avoid modifying the original
        const enrichedWork = { ...work };
        
        // Fetch client details if we only have ID
        if (work.client_id) {
          try {
            const clientData = await ClientService.getClientById(work.client_id);
            // Add the full client object to enrichedWork
            
            // Also add client fields directly to the work object for easier access
            enrichedWork.clientDetails = {
              nom_cf: clientData.nom_client,
              adresse: clientData.adresse,
              matricule_fiscale: clientData.numero_fiscal,
              tel: clientData.telephone,
              // Add any other client fields you need
              email: clientData.email,
              nom_responsable: clientData.nom_responsable,
              email_responsable: clientData.email_responsable,
              telephone_responsable: clientData.telephone_responsable,
              autre_numero: clientData.autre_numero
            };
          } catch (error) {
            console.error(`Error fetching client ${work.client_id}:`, error);
          }
        } else if (work.client) {
          // If client data is already present, still format it consistently
          enrichedWork.clientDetails = {
            nom_cf: work.client.nom_client,
            adresse: work.client.adresse,
            matricule_fiscale: work.client.numero_fiscal,
            tel: work.client.telephone,
            // Add any other client fields you need
            email: work.client.email,
            nom_responsable: work.client.nom_responsable,
            email_responsable: work.client.email_responsable,
            telephone_responsable: work.client.telephone_responsable,
            autre_numero: work.client.autre_numero
          };
        }
        
        // If work has material usages, fetch and add the material details
        if (work.matiere_usages && work.matiere_usages.length > 0) {
          // Fetch detailed material info for each matiere_id
          const materialsWithDetails = await Promise.all(
            work.matiere_usages.map(async (usage) => {
              try {
                // Fetch material details by ID
                const materialDetail = await RawMaterialService.getMaterialById(usage.matiere_id);
                
                // Combine the usage data with the material details
                return {
                  ...usage,
                  ...materialDetail, // This adds all properties from materialDetail
                  // Ensure we have the essential fields with fallbacks
                  type_matiere: materialDetail.type_matiere || usage.type_matiere || 'Type inconnu',
                  nom_matiere: materialDetail.nom_matiere || usage.nom_matiere || `Matière #${usage.matiere_id}`,
                  thickness: materialDetail.thickness,
                  length: materialDetail.length,
                  width: materialDetail.width
                };
              } catch (error) {
                console.error(`Error fetching material ${usage.matiere_id}:`, error);
                return {
                  ...usage,
                  type_matiere: usage.type_matiere || 'Type inconnu',
                  nom_matiere: usage.nom_matiere || `Matière #${usage.matiere_id}`
                };
              }
            })
          );
          
          enrichedWork.matiere_usages = materialsWithDetails;
        }
        
        return enrichedWork;
      }));
      
      console.log('Enriched works data with client details:', enrichedWorksData);
      
      // This is where you could call a function to process the enriched data
      // For example, export to PDF, send to another service, etc.
      // processEnrichedWorksData(enrichedWorksData);
      
      // Hide loading
      message.success({ content: 'Détails récupérés', key: 'materialsLoading', duration: 1 });
      
      // Show the modal with detailed information
      Modal.info({
        title: 'Travaux sélectionnés',
        width: 700,
        content: (
          <div>
            <p>{enrichedWorksData.length} travaux sélectionnés</p>
            <List
              size="small"
              dataSource={enrichedWorksData}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    {/* Client Information Block */}
                    <Card
                      size="small"
                      title="Information Client"
                      style={{ marginBottom: 16 }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                          <strong>Nom C/F : </strong>
                          {item.clientDetails?.nom_cf || item.client?.nom_client || item.client_name || 'N/A'}
                        </div>
                        <div>
                          <strong>Adresse : </strong>
                          {item.clientDetails?.adresse || item.client?.adresse || 'N/A'}
                        </div>
                        <div>
                          <strong>MatriculeFiscale : </strong>
                          {item.clientDetails?.matricule_fiscale || item.client?.numero_fiscal || 'N/A'}
                        </div>
                        <div>
                          <strong>Tel : </strong>
                          {item.clientDetails?.tel || item.client?.telephone || 'N/A'}
                        </div>
                      </div>
                    </Card>
                    
                    {/* Work Information */}
                    <div>
                      <strong>Produit:</strong> {item.produit_name}
                    </div>
                    
                    {/* Materials List */}
                    {item.matiere_usages && item.matiere_usages.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <strong>Matériaux utilisés:</strong>
                        <List
                          size="small"
                          dataSource={item.matiere_usages}
                          renderItem={(mat) => (
                            <List.Item>
                              <div style={{ width: '100%' }}>
                                <Space>
                                  <Tag color="blue">{mat.type_matiere}</Tag>
                                  <span>{mat.nom_matiere}</span>
                                </Space>
                                <div>
                                  <Text type="secondary">
                                    Dimensions: {mat.thickness ? `${mat.thickness}mm` : '-'} × 
                                    {mat.length ? `${mat.length}mm` : '-'} × 
                                    {mat.width ? `${mat.width}mm` : '-'}
                                  </Text>
                                </div>
                                <div>
                                  <Text strong>Quantité utilisée: {mat.quantite_utilisee}</Text>
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
        ),
        onOk() {
          // Provide access to the enriched data for downstream processing
          window.lastProcessedWorks = enrichedWorksData;
          console.log('Enriched data is available as window.lastProcessedWorks');
          
          // You could call a function here to further process the data
          // processSelectedWorksData(enrichedWorksData);
        },
      });
      
    } catch (error) {
      console.error('Error processing selected works:', error);
      message.error({ content: 'Erreur lors du traitement des sélections', key: 'materialsLoading' });
    }
  };
  
  // When fetching works, we should also get material details
  // Updated function to fetch complete material details for a work
  const fetchWorkWithMaterialDetails = async (workId) => {
    try {
      // Get the basic work data
      const workData = await WorkService.getWorkById(workId);
      
      if (!workData) return null;
      
      // If the work has material usages, fetch material details
      if (workData.matiere_usages && workData.matiere_usages.length > 0) {
        const enrichedMaterialUsages = await Promise.all(
          workData.matiere_usages.map(async (usage) => {
            try {
              // Get material details
              const materialDetail = await RawMaterialService.getMaterialById(usage.matiere_id);
              return { ...usage, ...materialDetail };
            } catch (error) {
              return usage; // Return original usage if fetching details fails
            }
          })
        );
        
        workData.matiere_usages = enrichedMaterialUsages;
      }
      
      return workData;
    } catch (error) {
      console.error('Error fetching work details:', error);
      return null;
    }
  };

  // Expanded row selection configuration to potentially fetch material details
  const rowSelection = {
    selectedRowKeys,
    onChange: async (keys, selectedRows) => {
      setSelectedRowKeys(keys);
      
      // If you need to fetch additional material details when selecting rows:
      /*
      const enrichedRows = await Promise.all(selectedRows.map(async (row) => {
        if (row.matiere_usages && row.matiere_usages.some(m => !m.material_name)) {
          // If any material is missing details, fetch them
          const workWithDetails = await fetchWorkWithMaterialDetails(row.id);
          return workWithDetails || row;
        }
        return row;
      }));
      setSelectedRowsData(enrichedRows);
      */
      
      // Otherwise just use the rows as they are
      setSelectedRowsData(selectedRows);
    },
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
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleProcessSelectedWorks}
              >
                Traiter {selectedRowKeys.length} travail(s) sélectionné(s)
              </Button>
            )}
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              Ajouter un travail
            </Button>
          </Space>
        </div>
        
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
          <Text strong style={{ marginRight: 12 }}>Filtrer par client:</Text>
          <Select
            style={{ width: 300 }}
            placeholder="Sélectionnez un client ou 'Tous'"
            onChange={(value) => setSelectedClientFilter(value)}
            value={selectedClientFilter}
            allowClear
            options={[
              { label: "Tous les clients", value: null },
              ...clientOptions
            ]}
            loading={clientSearchLoading}
          />
          {selectedClientFilter && (
            <Button 
              type="link" 
              onClick={() => setSelectedClientFilter(null)}
              style={{ marginLeft: 8 }}
            >
              Réinitialiser le filtre
            </Button>
          )}
        </div>
        
        {selectedClientFilter && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">
              {clientOptions.find(c => c.value === selectedClientFilter)?.label || 'Client sélectionné'}
            </Tag>
          </div>
        )}
        
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#108ee9' }}>
              <Tag color="processing">Travaux sélectionnés</Tag>
            </Badge>
            <Button 
              size="small" 
              type="link" 
              onClick={() => {
                setSelectedRowKeys([]);
                setSelectedRowsData([]);
              }}
            >
              Effacer la sélection
            </Button>
          </div>
        )}
        
        <Table
          rowSelection={rowSelection}
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
                              <span>
                                {material?.thickness != null ? `${material.thickness}mm` : '-'} × 
                                {material?.length != null ? `${material.length}mm` : '-'} × 
                                {material?.width != null ? `${material.width}mm` : '-'}
                              </span>
                            <div>
                              <Text type="secondary">Disponible: {material.remaining_quantity}</Text>
                            </div>
                          </div>
                          <div>
                            <InputNumber 
                              min={1} 
                              max={material.remaining_quantity} 
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
