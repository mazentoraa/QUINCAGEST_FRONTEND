import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Typography,
  Space,
  Card,
  Spin,
  message,
  Popconfirm,
  DatePicker,
  ConfigProvider,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import "moment/locale/fr";
import frFR from "antd/es/locale/fr_FR";
import { AppstoreOutlined } from "@ant-design/icons";
import {  Row, Col } from "antd";
import {
  TagOutlined,
  NumberOutlined,
  CalendarOutlined,
  ProfileOutlined,
  FontSizeOutlined,
} from "@ant-design/icons"
moment.locale("fr");

const { TextArea } = Input;
const { Title } = Typography;
const { RangePicker } = DatePicker;

const {Text } = Typography;

export default function Consommables() {
  const [consommables, setConsommables] = useState([]);
  const [filteredConsommables, setFilteredConsommables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [currentId, setCurrentId] = useState(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

  const fetchConsommables = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/consommables/`);
      const data = Array.isArray(response.data.results)
        ? response.data.results
        : response.data;
      setConsommables(data);
      setFilteredConsommables(data);
    } catch (error) {
      message.error("Erreur lors du chargement des consommables");
      setConsommables([]);
      setFilteredConsommables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsommables();
  }, []);

  useEffect(() => {
    const values = filterForm.getFieldsValue();
    let filtered = [...consommables];

    if (values.nom && values.nom.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.nom.toLowerCase().includes(values.nom.trim().toLowerCase())
      );
    }

    if (values.dateRange && values.dateRange.length === 2) {
      const [start, end] = values.dateRange;
      filtered = filtered.filter((item) => {
        if (!item.date_achat) return false;
        const d = moment(item.date_achat, "YYYY-MM-DD");
        return d.isSameOrAfter(start, "day") && d.isSameOrBefore(end, "day");
      });
    }

    setFilteredConsommables(filtered);
  }, [consommables, filterForm]);

  const handleFilterChange = () => {
    const values = filterForm.getFieldsValue();
    let filtered = [...consommables];

    if (values.nom && values.nom.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.nom.toLowerCase().includes(values.nom.trim().toLowerCase())
      );
    }
    if (values.dateRange && values.dateRange.length === 2) {
      const [start, end] = values.dateRange;
      filtered = filtered.filter((item) => {
        if (!item.date_achat) return false;
        const d = moment(item.date_achat, "YYYY-MM-DD");
        return d.isSameOrAfter(start, "day") && d.isSameOrBefore(end, "day");
      });
    }

    setFilteredConsommables(filtered);
  };

  const handleResetFilters = () => {
    filterForm.resetFields();
    setFilteredConsommables(consommables);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        prix_unitaire:
          values.prix_unitaire !== undefined &&
          values.prix_unitaire !== null &&
          values.prix_unitaire !== ""
            ? parseFloat(values.prix_unitaire)
            : null,
        quantite:
          values.quantite !== undefined &&
          values.quantite !== null &&
          values.quantite !== ""
            ? parseInt(values.quantite, 10)
            : null,
        date_achat: values.date_achat ? values.date_achat.format("YYYY-MM-DD") : null,
      };

      setLoading(true);
      if (currentId) {
        await axios.put(`${API_BASE_URL}/consommables/${currentId}/`, payload);
        message.success("Consommable modifié avec succès");
      } else {
        await axios.post(`${API_BASE_URL}/consommables/`, payload);
        message.success("Consommable ajouté avec succès");
      }

      setVisible(false);
      form.resetFields();
      setCurrentId(null);
      fetchConsommables();
    } catch (error) {
      console.error(error);
      message.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/consommables/${id}/`);
      message.success("Consommable supprimé avec succès");
      fetchConsommables();
    } catch (error) {
      message.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      sorter: (a, b) => a.nom.localeCompare(b.nom),
    },
    {
      title: "Prix unitaire",
      dataIndex: "prix_unitaire",
      key: "prix_unitaire",
      render: (val) => {
        const num = Number(val);
        return !isNaN(num) ? num.toFixed(2) : "-";
      },
      sorter: (a, b) => (a.prix_unitaire || 0) - (b.prix_unitaire || 0),
    },
    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
      sorter: (a, b) => (a.quantite || 0) - (b.quantite || 0),
    },
    {
      title: "Date",
      dataIndex: "date_achat",
      key: "date_achat",
      render: (val) => (val ? moment(val).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) => {
        const dateA = a.date_achat ? moment(a.date_achat) : moment(0);
        const dateB = b.date_achat ? moment(b.date_achat) : moment(0);
        return dateA - dateB;
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
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentId(record.id);
              setVisible(true);
              setTimeout(() => {
                form.setFieldsValue({
                  nom: record.nom,
                  description: record.description,
                  prix_unitaire:
                    record.prix_unitaire !== null && record.prix_unitaire !== undefined
                      ? Number(record.prix_unitaire)
                      : null,
                  quantite:
                    record.quantite !== null && record.quantite !== undefined
                      ? Number(record.quantite)
                      : null,
                  date_achat: record.date_achat ? moment(record.date_achat) : null,
                });
              }, 100);
            }}
          />
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce consommable ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider locale={frFR}>
      <Card>


