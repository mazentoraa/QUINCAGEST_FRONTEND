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
    { label: "Brouillon", value: "draft", color: "default" },
    { label: "Envoyé", value: "sent", color: "processing" },
    { label: "Terminé", value: "completed", color: "success" },
    { label: "Annulé", value: "cancelled", color: "error" },
  ];

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

    // Set default values
    form.setFieldsValue({
      numero_bon: BonRetourService.generateBonRetourNumber(),
      date_reception: moment(),
      date_retour: moment(),
      status: "draft",
    });

    setIsModalVisible(true);
  };

  const handleEdit = async (record) => {
    setEditingBonRetour(record);
    form.setFieldsValue({
      numero_bon: record.numero_bon,
      client: record.client?.id || record.client,
      date_reception: moment(record.date_reception),
      date_retour: moment(record.date_retour),
      status: record.status,
      notes: record.notes,
    });

    // Load available materials for this client
    if (record.client?.id || record.client) {
      await handleClientChange(record.client?.id || record.client);
    }

    // Pre-populate selected materials
    if (record.matiere_retours && record.matiere_retours.length > 0) {
      const initialSelectedMaterials = record.matiere_retours.map((retour) => ({
        materialId: retour.matiere?.id || retour.matiere,
        quantite_retournee: retour.quantite_retournee,
      }));
      setSelectedMaterials(initialSelectedMaterials);
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
      // Validate materials selection
      if (selectedMaterials.length === 0) {
        message.error("Veuillez sélectionner au moins une matière à retourner");
        return;
      }

      // Prepare materials data for submission
      const materialsToSubmit = selectedMaterials.map((mat) => ({
        matiere_id: mat.materialId,
        quantite_retournee: mat.quantite_retournee,
      }));

      const bonRetourData = {
        ...values,
        date_reception: values.date_reception.format("YYYY-MM-DD"),
        date_retour: values.date_retour.format("YYYY-MM-DD"),
        matiere_retours: materialsToSubmit, // Use materialsToSubmit instead of materialsToValidate
      };

      if (editingBonRetour) {
        await BonRetourService.updateBonRetour(
          editingBonRetour.id,
          bonRetourData
        );
        message.success("Bon de retour mis à jour avec succès");
      } else {
        await BonRetourService.createBonRetour(bonRetourData);
        message.success("Bon de retour créé avec succès");
      }

      setIsModalVisible(false);
      fetchBonsRetour();
      setSelectedMaterials([]);
      setAvailableMaterials([]);
      form.resetFields();
    } catch (error) {
      message.error("Erreur lors de l'enregistrement");
    }
  };

  const handleStatusChange = async (record, newStatus) => {
    try {
      await BonRetourService.updateBonRetourStatus(record.id, newStatus);
      message.success("Statut mis à jour avec succès");
      fetchBonsRetour();
    } catch (error) {
      message.error("Erreur lors de la mise à jour du statut");
    }
  };

  const generateBonRetourPDF = async (recordFromList) => {
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
      title: "Date Réception",
      dataIndex: "date_reception",
      key: "date_reception",
      render: (date) => moment(date).format("DD/MM/YYYY"),
      sorter: true,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const statusConfig = statusOptions.find((s) => s.value === status);
        return (
          <Select
            value={status}
            style={{ width: 120 }}
            onChange={(newStatus) => handleStatusChange(record, newStatus)}
            size="small"
          >
            {statusOptions.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                <Tag color={option.color}>{option.label}</Tag>
              </Select.Option>
            ))}
          </Select>
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

  return (
    <Content style={{ padding: "24px", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ background: "#fff", padding: "24px", borderRadius: "2px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <Title level={2}>Gestion des Bons de Retour</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Nouveau Bon de Retour
          </Button>
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
          <div style={{ marginTop: 12 }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBonsRetour}
              style={{ marginRight: 8 }}
            >
              Actualiser
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrintSelected}
              disabled={selectedRowKeys.length === 0}
              style={{ marginRight: 8 }}
            >
              Imprimer la sélection ({selectedRowKeys.length})
            </Button>
            <Button
              onClick={() => {
                setSearchText("");
                setStatusFilter("");
                setClientFilter("");
                setDateFilter("");
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </Card>

        <Table
          loading={loading}
          columns={columns}
          dataSource={bonsRetour}
          rowKey="id"
          rowSelection={rowSelection}
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
                  <DatePicker style={{ width: "100%" }} />
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
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            {/* Available Materials */}
            {availableMaterials.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Divider orientation="left">
                  Matières Disponibles pour Retour
                </Divider>
                <List
                  loading={loadingMaterials}
                  dataSource={availableMaterials}
                  renderItem={(material) => {
                    const currentSelection = selectedMaterials.find(
                      (sm) => sm.materialId === material.id
                    );
                    return (
                      <List.Item>
                        <Card style={{ width: "100%" }} size="small">
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <Space>
                                <Tag color="blue">{material.type_matiere}</Tag>
                                <span>
                                  {material.description ||
                                    material.designation ||
                                    "N/A"}
                                </span>
                              </Space>
                              <div>
                                <Text type="secondary">
                                  Dimensions: {material.thickness || "-"}x
                                  {material.length || "-"}x
                                  {material.width || "-"}mm
                                </Text>
                              </div>
                              <div>
                                <Text type="secondary">
                                  Quantité disponible:{" "}
                                  <strong>{material.remaining_quantity}</strong>
                                </Text>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <InputNumber
                                min={0}
                                max={material.remaining_quantity}
                                value={
                                  currentSelection
                                    ? currentSelection.quantite_retournee
                                    : material.remaining_quantity
                                }
                                onChange={(value) =>
                                  handleMaterialSelect(material.id, value)
                                }
                                addonAfter="pièces"
                                placeholder="Qté à retourner"
                                style={{ width: 160 }}
                              />
                              {currentSelection && (
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  onClick={() =>
                                    handleMaterialSelect(material.id, 0)
                                  }
                                >
                                  Retirer
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </List.Item>
                    );
                  }}
                />

                {selectedMaterials.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5}>
                      Matières sélectionnées pour retour (
                      {selectedMaterials.length})
                    </Title>
                    <List
                      size="small"
                      bordered
                      dataSource={selectedMaterials}
                      renderItem={(item) => {
                        const material = availableMaterials.find(
                          (m) => m.id === item.materialId
                        );
                        return (
                          <List.Item>
                            <Space>
                              <Tag color="green">{material?.type_matiere}</Tag>
                              <Text>
                                {material?.description ||
                                  material?.designation ||
                                  "Matériau inconnu"}
                                ({material?.thickness || "-"}x
                                {material?.length || "-"}x
                                {material?.width || "-"}mm)
                              </Text>
                              <Text strong>
                                - {item.quantite_retournee} pièce(s)
                              </Text>
                            </Space>
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            )}

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
