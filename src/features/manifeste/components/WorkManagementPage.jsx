import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Button, message, Table, Modal, 
  Form, Input, InputNumber, Select, Space, Popconfirm, Spin,
  Divider, Card, List, Tag, Badge, DatePicker, Row, Col
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ArrowRightOutlined, CheckOutlined, PrinterOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import debounce from 'lodash/debounce';
import moment from 'moment';
// Import jsPDF from pdfSetup and our custom table helper from pdfTableHelper
import { jsPDF } from '../../../utils/pdfSetup';
import { drawTable } from '../../../utils/pdfTableHelper';
import WorkService from '../services/WorkService';
import ClientService from '../services/ClientService';
import ProductService from '../services/ProductService';
// Import the RawMaterialService and InvoiceService
import RawMaterialService from '../services/RawMaterialService';
import InvoiceService from '../services/InvoiceService';  // Import CSS
import './WorkManagementPage.css';

const { Content } = Layout;
const { Title, Text } = Typography;
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
  
  // Add state for bill generation
  const [billableData, setBillableData] = useState([]);
  const [isBillModalVisible, setIsBillModalVisible] = useState(false);
  const [taxRate, setTaxRate] = useState(19); // Default tax rate of 19%
  const [billDate, setBillDate] = useState(moment().format('YYYY-MM-DD'));
  const [invoiceNumber, setInvoiceNumber] = useState(''); // State for invoice number
  
  // Add new state for client filter
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);

  // Add state for selected rows
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRowsData, setSelectedRowsData] = useState([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Function to handle selected works and prepare bill data
  const handleProcessSelectedWorks = async () => {
    try {
      if (!selectedRowsData || selectedRowsData.length === 0) {
        message.error('Aucun travail sélectionné');
        return;
      }

      // Show loading
      message.loading({ content: 'Récupération des détails...', key: 'materialsLoading' });

      // Process each work to add client and material details
      const enrichedWorksData = await Promise.all(selectedRowsData.map(async (work) => {
        const enrichedWork = { ...work };
        
        // Ensure client_id is always included and available
        if (!work.client_id && work.client?.id) {
          enrichedWork.client_id = work.client.id;
        }

        // If client data is not already present, fetch it
        if (enrichedWork.client_id && (!work.clientDetails || !work.client)) {
          try {
            const clientData = await ClientService.getClientById(enrichedWork.client_id);
            enrichedWork.clientDetails = {
              id: clientData.id, // Ensure client ID is preserved
              nom_cf: clientData.nom_client,
              adresse: clientData.adresse,
              matricule_fiscale: clientData.numero_fiscal,
              tel: clientData.telephone,
              email: clientData.email,
              nom_responsable: clientData.nom_responsable,
              email_responsable: clientData.email_responsable,
              telephone_responsable: clientData.telephone_responsable,
              autre_numero: clientData.autre_numero
            };
          } catch (error) {
            console.error(`Error fetching client ${enrichedWork.client_id}:`, error);
          }
        } else if (work.client) {
          // If client data is already present, still format it consistently
          enrichedWork.clientDetails = {
            id: work.client.id, // Ensure client ID is preserved
            nom_cf: work.client.nom_client,
            adresse: work.client.adresse,
            matricule_fiscale: work.client.numero_fiscal,
            tel: work.client.telephone,
            email: work.client.email,
            nom_responsable: work.client.nom_responsable,
            email_responsable: work.client.email_responsable,
            telephone_responsable: work.client.telephone_responsable,
            autre_numero: work.client.autre_numero
          };
        }

        // If material usage data is present but missing details, enrich it
        if (work.matiere_usages && work.matiere_usages.length > 0) {
          const enrichedMaterialUsages = await Promise.all(
            work.matiere_usages.map(async (usage) => {
              // If the usage already has all necessary data, just return it
              if (usage.nom_matiere && usage.type_matiere && usage.prix_unitaire) {
                return usage;
              }
              
              try {
                // Get material details
                const materialDetail = await RawMaterialService.getMaterialById(usage.matiere_id);
                return { 
                  ...usage, 
                  nom_matiere: materialDetail.nom_matiere || materialDetail.designation,
                  type_matiere: materialDetail.type_matiere,
                  prix_unitaire: materialDetail.prix_unitaire || 0,
                  thickness: materialDetail.thickness,
                  length: materialDetail.length,
                  width: materialDetail.width
                };
              } catch (error) {
                console.error(`Error fetching material details for ID ${usage.matiere_id}:`, error);
                return usage;
              }
            })
          );
          
          enrichedWork.matiere_usages = enrichedMaterialUsages;
        }

        // Add billable data fields with default values
        enrichedWork.billable = {
          date_facturation: moment().format('YYYY-MM-DD'),
          prix_unitaire: 0,
          quantite: enrichedWork.quantite || 1,
          taxe: taxRate,
          total_ht: 0
        };

        return enrichedWork;
      }));

      console.log('Enriched works data with client details:', enrichedWorksData);

      // Hide loading
      message.success({ content: 'Détails récupérés', key: 'materialsLoading', duration: 1 });

      // Set the billable data
      setBillableData(enrichedWorksData);

      // Generate invoice number using InvoiceService
      const generatedInvoiceNumber = InvoiceService.generateInvoiceNumber();
      setInvoiceNumber(generatedInvoiceNumber);

      // Show the bill modal
      setIsBillModalVisible(true);
    } catch (error) {
      console.error('Error processing selected works:', error);
      message.error('Erreur lors du traitement des travaux sélectionnés');
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

  // Function to generate PDF from bill data
  const generateBillPDF = () => {
    try {
      if (!billableData || billableData.length === 0) {
        message.error('Aucune donnée à imprimer');
        return;
      }
  
      const doc = new jsPDF();
      
      
      const clientData = billableData[0].clientDetails || billableData[0].client || {};
      
      // Title and header
      doc.setFontSize(20);
      doc.text('FACTURE', 105, 20, { align: 'center' });
      
      // Add current date
      doc.setFontSize(10);
      doc.text(`Date: ${billDate}`, 170, 30, { align: 'right' });
      doc.text(`Facture N°: ${invoiceNumber}`, 170, 35, { align: 'right' });
      
      // Company info (replace with your company info)
      doc.setFontSize(16);
      doc.text('Votre Société', 20, 30);
      doc.setFontSize(10);
      doc.text('Adresse: 123 Rue de la Métallurgie, Tunis', 20, 35);
      doc.text('Tél: +216 xx xxx xxx', 20, 40);
      doc.text('Email: contact@societe.com', 20, 45);
      
      // Divider
      doc.line(20, 50, 190, 50);
      
      // Client Information
      doc.setFontSize(14);
      doc.text('Client', 20, 60);
      doc.setFontSize(10);
      doc.text(`Nom: ${clientData.nom_cf || clientData.nom_client || 'N/A'}`, 20, 65);
      doc.text(`Adresse: ${clientData.adresse || 'N/A'}`, 20, 70);
      doc.text(`Matricule Fiscale: ${clientData.matricule_fiscale || clientData.numero_fiscal || 'N/A'}`, 20, 75);
      doc.text(`Tél: ${clientData.tel || clientData.telephone || 'N/A'}`, 20, 80);
      
      // Table for works
      const tableColumn = ["Description", "Quantité", "Prix unitaire (DT)", "Total HT (DT)"];
      let tableRows = [];
      let currentY = 90;
      let totalHT = 0;
      
      // Add each work item to the table
      billableData.forEach((item) => {
        // Product itself is not directly billed, only its materials
        // const workTotal = item.billable.prix_unitaire * item.billable.quantite; 
        // totalHT += workTotal; // Product cost is not added to totalHT
        
        // tableRows.push([
        //   item.produit_name + (item.description ? ` - ${item.description}` : ''),
        //   item.billable.quantite,
        //   item.billable.prix_unitaire.toFixed(3),
        //   workTotal.toFixed(3)
        // ]);
        
        // If the item has materials, add them to the table
        if (item.matiere_usages && item.matiere_usages.length > 0) {
          // Add a header for the work item if multiple works are billed, or just list materials
          // For simplicity, if there's a product name, we can use it as a section header implicitly
          // or add a specific row if needed. Here, we just list materials.
          // If you want to show which product these materials belong to, you might add a non-financial row:
          // tableRows.push([{content: `Matériaux pour: ${item.produit_name}`, colSpan: 4, styles: { fontStyle: 'italic', textColor: [100,100,100]}}]);


          item.matiere_usages.forEach(mat => {
            const matTotal = mat.prix_unitaire * mat.quantite_utilisee;
            totalHT += matTotal; // Only material costs contribute to totalHT
            
            tableRows.push([
              `Matériau: ${mat.nom_matiere} (${mat.type_matiere}) - ${mat.thickness || ''}×${mat.length || ''}×${mat.width || ''} mm (Pour ${item.produit_name})`,
              mat.quantite_utilisee,
              mat.prix_unitaire.toFixed(3),
              matTotal.toFixed(3)
            ]);
          });
        }
      });
      
      try {
        // Use our custom drawTable function
        console.log('Using custom table implementation');
        drawTable(doc, { head: [tableColumn], body: tableRows }, currentY, {
          columnWidths: [90, 20, 35, 35],
          fontSize: 9,
          headerBgColor: [50, 50, 50],
          headerTextColor: [255, 255, 255]
        });
      } catch (error) {
        console.error('Erreur lors de la création de la table:', error);
        // Fall back to simple text
        doc.text('Erreur lors de la création de la table. Affichage en format texte:', 20, currentY);
        currentY += 10;
        
        // Output as simple text
        doc.setFontSize(9);
        tableRows.forEach((row, index) => {
          doc.text(`${row[0]} - ${row[1]} x ${row[2]} = ${row[3]} DT`, 20, currentY + index * 6);
        });
      }
      
      // Calculate totals
      const TVA = totalHT * (taxRate / 100);
      const totalTTC = totalHT + TVA;
      
      // Add totals (use fixed position from bottom)
      const totalsY = 240;  // Position fixe pour les totaux
      doc.setFontSize(10);
      doc.text(`Total HT:`, 150, totalsY);
      doc.text(`${totalHT.toFixed(3)} DT`, 190, totalsY, { align: 'right' });
      
      doc.text(`TVA (${taxRate}%):`, 150, totalsY + 5);
      doc.text(`${TVA.toFixed(3)} DT`, 190, totalsY + 5, { align: 'right' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Total TTC:`, 150, totalsY + 15);
      doc.text(`${totalTTC.toFixed(3)} DT`, 190, totalsY + 15, { align: 'right' });
      
      // Add signature area
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Signature et cachet:', 150, totalsY + 35);
      doc.rect(150, totalsY + 40, 40, 20);
      
      // Footer
      doc.setFontSize(8);
      doc.text('Merci pour votre confiance !', 105, 280, { align: 'center' });
      
      // Save the PDF
      doc.save(`facture-${billDate}.pdf`);
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Erreur lors de la génération du PDF');
      return false;
    }
  };

// Function to save invoice data using InvoiceService
  const saveBillableData = async () => {
    try {
      if (!billableData || billableData.length === 0) {
        message.error('Aucune donnée à enregistrer');
        return false;
      }

      // Extract client ID from the first item (all items should be for the same client)
      const clientId = billableData[0].client_id || billableData[0].clientDetails?.id;
      
      if (!clientId) {
        message.error('ID du client manquant');
        return false;
      }

      // Get work IDs from billable data
      const workIds = billableData.map(item => item.id);

      // Create a data object to save
      const invoiceData = {
        client_id: clientId,
        client: clientId,
        numero_facture: invoiceNumber,
        tax_rate: taxRate, 
        date_emission: billDate,
        date_echeance: moment(billDate).add(30, 'days').format('YYYY-MM-DD'), // Default due date 30 days from bill date
        statut: 'draft',
        travaux_ids: workIds,
      };


      // Show loading message
      message.loading({ content: 'Enregistrement de la facture...', key: 'savingInvoice' });
      
      // Use InvoiceService to save the invoice
      const savedInvoice = await InvoiceService.createInvoice(invoiceData, workIds, clientId);
      
      message.success({ content: 'Facture enregistrée avec succès', key: 'savingInvoice', duration: 2 });
      console.log('Saved invoice:', savedInvoice);
      
      return true;
    } catch (error) {
      console.error('Error saving invoice data:', error);
      message.error({ content: `Erreur lors de l'enregistrement de la facture: ${error.message}`, key: 'savingInvoice', duration: 3 });
      return false;
    }
  };

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

        {/* Bill Modal */}
        <Modal
          title="Préparation de la Facture"
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
              onClick={() => {
                // Save the invoice data
                const success = saveBillableData();
                if (success) {
                  message.success("Facture sauvegardée avec succès");
                }
              }}
            >
              Sauvegarder
            </Button>,
            <Button 
              key="print" 
              type="primary" 
              icon={<PrinterOutlined />}
              onClick={() => {
                // Generate and print the PDF
                const success = generateBillPDF();
                if (success) {
                  message.success("Facture générée avec succès");
                }
                // Modal stays open as requested
              }}
            >
              Imprimer la facture
            </Button>
          ]}
        >
          <div className="bill-form-container">
            {/* Invoice Number */}
            <div style={{ textAlign: 'right', marginBottom: '10px' }}>
              <Text strong>Facture N°: </Text>
              <Text>{invoiceNumber}</Text>
            </div>
            
            {/* Global bill settings */}
            <div className="client-info-header">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Date de facturation">
                    <DatePicker 
                      style={{ width: '100%' }}
                      value={moment(billDate)}
                      onChange={(date) => {
                        const formattedDate = date ? date.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                        setBillDate(formattedDate);
                        
                        // Update all items with the new date
                        const updatedItems = billableData.map(item => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            date_facturation: formattedDate
                          }
                        }));
                        setBillableData(updatedItems);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Taux de TVA (%)">
                    <InputNumber
                      style={{ width: '100%' }}
                      value={taxRate}
                      onChange={(value) => {
                        setTaxRate(value);
                        
                        // Update all items with the new tax rate
                        const updatedItems = billableData.map(item => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            taxe: value
                          }
                        }));
                        setBillableData(updatedItems);
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider style={{ margin: '10px 0' }} />
              
              {/* Client info from first item (assuming all items are for the same client) */}
              {billableData.length > 0 && (
                <div>
                  <h3>Client: {billableData[0].clientDetails?.nom_cf || billableData[0].client?.nom_client || 'N/A'}</h3>
                  <p>Matricule Fiscale: {billableData[0].clientDetails?.matricule_fiscale || billableData[0].client?.numero_fiscal || 'N/A'}</p>
                  <p>Adresse: {billableData[0].clientDetails?.adresse || billableData[0].client?.adresse || 'N/A'}</p>
                  <p>Téléphone: {billableData[0].clientDetails?.tel || billableData[0].client?.telephone || 'N/A'}</p>
                </div>
              )}
            </div>
            
            {/* List of billable items */}
            <List
              dataSource={billableData}
              renderItem={(item, index) => (
                <List.Item>
                  <Card 
                    title={`Travail ${index + 1}: ${item.produit_name || 'Produit'} - Matériaux Uniquement`} 
                    style={{ width: '100%' }}
                  >
                    <Form layout="vertical">
                      {/* Row for product details is removed as product itself is not billed */}
                      {/*
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item label="Description">
                            <Input 
                              defaultValue={item.description || ''}
                              onChange={(e) => {
                                const newData = [...billableData];
                                newData[index].description = e.target.value;
                                setBillableData(newData);
                              }} 
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item label="Quantité">
                            <InputNumber
                              style={{ width: '100%' }}
                              min={1}
                              precision={0}
                              defaultValue={item.billable.quantite} // This quantity is for the product
                              // ... onChange logic for product quantity
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item label="Prix unitaire (DT)">
                            <InputNumber
                              style={{ width: '100%' }}
                              min={0}
                              precision={3}
                              defaultValue={item.billable.prix_unitaire} // This price is for the product
                              // ... onChange logic for product price
                            />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item label="Total HT (DT)">
                            <InputNumber
                              style={{ width: '100%' }}
                              value={(item.billable.prix_unitaire * item.billable.quantite).toFixed(3)}
                              disabled
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      */}
                      
                      {/* Materials section if available */}
                      {item.matiere_usages && item.matiere_usages.length > 0 && (
                        <div>
                          <Divider orientation="left">Matériaux utilisés</Divider>
                          <Table
                            className="material-table"
                            size="small"
                            pagination={false}
                            dataSource={item.matiere_usages}
                            columns={[
                              {
                                title: 'Matériau',
                                dataIndex: 'nom_matiere',
                                key: 'nom_matiere',
                                render: (text, record) => (
                                  <Space>
                                    <Tag color="blue">{record.type_matiere}</Tag>
                                    <span>{text}</span>
                                  </Space>
                                )
                              },
                              {
                                title: 'Dimensions',
                                key: 'dimensions',
                                render: (_, record) => (
                                  <span>
                                    {record.thickness ? `${record.thickness}mm` : '-'} × 
                                    {record.length ? `${record.length}mm` : '-'} × 
                                    {record.width ? `${record.width}mm` : '-'}
                                  </span>
                                )
                              },
                              {
                                title: 'Quantité',
                                dataIndex: 'quantite_utilisee',
                                key: 'quantite_utilisee',
                              },
                              {
                                title: 'Prix unitaire (DT)',
                                dataIndex: 'prix_unitaire',
                                key: 'prix_unitaire',
                                render: (text, record, materialIndex) => (
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    precision={3}
                                    value={record.prix_unitaire}
                                    onChange={(value) => {
                                      // Ensure value is a number, default to 0 if invalid
                                      const newPrice = (value === null || isNaN(value)) ? 0 : value;
                                      
                                      setBillableData(prevBillableData => {
                                        return prevBillableData.map((item, i) => {
                                          if (i === index) { // `index` is from the outer List's renderItem
                                            const updatedMatiereUsages = item.matiere_usages.map((mat, mi) => {
                                              if (mi === materialIndex) { // `materialIndex` is from the column's render
                                                return { ...mat, prix_unitaire: newPrice };
                                              }
                                              return mat;
                                            });
                                            // Recalculate item's total_ht if necessary, though it's mostly for display here
                                            // and final totals are calculated in the summary.
                                            return { ...item, matiere_usages: updatedMatiereUsages };
                                          }
                                          return item;
                                        });
                                      });
                                    }}
                                  />
                                )
                              },
                              {
                                title: 'Total (DT)',
                                key: 'total',
                                render: (_, record) => (
                                  <span>
                                    {(record.prix_unitaire * record.quantite_utilisee).toFixed(3)} DT
                                  </span>
                                )
                              }
                            ]}
                          />
                        </div>
                      )}
                    </Form>
                  </Card>
                </List.Item>
              )}
            />
            
            {/* Summary section */}
            <Card className="summary-card" style={{ marginTop: 16 }}>
              <Row justify="end">
                <Col span={8}>
                  <div style={{ textAlign: 'right' }}>
                    <p>
                      <strong>Total HT:</strong> {
                        billableData.reduce((sum, item) => {
                          // Product's direct cost (item.billable.prix_unitaire * item.billable.quantite) is not added.
                          // It's assumed item.billable.prix_unitaire is 0 for the product itself.
                          let materialTotalForItem = 0;
                          if (item.matiere_usages && item.matiere_usages.length > 0) {
                            materialTotalForItem = item.matiere_usages.reduce(
                              (materialSum, mat) => materialSum + (mat.prix_unitaire * mat.quantite_utilisee || 0),
                              0
                            );
                          }
                          return sum + materialTotalForItem;
                        }, 0).toFixed(3)
                      } DT
                    </p>
                    <p>
                      <strong>TVA ({taxRate}%):</strong> {
                        (billableData.reduce((sum, item) => {
                          let materialTotalForItem = 0;
                          if (item.matiere_usages && item.matiere_usages.length > 0) {
                            materialTotalForItem = item.matiere_usages.reduce(
                              (materialSum, mat) => materialSum + (mat.prix_unitaire * mat.quantite_utilisee || 0),
                              0
                            );
                          }
                          return sum + materialTotalForItem;
                        }, 0) * taxRate / 100).toFixed(3)
                      } DT
                    </p>
                    <p className="total-ttc">
                      <strong>Total TTC:</strong> {
                        (billableData.reduce((sum, item) => {
                          let materialTotalForItem = 0;
                          if (item.matiere_usages && item.matiere_usages.length > 0) {
                            materialTotalForItem = item.matiere_usages.reduce(
                              (materialSum, mat) => materialSum + (mat.prix_unitaire * mat.quantite_utilisee || 0),
                              0
                            );
                          }
                          return sum + materialTotalForItem;
                        }, 0) * (1 + taxRate / 100)).toFixed(3)
                      } DT
                    </p>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        </Modal>
      </div>
    </Content>
  );
};

export default WorkManagementPage;
