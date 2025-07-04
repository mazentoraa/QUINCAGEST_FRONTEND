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
    const matchType = filterType ? b.type_achat === filterType : true;

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
      title: "Type d'achat",
      dataIndex: "type_achat",
      key: "type_achat",
      width: 120,
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
        title={
          <Space>
            <FileTextOutlined style={{ fontSize: 24 }} />
            <Title level={4} style={{ margin: 0 }}>
              Bon de livraison
            </Title>
          </Space>
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

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setCurrentId(null);
              setLivraisons([]);
              setEditingLivraisonIndex(null);
              setVisible(true);
            }}
            style={{ marginLeft: "auto", height: 32, alignSelf: "center" }}
          >
            Ajouter un bon
          </Button>
        </div>

        {/* TABLEAU PRINCIPAL */}
        <Table
          className="custom-table"
          columns={columns}
          dataSource={filteredBons}
          rowKey="id"
          loading={loading}
          bordered={false}  /* Important pour enlever bordures par défaut */
          scroll={{ x: 900 }}
          pagination={{ pageSize: 5 }}
          style={{ width: "100%" }}
        />

        {/* MODAL FORM */}
        <Modal
          title={currentId ? "Modifier le bon" : "Nouveau bon"}
          open={visible}
          onOk={handleSubmit}
          onCancel={() => {
            setVisible(false);
            form.resetFields();
            setLivraisons([]);
            setEditingLivraisonIndex(null);
          }}
          width={800}
          okText="Enregistrer"
          cancelText="Annuler"
          confirmLoading={loading}
          destroyOnClose
        >
          <Form form={form} layout="vertical">
            {/* Form fields comme avant */}
            <Form.Item
              name="numero"
              label="Numéro de bon"
              rules={[{ required: false, message: "Veuillez entrer un numéro" }]}
            >
              <Input placeholder="Ex: BON-2024-001" />
            </Form.Item>

            <Form.Item
              name="fournisseur"
              label="Fournisseur"
              rules={[{ required: false, message: "Veuillez sélectionner un fournisseur" }]}
            >
              <Select
                placeholder="Sélectionner un fournisseur"
                showSearch
                optionFilterProp="children"
                allowClear
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
            </Form.Item>

            <Form.Item
              name="type_achat"
              label="Type d'achat"
              rules={[{ required: false, message: "Veuillez sélectionner un type" }]}
            >
              <Select placeholder="Sélectionner un type">
                {typeOptions.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="prix_total" label="Prix total">
              <Input type="number" min={0} placeholder="Prix total (optionnel)" />
            </Form.Item>

            <Form.Item name="date_livraison" label="Date de livraison">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Typography.Title level={5}>Livraisons</Typography.Title>
            <Space>
              <Form.Item name="achat_nom" noStyle>
                <Input placeholder="Nom" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item name="achat_prix" noStyle>
                <Input type="number" min={0} placeholder="Prix" style={{ width: 120 }} />
              </Form.Item>
              <Form.Item name="achat_quantite" noStyle>
                <Input type="number" min={1} placeholder="Quantité" style={{ width: 120 }} />
              </Form.Item>
              <Button onClick={addLivraison} icon={<PlusOutlined />}>
                {editingLivraisonIndex !== null ? "Modifier" : "Ajouter"}
              </Button>
            </Space>

            <Table
              columns={livraisonColumns}
              dataSource={livraisons}
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
