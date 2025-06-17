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
  Drawer,
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
import BonRetourPdfService from "../../services/BonRetourPdfService";
import "./BonRetour.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Définition des options de statut en dehors du composant BonRetour
const statusOptions = [
  { value: "draft", label: "Brouillon", color: "default" },
  { value: "pending", label: "En attente", color: "orange" },
  { value: "validated", label: "Validé", color: "blue" },
  { value: "completed", label: "Terminé", color: "green" },
  { value: "cancelled", label: "Annulé", color: "red" },
];

const BonRetour = () => {
  const [bonsRetour, setBonsRetour] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBonRetour, setEditingBonRetour] = useState(null);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  const [clientOptions, setClientOptions] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  const applyFilters = (values) => {
    setClientFilter(values.clientId || "");
    // Correction : on prend la date de début et de fin si RangePicker
    setDateFilter(
      values.dateRange && values.dateRange[1]
        ? values.dateRange[1].format("YYYY-MM-DD")
        : ""
    );
    setStatusFilter(values.status || "");
    setFilterDrawerVisible(false);
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setClientFilter("");
    setDateFilter("");
    setStatusFilter("");
    setFilterDrawerVisible(false);
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

  useEffect(() => {
    fetchBonsRetour();
    fetchInitialClients();
  }, [searchText, statusFilter, clientFilter, dateFilter]);

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
      }
    } catch (error) {
      message.error("Erreur lors du chargement des clients");
    }
  };

  const fetchBonsRetour = async () => {
    setLoading(true);
    try {
      const queryParams = {};
      if (searchText) queryParams.search = searchText;
      if (statusFilter) queryParams.status = statusFilter;
      if (clientFilter) queryParams.client = clientFilter;
      if (dateFilter) queryParams.date_retour = dateFilter;
      const data = await BonRetourService.getAllBonsRetour(queryParams);
      if (data && Array.isArray(data.results)) {
        setBonsRetour(data.results);
      } else if (Array.isArray(data)) {
        setBonsRetour(data);
      } else {
        setBonsRetour([]);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des bons de retour");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (record, newStatus) => {
    // Logique pour gérer le changement de statut
    console.log("Changement de statut pour", record, "Nouveau statut:", newStatus);
    // Appeler le service pour mettre à jour le statut du bon de retour
    try {
      await BonRetourService.updateBonRetourStatus(record.id, newStatus);
      message.success("Statut mis à jour avec succès");
      // Mettre à jour localement le bon de retour modifié
      setBonsRetour((prev) =>
        prev.map((bon) =>
          bon.id === record.id ? { ...bon, status: newStatus } : bon
        )
      );
    } catch (error) {
      message.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleEdit = (record) => {
    setEditingBonRetour(record);
    form.setFieldsValue({
      ...record,
      date_retour: moment(record.date_retour),
      date_reception: moment(record.date_reception),
      clientId: record.client?.id,
      // Matières : on extrait les IDs des matières sélectionnées
      materials: record.matiere_retours?.map((matiere) => matiere.id) || [],
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await BonRetourService.deleteBonRetour(id);
      message.success("Bon de retour supprimé avec succès");
      fetchBonsRetour();
    } catch (error) {
      message.error("Erreur lors de la suppression du bon de retour");
    }
  };

  const generateBonRetourPDF = async (record) => {
    try {
      const response = await BonRetourPdfService.generatePDF(record.id);
      const blob = new Blob([response], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bon_retour_${record.numero_bon}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("PDF généré avec succès");
    } catch (error) {
      message.error("Erreur lors de la génération du PDF");
    }
  };

  const handleCreateBonRetour = async () => {
    try {
      const values = await form.validateFields();
      const newBon = {
        id: Date.now(),
        numero_bon: `BR-${Date.now()}`,
        client: clientOptions.find((c) => c.value === values.clientId) || {},
        date_retour: values.date_retour
          ? values.date_retour.format("YYYY-MM-DD")
          : "",
        date_reception: values.date_reception
          ? values.date_reception.format("YYYY-MM-DD")
          : "",
        status: values.status || "draft",
        matiere_retours: [],
        // Ajoutez d'autres champs si besoin
      };
      setBonsRetour((prev) => [newBon, ...prev]);
      setIsModalVisible(false);
      form.resetFields();
      setSelectedMaterials([]);
      setAvailableMaterials([]);
      message.success("Nouveau bon de retour ajouté !");
    } catch (err) {
      message.error("Veuillez remplir tous les champs obligatoires.");
    }
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
    <>
      <Content style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Title level={2}>Gestion des Bons de Retour</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingBonRetour(null);
              form.resetFields();
              setSelectedMaterials([]);
              setAvailableMaterials([]);
              // Pré-remplir les champs par défaut si besoin
              form.setFieldsValue({
                date_retour: moment(),
                date_reception: moment(),
                status: "draft",
                // Ajoutez d'autres valeurs par défaut si nécessaire
              });
              setIsModalVisible(true);
            }}
          >
            Nouveau Bon de Retour
          </Button>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              icon={<SearchOutlined />}
              onClick={() => setFilterDrawerVisible(true)}
            >
              Filtres avancés
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchBonsRetour}>
              Actualiser
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => message.info("Impression en préparation...")}
            >
              Imprimer la sélection
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
      </Content>

      <Drawer
        title="Filtres avancés"
        width={400}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={resetFilters}>Réinitialiser</Button>
            <Button onClick={() => filterForm.submit()} type="primary">
              Appliquer
            </Button>
          </Space>
        }
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={applyFilters}
          initialValues={{
            clientId: clientFilter || undefined,
            dateRange: dateFilter
              ? [null, dateFilter ? moment(dateFilter, "YYYY-MM-DD") : null]
              : null,
            status: statusFilter || undefined,
          }}
        >
          <Form.Item name="clientId" label="Client">
            <Select
              allowClear
              showSearch
              placeholder="Sélectionner un client"
              optionFilterProp="label"
              loading={clientSearchLoading}
              onSearch={debouncedSearch}
              options={clientOptions}
            />
          </Form.Item>

          <Form.Item name="dateRange" label="Période de retour">
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Form.Item>

          <Form.Item name="status" label="Statut">
            <Select allowClear placeholder="Sélectionner un statut">
              {statusOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={resetFilters}>Effacer</Button>
              <Button type="primary" htmlType="submit">
                Appliquer
              </Button>
            </Space>
          </div>
        </Form>
      </Drawer>

      {/* Modal pour création/édition */}
      <Modal
        title={editingBonRetour ? "Modifier le Bon de Retour" : "Nouveau Bon de Retour"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedMaterials([]);
          setAvailableMaterials([]);
          form.resetFields();
        }}
        footer={
          <Space>
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
            <Button type="primary" onClick={handleCreateBonRetour}>
              {editingBonRetour ? "Mettre à jour" : "Créer"}
            </Button>
          </Space>
        }
        width={1000}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="clientId"
            label="Client"
            rules={[{ required: true, message: "Veuillez sélectionner un client" }]}
          >
            <Select
              allowClear
              showSearch
              placeholder="Sélectionner un client"
              optionFilterProp="label"
              loading={clientSearchLoading}
              onSearch={debouncedSearch}
              options={clientOptions}
            />
          </Form.Item>

          <Form.Item
            name="date_retour"
            label="Date de Retour"
            rules={[{ required: true, message: "Veuillez sélectionner une date de retour" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current > moment().endOf("day")}
            />
          </Form.Item>

          <Form.Item
            name="date_reception"
            label="Date de Réception"
            rules={[{ required: true, message: "Veuillez sélectionner une date de réception" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current > moment().endOf("day")}
            />
          </Form.Item>

          <Form.Item name="status" label="Statut">
            <Select allowClear placeholder="Sélectionner un statut">
              {statusOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item label="Matières">
            <Button
              type="dashed"
              style={{ width: "100%" }}
              onClick={() => {
                // Logique pour ouvrir le sélecteur de matières
                setLoadingMaterials(true);
                setTimeout(() => {
                  setLoadingMaterials(false);
                  setAvailableMaterials([
                    { id: 1, name: "Matière 1" },
                    { id: 2, name: "Matière 2" },
                    { id: 3, name: "Matière 3" },
                  ]);
                }, 1000);
              }}
            >
              {loadingMaterials ? <Spin size="small" /> : "Sélectionner les matières"}
            </Button>
          </Form.Item>

          <Form.Item>
            <List
              bordered
              dataSource={selectedMaterials}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        setSelectedMaterials((prev) =>
                          prev.filter((material) => material.id !== item.id)
                        )
                      }
                    />,
                  ]}
                >
                  {item.name}
                </List.Item>
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default BonRetour;