<div style={{ marginBottom: 32, position: "relative" }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <Space size="large" align="center">
      {/* Badge & Titre */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: "#eb2f96", // rose vif
            borderRadius: 16,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(235, 47, 150, 0.4)",
          }}
        >
          <AppstoreOutlined style={{ fontSize: 24, color: "#fff" }} />
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
          {filteredConsommables?.length || 0}
        </div>
      </div>

      <div>
        <Title
          level={2}
          style={{
            margin: 0,
            fontWeight: 700,
            color: "#eb2f96",
            fontSize: "28px",
          }}
        >
          Consommables
        </Title>
        <Text
          type="secondary"
          style={{
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          {filteredConsommables?.length || 0} consommable
          {filteredConsommables?.length > 1 ? "s" : ""} enregistré
          {filteredConsommables?.length > 1 ? "s" : ""}
          <span
            style={{
              color: "#52c41a",
              marginLeft: 8,
              fontWeight: "bold",
            }}
          >
            ●
          </span>
        </Text>
      </div>
    </Space>

    {/* Boutons Corbeille & Ajouter */}
    <Space size="large">
      <Button
        icon={<DeleteOutlined />}
        size="large"
        style={{
          borderRadius: "12px",
          height: "48px",
          padding: "0 20px",
          border: "2px solid #ef4444",
          color: "#ef4444",
          fontWeight: 600,
          background: "#ffffff",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          fontSize: "15px",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "#dc2626";
          e.target.style.color = "#ffffff";
          e.target.style.background = "#ef4444";
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "#ef4444";
          e.target.style.color = "#ef4444";
          e.target.style.background = "#ffffff";
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.15)";
        }}
        onClick={() => {
          message.info("Fonction de corbeille à implémenter");
        }}
      >
        Corbeille
      </Button>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        size="large"
        onClick={() => {
          form.resetFields();
          setCurrentId(null);
          setVisible(true);
        }}
        style={{
          borderRadius: "12px",
          height: "48px",
          padding: "0 24px",
          background: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
          border: "none",
          fontWeight: 600,
          fontSize: "15px",
          boxShadow: "0 6px 20px rgba(24, 144, 255, 0.3)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          color: "#fff",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 10px 30px rgba(24, 144, 255, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 6px 20px rgba(24, 144, 255, 0.3)";
        }}
      >
        Ajouter un consommable
      </Button>
    </Space>
  </div>
</div>


        <Form
          form={filterForm}
          layout="inline"
          style={{ marginBottom: 16, gap: 16 }}
          onValuesChange={handleFilterChange}
        >
          <Form.Item name="nom">
            <Input placeholder="Filtrer par nom" allowClear />
          </Form.Item>

          <Form.Item name="dateRange">
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={["Date de début", "Date de fin"]}
            />
          </Form.Item>

          <Form.Item>
            <Button onClick={handleResetFilters}>Effacer les filtres</Button>
          </Form.Item>
        </Form>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredConsommables}
            rowKey="id"
            bordered
            pagination={{ pageSize: 5 }}
          />
        </Spin>

  <Modal
  title={currentId ? "Modifier le consommable" : "Nouveau consommable"}
  open={visible}
  onOk={form.submit}
  onCancel={() => {
    setVisible(false);
    form.resetFields();
    setCurrentId(null);
  }}
  width={720}
  okText="Enregistrer"
  cancelText="Annuler"
  confirmLoading={loading}
  bodyStyle={{
    padding: 32,
    backgroundColor: "#fafafa",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    borderRadius: 10,
  }}
  okButtonProps={{
    style: {
      borderRadius: 8,
      background: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
      border: "none",
      fontWeight: "600",
      fontSize: 16,
      boxShadow: "0 6px 20px rgba(24, 144, 255, 0.3)",
      padding: "8px 32px",
      transition: "all 0.3s ease",
    },
  }}
  cancelButtonProps={{
    style: {
      borderRadius: 8,
      fontWeight: "600",
      fontSize: 16,
      padding: "8px 32px",
    },
  }}
