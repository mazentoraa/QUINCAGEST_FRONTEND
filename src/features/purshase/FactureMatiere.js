import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Select,
  Input,
  InputNumber,
  Modal,
  Form,
  Typography,
  Space,
  DatePicker,
  Card,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FileDoneOutlined
} from "@ant-design/icons";
import {

  TagOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  NumberOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import moment from "moment";
import FactureAchatMatiereService from "./Services/FactureAchatMatiereService";
import FournisseurService from "./Services/FournisseurService";

const { Title } = Typography;
const { Option } = Select;

export default function FactureMatiere() {
  const [form] = Form.useForm();
  const [factures, setFactures] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [visible, setVisible] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [achats, setAchats] = useState([]);
  const [editingAchatIndex, setEditingAchatIndex] = useState(null);

  // Filtres
  const [filterNumero, setFilterNumero] = useState("");
  const [filterFournisseur, setFilterFournisseur] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modePaiement, setModePaiement] = useState("");

  const typeOptions = ["matière première", "consommable", "autres"];
  const modePaiementOptions = [
  { value: "cash", label: "Comptant" },
  { value: "cheque", label: "Chèque" },
  { value: "virement", label: "Virement Bancaire" },
  { value: "carte", label: "Carte de crédit" },
  { value: "traite", label: "Traite" },
  { value: "mixte", label: "Mixte" },
];


  // Charger factures
  const fetchFactures = async () => {
    setLoading(true);
    try {
      const data = await FactureAchatMatiereService.getAll();
      setFactures(data);
    } catch {
      message.error("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  };

  // Charger fournisseurs
  const fetchFournisseurs = async () => {
    try {
      const data = await FournisseurService.getAll();
      let list = [];
      if (data && Array.isArray(data.results)) {
        list = data.results;
      } else if (Array.isArray(data)) {
        list = data;
      }
      setFournisseurs(list);
    } catch {
      message.error("Erreur lors du chargement des fournisseurs");
      setFournisseurs([]);
    }
  };

  useEffect(() => {
    fetchFactures();
    fetchFournisseurs();
  }, []);

  const filteredFactures = factures.filter((f) => {
    const matchNumero = f.numero
      ? f.numero.toLowerCase().includes(filterNumero.toLowerCase())
      : false;
    const matchFournisseur = f.fournisseur
      ? f.fournisseur.toLowerCase().includes(filterFournisseur.toLowerCase())
      : false;

    return (
      (filterNumero === "" || matchNumero) &&
      (filterFournisseur === "" || matchFournisseur)
    );
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date_facture: values.date_facture
          ? values.date_facture.format("YYYY-MM-DD")
          : null,
        achats,
      };

      setLoading(true);

      if (currentId) {
        await FactureAchatMatiereService.update(currentId, payload);
        message.success("Facture mise à jour avec succès");
      } else {
        await FactureAchatMatiereService.create(payload);
        message.success("Facture ajoutée avec succès");
      }

      setVisible(false);
      form.resetFields();
      setAchats([]);
      setEditingAchatIndex(null);
      await fetchFactures();
    } catch {
      message.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await FactureAchatMatiereService.delete(id);
      message.success("Facture supprimée avec succès");
      await fetchFactures();
    } catch {
      message.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const addAchat = () => {
    const achat = form.getFieldsValue([
      "achat_nom",
      "achat_prix",
      "achat_quantite",
    ]);
    if (
      !achat.achat_nom ||
      !achat.achat_prix ||
      !achat.achat_quantite
    ) {
      return message.warning("Veuillez remplir tous les champs de l'achat");
    }

    if (editingAchatIndex !== null) {
      setAchats((prev) =>
        prev.map((item, idx) =>
          idx === editingAchatIndex
            ? {
                nom: achat.achat_nom,
                prix: achat.achat_prix,
                quantite: achat.achat_quantite,
              }
            : item
        )
      );
      setEditingAchatIndex(null);
    } else {
      setAchats((prev) => [
        ...prev,
        {
          nom: achat.achat_nom,
          prix: achat.achat_prix,
          quantite: achat.achat_quantite,
        },
      ]);
    }

    form.setFieldsValue({ achat_nom: "", achat_prix: null, achat_quantite: null });
  };

  const removeAchat = (index) => {
    setAchats((prev) => prev.filter((_, i) => i !== index));
    if (editingAchatIndex === index) {
      setEditingAchatIndex(null);
      form.setFieldsValue({ achat_nom: "", achat_prix: null, achat_quantite: null });
    }
  };

  const editAchat = (index) => {
    const achat = achats[index];
    form.setFieldsValue({
      achat_nom: achat.nom,
      achat_prix: achat.prix,
      achat_quantite: achat.quantite,
    });
    setEditingAchatIndex(index);
  };

  const columns = [
    {
      title: "Numéro",
      dataIndex: "numero",
      key: "numero",
      width: 100,
      ellipsis: true,
    },
    {
      title: "Fournisseur",
      dataIndex: "fournisseur",
      key: "fournisseur",
      width: 140,
      ellipsis: true,
    },
    {
      title: "Nom",
      key: "achat_nom",
      width: 130,
      ellipsis: true,
      render: (_, record) =>
        record.achats && record.achats.length > 0 ? (
          <>
            {record.achats.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.achats.length - 1
                      ? "1px solid black"
                      : "none",
                  padding: "4px 0",
                }}
              >
                {a.nom}
              </div>
            ))}
          </>
        ) : (
          <em>Aucun achat</em>
        ),
    },
    {
      title: "Prix",
      key: "achat_prix",
      width: 90,
      ellipsis: true,
      render: (_, record) =>
        record.achats && record.achats.length > 0 ? (
          <>
            {record.achats.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.achats.length - 1
                      ? "1px solid black"
                      : "none",
                  padding: "4px 0",
                }}
              >
                {a.prix}
              </div>
            ))}
          </>
        ) : (
          ""
        ),
    },
    {
      title: "Quantité",
      key: "achat_quantite",
      width: 90,
      ellipsis: true,
      render: (_, record) =>
        record.achats && record.achats.length > 0 ? (
          <>
            {record.achats.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.achats.length - 1
                      ? "1px solid black"
                      : "none",
                  padding: "4px 0",
                }}
              >
                {a.quantite}
              </div>
            ))}
          </>
        ) : (
          ""
        ),
    },
    {
      title: "Date",
      dataIndex: "date_facture",
      key: "date_facture",
      width: 110,
      ellipsis: true,
      render: (val) => (val ? moment(val).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Prix Total",
      dataIndex: "prix_total",
      key: "prix_total",
      width: 110,
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              form.setFieldsValue({
                ...record,
                date_facture: record.date_facture
                  ? moment(record.date_facture)
                  : null,
                achat_nom: "",
                achat_prix: null,
                achat_quantite: null,
                mode_paiement: record.mode_paiement || "cash",
                mixte_comptant: record.mixte_comptant || 0,
              });
              setModePaiement(record.mode_paiement)
              setAchats(record.achats || []);
              setCurrentId(record.id);
              setEditingAchatIndex(null);
              setVisible(true);
            }}
          />
          <Popconfirm
            title="Supprimer cette facture ?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const achatColumns = [
    { title: "Nom", dataIndex: "nom", key: "nom", width: 150, ellipsis: true },
    { title: "Prix", dataIndex: "prix", key: "prix", width: 100, ellipsis: true },
    { title: "Quantité", dataIndex: "quantite", key: "quantite", width: 100, ellipsis: true },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_, __, index) => (
        <Space>
          <Button size="small" onClick={() => editAchat(index)} icon={<EditOutlined />}>
            Modifier
          </Button>
          <Button danger size="small" onClick={() => removeAchat(index)}>
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{`
        /* Suppression des bordures par défaut du tableau */
        .custom-table .ant-table-container {
          border: none !important;
        }
        /* Lignes horizontales noires */
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 0.5px solid #e0e0e0 !important;
        }
        /* Bordures verticales grises claires */
        .custom-table .ant-table-cell {
          border-left: 0.2px solid #d9d9d9 !important;
          border-right: 0px solid #d9d9d9 !important;
        }
        /* Pas de double bordure à gauche du tableau */
        .custom-table .ant-table-tbody > tr > td:first-child {
          border-left: none !important;
        }
        /* Pas de double bordure à droite du tableau */
        .custom-table .ant-table-tbody > tr > td:last-child {
          border-right: none !important;
        }
        /* Même pour l'en-tête */
        .custom-table .ant-table-thead > tr > th {
          border-left: 0.2px solid #d9d9d9 !important;
          border-right: 0px solid #d9d9d9 !important;
          border-bottom: 0.2px solid #e0e0e0 !important;
        }
        .custom-table .ant-table-thead > tr > th:first-child {
          border-left: none !important;
        }
        .custom-table .ant-table-thead > tr > th:last-child {
          border-right: none !important;
        }
      `}</style>

      <Card
        title={
         <div
      style={{
        padding: "7px 20px 30px",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      }}
    >
      {/* Partie gauche : icône + titre + sous-texte */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #eb2f96 0%, #ff85c0 100%)",
            boxShadow: "0 6px 20px rgba(235, 47, 150, 0.25)",
            position: "relative",
          }}
        >
          <FileDoneOutlined style={{ fontSize: "24px", color: "#ffffff" }} />
          <div
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "18px",
              height: "18px",
              borderRadius: "10px",
              backgroundColor: "#52c41a",
              border: "2px solid #ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: "9px",
                fontWeight: "bold",
              }}
            >
              {factures.length}
            </span>
          </div>
        </div>

        <div>
          <h2
            style={{
              margin: 0,
              fontWeight: 600,
              color: "#eb2f96",
              fontSize: "28px",
              letterSpacing: "-0.5px",
            }}
          >
            Factures
          </h2>
          <span style={{ color: "#64748b", fontSize: "14px" }}>
            {factures.length} retour{factures.length !== 1 ? "s" : ""} enregistré
            {factures.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Partie droite : boutons */}
      <Space size="middle">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
           onClick={() => {
              form.resetFields();
              setCurrentId(null);
              setAchats([]);
              setEditingAchatIndex(null);
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
            cursor: "pointer",
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
          Ajouter une facture
        </Button>
      </Space>
    </div>
        }
      >
        {/* FILTRES + BOUTON AJOUT */}
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Input
              placeholder="Numéro"
              value={filterNumero}
              onChange={(e) => setFilterNumero(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <Select
              placeholder="Sélectionner un fournisseur"
              value={filterFournisseur || undefined}
              onChange={(value) => setFilterFournisseur(value)}
              allowClear
              style={{ width: 200 }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {fournisseurs.map((f) => (
                <Option key={f.id} value={f.nom}>
                  {f.nom}
                </Option>
              ))}
            </Select>
          </div>

          <Form.Item style={{ marginBottom: 0, minWidth: 180 }}>
            <Select
              placeholder="Sélectionner un type"
              value={filterType || undefined}
              onChange={(value) => setFilterType(value)}
              allowClear
              style={{ width: 180 }}
            >
              {typeOptions.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>

         
        </div>

        {/* TABLEAU PRINCIPAL */}
        <Table
          className="custom-table"
          columns={columns}
          dataSource={filteredFactures}
          rowKey="id"
          loading={loading}
          bordered={false}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 5 }}
          style={{ width: "100%" }}
        />

        {/* MODAL FORM */}
       <Modal
      title={currentId ? "Modifier la facture" : "Nouvelle facture"}
      open={visible}
      onOk={form.submit}
      onCancel={() => {
        setVisible(false);
        form.resetFields();
        setAchats([]);
        setEditingAchatIndex(null);
      }}
      width={820}
      okText="Enregistrer"
      cancelText="Annuler"
      confirmLoading={loading}
      destroyOnClose
      bodyStyle={{
        padding: 32,
        backgroundColor: "#fafafa",
        borderRadius: 14,
        boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
      }}
      okButtonProps={{
        style: {
          borderRadius: 8,
          background:
            "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
          border: "none",
          fontWeight: "600",
          fontSize: 16,
          padding: "8px 32px",
          boxShadow: "0 6px 20px rgba(24, 144, 255, 0.3)",
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
          name="numero"
          label="Numéro de facture"
          rules={[{ required: false }]}
        >
          <Input
            placeholder="Ex: FAC-2024-001"
            size="large"
            prefix={<TagOutlined style={{ color: "#1890ff" }} />}
            style={{
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "box-shadow 0.3s ease",
              fontSize: 15,
            }}
            onFocus={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")
            }
            onBlur={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
            }
          />
        </Form.Item>

        <Form.Item
          name="fournisseur"
          label="Fournisseur"
          rules={[{ required: false }]}
        >
          <Select
            size="large"
            placeholder="Sélectionner un fournisseur"
            showSearch
            optionFilterProp="children"
            allowClear
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            suffixIcon={<UserOutlined style={{ color: "#1890ff" }} />}
            dropdownStyle={{ borderRadius: 12 }}
            style={{
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              fontSize: 15,
              transition: "box-shadow 0.3s ease",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")
            }
            onBlur={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
            }
          >
            {fournisseurs.map((f) => (
              <Option key={f.id} value={f.nom}>
                {f.nom}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="mode_paiement"
          label="Mode de paiement"
          rules={[{ required: false }]}
        >
          <Select
            size="large"
            placeholder="Sélectionner un mode de paiement"
            suffixIcon={<CreditCardOutlined style={{ color: "#1890ff" }} />}
            onChange={(value)=>setModePaiement(value)}
            style={{
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              fontSize: 15,
              transition: "box-shadow 0.3s ease",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")
            }
            onBlur={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
            }
          >
            {modePaiementOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        {modePaiement=='mixte' && (
              <Form.Item
                name='mixte_comptant'
                label='Partie Comptant'
              >
                <InputNumber
                  placeholder="Comptant"
                  style={{ width: "100%" }}
                  min={0}
                  step={0.001}
                  ></InputNumber>
              </Form.Item>
        )}    
        <Form.Item name="prix_total" label="Prix total">
          <Input
            type="number"
            min={0}
            placeholder="Prix total (optionnel)"
            size="large"
            prefix={<DollarOutlined style={{ color: "#1890ff" }} />}
            style={{
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              fontSize: 15,
              transition: "box-shadow 0.3s ease",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")
            }
            onBlur={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
            }
          />
        </Form.Item>

        <Form.Item name="date_facture" label="Date de facture">
          <DatePicker
            size="large"
            style={{
              width: "100%",
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              fontSize: 15,
              transition: "box-shadow 0.3s ease",
            }}
            suffixIcon={<CalendarOutlined style={{ color: "#1890ff" }} />}
            onFocus={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")
            }
            onBlur={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
            }
          />
        </Form.Item>

        <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
          Achats
        </Title>
        <Space
          size="middle"
          wrap
          style={{ marginBottom: 12, gap: 12, alignItems: "center" }}
        >
          <Form.Item name="achat_nom" noStyle>
            <Input
              placeholder="Nom"
              size="large"
              prefix={<TagOutlined style={{ color: "#1890ff" }} />}
              style={{
                width: 180,
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                fontSize: 15,
                transition: "box-shadow 0.3s ease",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")
              }
              onBlur={(e) =>
                (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
              }
            />
          </Form.Item>
          <Form.Item name="achat_prix" noStyle>
            <Input
              type="number"
              min={0}
              placeholder="Prix"
              size="large"
              prefix={<DollarOutlined style={{ color: "#1890ff" }} />}
              style={{
                width: 140,
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                fontSize: 15,
                transition: "box-shadow 0.3s ease",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")
              }
              onBlur={(e) =>
                (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
              }
            />
          </Form.Item>
          <Form.Item name="achat_quantite" noStyle>
            <Input
              type="number"
              min={1}
              placeholder="Quantité"
              size="large"
              prefix={<NumberOutlined style={{ color: "#1890ff" }} />}
              style={{
                width: 140,
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                fontSize: 15,
                transition: "box-shadow 0.3s ease",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")
              }
              onBlur={(e) =>
                (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
              }
            />
          </Form.Item>

          <Button
            type={editingAchatIndex !== null ? "default" : "primary"}
            onClick={addAchat}
            icon={<PlusOutlined />}
            style={{
              borderRadius: 10,
              fontWeight: "600",
              fontSize: 15,
              height: 44,
              padding: "0 24px",
              boxShadow:
                editingAchatIndex === null
                  ? "0 6px 18px rgba(24, 144, 255, 0.3)"
                  : "none",
              background:
                editingAchatIndex === null
                  ? "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)"
                  : "initial",
              color: editingAchatIndex === null ? "white" : "inherit",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (editingAchatIndex === null) {
                e.currentTarget.style.boxShadow =
                  "0 8px 22px rgba(24, 144, 255, 0.5)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (editingAchatIndex === null) {
                e.currentTarget.style.boxShadow =
                  "0 6px 18px rgba(24, 144, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {editingAchatIndex !== null ? "Modifier" : "Ajouter"}
          </Button>
        </Space>

        <Table
          columns={achatColumns}
          dataSource={achats}
          rowKey={(_, index) => index}
          pagination={false}
          size="middle"
          bordered
          style={{ marginTop: 16, borderRadius: 14, overflow: "hidden" }}
          scroll={{ x: "max-content" }}
        />
      </Form>
    </Modal>
      </Card>
    </>
  );
}
