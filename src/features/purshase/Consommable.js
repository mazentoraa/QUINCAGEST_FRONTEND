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

moment.locale("fr");

const { TextArea } = Input;
const { Title } = Typography;
const { RangePicker } = DatePicker;

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
        <div
          style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}
        >
          <Title level={4}>Gestion des consommables</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setCurrentId(null);
              setVisible(true);
            }}
          >
            Ajouter
          </Button>
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
          onOk={handleSubmit}
          onCancel={() => {
            setVisible(false);
            form.resetFields();
            setCurrentId(null);
          }}
          width={800}
          okText="Enregistrer"
          cancelText="Annuler"
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="nom"
              label="Nom"
              rules={[{ required: true, message: "Ce champ est requis" }]}
            >
              <Input placeholder="Nom du consommable" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={2} />
            </Form.Item>

            <Space style={{ display: "flex", justifyContent: "space-between" }}>
              <Form.Item
                name="prix_unitaire"
                label="Prix unitaire"
                style={{ flex: 1 }}
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
              >
                <Input type="number" min={0} step="0.01" />
              </Form.Item>

              <Form.Item
                name="quantite"
                label="Quantité"
                style={{ flex: 1 }}
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
              >
                <Input type="number" min={0} />
              </Form.Item>

              <Form.Item name="date_achat" label="Date" style={{ flex: 1 }}>
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Space>
          </Form>
        </Modal>
      </Card>
    </ConfigProvider>
  );
}
