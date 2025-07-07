import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Button,
  message,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Spin,
  DatePicker,
  Divider,
  Card,
  List,
  Tag,
  Badge,
  Row,
  Col,
  InputNumber,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
} from "@ant-design/icons";
import debounce from "lodash/debounce";
import moment from "moment";
import BonRetourService from "../../features/bonRetour/services/BonRetourService";
import ClientService from "../../features/manifeste/services/ClientService";
import BonRetourPdfService from "../../services/BonRetourPdfService"; // Import the new service
import "./BonRetour.css";
import { useMemo } from "react";
import { Statistic } from "antd"

import {
  FileDoneOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";



const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const BonRetour = () => {
  const [bonsRetour, setBonsRetour] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBonRetour, setEditingBonRetour] = useState(null);
  const [form] = Form.useForm();

  // Client and materials data
  const [clientOptions, setClientOptions] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);

  // Filters and search
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // State for table row selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const statusOptions = [
    { label: "Brouillé", value: "draft", color: "default" },
    { label: "Envoyé", value: "sent", color: "processing" },
    { label: "Terminé", value: "completed", color: "success" },
    { label: "Annulé", value: "cancelled", color: "error" },
  ];
    // Comptage total et par statut
  const stats = useMemo(() => {
    const result = {
      total: bonsRetour.length,
      draft: 0,
      sent: 0,
      completed: 0,
      cancelled: 0,
    };
    bonsRetour.forEach((bon) => {
      if (bon.status && result[bon.status] !== undefined) {
        result[bon.status]++;
      }
    });
    return result;
  }, [bonsRetour]);

  useEffect(() => {
    fetchBonsRetour();
    fetchInitialClients();
  }, [searchText, statusFilter, clientFilter, dateFilter]);

  const fetchBonsRetour = async () => {
    setLoading(true);
    try {
      const queryParams = {};
      if (searchText) queryParams.search = searchText;
      if (statusFilter) queryParams.status = statusFilter;
      if (clientFilter) queryParams.client = clientFilter;
      if (dateFilter) queryParams.date_retour = dateFilter;

      const data = await BonRetourService.getAllBonsRetour(queryParams);
      console.log("recordsss" , data)
      // Adjust to handle paginated response
      if (data && Array.isArray(data.results)) {
        setBonsRetour(data.results);
      } else if (Array.isArray(data)) {
        // Fallback for non-paginated array
        setBonsRetour(data);
      } else {
        setBonsRetour([]);
        if (data != null) {
          console.warn(
            "API response for bons retour was not in the expected format:",
            data
          );
        }
      }
    } catch (error) {
      message.error("Erreur lors du chargement des bons de retour");
      setBonsRetour([]); // Ensure it's an array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialClients = async () => {
    try {
      const clientsData = await ClientService.getAllClients();
      console.log("clientss",clientsData)

      if (Array.isArray(clientsData)) {
        setClientOptions(
          clientsData.map((client) => ({
            label: client.nom_client,
            value: client.id,
          }))
        );
      } else {
        setClientOptions([]);
        if (clientsData != null) {
          // clientsData is not null and not undefined
          console.warn(
            "API response for initial clients was not an array:",
            clientsData
          );
        }
      }
    } catch (error) {
      message.error("Erreur lors du chargement des clients");
      setClientOptions([]); // Ensure it's an array on error
    }
  };

  const handleSearch = async (value) => {
    if (value.length < 2) return;

    setClientSearchLoading(true);
    try {
      const clients = await ClientService.searchClients(value);
      setClientOptions(
        clients.map((client) => ({
          label: client.nom_client,
          value: client.id,
        }))
      );
    } catch (error) {
      console.error("Error searching clients:", error);
    } finally {
      setClientSearchLoading(false);
    }
  };

  const debouncedSearch = debounce(handleSearch, 500);

  const handleAdd = () => {
    form.resetFields();
    setEditingBonRetour(null);
    setSelectedMaterials([]);
    setAvailableMaterials([]);
   setCustomMaterials([{ name: "", quantite: 0 }]); 
    // Set default values
    form.setFieldsValue({
      numero_bon: BonRetourService.generateBonRetourNumber(bonsRetour),
      date_reception: moment(),
      date_retour: moment(),
      status: "draft",
    });

    setIsModalVisible(true);
  };

const handleEdit = async (record) => {
  // Toujours récupérer les données complètes du bon de retour, y compris les matières
  let recordWithDetails = record;

  try {
    const fullRecord = await BonRetourService.getBonRetourWithMaterialDetails(record.id);
    if (fullRecord) {
      recordWithDetails = fullRecord;
    }
  } catch (error) {
    console.warn("Erreur lors du chargement complet du bon de retour :", error);
  }

  console.log("Détails matiere_retours lors de l'édition :", recordWithDetails.matiere_retours);

  setEditingBonRetour(recordWithDetails);
  console.log("Dates reçues pour l'édition:", {
  date_reception: recordWithDetails.date_reception,
  date_retour: recordWithDetails.date_retour,
});
console.log("Dates transformées en moment:", {
  date_reception: recordWithDetails.date_reception ? moment(recordWithDetails.date_reception, "YYYY-MM-DD") : null,
  date_retour: recordWithDetails.date_retour ? moment(recordWithDetails.date_retour, "YYYY-MM-DD") : null,
});


  // Remplissage des champs du formulaire avec parsing sécurisé des dates
  form.setFieldsValue({
    numero_bon: recordWithDetails.numero_bon,
    client: recordWithDetails.client?.id || recordWithDetails.client,
    date_reception: recordWithDetails.date_reception
      ? moment(recordWithDetails.date_reception, "YYYY-MM-DD")
      : null,
    date_retour: recordWithDetails.date_retour
      ? moment(recordWithDetails.date_retour, "YYYY-MM-DD")
      : null,
    status: recordWithDetails.status,
    notes: recordWithDetails.notes,
  });

  // Préparation des matières
  if (recordWithDetails.matiere_retours && recordWithDetails.matiere_retours.length > 0) {
    const customMats = recordWithDetails.matiere_retours.map((retour) => ({
  name: retour.nom_matiere || "",
  quantite: retour.quantite_retournee || 0,
}));

    setCustomMaterials(customMats);
  } else {
    setCustomMaterials([{ name: "", quantite: 0 }]);
  }

  // Chargement des matières disponibles du client
  const clientId =
    recordWithDetails.client?.id || recordWithDetails.client;
  if (clientId) {
    await handleClientChange(clientId);
  }

  setIsModalVisible(true);
};



  const handleDelete = async (id) => {
    try {
      await BonRetourService.deleteBonRetour(id);
      message.success("Bon de retour supprimé avec succès");
      fetchBonsRetour();
    } catch (error) {
      message.error("Erreur lors de la suppression");
    }
  };

  const handleClientChange = async (clientId) => {
    if (!clientId) {
      setAvailableMaterials([]);
      setSelectedMaterials([]);
      return;
    }

    setLoadingMaterials(true);
    try {
      const response = await BonRetourService.getAvailableMaterials(clientId);
      setAvailableMaterials(response.available_materials || []);
      setSelectedMaterials([]);
    } catch (error) {
      console.error("Error fetching available materials:", error);
      message.error("Erreur lors du chargement des matières disponibles");
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleMaterialSelect = (materialId, quantite) => {
    const existingIndex = selectedMaterials.findIndex(
      (m) => m.materialId === materialId
    );

    if (quantite === null || quantite === 0) {
      if (existingIndex >= 0) {
        setSelectedMaterials(
          selectedMaterials.filter((m) => m.materialId !== materialId)
        );
      }
      return;
    }

    if (existingIndex >= 0) {
      const updatedMaterials = [...selectedMaterials];
      updatedMaterials[existingIndex].quantite_retournee = quantite;
      setSelectedMaterials(updatedMaterials);
    } else {
      setSelectedMaterials([
        ...selectedMaterials,
        { materialId, quantite_retournee: quantite },
      ]);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (
        !customMaterials.length ||
        customMaterials.every((mat) => !mat.name || !mat.quantite)
      ) {
        message.error("Veuillez ajouter au moins une matière avec une quantité.");
        return;
      }
      

      // Prepare materials data for submission
      const materialsToSubmit = customMaterials
      .filter((mat) => mat.name && mat.quantite)
      .map((mat) => ({
        nom_matiere: mat.name,
        quantite_retournee: mat.quantite,
      }));
    

      const bonRetourData = {
        ...values,
        date_reception: values.date_reception.format("YYYY-MM-DD"),
        date_retour: values.date_retour.format("YYYY-MM-DD"),
        matiere_retours: materialsToSubmit, // Use materialsToSubmit instead of materialsToValidate
      };

      console.log("Submitting bonRetourData:", bonRetourData);

      if (editingBonRetour) {
        try {
          await BonRetourService.updateBonRetour(
            editingBonRetour.id,
            bonRetourData
          );
          message.success("Bon de retour mis à jour avec succès");
        } catch (updateError) {
          console.error("Error updating bon de retour:", updateError);
          message.error(
            `Erreur lors de la mise à jour: ${
              updateError.response?.data || updateError.message
            }`
          );
          return;
        }
      } else {
        try {
          await BonRetourService.createBonRetour(bonRetourData);
          message.success("Bon de retour créé avec succès");
        } catch (createError) {
          console.error("Error creating bon de retour:", createError);
          message.error(
            `Erreur lors de la création: ${
              createError.response?.data || createError.message
            }`
          );
          return;
        }
      }

      setIsModalVisible(false);
      fetchBonsRetour();
      setSelectedMaterials([]);
      setAvailableMaterials([]);
      form.resetFields();
    } catch (error) {
      console.error("Unexpected error in handleSubmit:", error);
      message.error("Erreur lors de l'enregistrement");
    }
  };

const handleStatusChange = async (record, newStatus) => {
  try {
    await BonRetourService.updateBonRetourStatus(record.id, newStatus);
    message.success("Statut mis à jour avec succès");
    // Recharge la liste seulement, pas le formulaire
    fetchBonsRetour();
  } catch (error) {
    message.error("Erreur lors de la mise à jour du statut");
  }
};


  const generateBonRetourPDF = async (recordFromList) => {
    console.log(recordFromList);
    const hideLoading = message.loading("Génération du PDF en cours...", 0);
    let fullRecord = null;
    try {
      fullRecord = await BonRetourService.getBonRetourWithMaterialDetails(
        recordFromList.id
      );
      console.log("Fetched record with materials for PDF service:", fullRecord);

      let clientData = fullRecord.client;
      if (
        !clientData ||
        typeof clientData !== "object" ||
        !clientData.nom_client
      ) {
        try {
          const clientId =
            fullRecord.client?.id ||
            fullRecord.client ||
            recordFromList.client?.id ||
            recordFromList.client;
          if (clientId) {
            clientData = await ClientService.getClientById(clientId);
            fullRecord.client = clientData; // Ensure fullRecord has the detailed client info
          }
        } catch (error) {
          console.warn("Could not fetch client data for PDF:", error);
          // Use whatever client info is available in recordFromList as a fallback
          fullRecord.client = recordFromList.client || {
            code_client : "N/A",
            nom_client: "N/A",
            adresse: "N/A",
            numero_fiscal: "N/A",
            telephone: "N/A",
          };
        }
      }

      // Ensure client is an object, even if some fields are N/A
      if (typeof fullRecord.client !== "object" || fullRecord.client === null) {
        fullRecord.client = {
          code_client : "N/A",
          nom_client: "N/A",
          adresse: "N/A",
          numero_fiscal: "N/A",
          telephone: "N/A",
        };
      }

      // Pass the prepared fullRecord to the PDF service
      await BonRetourPdfService.generateBonRetourPDF(
        fullRecord,
        `bon-retour-${fullRecord.numero_bon}.pdf`
      );

      hideLoading();
      message.success(
        "Bon de retour PDF demandé. Vérifiez votre navigateur pour le téléchargement ou nouvel onglet."
      );
    } catch (error) {
      hideLoading();
      console.error("Error generating PDF via service:", error);
      console.error("Full record data at time of error:", fullRecord);
      message.error(
        `Erreur lors de la génération du PDF: ${
          error.message || "Erreur inconnue"
        }. Assurez-vous que les détails du bon sont complets.`
      );
    }
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handlePrintSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.info(
        "Veuillez sélectionner au moins un bon de retour à imprimer."
      );
      return;
    }

    const hideOverallLoading = message.loading(
      `Préparation de l'impression pour ${selectedRowKeys.length} bon(s)...`,
      0
    );
    let successCount = 0;
    let errorCount = 0;

    for (const bonId of selectedRowKeys) {
      const recordToPrint = bonsRetour.find((br) => br.id === bonId);
      console.log("to print")
      if (recordToPrint) {
        try {
          await generateBonRetourPDF(recordToPrint); // This function handles its own success/error messages
          successCount++;
        } catch (error) {
          // Error is already logged and messaged by generateBonRetourPDF
          // We count it here for a final summary
          errorCount++;
        }
      } else {
        console.warn(
          `Bon de retour avec ID ${bonId} non trouvé dans la liste actuelle.`
        );
        errorCount++; // Consider this an error in the batch process
      }
    }
    hideOverallLoading();

    if (successCount > 0 && errorCount === 0) {
      message.success(`${successCount} PDF(s) générés avec succès.`);
    } else if (errorCount > 0) {
      message.warn(
        `${successCount} PDF(s) générés. ${errorCount} erreur(s) lors de la génération.`
      );
    }
    // Optionally clear selection after printing
    // setSelectedRowKeys([]);
  };

  const columns = [
    {
      title: "Numéro",
      dataIndex: "numero_bon",
      key: "numero_bon",
      sorter: true,
    },
    {
      title: "Client",
      dataIndex: ["client", "nom_client"],
      key: "client",
      render: (text, record) =>
        record.client?.nom_client || record.client_name || "N/A",
    },
    {
      title: "Date Retour",
      dataIndex: "date_retour",
      key: "date_retour",
      render: (date) => moment(date).format("DD/MM/YYYY"),
      sorter: true,
    },
   
{
  title: "Statut",
  dataIndex: "status",
  key: "status",
  render: (status, record) => {
    const statusConfig = statusOptions.find((s) => s.value === status);

    const gradients = {
      draft: "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)",
      sent: "linear-gradient(135deg, #91d5ff 0%, #1890ff 100%)",
      completed: "linear-gradient(135deg, #b7eb8f 0%, #52c41a 100%)",
      cancelled: "linear-gradient(135deg, #ffa39e 0%, #ff4d4f 100%)",
    };

    const icons = {
      draft: <FileTextOutlined style={{ marginRight: 6 }} />,
      sent: <SendOutlined style={{ marginRight: 6 }} />,
      completed: <CheckCircleOutlined style={{ marginRight: 6 }} />,
      cancelled: <CloseCircleOutlined style={{ marginRight: 6 }} />,
    };

    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: 20,
          fontWeight: "600",
          color: status === "draft" ? "#000" : "#fff",
          background: gradients[status] || "#eee",
          userSelect: "none",
          boxShadow: "0 2px 8px rgb(0 0 0 / 0.1)",
          cursor: "default",
          whiteSpace: "nowrap",
        }}
        title={statusConfig?.label || status}
      >
        {icons[status]}
        <span>{statusConfig?.label || status}</span>
      </div>
    );
  },
},
    {
      title: "Matières",
      key: "materials_count",
      render: (_, record) => (
        <Badge
          count={
            record.total_materials !== undefined
              ? record.total_materials
              : record.matiere_retours?.length || 0
          }
          style={{ backgroundColor: "#108ee9" }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Imprimer">
            <Button
              icon={<PrinterOutlined />}
              onClick={() => generateBonRetourPDF(record)}
              size="small"
              type="primary"
            />
          </Tooltip>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce bon de retour?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button icon={<DeleteOutlined />} danger size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  const [customMaterials, setCustomMaterials] = useState([
    { name: "", quantite: 0 },
  ]);
  
  return (
    <Content style={{ padding: "24px", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ background: "#fff", padding: "24px", borderRadius: "2px" }}>
      <div
>


 <Title level={2}><FileDoneOutlined /> Bon de Retour</Title>
<Card style={{ marginBottom: 24, overflowX: "auto" }}>
  <Row
  gutter={16}
  style={{ marginBottom: 16, flexWrap: "nowrap", overflowX: "auto" }}
>
  <Col flex="1 1 0" style={{ minWidth: 140 }}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Total
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
        }}
      >
        <FileDoneOutlined style={{ marginRight: 8, color: "#1890ff" }} />
        {stats.total}
      </Text>
    </Card>
  </Col>

  <Col flex="1 1 0" style={{ minWidth: 140 }}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Brouillon
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
        }}
      >
        <FileTextOutlined style={{ marginRight: 8, color: "gray" }} />
        {stats.draft}
      </Text>
    </Card>
  </Col>

  <Col flex="1 1 0" style={{ minWidth: 140 }}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Envoyé
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
        }}
      >
        <SendOutlined style={{ marginRight: 8, color: "#096dd9" }} />
        {stats.sent}
      </Text>
    </Card>
  </Col>

  <Col flex="1 1 0" style={{ minWidth: 140 }}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Terminé
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
        }}
      >
        <CheckCircleOutlined style={{ marginRight: 8, color: "#389e0d" }} />
        {stats.completed}
      </Text>
    </Card>
  </Col>

  <Col flex="1 1 0" style={{ minWidth: 140 }}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Annulé
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
        }}
      >
        <CloseCircleOutlined style={{ marginRight: 8, color: "#cf1322" }} />
        {stats.cancelled}
      </Text>
    </Card>
  </Col>
