import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import FournisseurService from "./Services/FournisseurService";

export default function Fournisseur() {
  const [form] = Form.useForm();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [filteredFournisseurs, setFilteredFournisseurs] = useState([]);
  const [visible, setVisible] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);

  // États pour les filtres
  const [searchNom, setSearchNom] = useState("");
  const [searchNumRegFiscal, setSearchNumRegFiscal] = useState("");

  const fetchFournisseurs = async () => {
    setLoading(true);
    try {
      const data = await FournisseurService.getAll();
      let list = [];
      if (data && Array.isArray(data.results)) {
        list = data.results;
      } else if (Array.isArray(data)) {
        list = data;
      }
      setFournisseurs(list);
      setFilteredFournisseurs(list);
    } catch (error) {
      message.error("Erreur lors du chargement des fournisseurs");
      setFournisseurs([]);
      setFilteredFournisseurs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  // Filtrer fournisseurs selon nom et numéro d'enregistrement fiscal
  useEffect(() => {
    let filtered = fournisseurs;

    if (searchNom) {
      filtered = filtered.filter((f) =>
        f.nom.toLowerCase().includes(searchNom.toLowerCase())
      );
    }
    if (searchNumRegFiscal) {
      filtered = filtered.filter((f) =>
        f.num_reg_fiscal
          ? f.num_reg_fiscal.toLowerCase().includes(searchNumRegFiscal.toLowerCase())
          : false
      );
    }
    setFilteredFournisseurs(filtered);
  }, [searchNom, searchNumRegFiscal, fournisseurs]);

  const onSearchNomChange = (e) => {
    setSearchNom(e.target.value);
  };

  const onSearchNumRegFiscalChange = (e) => {
    setSearchNumRegFiscal(e.target.value);
  };

  // Effacer les filtres
  const clearFilters = () => {
    setSearchNom("");
    setSearchNumRegFiscal("");
  };

  const openModalForAdd = () => {
    form.resetFields();
    setCurrentId(null);
    setVisible(true);
  };

  const openModalForEdit = (record) => {
    form.setFieldsValue(record);
    setCurrentId(record.id);
    setVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await FournisseurService.delete(id);
      message.success("Fournisseur supprimé avec succès");
      await fetchFournisseurs();
      clearFilters();
    } catch (error) {
      message.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (currentId) {
        await FournisseurService.update(currentId, values);
        message.success("Fournisseur modifié avec succès");
      } else {
        await FournisseurService.create(values);
        message.success("Fournisseur ajouté avec succès");
      }
      setVisible(false);
      form.resetFields();
      await fetchFournisseurs();
      clearFilters();
    } catch (error) {
      message.error("Veuillez remplir correctement le formulaire");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      width: 200,
    },
    {
      title: "Numéro d'enregistrement fiscal",
      dataIndex: "num_reg_fiscal",
      key: "num_reg_fiscal",
      width: 200,
    },
    {
      title: "Adresse",
      dataIndex: "adresse",
      key: "adresse",
      width: 250,
    },
    {
      title: "Numéro de téléphone",
      dataIndex: "telephone",
      key: "telephone",
      width: 150,
    },
    {
      title: "Informations complémentaires",
      dataIndex: "infos_complementaires",
      key: "infos_complementaires",
      width: 300,
      render: (text) => text || <em>Aucune info</em>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openModalForEdit(record)}
            disabled={loading}
          />
          <Popconfirm
            title="Supprimer ce fournisseur ?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger disabled={loading} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{ margin: 24 }}
      bodyStyle={{ padding: 24 }}
      title={
        <div style={{ fontSize: 22 }}>
          Gestion des fournisseurs
        </div>
      }
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <div style={{ fontSize: 18, fontWeight: "500", marginBottom: 8 }}>
            Liste des fournisseurs
          </div>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openModalForAdd}
            disabled={loading}
          >
            Ajouter un fournisseur
          </Button>
        </Col>
      </Row>

      {/* Ligne des filtres et bouton */}
      <Row
        gutter={16}
        align="middle"
        style={{ marginBottom: 16, maxWidth: 800, width: "100%" }}
      >
        <Col>
          <Input
            placeholder="Filtrer par nom"
            value={searchNom}
            onChange={onSearchNomChange}
            allowClear
            style={{ width: 280 }}
          />
        </Col>
        <Col>
          <Input
            placeholder="Filtrer par numéro d'enregistrement fiscal"
            value={searchNumRegFiscal}
            onChange={onSearchNumRegFiscalChange}
            allowClear
            style={{ width: 280 }}
          />
        </Col>
        <Col>
          <Button
            onClick={clearFilters}
            style={{ height: 32, marginTop: 2 }} // Aligne verticalement avec les inputs
          >
            Effacer filtres
          </Button>
        </Col>
        
      </Row>

      <Table
        columns={columns}
        dataSource={filteredFournisseurs}
        rowKey="id"
        bordered
        pagination={{ pageSize: 5 }}
        loading={loading}
      />

      <Modal
        title={currentId ? "Modifier fournisseur" : "Nouveau fournisseur"}
        open={visible}
        onOk={handleSubmit}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
        }}
        okText="Enregistrer"
        cancelText="Annuler"
        destroyOnClose
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nom"
            label="Nom"
            rules={[{ required: true, message: "Veuillez entrer le nom" }]}
          >
            <Input placeholder="Nom du fournisseur" />
          </Form.Item>

          <Form.Item
            name="num_reg_fiscal"
            label="Numéro d'enregistrement fiscal"
          >
            <Input placeholder="Numéro d'enregistrement fiscal" />
          </Form.Item>

          <Form.Item name="adresse" label="Adresse">
            <Input placeholder="Adresse" />
          </Form.Item>

          <Form.Item
            name="telephone"
            label="Numéro de téléphone"
            rules={[
              {
                pattern: /^\+?\d{7,15}$/,
                message: "Entrez un numéro valide (chiffres uniquement)",
              },
            ]}
          >
            <Input placeholder="Numéro de téléphone" />
          </Form.Item>

          <Form.Item
            name="infos_complementaires"
            label="Informations complémentaires"
          >
            <Input.TextArea
              placeholder="Informations complémentaires (optionnel)"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
