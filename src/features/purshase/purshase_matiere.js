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
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import "moment/locale/fr";
import frFR from "antd/es/locale/fr_FR";

moment.locale("fr");

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function PurchaseMatiere() {
  const [matieres, setMatieres] = useState([]);
  const [filteredMatieres, setFilteredMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [currentId, setCurrentId] = useState(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

  const fetchMatieres = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matiere-purchase/`);
      const data = response.data.results || response.data;
      setMatieres(data);
      setFilteredMatieres(data);
    } catch (error) {
      message.error("Erreur lors du chargement des matières");
      setMatieres([]);
      setFilteredMatieres([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatieres();
  }, []);

  useEffect(() => {
    const values = filterForm.getFieldsValue();
    let filtered = [...matieres];

    if (values.nom && values.nom.trim() !== "") {
      filtered = filtered.filter((m) =>
        m.nom.toLowerCase().includes(values.nom.trim().toLowerCase())
      );
    }

    if (values.dateRange && values.dateRange.length === 2) {
      const [start, end] = values.dateRange;
      filtered = filtered.filter((m) => {
        if (!m.purshase_date) return false;
        const d = moment(m.purshase_date, "YYYY-MM-DD");
        return d.isSameOrAfter(start, "day") && d.isSameOrBefore(end, "day");
      });
    }

    setFilteredMatieres(filtered);
  }, [matieres, filterForm]);

  const handleFilterChange = () => {
    const values = filterForm.getFieldsValue();
    let filtered = [...matieres];

    if (values.nom && values.nom.trim() !== "") {
      filtered = filtered.filter((m) =>
        m.nom.toLowerCase().includes(values.nom.trim().toLowerCase())
      );
    }

    if (values.dateRange && values.dateRange.length === 2) {
      const [start, end] = values.dateRange;
      filtered = filtered.filter((m) => {
        if (!m.purshase_date) return false;
        const d = moment(m.purshase_date, "YYYY-MM-DD");
        return d.isSameOrAfter(start, "day") && d.isSameOrBefore(end, "day");
      });
    }

    setFilteredMatieres(filtered);
  };

  const handleResetFilters = () => {
    filterForm.resetFields();
    setFilteredMatieres(matieres);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        prix_unitaire: values.prix_unitaire
          ? parseFloat(values.prix_unitaire)
          : null,
        quantite: parseInt(values.quantite),
        purshase_date: values.purshase_date
          ? values.purshase_date.format("YYYY-MM-DD")
          : null,
      };

      if (currentId) {
        await axios.put(
          `${API_BASE_URL}/matiere-purchase/${currentId}/`,
          payload
        );
        message.success("Matière mise à jour avec succès");
      } else {
        await axios.post(`${API_BASE_URL}/matiere-purchase/`, payload);
        message.success("Matière ajoutée avec succès");
      }

      setVisible(false);
      form.resetFields();
      fetchMatieres();
      setCurrentId(null);
    } catch (error) {
      console.error(error);
      message.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/matiere-purchase/${id}/`);
      message.success("Matière supprimée avec succès");
      fetchMatieres();
    } catch (error) {
      message.error("Erreur lors de la suppression");
    }
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
    },
    {
      title: "Prix unitaire",
      dataIndex: "prix_unitaire",
      key: "prix_unitaire",
      render: (value) => `${value?.toFixed(2) ?? "-"}`,
    },
    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
    },
    {
      title: "Date d'Achat",
      dataIndex: "purshase_date",
      key: "purshase_date",
      render: (value) => (value ? moment(value).format("DD/MM/YYYY") : "-"),
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
            icon={<EditOutlined />}
            onClick={() => {
              form.setFieldsValue({
                ...record,
                purshase_date: record.purshase_date
                  ? moment(record.purshase_date)
                  : null,
              });
              setCurrentId(record.id);
              setVisible(true);
            }}
          />
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cet Achat ?"
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
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Title level={4}>Achats</Title>
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
              placeholder={["Date début", "Date fin"]}
              style={{ width: 280 }}
            />
          </Form.Item>

          <Form.Item>
            <Button onClick={handleResetFilters}>Effacer les filtres</Button>
          </Form.Item>
        </Form>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredMatieres}
            rowKey="id"
            bordered
            pagination={{ pageSize: 6 }}
          />
        </Spin>

        <Modal
          title={currentId ? "Modifier la matière" : "Nouvel achat"}
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
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="nom"
              label="Nom"
              rules={[{ required: true, message: "Ce champ est requis" }]}
            >
              <Input placeholder="Nom de la matière" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={2} />
            </Form.Item>

            <Space size="large" style={{ width: "100%" }}>
              <Form.Item
                name="prix_unitaire"
                label="Prix unitaire"
                rules={[{ required: true, message: "Prix unitaire requis" }]}
              >
                <Input type="number" min={0} />
              </Form.Item>

              <Form.Item
                name="quantite"
                label="Quantité"
                rules={[{ required: true, message: "Quantité requise" }]}
              >
                <Input type="number" min={0} />
              </Form.Item>

              <Form.Item
                name="purshase_date"
                label="Date d'achat"
                rules={[{ required: true, message: "Date requise" }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Space>
          </Form>
        </Modal>
      </Card>
    </ConfigProvider>
  );
}
