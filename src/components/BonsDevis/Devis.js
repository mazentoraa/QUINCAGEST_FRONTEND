import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Input,
  Select,
  DatePicker,
  Table,
  Space,
  Card,
  Row,
  Col,
  Tag,
  Drawer,
  Form,
  notification
} from "antd";
import {
  ReloadOutlined,
  FilterOutlined,
  PlusOutlined,
  FilePdfOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

const Devis = () => {
  const [devisList, setDevisList] = useState([]);
  const [filteredDevisList, setFilteredDevisList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [filterForm] = Form.useForm();
  const [createForm] = Form.useForm();

  const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

  useEffect(() => {
    fetchDevis();
  }, []);

  useEffect(() => {
    filterDevisList();
  }, [devisList, searchText]);
  
const filterDevisList = () => {
  const values = filterForm.getFieldsValue();
  applyFilters(values);
};

  const fetchDevis = async () => {
    try {
      const response = await axios.get(`${API_URL}/devis/`);
      const data = Array.isArray(response.data) ? response.data : [];
      setDevisList(data);
      setFilteredDevisList(data);
    } catch (error) {
      notification.error({ message: "Erreur", description: "Échec du chargement des devis." });
      setDevisList([]);
      setFilteredDevisList([]);
    }
  };

  const applyFilters = (values) => {
    let result = [...devisList];

    if (values.numeroSearch) {
      const search = values.numeroSearch.toLowerCase();
      result = result.filter((d) => d.numero_devis.toLowerCase().includes(search));
    }

    if (values.status) {
      result = result.filter((d) => d.statut === values.status);
    }

    if (values.dateEmission && values.dateEmission[0] && values.dateEmission[1]) {
      const [start, end] = values.dateEmission;
      result = result.filter((d) => {
        const date = dayjs(d.date_emission);
        return date.isAfter(start.startOf("day")) && date.isBefore(end.endOf("day"));
      });
    }

    if (values.dateValidite && values.dateValidite[0] && values.dateValidite[1]) {
      const [start, end] = values.dateValidite;
      result = result.filter((d) => {
        const date = dayjs(d.date_validite);
        return date.isAfter(start.startOf("day")) && date.isBefore(end.endOf("day"));
      });
    }

    setFilteredDevisList(result);
    setFilterDrawerVisible(false);
  };

  const handleCreateDevis = async () => {
    try {
      const values = await createForm.validateFields();
      const newDevis = {
        id: Date.now(),
        numero_devis: `DV-${Date.now()}`,
        date_emission: values.date_emission ? values.date_emission.format("YYYY-MM-DD") : "",
        date_validite: values.date_validite ? values.date_validite.format("YYYY-MM-DD") : "",
        statut: values.statut || "draft",
        montant_ttc: values.montant_ttc || 0,
      };
      setDevisList(prev => [newDevis, ...prev]);
      setFilteredDevisList(prev => [newDevis, ...prev]);
      setIsDrawerVisible(false);
      createForm.resetFields();
      notification.success({ message: "Nouveau devis ajouté !" });
    } catch (err) {
      notification.error({ message: "Erreur", description: "Veuillez remplir tous les champs obligatoires." });
    }
  };

  const columns = [
    {
      title: "№ Devis",
      dataIndex: "numero_devis",
      key: "numero_devis"
    },
    {
      title: "Date d'émission",
      dataIndex: "date_emission",
      key: "date_emission",
      render: (text) => dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "Date de validité",
      dataIndex: "date_validite",
      key: "date_validite",
      render: (text) => dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => <Tag>{status}</Tag>
    },
    {
      title: "Montant TTC",
      dataIndex: "montant_ttc",
      key: "montant_ttc",
      render: (val) => `${val?.toLocaleString()} TND`
    },
    {
      title: "Actions",
      key: "actions",
      render: () => <Button size="small">Voir</Button>
    }
  ];

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2 style={{ margin: 0 }}>Devis</h2>
        </Col>
        <Col>
          <Space>
            <Input.Search
              placeholder="Rechercher par N° devis"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 250 }}
            />
            <Button icon={<FilterOutlined />} onClick={() => setFilterDrawerVisible(true)}>
              Filtres avancés
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                createForm.resetFields();
                setIsDrawerVisible(true);
              }}
            >
              Nouveau Devis
            </Button>
            <Button icon={<FilePdfOutlined />}>Exporter PDFs</Button>
            <Button icon={<ReloadOutlined />} onClick={fetchDevis} />
          </Space>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={Array.isArray(filteredDevisList) ? filteredDevisList : []}
        pagination={{ pageSize: 10 }}
        bordered
      />

      <Drawer
        title="Filtres avancés"
        width={400}
        open={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setFilterDrawerVisible(false)}>Annuler</Button>
            <Button type="primary" onClick={() => filterForm.submit()}>Appliquer</Button>
          </Space>
        }
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={applyFilters}
        >
          <Form.Item name="numeroSearch" label="№ Devis">
            <Input placeholder="Rechercher par N° devis" />
          </Form.Item>
          <Form.Item name="dateEmission" label="Date d'émission">
            <DatePicker.RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="dateValidite" label="Date de validité">
            <DatePicker.RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="status" label="Statut">
            <Select allowClear>
              <Option value="draft">Brouillon</Option>
              <Option value="sent">Envoyé</Option>
              <Option value="accepted">Accepté</Option>
              <Option value="rejected">Rejeté</Option>
              <Option value="expired">Expiré</Option>
              <Option value="converted">Converti</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Nouveau Devis"
        width={500}
        open={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerVisible(false)}>Annuler</Button>
            <Button type="primary" onClick={handleCreateDevis}>Créer</Button>
          </Space>
        }
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="date_emission" label="Date d'émission" rules={[{ required: true, message: "Date d'émission requise" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="date_validite" label="Date de validité" rules={[{ required: true, message: "Date de validité requise" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="statut" label="Statut" rules={[{ required: true, message: "Statut requis" }]}>
            <Select>
              <Option value="draft">Brouillon</Option>
              <Option value="sent">Envoyé</Option>
              <Option value="accepted">Accepté</Option>
              <Option value="rejected">Rejeté</Option>
              <Option value="expired">Expiré</Option>
              <Option value="converted">Converti</Option>
            </Select>
          </Form.Item>
          <Form.Item name="montant_ttc" label="Montant TTC" rules={[{ required: true, message: "Montant TTC requis" }]}>
            <Input type="number" min={0} addonAfter="TND" />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
};

export default Devis;