</Row>

</Card>





</div>


        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Input
                placeholder="Rechercher..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filtrer par statut"
                style={{ width: "100%" }}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
              >
                {statusOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    <Tag color={option.color}>{option.label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filtrer par client"
                style={{ width: "100%" }}
                value={clientFilter}
                onChange={setClientFilter}
                allowClear
                showSearch
                options={clientOptions}
              />
            </Col>
            <Col span={6}>
              <DatePicker
                placeholder="Filtrer par date"
                style={{ width: "100%" }}
                value={dateFilter ? moment(dateFilter) : null}
                onChange={(date) =>
                  setDateFilter(date ? date.format("YYYY-MM-DD") : "")
                }
              />
            </Col>
          </Row>
<div
  style={{
    marginTop: 12,
    display: "flex",
    justifyContent: "flex-end",
    gap: 8, // espace horizontal entre les boutons
    flexWrap: "wrap", // au cas où la fenêtre est petite
  }}
>
 

  <Button
    onClick={() => {
      setSearchText("");
      setStatusFilter("");
      setClientFilter("");
      setDateFilter("");
    }}
  >
    Effacer les filtres
  </Button>

  <Button
    type="primary"
    icon={<PlusOutlined />}
    onClick={handleAdd}
  >
    Nouveau Bon de Retour
  </Button>
</div>

        </Card>

        <Table
          loading={loading}
          columns={columns}
          dataSource={bonsRetour}
          rowKey="id"
          // rowSelection={rowSelection}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} sur ${total} éléments`,
          }}
        />

        {/* Modal for Add/Edit */}
        <Modal
          title={
            editingBonRetour
              ? "Modifier le Bon de Retour"
              : "Nouveau Bon de Retour"
          }
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedMaterials([]);
            setAvailableMaterials([]);
            form.resetFields();
          }}
          footer={null}
          width={1000}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="numero_bon"
                  label="Numéro du Bon"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir le numéro du bon",
                    },
                  ]}
                >
                  <Input disabled={!!editingBonRetour} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="Statut"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner un statut",
                    },
                  ]}
                >
                  <Select>
                    {statusOptions.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        <Tag color={option.color}>{option.label}</Tag>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="client"
              label="Client"
              rules={[
                { required: true, message: "Veuillez sélectionner un client" },
              ]}
            >
              <Select
                showSearch
                placeholder="Rechercher un client..."
                filterOption={false}
                onSearch={debouncedSearch}
                onChange={handleClientChange}
                loading={clientSearchLoading}
                notFoundContent={
                  clientSearchLoading ? <Spin size="small" /> : null
                }
                options={clientOptions}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
  name="date_retour"
  label="Date de Retour"
  rules={[
    {
      required: true,
      message: "Veuillez sélectionner la date de retour",
    },
  ]}
>
  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
</Form.Item>

              </Col>
              <Col span={12}>
               <Form.Item
  name="date_reception"
  label="Date de Réception"
  rules={[
    {
      required: true,
      message: "Veuillez sélectionner la date de réception",
    },
  ]}
>
  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
</Form.Item>

              </Col>
            </Row>

            {/* Available Materials */}
            <Divider orientation="left">Matières à retourner</Divider>
<List
  bordered
  dataSource={customMaterials}
  renderItem={(item, index) => (
    <List.Item
      actions={[
        customMaterials.length > 1 ? (
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => {
              const newList = [...customMaterials];
              newList.splice(index, 1);
              setCustomMaterials(newList);
            }}
          />
        ) : null,
      ]}
    >
      <Space style={{ width: "100%" }} direction="vertical">
        <Input
          placeholder="Nom de la matière"
          value={item.name}
          onChange={(e) => {
            const newList = [...customMaterials];
            newList[index].name = e.target.value;
            setCustomMaterials(newList);
          }}
        />
        <InputNumber
          placeholder="Quantité"
          min={1}
          value={item.quantite}
          onChange={(value) => {
            const newList = [...customMaterials];
            newList[index].quantite = value;
            setCustomMaterials(newList);
          }}
          style={{ width: "100%" }}
        />
      </Space>
    </List.Item>
  )}
  footer={
    <Button
      type="dashed"
      icon={<PlusOutlined />}
      onClick={() =>
        setCustomMaterials([...customMaterials, { name: "", quantite: 1 }])
      }
      block
    >
      Ajouter une matière
    </Button>
  }
/>


            <Form.Item name="notes" label="Notes">
              <TextArea rows={4} placeholder="Notes supplémentaires..." />
            </Form.Item>

            <Divider />

            <Form.Item>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    setSelectedMaterials([]);
                    setAvailableMaterials([]);
                    form.resetFields();
                  }}
                >
                  Annuler
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingBonRetour ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Content>
  );
};

export default BonRetour;
