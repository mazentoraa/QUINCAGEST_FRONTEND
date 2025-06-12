import React, { useState, useEffect ,useCallback} from 'react';

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
  message
} from 'antd';
import { PlusOutlined, PrinterOutlined, SaveOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import RawMaterialService from '../services/RawMaterialService';
import moment from 'moment';
import { useParams, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InvoiceService from '../../../services/InvoiceService'
import ClientMaterialService from '../../clientMaterials/services/ClientMaterialService';
import ClientMaterialPdfService from '../../clientMaterials/services/ClientMaterialPdfService';
import ClientService from '../services/ClientService';
const { Title, Text } = Typography;
const { Option } = Select;

const ClientRawMaterialsPage = () => {
  const { client_id } = useParams();
  const location = useLocation();
  const client_name = location.state?.client_name || 'Client';

  const [materials, set_materials] = useState([]);
  const [loading, set_loading] = useState(false);
  const [is_modal_visible, set_is_modal_visible] = useState(false);
  const [editing_material, set_editing_material] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRowsData, setSelectedRowsData] = useState([]); // Ajout pour stocker les données sélectionnées
  const [clientDetails, setClientDetails] = useState(null);
  const [form] = Form.useForm();

  // Modal de préparation de la facture
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
  
  // Function to get readable material type label
  const getMaterialTypeLabel = (type) => {
    const materialType = material_types.find(item => item.value === type);
    return materialType ? materialType.label : type;
  };

  // Fetch client materials
  useEffect(() => {
    const fetchClientDetails = async () => {
    if (client_id) {
    try {
      console.log("Fetching client details for ID:", client_id);
      const clientData = await ClientService.getClientById(client_id); 
      console.log("Client data received:", clientData);
      
      if (clientData) {
        setClientDetails(clientData); 
      } else {
        console.warn("Aucune donnée client reçue");
        notification.warning({ message: "Aucune donnée trouvée pour ce client" });
      }
    } catch (error) {
      console.error('Erreur récupération client:', error);
      notification.error({
        message: 'Erreur',
        description: `Impossible de charger les détails du client: ${error.message}`
      });
    }
  }
  };
    const fetch_materials = async () => {
      set_loading(true);
      try {
        const response = await RawMaterialService.get_materials_by_client_id(client_id);
        // Transform the data to display formatted material types
        const formattedMaterials = response.map(material => ({
          ...material,
          display_type: getMaterialTypeLabel(material.type_matiere),
          remaining_quantity: material.remaining_quantity !== undefined ? 
            material.remaining_quantity : material.quantite
        }));
        set_materials(formattedMaterials);
        set_loading(false);
      } catch (error) {
        console.error('Error fetching materials:', error);
        notification.error({
          message: 'Erreur',
          description: 'Impossible de récupérer la liste des matières premières.'
        });
        set_loading(false);
      }
    };

    if (client_id) {
      fetch_materials();
      fetchClientDetails();
    }
  }, [client_id]);

  // Table columns
  const columns = [
    // {
    //   title: 'N° Bon de livraison',
    //   dataIndex: 'numero_bon',
    //   key: 'numero_bon',
    //   render: (numero_bon, record) => record.numero_bon || '-', // Utilise la valeur du record
    // },
    {
      title: 'Date de réception',
      dataIndex: 'reception_date',
      key: 'reception_date',
      render: (date, record) => {
        // Prend la date du record si disponible, sinon la valeur directe
        const value = record.reception_date || date;
        return value ? moment(value).format('YYYY-MM-DD') : '-';
      },
    },
    {
      title: 'Type de matériau',
      dataIndex: 'type_matiere',
      key: 'type_matiere',
      render: (type) => getMaterialTypeLabel(type),
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
      render: (remaining_quantity, record) => {
        // If remaining_quantity is not defined, default to the original quantity
        const value = remaining_quantity !== undefined ? 
          remaining_quantity : 
          record.quantite;
        
        // Highlight in red if less than 10% of original quantity remains
        const style = {};
        if (value < (record.quantite * 0.1) && value > 0) {
          style.color = 'red';
        } else if (value <= 0) {
          style.color = 'red';
          style.fontWeight = 'bold';
        }
        
        return <span style={style}>{value}</span>;
      }
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
            onClick={() => handle_edit(record)}
            aria-label="Modifier"
          />
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette matière première?"
            onConfirm={() => handle_delete(record.id)}
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
    },
  ];

  const handle_edit = (material) => {
    set_editing_material(material);
    form.setFieldsValue({
      ...material,
      reception_date: moment(material.reception_date)
    });
    set_is_modal_visible(true);
  };

  const handle_delete = async (id) => {
    try {
      await RawMaterialService.delete_material(id);
      set_materials(materials.filter(material => material.id !== id));
      notification.success({
        message: 'Succès',
        description: 'Matière première supprimée avec succès.'
      });
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: 'Impossible de supprimer la matière première.'
      });
    }
  };

  // Génère un numéro de bon de livraison unique basé sur l'année et le nombre de bons existants
  const generateDeliveryNote = () => {
    const year = moment().format('YYYY');
    // Using a combination of timestamp (milliseconds) and a random number for higher uniqueness
    const timestamp = moment().valueOf(); // Milliseconds since epoch
    // Random number between 0 and 9999
    const randomNumber1 = Math.floor(Math.random() * 10000).toString().padStart(2, '0'); // Random 2-digit number

    const randomNumber2 = Math.floor(Math.random() * 10000).toString().padStart(2, '0'); // Random 2-digit number
    return `BL-${randomNumber1}-${randomNumber2}`;
  };

  // Ouvre le modal pour ajouter une matière première avec un numéro de bon généré automatiquement
  const handle_add = () => {
    form.setFieldsValue({
      numero_bon: generateDeliveryNote(),
      reception_date: null,
      type_matiere: undefined,
      thickness: undefined,
      length: undefined,
      width: undefined,
      quantite: undefined,
      description: undefined,
    });
    set_editing_material(null);
    set_is_modal_visible(true);
  };

  // Handler pour préparer la facture à partir des matières sélectionnées
  const handleProcessSelectedMaterials = async () => {
    if (!selectedRowsData || selectedRowsData.length === 0) {
      notification.error({ message: 'Aucune matière sélectionnée' });
      return;
    }
    setBillableData(selectedRowsData);
     const newInvoiceNumber = await generateInvoiceNumber();
    setInvoiceNumber(newInvoiceNumber);
    setBillDate(moment().format('YYYY-MM-DD'));
    setIsBillModalVisible(true);
  };

  const calculateTotalQuantity = useCallback((materials) => {
      if (!materials || !Array.isArray(materials)) return 0;
      return materials.reduce(
        (sum, item) => sum + (parseFloat(item.quantite) || 0),
        0
      );
    }, []);
  
  const printDeliveryNote = async (record) => {
  try {
    if (!record || !Array.isArray(billableData) || billableData.length === 0) {
      notification.error({
        message: "Aucune matière à imprimer",
        description: "Aucune matière sélectionnée pour le bon de livraison.",
      });
      return;
    }

    message.loading({
      content: "Génération du bon de livraison...",
      key: "generatePDF",
    });

    // Préparer les informations client
    const clientInfo = {
      nom_client: client_name || "Client non spécifié",
      adresse: "", // Vous pourriez ajouter ces infos si disponibles
      telephone: "",
      email: "",
      numero_fiscal: "",
      id: client_id || "N/A"
    };

    // Préparer les données pour le PDF
    const pdfData = {
      deliveryNumber: invoiceNumber,
      deliveryDate: billDate,
      clientName: client_name,
      clientAddress:  clientDetails?.adresse || "",
      clientTaxId: clientDetails?.numero_fiscal || "N/A",
      clientPhone: clientDetails?.telephone || "N/A",
      clientCode: clientInfo.id,
      materials: billableData.map(item => ({
        numero_bon: invoiceNumber,
        reception_date: item.reception_date || billDate,
        type_matiere: getMaterialTypeLabel(item.type_matiere),
        thickness: item.thickness || "-",
        length: item.length || "-",
        width: item.width || "-",
        quantite: item.quantite || 0,
        description: item.description || "",
        surface: "-" // Ajoutez cette info si disponible
      })),
      totalQuantity: calculateTotalQuantity(billableData),
      notes: "" // Ajoutez des notes si nécessaire
    };
     console.log("pdfData:", pdfData);
    await ClientMaterialPdfService.generateClientMaterialsPDF(
      pdfData,
      `bon-livraison-${invoiceNumber}.pdf`
    );

    message.success({
      content: "Bon de livraison généré avec succès!",
      key: "generatePDF",
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    message.error({
      content: `Erreur lors de la génération: ${error.message}`,
      key: "generatePDF",
    });
    notification.error({
      message: "Erreur PDF",
      description: `Impossible de générer le PDF: ${error.message}`,
    });
  }
};
  // Génération et téléchargement du PDF lors de l'impression
  const handlePrintBill = () => {
    // Génération du PDF avec jsPDF et autoTable
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Facture Matières Premières', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Facture N°: ${invoiceNumber}`, 14, 25);
    doc.text(`Date: ${billDate}`, 150, 25);

    doc.text(`Client: ${client_name}`, 14, 32);
    doc.text(`ID Client: ${client_id}`, 150, 32);

    // Table des matières
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

    // Total quantité
    const total = billableData.reduce((sum, item) => sum + (item.quantite || 0), 0);
    doc.text(`Total quantité: ${total}`, 14, doc.lastAutoTable.finalY + 10);

    doc.save(`facture-matieres-${invoiceNumber}.pdf`);

    // Optionnel : lancer l'impression après téléchargement
    window.print();
    notification.success({ message: 'Facture téléchargée et impression lancée' });
  };

  // Sauvegarde dans la base de données (à adapter selon votre API)
  const handleSaveBill = async () => {
    try {
      // À adapter selon votre API de facturation
      // Exemple :
      // await InvoiceService.createInvoice({ invoiceNumber, billDate, items: billableData });
      notification.success({ message: 'Facture sauvegardée avec succès' });
      setIsBillModalVisible(false);
    } catch (e) {
      notification.error({ message: 'Erreur lors de la sauvegarde' });
    }
  };

  // Handle form submission
  const handle_submit = async (values) => {
    try {
      let new_material;
      // Convert client_id to integer explicitly
      const client_id_int = parseInt(client_id, 10);
      
      if (editing_material) {
        // Update existing material
        new_material = await RawMaterialService.update_material(editing_material.id, {
          ...values,
          reception_date: values.reception_date.format('YYYY-MM-DD'),
          client_id: client_id_int  // Explicitly set client_id as integer
        });
        // Add display_type for the updated material
        new_material.display_type = getMaterialTypeLabel(new_material.type_matiere);
        set_materials(materials.map(material => 
          material.id === editing_material.id ? new_material : material
        ));
        notification.success({
          message: 'Succès',
          description: 'Matière première modifiée avec succès.'
        });
      } else {
        // Add new material
        new_material = await RawMaterialService.add_material_to_client(client_id_int, {
          ...values,
          reception_date: values.reception_date.format('YYYY-MM-DD'),
          client_id: client_id_int  // Explicitly set client_id as integer
        });
        // Add display_type for the new material
        new_material.display_type = getMaterialTypeLabel(new_material.type_matiere);
        set_materials([...materials, new_material]);
        notification.success({
          message: 'Succès',
          description: 'Matière première ajoutée avec succès.'
        });
      }
      
      set_is_modal_visible(false);
      form.resetFields();
      set_editing_material(null);
    } catch (error) {
      console.error('Error saving material:', error);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de sauvegarder la matière première.'
      });
    }
  };

  const handle_cancel = () => {
    set_is_modal_visible(false);
    form.resetFields();
    set_editing_material(null);
  };

  // Générer un numéro de facture simple (à adapter selon votre logique)
  // const generateInvoiceNumber = () => {
  //   const date = moment().format('YYYYMMDD');
  //   return `INV-${date}-${Math.floor(Math.random() * 1000)}`;
  // };
 
    const generateInvoiceNumber = async ()=> {
      const currentYear = new Date().getFullYear();
      const existingData1  =await ClientMaterialService.getAllMaterialInvoices()
      const existingData  = existingData1.results;
       const current = existingData.filter(invoice => {
     return invoice.numero_bon && invoice.numero_bon.startsWith(`BL-${currentYear}-`);
      });
    let maxNumber = 0;
    existingData.forEach(invoice => {
    const parts = invoice.numero_bon.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2]);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  });
  const newNumber = maxNumber + 1;
    return`BL-${currentYear}-${String(newNumber).padStart(5, '0')}`;
    }
  
  // rowSelection pour Table
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
            <div className="client-info">
              <Text strong>Nom du client: </Text>
              <Text>{client_name || 'N/A'}</Text>
              <Divider type="vertical" />
              <Text strong>ID Client: </Text>
              <Text>{client_id || 'N/A'}</Text>
            </div>
            <Text type="secondary">
              Gestion des matières premières reçues du client pour la production
            </Text>
          </div>
          <div>
            {selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                onClick={ handleProcessSelectedMaterials}
                style={{ marginBottom: 8 }}
              >
                Préparer le bon de livraison ({selectedRowKeys.length} matière(s) sélectionnée(s))
              </Button>
            )}
          </div>
        </div>
        <Divider />
        <div className="materials-actions">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handle_add}
            style={{ marginBottom: 16 }}
          >
            Ajouter une matière première
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={materials}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowSelection={rowSelection}
        />
      </Card>

      {/* Modal for adding or editing material */}
      <Modal
        title={editing_material ? "Modifier une matière première" : "Réception de matière première client"}
        open={is_modal_visible}
        onCancel={handle_cancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handle_submit}
        >
          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Informations client</Title>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label="Nom du client"
                style={{ flex: 1 }}
              >
                <Input value={client_name} disabled />
              </Form.Item>
              <Form.Item
                label="ID Client"
                style={{ flex: 1 }}
              >
                <Input value={client_id} disabled />
              </Form.Item>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Informations livraison</Title>
            <div style={{ display: 'flex', gap: 16 }}>
              {/* <Form.Item
                name="numero_bon"
                label="N° Bon de livraison"
                rules={[{ required: true, message: 'Veuillez saisir le numéro de bon de livraison' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Ex: BL-2023-001" disabled />
              </Form.Item> */}
              <Form.Item
                name="reception_date"
                label="Date de réception"
                // rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} />
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
                // rules={[{ required: true, message: 'Veuillez saisir l\'épaisseur' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={1} />
              </Form.Item>
            </div>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="length"
                label="Longueur (mm)"
                // rules={[{ required: true, message: 'Veuillez saisir la longueur' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item
                name="width"
                label="Largeur (mm)"
                // rules={[{ required: true, message: 'Veuillez saisir la largeur' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item
                name="quantite"
                label="Quantité"
                // rules={[{ required: true, message: 'Veuillez saisir la quantité' }]}
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
              <Button onClick={handle_cancel}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit">
                {editing_material ? 'Mettre à jour' : 'Enregistrer'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de préparation du bon de livraison */}
      <Modal
        title="Préparation du bon de livraison"
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
            // onClick={handlePrintBill}
            onClick={() => printDeliveryNote({
    numero_bon: invoiceNumber,
    date_reception: billDate,
    client_details: {
      nom_client: client_name,
      id: client_id
    },
    matieres_details: billableData
  })}
          >
            Imprimer la facture
          </Button>
        ]}
      >
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
          <Text strong>Bon N°: </Text>
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
              // {
              //   title: 'N° Bon de livraison',
              //   dataIndex: 'numero_bon',
              //   key: 'numero_bon',
              //   render: (text, record, idx) => (
              //     <Input
              //       value={record.numero_bon}
              //       onChange={e => {
              //         const newData = [...billableData];
              //         newData[idx].numero_bon = e.target.value;
              //         setBillableData(newData);
              //       }}
              //     />
              //   )
              // },
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
                title: 'Longueur (mm)',
                dataIndex: 'length',
                key: 'length',
                render: (value, record, idx) => (
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    value={value}
                    onChange={val => {
                      const newData = [...billableData];
                      newData[idx].length = val;
                      setBillableData(newData);
                    }}
                  />
                )
              },
              {
                title: 'Largeur (mm)',
                dataIndex: 'width',
                key: 'width',
                render: (value, record, idx) => (
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    value={value}
                    onChange={val => {
                      const newData = [...billableData];
                      newData[idx].width = val;
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
                  <Table.Summary.Cell index={0} colSpan={6}><b>Total</b></Table.Summary.Cell>
                  <Table.Summary.Cell index={6}><b>{total}</b></Table.Summary.Cell>
                  <Table.Summary.Cell index={7} />
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
