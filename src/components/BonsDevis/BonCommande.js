// bonCommande.js (modifié avec filtrage avancé et nettoyage)
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Row,
  Col,
  Divider,
  Layout,
  message,
  Tooltip,
  Popconfirm,
  Typography,
  Spin,
  Card,
  Badge,
} from "antd";
import {
  PrinterOutlined,
  EditOutlined,
  FilePdfOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileDoneOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { debounce } from "lodash";
import moment from "moment";
import { getApiService } from "../../services/apiServiceFactory";
import ClientService from "../../features/clientManagement/services/ClientService";
import ProductService from "../../components/BonsDevis/ProductService";
import BonCommandePdfApiService from "../../features/orders/services/BonCommandePdfApiService";

const { RangePicker } = DatePicker;
const { orderService } = getApiService();
const { Option } = Select;
const { Title } = Typography;

export default function BonCommande() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);

  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [filterForm] = Form.useForm();
  const [availableClients, setAvailableClients] = useState([]);

  // Ajoutez l'état pour le Drawer de création/édition
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [drawerForm] = Form.useForm();
  const [isCreating, setIsCreating] = useState(false);

  // Ajoutez l'état pour stocker toutes les factures créées localement (pour la démo)
  const [createdOrders, setCreatedOrders] = useState([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      message.error("Erreur lors du chargement des commandes : " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableClients = useCallback(async () => {
    try {
      const clients = await ClientService.get_all_clients();
      setAvailableClients(clients);
    } catch (err) {
      message.error("Erreur lors du chargement des clients : " + err.message);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchAvailableClients();
  }, [fetchOrders, fetchAvailableClients]);

  const applyFilters = (values) => {
    setSearchText(values.numeroSearch || "");
    setSelectedClientFilter(values.clientId || null);
    setSelectedStatus(values.status || null);
    setDateRange(values.dateRange || null);
    setFilterDrawerVisible(false);
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setSearchText("");
    setSelectedClientFilter(null);
    setSelectedStatus(null);
    setDateRange(null);
    setFilterDrawerVisible(false);
  };

  const filterOrders = useCallback(() => {
    let result = [...orders];
    if (searchText) {
      result = result.filter((order) =>
        order.numero_commande?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (selectedClientFilter) {
      result = result.filter((order) => order.client_id === selectedClientFilter);
    }
    if (selectedStatus) {
      result = result.filter((order) => order.statut === selectedStatus);
    }
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      result = result.filter((order) => {
        const orderDate = moment(order.date_commande);
        return orderDate.isBetween(start, end, 'day', '[]');
      });
    }
    setFilteredOrders(result);
  }, [orders, searchText, selectedClientFilter, selectedStatus, dateRange]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const columns = [
    { title: "N° Commande", dataIndex: "numero_commande", key: "numero_commande" },
    { title: "Client", dataIndex: "nom_client", key: "nom_client" },
    { title: "Date Commande", dataIndex: "date_commande", key: "date_commande",
      render: (date) => date ? moment(date).format("DD/MM/YYYY") : "" },
    { title: "Date Livraison", dataIndex: "date_livraison_prevue", key: "date_livraison_prevue",
      render: (date) => date ? moment(date).format("DD/MM/YYYY") : "" },
    { title: "Statut", dataIndex: "statut", key: "statut" },
  ];

  // Fonction pour ouvrir le Drawer de création
  const handleCreateOrder = () => {
    setIsCreating(true);
    drawerForm.resetFields();
    setIsDrawerVisible(true);
  };

  // Fonction pour gérer la création d'une commande (facture)
  const handleDrawerSave = async () => {
    try {
      const values = await drawerForm.validateFields();
      // Créez un objet commande minimal (à adapter selon votre modèle)
      const newOrder = {
        id: Date.now(), // Génère un id unique local
        numero_commande: `CMD-${Date.now()}`,
        nom_client: availableClients.find(c => c.id === values.client_id)?.nom_client || "",
        date_commande: values.date_commande ? values.date_commande.format("YYYY-MM-DD") : "",
        date_livraison_prevue: values.date_livraison_prevue ? values.date_livraison_prevue.format("YYYY-MM-DD") : "",
        statut: "pending",
        // Ajoutez d'autres champs si besoin
      };
      // Ajoutez la commande à la liste locale (pour la démo)
      setOrders(prev => [newOrder, ...prev]);
      setFilteredOrders(prev => [newOrder, ...prev]);
      setCreatedOrders(prev => [newOrder, ...prev]);
      setIsDrawerVisible(false);
      message.success("Commande ajoutée !");
    } catch (err) {
      message.error("Veuillez remplir tous les champs obligatoires.");
    }
  };

  return (
    <Layout.Content style={{ padding: 24 }}>
      <Card>
        <Row style={{ marginBottom: 8 }}>
    <Col span={24}>
      <Title level={2}>
        <FileDoneOutlined style={{ marginRight: 8 }} />
        Bons de Commande
      </Title>
    </Col>
  </Row>
        <Row justify="end" gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Button onClick={() => setFilterDrawerVisible(true)} icon={<SearchOutlined />}>Filtres avancés</Button>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateOrder}
            >
              Nouvelle Commande
            </Button>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>Actualiser</Button>
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      <Drawer
        title="Filtres avancés"
        width={400}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={() => setFilterDrawerVisible(false)}>Annuler</Button>
            <Button onClick={() => filterForm.submit()} type="primary">Appliquer</Button>
          </Space>
        }
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={applyFilters}
          initialValues={{
            clientId: selectedClientFilter,
            dateRange,
            numeroSearch: searchText,
            status: selectedStatus,
          }}
        >
          <Form.Item name="numeroSearch" label="N° Commande">
            <Input placeholder="Rechercher par numéro" />
          </Form.Item>

          <Form.Item name="clientId" label="Client">
            <Select
              allowClear
              showSearch
              placeholder="Sélectionner un client"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableClients.map((client) => (
                <Option key={client.id} value={client.id}>
                  {client.nom_client || client.nom}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="Date de commande">
            <RangePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="status" label="Statut">
            <Select allowClear placeholder="Filtrer par statut">
              <Option value="pending">En attente</Option>
              <Option value="processing">En cours</Option>
              <Option value="completed">Terminée</Option>
              <Option value="cancelled">Annulée</Option>
              <Option value="invoiced">Facturée</Option>
            </Select>
          </Form.Item>

          <Divider />
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={resetFilters}>Réinitialiser</Button>
              <Button type="primary" htmlType="submit">Appliquer</Button>
            </Space>
          </div>
        </Form>
      </Drawer>

      {/* Drawer de création/édition de commande */}
      <Drawer
        title={isCreating ? "Nouvelle Commande" : "Modifier Commande"}
        width={800}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerVisible(false)}>Annuler</Button>
            <Button type="primary" onClick={handleDrawerSave}>
              {isCreating ? "Créer" : "Sauvegarder"}
            </Button>
          </Space>
        }
      >
        <Form form={drawerForm} layout="vertical">
          {/* Ajoutez ici les champs nécessaires pour la création de commande */}
          <Form.Item name="client_id" label="Client" rules={[{ required: true, message: "Veuillez sélectionner un client" }]}>
            <Select
              placeholder="Sélectionner un client"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableClients.map((client) => (
                <Option key={client.id} value={client.id}>
                  {client.nom_client || client.nom}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date_commande" label="Date Commande" rules={[{ required: true, message: "Veuillez sélectionner une date" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="date_livraison_prevue" label="Date Livraison Prévue">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          {/* Ajoutez d'autres champs selon votre modèle */}
        </Form>
      </Drawer>
    </Layout.Content>
  );
}
