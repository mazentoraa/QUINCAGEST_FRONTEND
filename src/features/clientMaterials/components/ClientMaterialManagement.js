import React, { useState, useEffect } from "react";
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
  Tag,
} from "antd";
import {
  PlusOutlined,
  PrinterOutlined,
  SaveOutlined,
  EditOutlined,
   ClearOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import RawMaterialService from "../../clientManagement/services/RawMaterialService";
import ClientService from "../../clientManagement/services/ClientService";
import ClientMaterialService from "../services/ClientMaterialService";
// Import the new PDF service instead of jsPDF
import ClientMaterialPdfService from "../services/ClientMaterialPdfService";
import moment from "moment";
import debounce from "lodash/debounce";
import { GoldOutlined } from "@ant-design/icons";


const { Title, Text } = Typography;
const { Option } = Select;

const ClientRawMaterialsPage = () => {
  // State for client search and selection
  const [searchText, setSearchText] = useState("");
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
  const [billDate, setBillDate] = useState(moment()); // Store as moment object
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [billableData, setBillableData] = useState([]);
  const [clientNameFilter, setClientNameFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState(null);
const [endDateFilter, setEndDateFilter] = useState(null);

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
        const clientsData = await ClientService.search_clients("");
        setSearchOptions(
          clientsData.map((client) => ({
            value: client.id,
            label: `${
              client.nom_client ||
              client.name ||
              client.client_name ||
              "Client sans nom"
            } (ID: ${client.id})`,
            client: client,
          }))
        );
      } catch (err) {
        console.error("Error fetching initial clients:", err);
        notification.error({
          message: "Erreur",
          description: "Impossible de récupérer la liste des clients.",
        });
      } finally {
        setClientSearchLoading(false);
      }
    };

    fetchInitialClients();
    fetchAllMaterials();

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

      setSearchOptions(
        clientsData.map((client) => ({
          value: client.id,
          label: `${
            client.nom_client ||
            client.name ||
            client.client_name ||
            "Client sans nom"
          } (ID: ${client.id})`,
          client: client,
        }))
      );
    } catch (err) {
      console.error("Error searching clients:", err);
      notification.error({
        message: "Erreur",
        description: "Erreur lors de la recherche des clients.",
      });
    } finally {
      setClientSearchLoading(false);
    }
  };

  // Create a debounced search function with longer delay to reduce requests
  const debouncedSearch = debounce(handleSearch, 800);
  // Handle client selection
