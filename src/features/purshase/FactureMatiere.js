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
} from "@ant-design/icons";
import moment from "moment";
import FactureAchatMatiereService from "./Services/FactureAchatMatiereService";

const { Title } = Typography;
const { Option } = Select;

export default function FactureMatiere() {
  const [form] = Form.useForm();
  const [factures, setFactures] = useState([]);
  const [visible, setVisible] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [achats, setAchats] = useState([]);
  const [editingAchatIndex, setEditingAchatIndex] = useState(null);

  const [filterNumero, setFilterNumero] = useState("");
  const [filterFournisseur, setFilterFournisseur] = useState("");
  const [filterType, setFilterType] = useState("");

  const typeOptions = ["matière première", "consommable", "autres"];

  const fetchFactures = async () => {
    setLoading(true);
    try {
      const data = await FactureAchatMatiereService.getAll();
      setFactures(data);
    } catch (error) {
      message.error("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactures();
  }, []);

  const filteredFactures = factures.filter((f) => {
    const matchNumero = f.numero
      ? f.numero.toLowerCase().includes(filterNumero.toLowerCase())
      : false;
    const matchFournisseur = f.fournisseur
      ? f.fournisseur.toLowerCase().includes(filterFournisseur.toLowerCase())
      : false;
    const matchType = filterType ? f.type_achat === filterType : true;

    return (
      (filterNumero === "" || matchNumero) &&
      (filterFournisseur === "" || matchFournisseur) &&
      matchType
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
      fetchFactures();
    } catch (error) {
      message.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    try {
      await FactureAchatMatiereService.delete(id);
      message.success("Facture supprimée avec succès");
      fetchFactures();
    } catch (error) {
      message.error("Erreur lors de la suppression");
    }
  };

  const addAchat = () => {
    const achat = form.getFieldsValue([
      "achat_nom",
      "achat_prix",
      "achat_quantite",
    ]);
    if (!achat.achat_nom || !achat.achat_prix || !achat.achat_quantite) {
      return message.warning("Veuillez remplir tous les champs de l'achat");
    }

    if (editingAchatIndex !== null) {
      setAchats((prev) =>
        prev.map((item, index) =>
          index === editingAchatIndex
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
      width: 120,
    },
    {
      title: "Fournisseur",
      dataIndex: "fournisseur",
      key: "fournisseur",
      width: 180,
    },
    {
      title: "Type d'achat",
      dataIndex: "type_achat",
      key: "type_achat",
      width: 150,
    },
    {
      title: "Nom",
      key: "achat_nom",
      width: 150,
      render: (_, record) =>
        record.achats && record.achats.length > 0 ? (
          <>
            {record.achats.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.achats.length - 1 ? "1px solid black" : "none",
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
      width: 100,
      render: (_, record) =>
        record.achats && record.achats.length > 0 ? (
          <>
            {record.achats.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.achats.length - 1 ? "1px solid black" : "none",
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
      width: 100,
      render: (_, record) =>
        record.achats && record.achats.length > 0 ? (
          <>
            {record.achats.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.achats.length - 1 ? "1px solid black" : "none",
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
      width: 130,
    },
    {
      title: "Prix Total",
      dataIndex: "prix_total",
      key: "prix_total",
      width: 120,
      render: (val) => (val ? `${val}` : ""),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
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
              });
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
    { title: "Nom", dataIndex: "nom", key: "nom", width: 150 },
    { title: "Prix", dataIndex: "prix", key: "prix", width: 100 },
    { title: "Quantité", dataIndex: "quantite", key: "quantite", width: 100 },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_, __, index) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => editAchat(index)}
          >
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
        .facture-table .ant-table-cell {
          border-color: black !important;
        }
        .facture-table .ant-table-container,
        .facture-table .ant-table {
          border-color: black !important;
        }
      `}</style>

      <Card>
        {/* Titre ajouté */}
        <Title level={3} style={{ marginBottom: 24 }}>
          Factures
        </Title>

        <div
          style={{
            marginBottom: 32,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Input
            placeholder="Filtrer par numéro"
            value={filterNumero}
            onChange={(e) => setFilterNumero(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Input
            placeholder="Filtrer par fournisseur"
            value={filterFournisseur}
            onChange={(e) => setFilterFournisseur(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="Filtrer par type d'achat"
            value={filterType}
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

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setCurrentId(null);
              setAchats([]);
              setEditingAchatIndex(null);
              setVisible(true);
            }}
            style={{ marginLeft: "auto" }}
          >
            Ajouter une facture
          </Button>
        </div>

        <Table
          className="facture-table"
          columns={columns}
          dataSource={filteredFactures}
          rowKey="id"
          loading={loading}
          bordered
        />

        <Modal
          title={currentId ? "Modifier la facture" : "Nouvelle facture"}
          open={visible}
          onOk={handleSubmit}
          onCancel={() => {
            setVisible(false);
            form.resetFields();
            setAchats([]);
            setEditingAchatIndex(null);
          }}
          width={700}
          okText="Enregistrer"
          cancelText="Annuler"
        >
          <Form form={form} layout="vertical">
            <Form.Item name="numero" label="Numéro de facture">
              <Input placeholder="Ex: FAC-2024-001" />
            </Form.Item>

            <Form.Item name="fournisseur" label="Fournisseur">
              <Input placeholder="Nom du fournisseur" />
            </Form.Item>

            <Form.Item name="type_achat" label="Type d'achat">
              <Select placeholder="Sélectionner un type">
                {typeOptions.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="prix_total" label="Prix total">
              <Input type="number" />
            </Form.Item>

            <Form.Item name="date_facture" label="Date de facturation">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Typography.Title level={5}>Achats</Typography.Title>
            <Space>
              <Form.Item name="achat_nom" noStyle>
                <Input placeholder="Nom" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item name="achat_prix" noStyle>
                <Input type="number" placeholder="Prix" style={{ width: 120 }} />
              </Form.Item>
              <Form.Item name="achat_quantite" noStyle>
                <Input type="number" placeholder="Quantité" style={{ width: 120 }} />
              </Form.Item>
              <Button onClick={addAchat} icon={<PlusOutlined />}>
                {editingAchatIndex !== null ? "Modifier" : "Ajouter"}
              </Button>
            </Space>

            <Table
              columns={achatColumns}
              dataSource={achats}
              rowKey={(_, index) => index}
              pagination={false}
              style={{ marginTop: 16 }}
              size="small"
              bordered
            />
          </Form>
        </Modal>
      </Card>
    </>
  );
}
