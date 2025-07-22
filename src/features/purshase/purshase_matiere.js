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
  AppstoreOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import "moment/locale/fr";
import frFR from "antd/es/locale/fr_FR";

import TextArea from "antd/es/input/TextArea";
import {
  ProfileOutlined,
  TagOutlined,
  NumberOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
moment.locale("fr");

const { Title, Text } = Typography;

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

  const handleCorbeille = () => {
    // Ta logique corbeille ici (par exemple afficher une page ou modal)
    message.info("Bouton Corbeille cliqué");
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
        <div style={{ marginBottom: 32, position: "relative" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space size="large" align="center">
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
                  {matieres?.length || 0}
                </div>
              </div>

              <div>
                <Title
                  level={2}
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    color: "#eb2f96", // titre rose
                    fontSize: "28px",
                  }}
                >
                  Achats 
                </Title>
                <Text
                  type="secondary"
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  {matieres?.length || 0} matière
                  {matieres?.length > 1 ? "s" : ""} enregistrée
                  {matieres?.length > 1 ? "s" : ""}
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
                onClick={handleCorbeille}
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
                  position: "relative",
                  overflow: "hidden",
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
                Ajouter
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
      onOk={form.submit}
      onCancel={() => {
        setVisible(false);
        form.resetFields();
        setCurrentId(null);
      }}
      width={800}
      okText="Enregistrer"
      cancelText="Annuler"
      bodyStyle={{
        padding: 32,
        backgroundColor: "#fafafa",
        borderRadius: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
      okButtonProps={{
        style: {
          borderRadius: 12,
          background:
            "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          border: "none",
          fontWeight: "700",
          fontSize: 16,
          boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
          padding: "10px 36px",
          transition: "all 0.3s ease",
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "0 12px 35px rgba(59, 130, 246, 0.4)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 8px 25px rgba(59, 130, 246, 0.3)";
        },
      }}
      cancelButtonProps={{
        style: {
          borderRadius: 12,
          fontWeight: "600",
          fontSize: 16,
          padding: "10px 32px",
          color: "#374151",
          border: "2px solid #e5e7eb",
          transition: "all 0.3s ease",
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.backgroundColor = "#f3f4f6";
          e.currentTarget.style.borderColor = "#9ca3af";
          e.currentTarget.style.color = "#1f2937";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.color = "#374151";
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
          label={<Text strong style={{ fontSize: 16, color: "#111827" }}>Nom de la matière</Text>}
          rules={[{ required: true, message: "Ce champ est requis" }]}
          style={{ marginBottom: 28 }}
        >
          <Input
            placeholder="Nom de la matière"
            size="large"
            prefix={<ProfileOutlined style={{ color: "#3b82f6" }} />}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              border: "2px solid #e5e7eb",
              fontSize: 15,
              transition: "box-shadow 0.3s ease, border-color 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 8px #3b82f6";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={<Text strong style={{ fontSize: 16, color: "#111827" }}>Description</Text>}
          style={{ marginBottom: 36 }}
        >
          <TextArea
            rows={4}
            placeholder="Décrire la matière (optionnel)"
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              border: "2px solid #e5e7eb",
              fontSize: 15,
              transition: "box-shadow 0.3s ease, border-color 0.3s ease",
              resize: "none",
              padding: 12,
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 8px #3b82f6";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          />
        </Form.Item>

        <Space
          size="large"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          {["prix_unitaire", "quantite", "purchase_date"].map((field, i) => {
            const labels = {
              prix_unitaire: "Prix unitaire (TND)",
              quantite: "Quantité",
              purchase_date: "Date d'achat",
            };
            const icons = {
              prix_unitaire: <TagOutlined style={{ color: "#3b82f6" }} />,
              quantite: <NumberOutlined style={{ color: "#3b82f6" }} />,
              purchase_date: <CalendarOutlined style={{ color: "#3b82f6" }} />,
            };
            const placeholders = {
              prix_unitaire: "0.00",
              quantite: "0",
              purchase_date: "JJ/MM/AAAA",
            };
            return (
              <Form.Item
                key={field}
                name={field}
                label={
                  <Text strong style={{ fontSize: 16, color: "#111827" }}>
                    {labels[field]}
                  </Text>
                }
                rules={
                  field !== "purchase_date"
                    ? [
                        { required: true, message: `${labels[field]} requis` },
                        {
                          validator: (_, value) => {
                            if (
                              value === undefined ||
                              value === null ||
                              value === ""
                            )
                              return Promise.resolve();
                            const num = Number(value);
                            if (isNaN(num) || num < 0) {
                              return Promise.reject(
                                new Error("Doit être un nombre positif")
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]
                    : [{ required: true, message: "Date requise" }]
                }
                style={{ flex: 1 }}
              >
                {field === "purchase_date" ? (
                  <DatePicker
                    format="DD/MM/YYYY"
                    size="large"
                    placeholder={placeholders[field]}
                    suffixIcon={icons[field]}
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                      border: "2px solid #e5e7eb",
                      fontSize: 15,
                      transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 8px #3b82f6";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  />
                ) : (
                  <Input
                    type={field === "quantite" ? "number" : "text"}
                    min={0}
                    placeholder={placeholders[field]}
                    size="large"
                    prefix={icons[field]}
                    style={{
                      borderRadius: 12,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                      border: "2px solid #e5e7eb",
                      fontSize: 15,
                      transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 8px #3b82f6";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  />
                )}
              </Form.Item>
            );
          })}
        </Space>
      </Form>
    </Modal>
      </Card>
    </ConfigProvider>
  );
}