>
  <Form
    form={form}
    layout="vertical"
    onFinish={handleSubmit}
    colon={false}
    labelAlign="left"
    labelCol={{ span: 24 }}
  >
    <Form.Item
      name="nom"
      label={<Typography.Text strong>Nom du consommable</Typography.Text>}
      rules={[{ required: true, message: "Ce champ est requis" }]}
      style={{ marginBottom: 24 }}
    >
      <Input
        placeholder="Entrez le nom du consommable"
        size="large"
        prefix={<ProfileOutlined style={{ color: "#1890ff" }} />}
        style={{
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "box-shadow 0.3s ease",
        }}
        onFocus={e => (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")}
        onBlur={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
      />
    </Form.Item>

    <Form.Item
      name="description"
      label={<Typography.Text strong>Description</Typography.Text>}
      style={{ marginBottom: 32 }}
    >
      <TextArea
        rows={3}
        placeholder="Décrire le consommable (optionnel)"
        style={{
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "box-shadow 0.3s ease",
        }}
        onFocus={e => (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")}
        onBlur={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
      />
    </Form.Item>

    <Row gutter={24}>
      <Col span={8}>
        <Form.Item
          name="prix_unitaire"
          label={<Typography.Text strong>Prix unitaire</Typography.Text>}
          rules={[
            {
              validator: (_, value) => {
                if (value === undefined || value === null || value === "")
                  return Promise.resolve();
                const num = Number(value);
                if (isNaN(num) || num < 0) {
                  return Promise.reject(new Error("Doit être un nombre positif"));
                }
                return Promise.resolve();
              },
            },
          ]}
          style={{ marginBottom: 24 }}
        >
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            size="large"
            prefix={<TagOutlined style={{ color: "#1890ff" }} />}
            style={{
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "box-shadow 0.3s ease",
            }}
            onFocus={e => (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")}
            onBlur={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
          />
        </Form.Item>
      </Col>

      <Col span={8}>
        <Form.Item
          name="quantite"
          label={<Typography.Text strong>Quantité</Typography.Text>}
          rules={[
            {
              validator: (_, value) => {
                if (value === undefined || value === null || value === "")
                  return Promise.resolve();
                const num = Number(value);
                if (isNaN(num) || num < 0) {
                  return Promise.reject(new Error("Doit être un nombre positif"));
                }
                return Promise.resolve();
              },
            },
          ]}
          style={{ marginBottom: 24 }}
        >
          <Input
            type="number"
            min={0}
            placeholder="0"
            size="large"
            prefix={<NumberOutlined style={{ color: "#1890ff" }} />}
            style={{
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "box-shadow 0.3s ease",
            }}
            onFocus={e => (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")}
            onBlur={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
          />
        </Form.Item>
      </Col>

      <Col span={8}>
        <Form.Item
          name="date_achat"
          label={<Typography.Text strong>Date d'achat</Typography.Text>}
          style={{ marginBottom: 24 }}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{
              width: "100%",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "box-shadow 0.3s ease",
            }}
            size="large"
            placeholder="JJ/MM/AAAA"
            suffixIcon={<CalendarOutlined style={{ color: "#1890ff" }} />}
            onFocus={e => (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")}
            onBlur={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
</Modal>
      </Card>
    </ConfigProvider>
  );
}
