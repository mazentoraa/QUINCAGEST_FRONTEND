import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Select,
  Input,
  Modal,
  Form,
  Typography,
  Space,
  Card,
  Spin,
  message,
  Popconfirm,
  DatePicker
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment"; // ✅ Import moment

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

export default function PurchaseMatiere() {
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentId, setCurrentId] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

  const fetchMatieres = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matiere-purchase/`);
      setMatieres(response.data.results || response.data); // ✅ sécurise .results ou non
    } catch (error) {
      message.error("Erreur lors du chargement des matières");
      setMatieres([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatieres();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        prix_unitaire: values.prix_unitaire ? parseFloat(values.prix_unitaire) : null,
        quantite: parseInt(values.quantite),
        purshase_date: values.purshase_date
          ? values.purshase_date.format("YYYY-MM-DD")
          : null,
      };

      if (currentId) {
        await axios.put(`${API_BASE_URL}/matiere-purchase/${currentId}/`, payload, {
          headers: { "Content-Type": "application/json" }
        });
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
      key: "nom"
    },
    {
      title: "Prix unitaire",
      dataIndex: "prix_unitaire",
      key: "price",
      render: value => `${value}`
    },
    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantity"
    },
  {
  title: "Date d'Achat",
  dataIndex: "purshase_date",
  key: "purshase_date",
  render: (value) => value ? moment(value).format("D-M-YYYY") : "-"
},

    {
      title: "Description",
      dataIndex: "description",
      key: "description"
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
                purshase_date: record.purshase_date ? moment(record.purshase_date) : null
              });
              setCurrentId(record.id);
              setVisible(true);
            }}
          />
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette matière ?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={4}>Gestion des Achats</Title>
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

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={matieres}
          rowKey="id"
          bordered
        />
      </Spin>

      <Modal
        title={currentId ? "Modifier la matière" : "Nouveau Achat"}
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
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
