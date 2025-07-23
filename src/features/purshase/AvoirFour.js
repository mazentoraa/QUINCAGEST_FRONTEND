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
// Import vos services - adaptez selon votre structure
import AvoirService from "./Services/AvoirService"; // Service pour les avoirs
import FournisseurService from "./Services/FournisseurService";

const { Title } = Typography;
const { Option } = Select;

export default function Avoir() {
  const [form] = Form.useForm();
const [avoirs, setAvoirs] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [visible, setVisible] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [editingArticleIndex, setEditingArticleIndex] = useState(null);

  // Filtres
  const [filterNumero, setFilterNumero] = useState("");
  const [filterFournisseur, setFilterFournisseur] = useState("");
  const [filterType, setFilterType] = useState("");

  const typeOptions = ["retour marchandise", "remise commerciale", "erreur facturation", "autres"];
  const modePaiementOptions = [
    { value: "cash", label: "Comptant" },
    { value: "cheque", label: "Chèque" },
    { value: "virement", label: "Virement Bancaire" },
    { value: "carte", label: "Carte de crédit" },
    { value: "traite", label: "Traite" },
  ];

  // Charger avoirs

// Dans le composant Avoir, modifiez la fonction fetchAvoirs :

const fetchAvoirs = async () => {
  setLoading(true);
  try {
    const data = await AvoirService.getAll();
    
    // Correction : s'assurer que data est bien un tableau
    let avoirsList = [];
    if (data && Array.isArray(data.results)) {
      // Si l'API retourne un objet avec une propriété 'results' contenant le tableau
      avoirsList = data.results;
    } else if (Array.isArray(data)) {
      // Si l'API retourne directement un tableau
      avoirsList = data;
    } else if (data && typeof data === 'object') {
      // Si c'est un objet, essayer de trouver la propriété qui contient le tableau
      avoirsList = data.data || data.avoirs || [];
    }
    
    setAvoirs(avoirsList);
  } catch (error) {
    console.error("Erreur lors du chargement des avoirs:", error);
    message.error("Erreur lors du chargement des avoirs");
    // Important : définir avoirs comme tableau vide en cas d'erreur
    setAvoirs([]);
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
    fetchAvoirs();
    fetchFournisseurs();
  }, []);

const filteredAvoirs = avoirs.filter((a) => {
  // Sécurisation des valeurs
  const avoirNumero = (a.numero || "").toLowerCase();
  const avoirFournisseur = (a.fournisseur || "").toLowerCase();
  const filterNum = (filterNumero || "").toLowerCase();
  const filterFourn = (filterFournisseur || "").toLowerCase();
  
  // Vérifications
  const matchNumero = !filterNum || avoirNumero.includes(filterNum);
  const matchFournisseur = !filterFourn || avoirFournisseur.includes(filterFourn);
  const matchType = !filterType || a.type_avoir === filterType;

  return matchNumero && matchFournisseur && matchType;
});



const handleSubmit = async (values) => {
  try {
    if (!values) {
      values = await form.validateFields();
    }

    // CORRECTION : Nettoyage simplifié et sécurisé des articles
    const cleanArticles = articles.map((article) => ({
      nom: String(article.nom || '').trim(),
      prix: Number(article.prix) || 0,
      quantite: Number(article.quantite) || 1,
    }));

    const payload = {
      ...values,
      date_avoir: values.date_avoir ? values.date_avoir.format("YYYY-MM-DD") : null,
      articles: cleanArticles,
    };

    setLoading(true);

    if (currentId) {
      await AvoirService.update(currentId, payload);
      message.success("Avoir mis à jour avec succès");
    } else {
      await AvoirService.create(payload);
      message.success("Avoir ajouté avec succès");
    }

    setVisible(false);
    form.resetFields();
    setArticles([]);
    setEditingArticleIndex(null);
    setCurrentId(null); // AJOUT : Reset currentId
    await fetchAvoirs();
    
  } catch (error) {
    console.error("Erreur lors de la soumission :", error);
    message.error("Erreur lors de l'enregistrement");
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await AvoirService.delete(id);
      message.success("Avoir supprimé avec succès");
      await fetchAvoirs();
    } catch {
      message.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const addArticle = () => {
    const article = form.getFieldsValue([
      "article_nom",
      "article_prix",
      "article_quantite",
    ]);
    if (
      !article.article_nom ||
      !article.article_prix ||
      !article.article_quantite
    ) {
      return message.warning("Veuillez remplir tous les champs de l'article");
    }

    if (editingArticleIndex !== null) {
      setArticles((prev) =>
        prev.map((item, idx) =>
          idx === editingArticleIndex
            ? {
                nom: article.article_nom,
                prix: article.article_prix,
                quantite: article.article_quantite,
              }
            : item
        )
      );
      setEditingArticleIndex(null);
    } else {
      setArticles((prev) => [
        ...prev,
        {
          nom: article.article_nom,
          prix: article.article_prix,
          quantite: article.article_quantite,
        },
      ]);
    }

    form.setFieldsValue({ article_nom: "", article_prix: null, article_quantite: null });
  };

  const removeArticle = (index) => {
    setArticles((prev) => prev.filter((_, i) => i !== index));
    if (editingArticleIndex === index) {
      setEditingArticleIndex(null);
      form.setFieldsValue({ article_nom: "", article_prix: null, article_quantite: null });
    }
  };

  const editArticle = (index) => {
    const article = articles[index];
    form.setFieldsValue({
      article_nom: article.nom,
      article_prix: article.prix,
      article_quantite: article.quantite,
    });
    setEditingArticleIndex(index);
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
      title: "Article",
      key: "article_nom",
      width: 130,
      ellipsis: true,
      render: (_, record) =>
        record.articles && record.articles.length > 0 ? (
          <>
            {record.articles.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.articles.length - 1
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
          <em>Aucun article</em>
        ),
    },
    {
      title: "Prix",
      key: "article_prix",
      width: 90,
      ellipsis: true,
      render: (_, record) =>
        record.articles && record.articles.length > 0 ? (
          <>
            {record.articles.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.articles.length - 1
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
      key: "article_quantite",
      width: 90,
      ellipsis: true,
      render: (_, record) =>
        record.articles && record.articles.length > 0 ? (
          <>
            {record.articles.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.articles.length - 1
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
      dataIndex: "date_avoir",
      key: "date_avoir",
      width: 110,
      ellipsis: true,
      render: (val) => (val ? moment(val).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Montant Total",
      dataIndex: "montant_total",
      key: "montant_total",
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
                date_avoir: record.date_avoir
                  ? moment(record.date_avoir)
                  : null,
                article_nom: "",
                article_prix: null,
                article_quantite: null,
                mode_paiement: record.mode_paiement || "cash",
              });
              setArticles(record.articles || []);
              setCurrentId(record.id);
              setEditingArticleIndex(null);
              setVisible(true);
            }}
          />
          <Popconfirm
            title="Supprimer cet avoir ?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const articleColumns = [
    { title: "Article", dataIndex: "nom", key: "nom", width: 150, ellipsis: true },
    { title: "Prix", dataIndex: "prix", key: "prix", width: 100, ellipsis: true },
    { title: "Quantité", dataIndex: "quantite", key: "quantite", width: 100, ellipsis: true },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_, __, index) => (
        <Space>
          <Button size="small" onClick={() => editArticle(index)} icon={<EditOutlined />}>
            Modifier
          </Button>
          <Button danger size="small" onClick={() => removeArticle(index)}>
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
            background: "#eb2f96",
            boxShadow: "0 6px 20px rgba(82, 196, 26, 0.25)",
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
              backgroundColor: "#1890ff",
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
              {avoirs.length}
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
            Avoirs
          </h2>
          <span style={{ color: "#64748b", fontSize: "14px" }}>
            {avoirs.length} avoir{avoirs.length !== 1 ? "s" : ""} enregistré
            {avoirs.length !== 1 ? "s" : ""}
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
              setArticles([]);
              setEditingArticleIndex(null);
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
          Ajouter un avoir
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
          dataSource={filteredAvoirs}
          rowKey="id"
          loading={loading}
          bordered={false}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 5 }}
          style={{ width: "100%" }}
        />

        {/* MODAL FORM */}
 {/* MODAL FORM - VERSION MODIFIÉE COMME FACTURE */}
        <Modal
  title={currentId ? "Modifier l'avoir" : "Nouvel avoir"}
  open={visible}
  onOk={() => form.submit()}
  onCancel={() => {
    setVisible(false);
    form.resetFields();
    setArticles([]);
    setEditingArticleIndex(null);
    setCurrentId(null);
  }}
  width={820}
  okText="Enregistrer"
  cancelText="Annuler"
  confirmLoading={loading}
  destroyOnClose
  styles={{
    body: {
      padding: 32,
      backgroundColor: "#fafafa",
      borderRadius: 14,
      boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
    }
  }}
  okButtonProps={{
    style: {
      borderRadius: 8,
      background: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
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
              label="Numéro d'avoir"
              rules={[{ required: false }]}
            >
              <Input
                placeholder="Ex: AV-2024-001"
                size="large"
                prefix={<TagOutlined style={{ color: "#1890ff" }} />}
                style={{
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "box-shadow 0.3s ease",
                  fontSize: 15,
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 6px #1890ff")
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
                  (e.currentTarget.style.boxShadow = "0 0 6px #1890ff")
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
                style={{
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  fontSize: 15,
                  transition: "box-shadow 0.3s ease",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 6px #1890ff")
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

            <Form.Item name="montant_total" label="Montant total">
              <Input
                type="number"
                min={0}
                placeholder="Montant total (optionnel)"
                size="large"
                prefix={<DollarOutlined style={{ color: "#1890ff" }} />}
                style={{
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  fontSize: 15,
                  transition: "box-shadow 0.3s ease",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 6px #1890ff")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
                }
              />
            </Form.Item>

            <Form.Item name="date_avoir" label="Date d'avoir">
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
                  (e.currentTarget.style.boxShadow = "0 0 6px #1890ff")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
                }
              />
            </Form.Item>

            <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
              Articles
            </Title>
            <Space
              size="middle"
              wrap
              style={{ marginBottom: 12, gap: 12, alignItems: "center" }}
            >
              <Form.Item name="article_nom" noStyle>
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
                    (e.currentTarget.style.boxShadow = "0 0 6px #1890ff")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
                  }
                />
              </Form.Item>
              <Form.Item name="article_prix" noStyle>
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
                    (e.currentTarget.style.boxShadow = "0 0 6px #1890ff")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
                  }
                />
              </Form.Item>
              <Form.Item name="article_quantite" noStyle>
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
                    (e.currentTarget.style.boxShadow = "0 0 6px #1890ff")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
                  }
                />
              </Form.Item>

              <Button
                type={editingArticleIndex !== null ? "default" : "primary"}
                onClick={addArticle}
                icon={<PlusOutlined />}
                style={{
                  borderRadius: 10,
                  fontWeight: "600",
                  fontSize: 15,
                  height: 44,
                  padding: "0 24px",
                  boxShadow:
                    editingArticleIndex === null
                      ? "0 6px 18px rgba(82, 196, 26, 0.3)"
                      : "none",
                  background:
                    editingArticleIndex === null
                      ? "linear-gradient(135deg, #1890ff 0%, #1890ff 100%)"
                      : "initial",
                  color: editingArticleIndex === null ? "white" : "inherit",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (editingArticleIndex === null) {
                    e.currentTarget.style.boxShadow =
                      "0 8px 22px rgba(26, 139, 196, 0.5)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (editingArticleIndex === null) {
                    e.currentTarget.style.boxShadow =
                      "0 6px 18px rgba(26, 108, 196, 0.3)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {editingArticleIndex !== null ? "Modifier" : "Ajouter"}
              </Button>
            </Space>

            <Table
              columns={articleColumns}
              dataSource={articles}
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
