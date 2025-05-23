import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  InputNumber, 
  Select, 
  Divider, 
  Space, 
  notification,
  Popconfirm,
  AutoComplete,
  Empty,
  Spin,
  message,
  Switch,
  Tag
} from 'antd';
import { PlusOutlined, PrinterOutlined, SaveOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import RawMaterialService from '../../clientManagement/services/RawMaterialService';
import ClientService from '../../clientManagement/services/ClientService';
import ClientMaterialService from '../services/ClientMaterialService';
import moment from 'moment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import debounce from 'lodash/debounce';

const { Title, Text } = Typography;
const { Option } = Select;

const ClientRawMaterialsPage = () => {  // State for client search and selection
  const [searchText, setSearchText] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchOptions, setSearchOptions] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [viewAllMaterials, setViewAllMaterials] = useState(false);

  // Existing states from the original component
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRowsData, setSelectedRowsData] = useState([]);
  const [form] = Form.useForm();

  // Material type filter state
  const [materialTypeFilter, setMaterialTypeFilter] = useState(null);

  // Modal for bill preparation
  const [isBillModalVisible, setIsBillModalVisible] = useState(false);
  const [billDate, setBillDate] = useState(moment().format('YYYY-MM-DD'));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [billableData, setBillableData] = useState([]);

  // Material types options
  const material_types = [
    { value: "acier", label: "Acier" },
    { value: "acier_inoxydable", label: "Acier inoxydable" },
    { value: "aluminium", label: "Aluminium" },
    { value: "laiton", label: "Laiton" },
    { value: "cuivre", label: "Cuivre" },
    { value: "acier_galvanise", label: "Acier galvanisé" },
    { value: "autre", label: "Autre" },
  ];
  // Fetch initial clients for dropdown on component mount
  useEffect(() => {
    const fetchInitialClients = async () => {
      try {
        setClientSearchLoading(true);
        const clientsData = await ClientService.search_clients('');
        setSearchOptions(clientsData.map(client => ({
          value: client.id,
          label: `${client.nom_client || client.name || client.client_name || 'Client sans nom'} (ID: ${client.id})`,
          client: client
        })));
      } catch (err) {
        console.error('Error fetching initial clients:', err);
        notification.error({
          message: 'Erreur',
          description: 'Impossible de récupérer la liste des clients.'
        });
      } finally {
        setClientSearchLoading(false);
      }
    };

    fetchInitialClients();
    
    // If view all materials is enabled, fetch all materials
    if (viewAllMaterials) {
      fetchAllMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAllMaterials]);

  // Handle client search with improved loading state and fewer requests
  const handleSearch = async (value) => {
    setSearchText(value);
    
    if (value.length < 2 && value.length > 0) return;
    
    setClientSearchLoading(true);
    
    try {
      const clientsData = await ClientService.search_clients(value);
      
      setSearchOptions(clientsData.map(client => ({
        value: client.id,
        label: `${client.nom_client || client.name || client.client_name || 'Client sans nom'} (ID: ${client.id})`,
        client: client
      })));
    } catch (err) {
      console.error('Error searching clients:', err);
      notification.error({
        message: 'Erreur',
        description: 'Erreur lors de la recherche des clients.'
      });
    } finally {
      setClientSearchLoading(false);
    }
  };

  // Create a debounced search function with longer delay to reduce requests
  const debouncedSearch = debounce(handleSearch, 800);
  // Handle client selection
  const handleClientSelect = (value, option) => {
    // If we switch to showing specific client materials, disable "view all" mode
    if (viewAllMaterials) {
      setViewAllMaterials(false);
    }
    setSelectedClient(option.client);
    fetchClientMaterials(option.value);
  };

  // Function to get readable material type label
  const getMaterialTypeLabel = (type) => {
    const materialType = material_types.find(item => item.value === type);
    return materialType ? materialType.label : type;
  };



  // Fetch all client materials
  const fetchAllMaterials = async () => {
    setLoading(true);
    try {
      const response = await RawMaterialService.get_all_materials();
      
      // Get unique client IDs from the materials, filtering out null/undefined values
      console.log('Fetched materials:', response);
      const clientIds = [...new Set(response.map(material => material.client_id).filter(Boolean))];
      
      // Fetch client information for all valid client IDs
      const clientsPromises = clientIds.map(clientId => 
        ClientService.get_client_by_id(clientId)
          .catch(error => {
            console.error(`Error fetching client ${clientId}:`, error);
            return { id: clientId, client_name: `Client ID: ${clientId}` };
          })
      );
      
      const clients = await Promise.all(clientsPromises);
      
      // Create a map of client ID to client name for quick lookup
      const clientMap = clients.reduce((map, client) => {
        map[client.id] = client.nom_client || client.name || client.client_name || `Client ID: ${client.id}`;
        return map;
      }, {});
      
      // Transform the data to include client name and formatted material types
      const formattedMaterials = response.map(material => ({
        ...material,
        // Handle null/undefined client_id
        client_name: material.client_id ? (clientMap[material.client_id] || `Client ID: ${material.client_id}`) : 'Sans client',
        display_type: getMaterialTypeLabel(material.type_matiere)
      }));
      
      setMaterials(formattedMaterials);
    } catch (err) {
      console.error('Error fetching all materials:', err);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de récupérer la liste complète des matières premières.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle view all materials
  const handleToggleViewAllMaterials = (checked) => {
    setViewAllMaterials(checked);
    if (checked) {
      setSelectedClient(null);
      setSelectedRowKeys([]);
      setSelectedRowsData([]);
      fetchAllMaterials();
    } else if (selectedClient) {
      // If a client was selected before, revert to showing only their materials
      fetchClientMaterials(selectedClient.id);
    } else {
      // If no client was selected, clear the materials
      setMaterials([]);
    }
  };
  // Fetch client materials when a client is selected
  const fetchClientMaterials = async (clientId) => {
    setLoading(true);
    try {
      const response = await RawMaterialService.get_materials_by_client_id(clientId);
      // Transform the data to display formatted material types
      const formattedMaterials = response.map(material => ({
        ...material,
        display_type: getMaterialTypeLabel(material.type_matiere)
      }));
      setMaterials(formattedMaterials);
    } catch (err) {
      console.error('Error fetching materials:', err);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de récupérer la liste des matières premières.'
      });
    } finally {
      setLoading(false);
    }
  };// Enhanced columns with client information for "view all" mode
  const getColumns = () => {
    // Client column to show when viewing all materials
    const clientColumn = viewAllMaterials ? [
      {
        title: 'Client',
        dataIndex: 'client_name',
        key: 'client_name',
        render: (text, record) => record.client_name || `Client ID: ${record.client_id}` || '-',
      }
    ] : [];
    
    return [
      ...clientColumn,
      {
        title: 'N° Bon de livraison',
        dataIndex: 'numero_bon',
        key: 'numero_bon',
        render: (numero_bon, record) => record.numero_bon || '-',
      },
    {
      title: 'Date de réception',
      dataIndex: 'reception_date',
      key: 'reception_date',
      render: (date, record) => {
        const value = record.reception_date || date;
        return value ? moment(value).format('YYYY-MM-DD') : '-';
      },
    },
    {
      title: 'Type de matériau',
      dataIndex: 'type_matiere',
      key: 'type_matiere',
      render: (type) => {
        const label = getMaterialTypeLabel(type);
        return <Tag color={getMaterialTypeColor(type)}>{label}</Tag>;
      },
      filters: material_types.map(type => ({ text: type.label, value: type.value })),
      onFilter: (value, record) => record.type_matiere === value,
      filterMultiple: false,
    },
    {
      title: 'Épaisseur (mm)',
      dataIndex: 'thickness',
      key: 'thickness',
    },
    {
      title: 'Longueur (mm)',
      dataIndex: 'length',
      key: 'length',
    },
    {
      title: 'Largeur (mm)',
      dataIndex: 'width',
      key: 'width',
    },
    {
      title: 'Quantité',
      dataIndex: 'quantite',
      key: 'quantite',
    },
    {
      title: 'Quantité restante',
      dataIndex: 'remaining_quantity',
      key: 'remaining_quantity',
      render: (remaining, record) => {
        // Show '-' if remaining_quantity is not provided from backend
        if (remaining === undefined || remaining === null) {
          return '-';
        }
        
        // Style the cell based on quantity
        const style = {};
        if (remaining === 0) {
          style.color = 'red';
        } else if (remaining < record.quantite * 0.2) { // Less than 20% remaining
          style.color = 'orange';
        }
        
        return <span style={style}>{remaining}</span>;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            aria-label="Modifier"
          />
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette matière première?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button 
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              aria-label="Supprimer"
            />
          </Popconfirm>
        </Space>
      ),
    },  ];
  };
  // Get color for material type tag
  const getMaterialTypeColor = (type) => {
    switch(type) {
      case 'acier': return 'blue';
      case 'acier_inoxydable': return 'cyan';
      case 'aluminium': return 'silver';
      case 'laiton': return 'gold';
      case 'cuivre': return 'orange';
      case 'acier_galvanise': return 'purple';
      default: return 'default';
    }
  };

  // Filter materials by type (for the dropdown filter)
  const handleMaterialTypeFilterChange = (value) => {
    setMaterialTypeFilter(value);
  };

  // Get filtered materials based on material type filter
  const getFilteredMaterials = () => {
    if (!materialTypeFilter) {
      return materials;
    }
    
    return materials.filter(material => material.type_matiere === materialTypeFilter);
  };
  // Edit handler
  const handleEdit = (material) => {
    // If we're in "view all materials" mode and the selected client doesn't match
    // the material's client, we need to fetch the client first
    if (viewAllMaterials && (!selectedClient || selectedClient.id !== material.client_id)) {
      // Fetch client information before editing
      ClientService.get_client_by_id(material.client_id)
        .then(client => {
          setSelectedClient(client);
          setEditingMaterial(material);
          
          // Ensure the reception_date is properly formatted for the DatePicker
          const formattedMaterial = {
            ...material,
            // Convert string date to moment object for DatePicker
            reception_date: material.reception_date ? moment(material.reception_date) : null
          };
          
          console.log("Setting form values:", formattedMaterial);
          form.setFieldsValue(formattedMaterial);
          setIsModalVisible(true);
        })
        .catch(err => {
          console.error('Error fetching client:', err);
          notification.error({
            message: 'Erreur',
            description: 'Impossible de récupérer les informations du client pour cette matière.'
          });
        });
    } else {
      setEditingMaterial(material);
      
      // Ensure the reception_date is properly formatted for the DatePicker
      const formattedMaterial = {
        ...material,
        // Convert string date to moment object for DatePicker
        reception_date: material.reception_date ? moment(material.reception_date) : null
      };
      
      console.log("Setting form values:", formattedMaterial);
      form.setFieldsValue(formattedMaterial);
      setIsModalVisible(true);
    }
  };
  // Delete handler
  const handleDelete = async (id) => {
    try {
      await RawMaterialService.delete_material(id);
      setMaterials(materials.filter(material => material.id !== id));
      notification.success({
        message: 'Succès',
        description: 'Matière première supprimée avec succès.'
      });
    } catch (err) {
      console.error('Error deleting material:', err);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de supprimer la matière première.'
      });
    }
  };

  // Generate delivery note number
  const generateDeliveryNote = () => {
    const year = moment().format('YYYY');
    const randomNumber = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `BL-${year}-${randomNumber}`;
  };

  // Add new material handler
  const handleAdd = () => {
    if (!selectedClient) {
      notification.error({
        message: 'Erreur',
        description: 'Veuillez sélectionner un client avant d\'ajouter une matière première.'
      });
      return;
    }
    
    const initialValues = {
      numero_bon: generateDeliveryNote(),
      reception_date: moment(), // Use moment object for current date
      type_matiere: undefined,
      thickness: undefined,
      length: undefined,
      width: undefined,
      quantite: undefined,
      description: undefined,
    };
    
    console.log("Setting initial form values:", initialValues);
    form.setFieldsValue(initialValues);
    setEditingMaterial(null);
    setIsModalVisible(true);
  };  // Process selected materials handler
  const handleProcessSelectedMaterials = async () => {
    if (!selectedRowsData || selectedRowsData.length === 0) {
      notification.error({ message: 'Aucune matière sélectionnée' });
      return;
    }
    
    // In "view all materials" mode, we need to check if all selected materials are from the same client
    if (viewAllMaterials) {
      const clientIds = new Set(selectedRowsData.map(material => material.client_id));
      
      // If more than one client is selected, show an error
      if (clientIds.size > 1) {
        notification.error({ 
          message: 'Sélection invalide', 
          description: 'Veuillez sélectionner uniquement des matières du même client pour préparer une facture.' 
        });
        return;
      }
      
      // If we don't have a selected client yet, fetch the client info
      if (!selectedClient && clientIds.size === 1) {
        const clientId = Array.from(clientIds)[0];
        try {
          const client = await ClientService.get_client_by_id(clientId);
          setSelectedClient(client);
        } catch (err) {
          console.error('Error fetching client:', err);
          notification.error({
            message: 'Erreur',
            description: 'Impossible de récupérer les informations du client.'
          });
          return;
        }
      }
    }
    
    // Set materials for billing
    setBillableData(selectedRowsData);
    
    try {
      // Generate new invoice number
      const newInvoiceNumber = selectedRowsData[0].numero_bon;
      setInvoiceNumber(newInvoiceNumber);
      
      // Set current date as default
      setBillDate(moment().format('YYYY-MM-DD'));
      
      // Show bill modal
      setIsBillModalVisible(true);
      
    } catch (err) {
      console.error('Error preparing invoice:', err);
      notification.error({
        message: 'Erreur',
        description: 'Un problème est survenu lors de la préparation de la facture.'
      });
    }
  };

  // Print bill handler
  const handlePrintBill = () => {
    // Generate PDF with jsPDF and autoTable
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Facture Matières Premières', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Facture N°: ${invoiceNumber}`, 14, 25);
    doc.text(`Date: ${billDate}`, 150, 25);

    const clientName = selectedClient 
      ? (selectedClient.nom_client || selectedClient.name || selectedClient.client_name || 'N/A') 
      : 'N/A';
    doc.text(`Client: ${clientName}`, 14, 32);
    doc.text(`ID Client: ${selectedClient ? selectedClient.id : ''}`, 150, 32);

    // Table of materials
    autoTable(doc, {
      startY: 40,
      head: [[
        'N° Bon', 'Date réception', 'Type', 'Épaisseur', 'Longueur', 'Largeur', 'Quantité', 'Description'
      ]],
      body: billableData.map(item => [
        item.numero_bon,
        item.reception_date ? moment(item.reception_date).format('YYYY-MM-DD') : '',
        getMaterialTypeLabel(item.type_matiere),
        item.thickness,
        item.length,
        item.width,
        item.quantite,
        item.description || ''
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [50, 50, 50] }
    });

    // Total quantity
    const total = billableData.reduce((sum, item) => sum + (item.quantite || 0), 0);
    doc.text(`Total quantité: ${total}`, 14, doc.lastAutoTable.finalY + 10);

    doc.save(`facture-matieres-${invoiceNumber}.pdf`);

    // Optional: launch print after download
    notification.success({ message: 'Facture téléchargée et impression lancée' });
  };
  // Save bill handler
  const handleSaveBill = async () => {
    try {
      if (!billableData || billableData.length === 0) {
        notification.error({ message: 'Aucune matière à facturer' });
        return;
      }
      
      if (!selectedClient) {
        notification.error({ message: 'Client non sélectionné' });
        return;
      }
      
      const materialIds = billableData.map(material => material.id);
      
      const invoiceData = {
        client: selectedClient.id,
        matieres: materialIds,
        numero_bon: invoiceNumber,
        date_reception: billDate,
        tax_rate: 19, // Default tax rate
        notes: "Facture générée automatiquement"
      };
      
      // If editing (invoice number exists in the database), update instead of create
      let response;
      
      // Show loading message
      message.loading({ content: 'Enregistrement de la facture...', key: 'savingInvoice' });
      
      response = await ClientMaterialService.createMaterialInvoice(invoiceData);
      
      // Update the invoice number with the generated one (if it was empty)
      if (response && response.numero_bon) {
        setInvoiceNumber(response.numero_bon);
      }
      
      message.success({ 
        content: 'Facture enregistrée avec succès', 
        key: 'savingInvoice', 
        duration: 2 
      });
      
      // Close the modal after successful save if needed
      // setIsBillModalVisible(false);
    } catch (err) {
      console.error('Error saving invoice:', err);
      notification.error({ 
        message: 'Erreur lors de la sauvegarde',
        description: err.message || 'Une erreur est survenue lors de la sauvegarde de la facture'
      });
    }
  };

  // Form submission handler
  const handleSubmit = async (values) => {
    try {
      let newMaterial;
      // Make sure we have a client selected
      if (!selectedClient) {
        notification.error({
          message: 'Erreur',
          description: 'Aucun client sélectionné.'
        });
        return;
      }
      
      const clientId = selectedClient.id;
      
      // Ensure reception_date is properly formatted before sending to API
      const formattedValues = { 
        ...values,
        // Handle the date properly - make sure it's a string in YYYY-MM-DD format
        reception_date: values.reception_date && typeof values.reception_date === 'object' && values.reception_date.format 
          ? values.reception_date.format('YYYY-MM-DD')
          : (typeof values.reception_date === 'string' ? values.reception_date : moment(values.reception_date).format('YYYY-MM-DD')),
        client_id: clientId
      };
      
      console.log('Submitting values:', formattedValues);
      
      if (editingMaterial) {
        // Update existing material
        newMaterial = await RawMaterialService.update_material(editingMaterial.id, formattedValues);
        // Add display_type for the updated material
        newMaterial.display_type = getMaterialTypeLabel(newMaterial.type_matiere);
        setMaterials(materials.map(material => 
          material.id === editingMaterial.id ? newMaterial : material
        ));
        notification.success({
          message: 'Succès',
          description: 'Matière première modifiée avec succès.'
        });
      } else {
        // Add new material
        newMaterial = await RawMaterialService.add_material_to_client(clientId, formattedValues);
        // Add display_type for the new material
        newMaterial.display_type = getMaterialTypeLabel(newMaterial.type_matiere);
        setMaterials([...materials, newMaterial]);
        notification.success({
          message: 'Succès',
          description: 'Matière première ajoutée avec succès.'
        });
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingMaterial(null);
    } catch (err) {
      console.error('Error saving material:', err);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de sauvegarder la matière première.'
      });
    }
  };

  // Cancel form handler
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingMaterial(null);
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const date = moment().format('YYYYMMDD');
    // Use MAT- prefix to match the backend format from FactureMatiereSerializer
    return `MAT-${date}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  };

  // Row selection for table
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      setSelectedRowsData(rows);
    },
  };

  return (
    <div className="client-materials-container">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <Title level={2}>Matières Premières Client</Title>
            <Text type="secondary">
              Gestion des matières premières reçues des clients pour la production
            </Text>
          </div>
        </div>        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Title level={4}>Rechercher un client</Title>
            <div>
              <Switch 
                checked={viewAllMaterials} 
                onChange={handleToggleViewAllMaterials} 
                style={{ marginRight: 8 }}
              />
              <Text>Voir toutes les matières premières</Text>
            </div>
          </div>
          
          {!viewAllMaterials && (
            <div style={{ display: 'flex', gap: 16 }}>
              <AutoComplete
                style={{ width: '100%' }}
                options={searchOptions}
                onSearch={(value) => debouncedSearch(value)}
                onSelect={handleClientSelect}
                placeholder="Rechercher par nom ou ID client"
                value={searchText}
                onChange={setSearchText}
                notFoundContent={clientSearchLoading ? <Spin size="small" /> : 'Aucun client trouvé'}
              />
            </div>
          )}
        </div>

        {(selectedClient || viewAllMaterials) && (
          <>            {/* Show client info card only when a client is selected and not when viewing all materials only */}
            {selectedClient && (
              <div className="client-info" style={{ marginBottom: 16 }}>
                <Card size="small" title="Client sélectionné">
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <Text strong>Nom du client: </Text>
                      <Text>{selectedClient.nom_client || selectedClient.name || selectedClient.client_name || 'N/A'}</Text>
                    </div>
                    <Divider type="vertical" />
                    <div>
                      <Text strong>ID Client: </Text>
                      <Text>{selectedClient.id || 'N/A'}</Text>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            {/* Show status message when in "view all" mode */}
            {viewAllMaterials && !selectedClient && (
              <div style={{ marginBottom: 16 }}>
                <Card size="small">
                  <Text strong>Affichage de toutes les matières premières de tous les clients</Text>
                </Card>
              </div>
            )}<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {/* Only show Add material button when not in "view all" mode */}
                {!viewAllMaterials && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                  >
                    Ajouter une matière première
                  </Button>
                )}
                
                {/* Add filter dropdown */}
                <Select
                  style={{ width: 200 }}
                  placeholder="Filtrer par type de matériau"
                  onChange={handleMaterialTypeFilterChange}
                  value={materialTypeFilter}
                  allowClear
                >
                  {material_types.map(type => (
                    <Option key={type.value} value={type.value}>
                      <Tag color={getMaterialTypeColor(type.value)} style={{ marginRight: 5 }}>{type.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </div>
              
              {/* Only show right-side button if we have selections */}
              {selectedRowKeys.length > 0 ? (
                <Button
                  type="primary"
                  onClick={handleProcessSelectedMaterials}
                >
                  Préparer le bon de livraison ({selectedRowKeys.length} matière(s) sélectionnée(s))
                </Button>
              ) : (
                /* Empty div to maintain flex layout when no selections */
                <div></div>
              )}
            </div><Table
              columns={getColumns()}
              dataSource={materialTypeFilter ? getFilteredMaterials() : materials}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              rowSelection={rowSelection}
            />
          </>
        )}        {!selectedClient && !viewAllMaterials && !loading && (
          <Empty 
            description="Veuillez sélectionner un client ou utiliser l'option 'Voir toutes les matières premières'"
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        )}
      </Card>

      {/* Modal for adding or editing material */}
      <Modal
        title={editingMaterial ? "Modifier une matière première" : "Réception de matière première client"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {selectedClient && (
            <div style={{ marginBottom: 16 }}>
              <Title level={4}>Informations client</Title>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  label="Nom du client"
                  style={{ flex: 1 }}
                >
                  <Input value={selectedClient.nom_client || selectedClient.name || selectedClient.client_name || 'N/A'} disabled />
                </Form.Item>
                <Form.Item
                  label="ID Client"
                  style={{ flex: 1 }}
                >
                  <Input value={selectedClient.id} disabled />
                </Form.Item>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Informations livraison</Title>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="numero_bon"
                label="N° Bon de livraison"
                rules={[{ required: true, message: 'Veuillez saisir le numéro de bon de livraison' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Ex: BL-2023-001" disabled={editingMaterial === null} />
              </Form.Item>
              <Form.Item
                name="reception_date"
                label="Date de réception"
                rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}
                style={{ flex: 1 }}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Caractéristiques du matériau</Title>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="type_matiere"
                label="Type de matériau"
                rules={[{ required: true, message: 'Veuillez sélectionner un type de matériau' }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="Sélectionnez un type">
                  {material_types.map(type => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="thickness"
                label="Épaisseur (mm)"
                rules={[{ required: true, message: 'Veuillez saisir l\'épaisseur' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={1} />
              </Form.Item>
            </div>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="length"
                label="Longueur (mm)"
                rules={[{ required: true, message: 'Veuillez saisir la longueur' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item
                name="width"
                label="Largeur (mm)"
                rules={[{ required: true, message: 'Veuillez saisir la largeur' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item
                name="quantite"
                label="Quantité"
                rules={[{ required: true, message: 'Veuillez saisir la quantité' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={1} precision={0} />
              </Form.Item>
            </div>
            
            <Form.Item
              name="description"
              label="Description / Observations"
            >
              <Input.TextArea rows={4} placeholder="Observations supplémentaires sur la matière première..." />
            </Form.Item>
          </div>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
              <Button onClick={handleCancel}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit">
                {editingMaterial ? 'Mettre à jour' : 'Enregistrer'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for bill preparation */}
      <Modal
        title="Préparation de bon de livraison"
        open={isBillModalVisible}
        width={900}
        onCancel={() => setIsBillModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsBillModalVisible(false)}>
            Annuler
          </Button>,
          <Button 
            key="save" 
            icon={<SaveOutlined />}
            onClick={handleSaveBill}
          >
            Sauvegarder
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={handlePrintBill}
          >
            Imprimer la facture
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <div className="client-info">
            <Text strong>Client: </Text>
            <Text>{selectedClient ? (selectedClient.nom_client || selectedClient.name || selectedClient.client_name || 'N/A') : 'N/A'}</Text>
            <Divider type="vertical" />
            <Text strong>ID Client: </Text>
            <Text>{selectedClient?.id || 'N/A'}</Text>
          </div>
        </div>
        
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
          <Text strong>Facture N°: </Text>
          <Input
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        <div>
          <Form layout="vertical">
            <Form.Item label="Date de facturation">
              <DatePicker 
                style={{ width: '100%' }}
                value={moment(billDate)}
                onChange={(date) => setBillDate(date ? date.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'))}
              />
            </Form.Item>
          </Form>
          <Divider />
          <Table
            dataSource={billableData}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'N° Bon de livraison',
                dataIndex: 'numero_bon',
                key: 'numero_bon',
                render: (text, record, idx) => (
                  <Input
                    value={record.numero_bon}
                    onChange={e => {
                      const newData = [...billableData];
                      newData[idx].numero_bon = e.target.value;
                      setBillableData(newData);
                    }}
                  />
                )
              },
              {
                title: 'Date de réception',
                dataIndex: 'reception_date',
                key: 'reception_date',
                render: (date, record, idx) => (
                  <DatePicker
                    style={{ width: '100%' }}
                    value={record.reception_date ? moment(record.reception_date) : null}
                    onChange={d => {
                      const newData = [...billableData];
                      newData[idx].reception_date = d ? d.format('YYYY-MM-DD') : '';
                      setBillableData(newData);
                    }}
                  />
                )
              },
              {
                title: 'Type de matériau',
                dataIndex: 'type_matiere',
                key: 'type_matiere',
                render: (type, record, idx) => (
                  <Select
                    value={record.type_matiere}
                    style={{ width: '100%' }}
                    onChange={value => {
                      const newData = [...billableData];
                      newData[idx].type_matiere = value;
                      setBillableData(newData);
                    }}
                  >
                    {material_types.map(typeOpt => (
                      <Option key={typeOpt.value} value={typeOpt.value}>{typeOpt.label}</Option>
                    ))}
                  </Select>
                )
              },
              {
                title: 'Épaisseur (mm)',
                dataIndex: 'thickness',
                key: 'thickness',
                render: (value, record, idx) => (
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    value={value}
                    onChange={val => {
                      const newData = [...billableData];
                      newData[idx].thickness = val;
                      setBillableData(newData);
                    }}
                  />
                )
              },
              {
                title: 'Quantité',
                dataIndex: 'quantite',
                key: 'quantite',
                render: (value, record, idx) => (
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    value={value}
                    onChange={val => {
                      const newData = [...billableData];
                      newData[idx].quantite = val;
                      setBillableData(newData);
                    }}
                  />
                )
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
                render: (value, record, idx) => (
                  <Input
                    value={value}
                    onChange={e => {
                      const newData = [...billableData];
                      newData[idx].description = e.target.value;
                      setBillableData(newData);
                    }}
                  />
                )
              },
            ]}
            summary={pageData => {
              const total = pageData.reduce((sum, item) => sum + (item.quantite || 0), 0);
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}><b>Total</b></Table.Summary.Cell>
                  <Table.Summary.Cell index={4}><b>{total}</b></Table.Summary.Cell>
                  <Table.Summary.Cell index={5} />
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ClientRawMaterialsPage;