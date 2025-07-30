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
} from "@ant-design/icons";
import {

  TagOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import moment from "moment";
import BonLivraisonMatiereService from "./Services/BonLivraisonMatiereService";
import FournisseurService from "./Services/FournisseurService";

const { Title } = Typography;
const { Option } = Select;

export default function BonLivraisonMatiere() {
  const [form] = Form.useForm();
  const [bons, setBons] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [visible, setVisible] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [livraisons, setLivraisons] = useState([]);
  const [editingLivraisonIndex, setEditingLivraisonIndex] = useState(null);

  // Filtres
  const [filterNumero, setFilterNumero] = useState("");
  const [filterFournisseur, setFilterFournisseur] = useState("");
  const [filterType, setFilterType] = useState("");

  const typeOptions = ["matière première", "consommable", "autres"];

  // Charger bons
  const fetchBons = async () => {
    setLoading(true);
    try {
      const data = await BonLivraisonMatiereService.getAll();
      setBons(data);
    } catch {
      message.error("Erreur lors du chargement des bons");
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
    fetchBons();
    fetchFournisseurs();
  }, []);

  const filteredBons = bons.filter((b) => {
    const matchNumero = b.numero
      ? b.numero.toLowerCase().includes(filterNumero.toLowerCase())
      : false;
    const matchFournisseur = b.fournisseur
      ? b.fournisseur.toLowerCase().includes(filterFournisseur.toLowerCase())
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
        date_livraison: values.date_livraison
          ? values.date_livraison.format("YYYY-MM-DD")
          : null,
        livraisons,
      };

      setLoading(true);

      if (currentId) {
        await BonLivraisonMatiereService.update(currentId, payload);
        message.success("Bon mis à jour avec succès");
      } else {
        await BonLivraisonMatiereService.create(payload);
        message.success("Bon ajouté avec succès");
      }

      setVisible(false);
      form.resetFields();
      setLivraisons([]);
      setEditingLivraisonIndex(null);
      await fetchBons();
    } catch {
      message.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await BonLivraisonMatiereService.delete(id);
      message.success("Bon supprimé avec succès");
      await fetchBons();
    } catch {
      message.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const addLivraison = () => {
    const livraison = form.getFieldsValue([
      "achat_nom",
      "achat_prix",
      "achat_quantite",
    ]);
    if (
      !livraison.achat_nom ||
      !livraison.achat_prix ||
      !livraison.achat_quantite
    ) {
      return message.warning("Veuillez remplir tous les champs de la livraison");
    }

    if (editingLivraisonIndex !== null) {
      setLivraisons((prev) =>
        prev.map((item, idx) =>
          idx === editingLivraisonIndex
            ? {
                nom: livraison.achat_nom,
                prix: livraison.achat_prix,
                quantite: livraison.achat_quantite,
              }
            : item
        )
      );
      setEditingLivraisonIndex(null);
    } else {
      setLivraisons((prev) => [
        ...prev,
        {
          nom: livraison.achat_nom,
          prix: livraison.achat_prix,
          quantite: livraison.achat_quantite,
        },
      ]);
    }

    form.setFieldsValue({ achat_nom: "", achat_prix: null, achat_quantite: null });
  };

  const removeLivraison = (index) => {
    setLivraisons((prev) => prev.filter((_, i) => i !== index));
    if (editingLivraisonIndex === index) {
      setEditingLivraisonIndex(null);
      form.setFieldsValue({ achat_nom: "", achat_prix: null, achat_quantite: null });
    }
  };

  const editLivraison = (index) => {
    const livraison = livraisons[index];
    form.setFieldsValue({
      achat_nom: livraison.nom,
      achat_prix: livraison.prix,
      achat_quantite: livraison.quantite,
    });
    setEditingLivraisonIndex(index);
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
        record.livraisons && record.livraisons.length > 0 ? (
          <>
            {record.livraisons.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.livraisons.length - 1
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
          <em>Aucune livraison</em>
        ),
    },
    {
      title: "Prix",
      key: "achat_prix",
      width: 90,
      ellipsis: true,
      render: (_, record) =>
        record.livraisons && record.livraisons.length > 0 ? (
          <>
            {record.livraisons.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.livraisons.length - 1
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
        record.livraisons && record.livraisons.length > 0 ? (
          <>
            {record.livraisons.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.livraisons.length - 1
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
      dataIndex: "date_livraison",
      key: "date_livraison",
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
                date_livraison: record.date_livraison
                  ? moment(record.date_livraison)
                  : null,
                achat_nom: "",
                achat_prix: null,
                achat_quantite: null,
              });
              setLivraisons(record.livraisons || []);
              setCurrentId(record.id);
              setEditingLivraisonIndex(null);
              setVisible(true);
            }}
          />
          <Popconfirm
            title="Supprimer ce bon ?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const livraisonColumns = [
    { title: "Nom", dataIndex: "nom", key: "nom", width: 150, ellipsis: true },
    { title: "Prix", dataIndex: "prix", key: "prix", width: 100, ellipsis: true },
    { title: "Quantité", dataIndex: "quantite", key: "quantite", width: 100, ellipsis: true },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_, __, index) => (
        <Space>
          <Button size="small" onClick={() => editLivraison(index)} icon={<EditOutlined />}>
            Modifier
          </Button>
          <Button danger size="small" onClick={() => removeLivraison(index)}>
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
          border-bottom:  0.5 px solid #e0e0e0 !important;
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
          border-bottom:  0.2px solid #e0e0e0 !important;
        }
        .custom-table .ant-table-thead > tr > th:first-child {
          border-left: none !important;
        }
        .custom-table .ant-table-thead > tr > th:last-child {
          border-right: none !important;
        }
      `}</style>

     <Card
  style={{ marginBottom: 32 }}
  bodyStyle={{ padding: 24 }}
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
        <FileTextOutlined style={{ fontSize: "24px", color: "#ffffff" }} />
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
            {bons.length}
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
          Bon de livraison
        </h2>
        <span
          style={{
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          {bons.length} bon{bons.length !== 1 ? "s" : ""} généré
          {bons.length !== 1 ? "s" : ""}
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
          setLivraisons([]);
          setEditingLivraisonIndex(null);
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
          e.target.style.boxShadow =
            "0 10px 30px rgba(24, 144, 255, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow =
            "0 6px 20px rgba(24, 144, 255, 0.3)";
        }}
      >
        Ajouter un bon
      </Button>
    </Space>
  </div>
}


>
  {/* FILTRES + BOUTONS */}
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
    dataSource={filteredBons}
    rowKey="id"
    loading={loading}
    bordered={false}
    scroll={{ x: 900 }}
    pagination={{ pageSize: 5 }}
    style={{ width: "100%" }}
  />

  {/* MODAL FORM */}
 <Modal
      title={currentId ? "Modifier le bon" : "Nouveau bon"}
      open={visible}
      onOk={form.submit}
      onCancel={() => {
        setVisible(false);
        form.resetFields();
        setLivraisons([]);
        setEditingLivraisonIndex(null);
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
          label="Numéro de bon"
          rules={[{ required: false }]}
        >
          <Input
            placeholder="Ex: BON-2024-001"
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

        <Form.Item name="date_livraison" label="Date de livraison">
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
          Livraisons
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
              style={{ width: 180, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: 15 }}
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
              style={{ width: 140, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: 15 }}
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
              style={{ width: 140, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: 15 }}
              onFocus={(e) =>
                (e.currentTarget.style.boxShadow = "0 0 6px #40a9ff")
              }
              onBlur={(e) =>
                (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
              }
            />
          </Form.Item>

          <Button
            type={editingLivraisonIndex !== null ? "default" : "primary"}
            onClick={addLivraison}
            icon={<PlusOutlined />}
            style={{
              borderRadius: 10,
              fontWeight: "600",
              fontSize: 15,
              height: 44,
              padding: "0 24px",
              boxShadow: editingLivraisonIndex === null
                ? "0 6px 18px rgba(24, 144, 255, 0.3)"
                : "none",
              background: editingLivraisonIndex === null
                ? "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)"
                : "initial",
              color: editingLivraisonIndex === null ? "white" : "inherit",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (editingLivraisonIndex === null) {
                e.currentTarget.style.boxShadow = "0 8px 22px rgba(24, 144, 255, 0.5)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (editingLivraisonIndex === null) {
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(24, 144, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {editingLivraisonIndex !== null ? "Modifier" : "Ajouter"}
          </Button>
        </Space>

        <Table
          columns={livraisonColumns}
          dataSource={livraisons}
          rowKey={(_, index) => index}
          pagination={false}
          size="middle"
          bordered
          style={{ marginTop: 12, borderRadius: 14, overflow: "hidden" }}
          scroll={{ x: "max-content" }}
        />
      </Form>
    </Modal>
</Card>

    </>
  );
}