const handleClientSelect = (value, option) => {
  // Définissez d'abord selectedClient
  setSelectedClient(option.client);
  // Puis récupérez les matériaux
  fetchClientMaterials(option.value);
};


  // Function to get readable material type label
  const getMaterialTypeLabel = (type) => {
    const materialType = material_types.find((item) => item.value === type);
    return materialType ? materialType.label : type;
  };

  // Fetch all client materials
  const fetchAllMaterials = async () => {
    setLoading(true);
    try {
      const response = await RawMaterialService.get_all_materials();

      // Get unique client IDs from the materials, filtering out null/undefined values
      console.log("Fetched materials:", response);
      const clientIds = [
        ...new Set(
          response.map((material) => material.client_id).filter(Boolean)
        ),
      ];

      // Fetch client information for all valid client IDs
      const clientsPromises = clientIds.map((clientId) =>
        ClientService.get_client_by_id(clientId).catch((error) => {
          console.error(`Error fetching client ${clientId}:`, error);
          return { id: clientId, client_name: `Client ID: ${clientId}` };
        })
      );

      const clients = await Promise.all(clientsPromises);

      // Create a map of client ID to client name for quick lookup
      const clientMap = clients.reduce((map, client) => {
        map[client.id] =
          client.nom_client ||
          client.name ||
          client.client_name ||
          `Client ID: ${client.id}`;
        return map;
      }, {});

      // Transform the data to include client name and formatted material types
      const formattedMaterials = response.map((material) => ({
        ...material,
        // Handle null/undefined client_id
        client_name: material.client_id
          ? clientMap[material.client_id] || `Client ID: ${material.client_id}`
          : "Sans client",
        display_type: getMaterialTypeLabel(material.type_matiere),
      }));

      setMaterials(formattedMaterials);
    } catch (err) {
      console.error("Error fetching all materials:", err);
      notification.error({
        message: "Erreur",
        description:
          "Impossible de récupérer la liste complète des matières premières.",
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
    
    const formattedMaterials = response.map((material) => ({
      ...material,
      display_type: getMaterialTypeLabel(material.type_matiere),
      // Correction ici - vérifiez si selectedClient existe
      client_name: selectedClient?.nom_client || selectedClient?.name || selectedClient?.client_name || "Client inconnu",
      client_id: clientId
    }));
    
    setMaterials(formattedMaterials);
  } catch (err) {
    console.error("Error fetching materials:", err);
    notification.error({
      message: "Erreur",
      description: "Impossible de récupérer la liste des matières premières.",
    });
  } finally {
    setLoading(false);
  }
};

  const getColumns = () => {
    // Client column to always show
    const clientColumn = [
       {
      title: "Client",
      dataIndex: "client_name",
      key: "client_name",
      render: (text, record) =>
        record.client_name || `Client ID: ${record.client_id}` || "-",
    },
    ];

    return [
      ...clientColumn,
      {
        title: "Date de réception",
        dataIndex: "reception_date",
        key: "reception_date",
        render: (date, record) => {
          const value = record.reception_date || date;
          return value ? moment(value).format("YYYY-MM-DD") : "-";
        },
      },
      {
        title: "Type de matériau",
        dataIndex: "type_matiere",
        key: "type_matiere",
        render: (type) => {
          const label = getMaterialTypeLabel(type);
          return <Tag color={getMaterialTypeColor(type)}>{label}</Tag>;
        },
        filters: material_types.map((type) => ({
          text: type.label,
          value: type.value,
        })),
        onFilter: (value, record) => record.type_matiere === value,
        filterMultiple: false,
      },
      {
        title: "Épaisseur (mm)",
        dataIndex: "thickness",
        key: "thickness",
      },
      {
        title: "Longueur (mm)",
        dataIndex: "length",
        key: "length",
      },
      {
        title: "Largeur (mm)",
        dataIndex: "width",
        key: "width",
      },
      {
        title: "Quantité",
        dataIndex: "quantite",
        key: "quantite",
      },
      {
        title: "Quantité restante",
        dataIndex: "remaining_quantity",
        key: "remaining_quantity",
        render: (remaining, record) => {
          // Show '-' if remaining_quantity is not provided from backend
          if (remaining === undefined || remaining === null) {
            return "-";
          }

          // Style the cell based on quantity
          const style = {};
          if (remaining === 0) {
            style.color = "red";
          } else if (remaining < record.quantite * 0.2) {
            // Less than 20% remaining
            style.color = "orange";
          }

          return <span style={style}>{remaining}</span>;
        },
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
      },
      {
        title: "Actions",
        key: "actions",
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
      },
    ];
  };
  // Get color for material type tag
  const getMaterialTypeColor = (type) => {
    switch (type) {
      case "acier":
        return "blue";
      case "acier_inoxydable":
        return "cyan";
      case "aluminium":
        return "silver";
      case "laiton":
        return "gold";
      case "cuivre":
        return "orange";
      case "acier_galvanise":
        return "purple";
      default:
        return "default";
    }
  };

  // Filter materials by type (for the dropdown filter)
  const handleMaterialTypeFilterChange = (value) => {
    setMaterialTypeFilter(value);
  };

  // Get filtered materials based on material type filter
const getFilteredMaterials = () => {
  let filtered = [...materials];

  // Filtre par type de matériau
  if (materialTypeFilter) {
    filtered = filtered.filter(
      (material) => material.type_matiere === materialTypeFilter
    );
  }

  // Filtre par nom de client
  if (clientNameFilter) {
    const lowerCaseFilter = clientNameFilter.toLowerCase();
    filtered = filtered.filter((material) =>
      (material.client_name || "").toLowerCase().includes(lowerCaseFilter)
    );
  }

  // Filtre par date de réception (affiche les données entre startDateFilter ET endDateFilter)
  if (startDateFilter || endDateFilter) {
    const start = startDateFilter ? moment(startDateFilter).startOf("day") : null;
    const end = endDateFilter ? moment(endDateFilter).endOf("day") : null;

    filtered = filtered.filter((material) => {
      const date = material.reception_date
        ? moment(material.reception_date)
        : null;

      // Si aucune date valide
      if (!date) return false;

      // Si les deux dates sont définies
      if (start && end) {
        return date.isBetween(start, end, null, "[]"); // Inclusif
      }
      // Si seulement la date de début est définie
      if (start) {
        return date.isSameOrAfter(start);
      }
      // Si seulement la date de fin est définie
      if (end) {
        return date.isSameOrBefore(end);
      }

      return true;
    });
  }

  return filtered;
};
  // Edit handler
const handleEdit = (material) => {
  setEditingMaterial(material);
  form.setFieldsValue({
    ...material,
    reception_date: material.reception_date ? moment(material.reception_date) : null,
  });
  setIsModalVisible(true);
};
  // Delete handler
  const handleDelete = async (id) => {
    try {
      await RawMaterialService.delete_material(id);
      setMaterials(materials.filter((material) => material.id !== id));
      notification.success({
        message: "Succès",
        description: "Matière première supprimée avec succès.",
      });
    } catch (err) {
      console.error("Error deleting material:", err);
      notification.error({
        message: "Erreur",
        description: "Impossible de supprimer la matière première.",
      });
    }
  };

  // Generate delivery note number
  const generateDeliveryNote = () => {
    const year = moment().format("YYYY");
    const randomNumber = String(Math.floor(Math.random() * 1000)).padStart(
      3,
      "0"
    );
    return `BL-${year}-${randomNumber}`;
  };

  // Add new material handler
  const handleAdd = () => {
    if (!selectedClient) {
      notification.error({
        message: "Erreur",
        description:
          "Veuillez sélectionner un client avant d'ajouter une matière première.",
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
  }; // Process selected materials handler
  const handleProcessSelectedMaterials = async () => {
    if (!selectedRowsData || selectedRowsData.length === 0) {
      notification.error({ message: "Aucune matière sélectionnée" });
      return;
    }

    // In "view all materials" mode, we need to check if all selected materials are from the same client
    if (viewAllMaterials) {
      const clientIds = new Set(
        selectedRowsData.map((material) => material.client_id)
      );

      // If more than one client is selected, show an error
      if (clientIds.size > 1) {
        notification.error({
          message: "Sélection invalide",
          description:
            "Veuillez sélectionner uniquement des matières du même client pour préparer une facture.",
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
          console.error("Error fetching client:", err);
          notification.error({
            message: "Erreur",
            description: "Impossible de récupérer les informations du client.",
          });
          return;
        }
      }
    }

    // Set materials for billing
    setBillableData(selectedRowsData);

    try {
      // Generate new random invoice number for matiere premiere
      const newInvoiceNumber = await generateInvoiceNumber();
      setInvoiceNumber(newInvoiceNumber);

      // Set current date as default
      setBillDate(moment()); // Update with moment object

      // Show bill modal
      setIsBillModalVisible(true);
    } catch (err) {
      console.error("Error preparing invoice:", err);
      notification.error({
        message: "Erreur",
        description:
          "Un problème est survenu lors de la préparation de la facture.",
      });
    }
  };

  // Print bill handler - Updated to use PDF API service
  const handlePrintBill = async () => {
    try {
      if (!billableData || billableData.length === 0) {
        notification.error({ message: "Aucune matière à imprimer" });
        return;
      }

      message.loading({
        content: "Génération du bon de livraison...",
        key: "generatePDF",
      });

      // Prepare data for PDF generation
      const clientName = selectedClient
        ? selectedClient.nom_client ||
          selectedClient.name ||
          selectedClient.client_name ||
          "N/A"
        : "N/A";

      const totalQuantity = billableData.reduce(
        (sum, item) => sum + (item.quantite || 0),
        0
      );

      const pdfData = {
        deliveryNumber: invoiceNumber,
        deliveryDate: billDate
          ? billDate.format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
        clientName: clientName,
        clientAddress: selectedClient?.adresse || "N/A",
        clientTaxId: selectedClient?.numero_fiscal || "N/A",
        clientPhone: selectedClient?.telephone || "N/A",
        clientCode: selectedClient?.id || "N/A",
        materials: billableData.map((item) => ({
          numero_bon: item.numero_bon,
          reception_date: item.reception_date
            ? moment(item.reception_date).format("YYYY-MM-DD")
            : "",
          type_matiere: item.type_matiere,
          thickness: item.thickness,
          length: item.length,
          width: item.width,
          quantite: item.quantite,
          description: item.description || "",
        })),
        totalQuantity: totalQuantity,
      };

      console.log("PDF data for materials:", pdfData);

      // Use the new PDF API service
      await ClientMaterialPdfService.generateClientMaterialsPDF(
        pdfData,
        `bon-livraison-matieres-${invoiceNumber}.pdf`
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
    }
  };
  const handleSaveBill = async () => {
    try {
      if (!billableData || billableData.length === 0) {
        notification.error({ message: "Aucune matière à facturer" });
        return;
      }

      if (!selectedClient) {
        notification.error({ message: "Client non sélectionné" });
        return;
      }
      const materialIds = billableData.map((material) => material.id);
      const invoiceData = {
        client: selectedClient.id,
        matieres: materialIds,
        numero_bon: invoiceNumber,
        date_reception: billDate
          ? billDate.format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
        tax_rate: 19, // Default tax rate
        notes: "Facture générée automatiquement",
      };
      let response;
      message.loading({
        content: "Enregistrement de la facture...",
        key: "savingInvoice",
      });
      response = await ClientMaterialService.createMaterialInvoice(invoiceData);
      if (response && response.numero_bon) {
        setInvoiceNumber(response.numero_bon);
      }
      message.success({
        content: "Facture enregistrée avec succès",
        key: "savingInvoice",
        duration: 2,
      });
      setIsBillModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedRowsData([]);
    } catch (err) {
      console.error("Error saving invoice:", err);
      notification.error({
        message: "Erreur lors de la sauvegarde",
        description:
          err.message ||
          "Une erreur est survenue lors de la sauvegarde de la facture",
      });
    }
  };
const handleSubmit = async (values) => {
  try {
    const clientId = selectedClient?.id || editingMaterial?.client_id;

    if (!clientId) {
      notification.error({
        message: "Erreur",
        description: "Aucun client sélectionné pour cette matière.",
      });
      return;
    }
    const formattedValues = {
      ...values,
      reception_date: moment(values.reception_date).format("YYYY-MM-DD"),
      client_id: clientId,
    };
    let response;
    if (editingMaterial) {
      response = await RawMaterialService.update_material(editingMaterial.id, formattedValues);
      notification.success({
        message: "Succès",
        description: "Matière première modifiée avec succès.",
      });
      form.resetFields();
      setEditingMaterial(null);
      setIsModalVisible(false);
      window.location.reload();
    } else {
      response = await RawMaterialService.add_material_to_client(clientId, formattedValues);
      const clientName = selectedClient?.nom_client || selectedClient?.name || selectedClient?.client_name || `Client ID: ${clientId}`;
      const newMaterial = {
        ...response,
        display_type: getMaterialTypeLabel(response.type_matiere),
        client_name: clientName,
      };
      setMaterials((prev) => [...prev, newMaterial]);
      notification.success({
        message: "Succès",
        description: "Matière première ajoutée avec succès.",
      });
      form.resetFields();
      setEditingMaterial(null);
      setIsModalVisible(false);
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde :", error);
    notification.error({
      message: "Erreur",
      description: error.message || "Impossible de sauvegarder les modifications.",
    });
  }
};
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingMaterial(null);
  }
  const generateInvoiceNumber =  async () => {
     try {
        const currentYear = new Date().getFullYear();
        const response = await ClientMaterialService.getAllMaterialInvoices();
        let allInvoices = [];      
        if (Array.isArray(response)) {
            allInvoices = response;
        } else if (response?.data && Array.isArray(response.data)) {
            allInvoices = response.data;
        } else if (response?.results && Array.isArray(response.results)) {
            allInvoices = response.results;
        } else {
            console.error('Format de réponse inattendu:', response);
            return `BL-${currentYear}-00001`; // Fallback
        }
        const currentYearInvoices = allInvoices.filter(invoice => 
            invoice?.numero_bon?.startsWith(`BL-${currentYear}-`)
        );

        const maxNumber = currentYearInvoices.reduce((max, invoice) => {
            const parts = invoice.numero_bon?.split('-') || [];
            if (parts.length === 3) {
                const num = parseInt(parts[2]);
                return !isNaN(num) ? Math.max(max, num) : max;
            }
            return max;
        }, 0);

        return `BL-${currentYear}-${String(maxNumber + 1).padStart(5, '0')}`;
        
    } catch (error) {
        console.error('Erreur lors de la génération du numéro:', error);
        return `BL-${new Date().getFullYear()}-00001`; // Fallback en cas d'erreur
    }
  };
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          
         <div style={{ marginBottom: 32, position: 'relative' }}>
<Space size="large" align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
  
  <Space size="large" align="center">
    
    <div style={{ position: 'relative' }}>
      
      <div
        style={{
          width: 48,
          height: 48,
          background: "#1890ff",
          borderRadius: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <GoldOutlined style={{ fontSize: 24, color: "#fff" }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: -8,
          right: -8,
          background: "#52c41a",
          color: "white",
          fontSize: 12,
          fontWeight: "bold",
          borderRadius: "50%",
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid white",
        }}
      >
        {materials?.length || 0}
      </div>
    </div>

    <div>
      <Title
        level={2}
        style={{
          margin: 0,
          fontWeight: 700,
          color: "#1890ff",
          fontSize: "28px",
        }}
      >
        Matières Premières Client
      </Title>
      <Text type="secondary">
        Gestion des matières premières reçues des clients pour la production
        <span style={{ color: "#52c41a", marginLeft: 8 }}>●</span>
      </Text>
    </div>
  </Space>
  

  
</Space>

</div>
        </div>{" "}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
          </div>
        </div>
        {(selectedClient ||  materials.length > 0) && (
          <>
            {" "}
            {selectedClient && (
              <div className="client-info" style={{ marginBottom: 16 }}>
                <Card size="small" title="Client sélectionné">
                  <div style={{ display: "flex", gap: 16 }}>
                    <div>
                      <Text strong>Nom du client: </Text>
                      <Text>
                        {selectedClient.nom_client ||
                          selectedClient.name ||
                          selectedClient.client_name ||
                          "N/A"}
                      </Text>
                    </div>
                    <Divider type="vertical" />
                    <div>
                      <Text strong>ID Client: </Text>
                      <Text>{selectedClient.id || "N/A"}</Text>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {/* Only show Add material button when not in "view all" mode */}
                {selectedClient && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                  >
                    Ajouter une matière première
                  </Button>
                )}
              </div>
              {selectedRowKeys.length > 0 ? (
                <Button type="primary" onClick={handleProcessSelectedMaterials}>
                  Préparer le bon de livraison ({selectedRowKeys.length}{" "}
                  matière(s) sélectionnée(s))
                </Button>
              ) : (
                <div></div>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
  <Space size="middle">
    <Input
      placeholder="Filtrer par nom de client"
      value={clientNameFilter}
      onChange={(e) => setClientNameFilter(e.target.value)}
      style={{ width: 200 }}
    />
    <DatePicker
      placeholder="Du"
      value={startDateFilter}
      onChange={(date) => setStartDateFilter(date)}
      format="YYYY-MM-DD"
    />
    <DatePicker
      placeholder="Au"
      value={endDateFilter}
      onChange={(date) => setEndDateFilter(date)}
      format="YYYY-MM-DD"
    />
    <Select
      style={{ width: 200 }}
      placeholder="Filtrer par type de matériau"
      onChange={handleMaterialTypeFilterChange}
      value={materialTypeFilter}
      allowClear
    >
      {material_types.map((type) => (
        <Option key={type.value} value={type.value}>
          <Tag color={getMaterialTypeColor(type.value)}>{type.label}</Tag>
        </Option>
      ))}
    </Select>
    <Button onClick={() => {
      setClientNameFilter("");
      setStartDateFilter(null);
      setEndDateFilter(null);
      setMaterialTypeFilter(null);
      
    }}>
       {<ClearOutlined />}
         
     Effacer les filtres
    </Button>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
  <Button
    icon={<DeleteOutlined />}
    size="large"
    style={{
      borderRadius: '12px',
      height: '35px',
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
</div>
  </Space>
</div>
          <Table
  columns={getColumns()}
  dataSource={getFilteredMaterials()} // Toujours utiliser les données filtrées
  rowKey="id"
  loading={loading}
  pagination={{ pageSize: 10 }}
/>
          </>
        )}{" "}
        {!selectedClient && materials.length === 0 && !loading && (
          <Empty
            description="Veuillez sélectionner un client ou utiliser l'option 'Voir toutes les matières premières'"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {/* Modal for adding or editing material */}
      <Modal
        title={
          editingMaterial
            ? "Modifier une matière première"
            : "Réception de matière première client"
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
       {selectedClient && (
  <div style={{ marginBottom: 16 }}>
    <Title level={4}>Informations client</Title>
    <div style={{ display: "flex", gap: 16 }}>
      <Form.Item label="Nom du client" style={{ flex: 1 }}>
        <Input
          value={selectedClient?.nom_client || selectedClient?.name || selectedClient?.client_name || "N/A"}
          disabled
        />
      </Form.Item>

      <Form.Item label="Code client (ID)" style={{ flex: 1 }}>
        <Input
          value={selectedClient?.id || "N/A"}
          disabled
        />
      </Form.Item>
    </div>
  </div>
)}
          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Informations livraison</Title>
            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                name="numero_bon"
                label="N° Bon de livraison"
                rules={[
                  {
                    required: true,
                    message: "Veuillez saisir le numéro de bon de livraison",
                  },
                ]}
                style={{ flex: 1 }}
              >
                <Input
                  placeholder="Ex: BL-2023-001"
                  disabled={editingMaterial === null}
                />
              </Form.Item>
              <Form.Item
                name="reception_date"
                label="Date de réception"
                rules={[
                  { required: true, message: "Veuillez sélectionner une date" },
                ]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item
  name="type_matiere"
  label="Type de matériau"
  rules={[
    { required: true, message: "Veuillez sélectionner un type de matériau" }
  ]}
>
  <Select placeholder="Sélectionnez un type">
    {material_types.map((type) => (
      <Option key={type.value} value={type.value}>
        {type.label}
      </Option>
    ))}
  </Select>
</Form.Item>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Caractéristiques du matériau</Title>
            <div style={{ display: "flex", gap: 16 }}>
              
              <Form.Item
                name="thickness"
                label="Épaisseur (mm)"
                rules={[
                  { required: true, message: "Veuillez saisir l'épaisseur" },
                ]}
                style={{ flex: 1 }}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={0.1}
                  precision={1}
                />
              </Form.Item>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                name="length"
                label="Longueur (mm)"
                rules={[
                  { required: true, message: "Veuillez saisir la longueur" },
                ]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
              <Form.Item
                name="width"
                label="Largeur (mm)"
                rules={[
                  { required: true, message: "Veuillez saisir la largeur" },
                ]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
              <Form.Item
                name="quantite"
                label="Quantité"
                rules={[
                  { required: true, message: "Veuillez saisir la quantité" },
                ]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: "100%" }} min={1} precision={0} />
              </Form.Item>
            </div>

            <Form.Item name="description" label="Description / Observations">
              <Input.TextArea
                rows={4}
                placeholder="Observations supplémentaires sur la matière première..."
              />
            </Form.Item>
          </div>

          <Form.Item>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}
            >
              <Button onClick={handleCancel}>Annuler</Button>
              <Button type="primary" htmlType="submit">
                {editingMaterial ? "Mettre à jour" : "Enregistrer"}
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
          <Button key="save" icon={<SaveOutlined />} onClick={handleSaveBill}>
            Sauvegarder
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrintBill}
          >
            Imprimer le bon de livraison
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <div className="client-info">
            <Text strong>Client: </Text>
            <Text>
              {selectedClient
                ? selectedClient.nom_client ||
                  selectedClient.name ||
                  selectedClient.client_name ||
                  "N/A"
                : "N/A"}
            </Text>
            <Divider type="vertical" />
            <Text strong>ID Client: </Text>
            <Text>{selectedClient?.id || "N/A"}</Text>
          </div>
        </div>

        <div style={{ textAlign: "right", marginBottom: "10px" }}>
          <Text strong>Bon N°: </Text>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        <div>
          <Form layout="vertical">
            <Form.Item label="Date de facturation">
              <DatePicker
                style={{ width: "100%" }}
                value={billDate} // Use moment object directly
                onChange={
                  (dateMoment) => setBillDate(dateMoment || moment()) // Update with moment object, default to now if cleared
                }
                format="YYYY-MM-DD" // Ensure display format is correct
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
                title: "Date de réception",
                dataIndex: "reception_date",
                key: "reception_date",
                render: (date, record, idx) => (
                  <DatePicker
                    style={{ width: "100%" }}
                    value={
                      record.reception_date
                        ? moment(record.reception_date)
                        : null
                    }
                    onChange={(d) => {
                      const newData = [...billableData];
                      newData[idx].reception_date = d
                        ? d.format("YYYY-MM-DD")
                        : "";
                      setBillableData(newData);
                    }}
                  />
                ),
              },
              {
                title: "Type de matériau",
                dataIndex: "type_matiere",
                key: "type_matiere",
                render: (type, record, idx) => (
                  <Select
                    value={record.type_matiere}
                    style={{ width: "100%" }}
                    onChange={(value) => {
                      const newData = [...billableData];
                      newData[idx].type_matiere = value;
                      setBillableData(newData);
                    }}
                  >
                    {material_types.map((typeOpt) => (
                      <Option key={typeOpt.value} value={typeOpt.value}>
                        {typeOpt.label}
                      </Option>
                    ))}
                  </Select>
                ),
              },
              {
                title: "Épaisseur (mm)",
                dataIndex: "thickness",
                key: "thickness",
                render: (value, record, idx) => (
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    value={value}
                    onChange={(val) => {
                      const newData = [...billableData];
                      newData[idx].thickness = val;
                      setBillableData(newData);
                    }}
                  />
                ),
              },
              {
                title: "Quantité",
                dataIndex: "quantite",
                key: "quantite",
                render: (value, record, idx) => (
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    value={value}
                    onChange={(val) => {
                      const newData = [...billableData];
                      newData[idx].quantite = val;
                      setBillableData(newData);
                    }}
                  />
                ),
              },
              {
                title: "Description",
                dataIndex: "description",
                key: "description",
                ellipsis: true,
                render: (value, record, idx) => (
                  <Input
                    value={value}
                    onChange={(e) => {
                      const newData = [...billableData];
                      newData[idx].description = e.target.value;
                      setBillableData(newData);
                    }}
                  />
                ),
              },
            ]}
            summary={(pageData) => {
              const total = pageData.reduce(
                (sum, item) => sum + (item.quantite || 0),
                0
              );
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <b>Total</b>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <b>{total}</b>
                  </Table.Summary.Cell>
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