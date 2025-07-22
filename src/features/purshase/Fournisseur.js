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
import { TeamOutlined } from "@ant-design/icons";

export default function Fournisseur() {
  const [form] = Form.useForm();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [filteredFournisseurs, setFilteredFournisseurs] = useState([]);
  const [visible, setVisible] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);
const [isHovered, setIsHovered] = useState(false);

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
  title={null} // on le remplace manuellement plus bas
>
  <div style={{
    padding: '7px 20px 30px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #eb2f96 0%, #ff85c0 100%)',
        boxShadow: '0 6px 20px rgba(235, 47, 150, 0.25)',
        position: 'relative'
      }}>
        <TeamOutlined style={{ fontSize: '24px', color: '#ffffff' }} />
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '18px',
          height: '18px',
          borderRadius: '10px',
          backgroundColor: '#52c41a',
          border: '2px solid #ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 'bold'
          }}>
            {fournisseurs.length}
          </span>
        </div>
      </div>

      <div>
        <h2 style={{
          margin: 0,
          fontWeight: 600,
          color: '#eb2f96',
          fontSize: "28px",
          letterSpacing: '-0.5px'
        }}>
          Gestion des Fournisseurs
        </h2>
        <span style={{
          color: '#64748b',
          fontSize: '14px'
        }}>
          {fournisseurs.length} fournisseur{fournisseurs.length !== 1 ? 's' : ''} enregistré{fournisseurs.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>

  </div>

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <div style={{ fontSize: 18, fontWeight: "500", marginBottom: 8 }}>
            Liste des fournisseurs
          </div>
        </Col>
  
      </Row>

      {/* Ligne des filtres et bouton */}
<Row
  justify="space-between"
  align="middle"
  style={{ marginBottom: 16, width: "100%" }}
>
  {/* Colonne gauche : filtres + effacer */}
  <Col>
    <Row gutter={16} align="middle">
      <Col>
        <Input
          placeholder="Filtrer par nom"
          value={searchNom}
          onChange={onSearchNomChange}
          allowClear
          style={{ width: 240, height: 32 }}
        />
      </Col>
      <Col>
        <Input
          placeholder="Filtrer par numéro d'enregistrement fiscal"
          value={searchNumRegFiscal}
          onChange={onSearchNumRegFiscalChange}
          allowClear
          style={{ width: 280, height: 32 }}
        />
      </Col>
      <Col style={{ display: "flex", alignItems: "center" }}>
        <Button
          onClick={clearFilters}
          style={{ height: 32 }}
        >
          Effacer filtres
        </Button>
      </Col>
    </Row>
  </Col>

  {/* Colonne droite : bouton Ajouter */}
<Col>
  <Button
    icon={<PlusOutlined />}
    onClick={openModalForAdd}
    disabled={loading}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    style={{
      borderRadius: '8px',
      height: 32,
      padding: '0 20px',
      background: isHovered
        ? 'linear-gradient(135deg, #0f7ae5 0%, #2194ff 100%)'
        : 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      border: 'none',
      fontWeight: 500,
      color: '#fff',
      boxShadow: isHovered
        ? '0 6px 20px rgba(24, 144, 255, 0.4)'
        : '0 2px 8px rgba(24, 144, 255, 0.2)',
      transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      transition: 'all 0.3s ease',
    }}
  >
    Ajouter un fournisseur
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
  title={
    <span style={{ fontWeight: 700, fontSize: "20px", color: "#1f2937" }}>
      {currentId ? "✏️ Modifier fournisseur" : "➕ Nouveau fournisseur"}
    </span>
  }
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
  bodyStyle={{
    padding: '24px 24px 8px',
  
    borderRadius: '12px',
  }}
  style={{
    borderRadius: '16px',
    overflow: 'hidden',
    paddingBottom: '0',
  }}
  okButtonProps={{
    style: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      border: 'none',
      fontWeight: 600,
      borderRadius: '10px',
      height: '40px',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
    },
    onMouseEnter: (e) => {
      e.target.style.transform = 'translateY(-1px)';
    },
    onMouseLeave: (e) => {
      e.target.style.transform = 'translateY(0)';
    },
  }}
  cancelButtonProps={{
    style: {
      borderRadius: '10px',
      height: '40px',
      border: '1px solid #d1d5db',
      fontWeight: 500,
      color: '#4b5563',
    }
  }}
>
  <Form form={form} layout="vertical">
    <Form.Item
      name="nom"
      label={<strong style={{ color: '#374151' }}>Nom</strong>}
      rules={[{ required: true, message: "Veuillez entrer le nom" }]}
    >
      <Input
        placeholder="🏢 Nom du fournisseur"
        style={{
          borderRadius: '10px',
          height: '42px',
          border: '1.5px solid #d1d5db',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      />
    </Form.Item>

    <Form.Item
      name="num_reg_fiscal"
      label={<strong style={{ color: '#374151' }}>Numéro d'enregistrement fiscal</strong>}
    >
      <Input
        placeholder="📋 Numéro d'enregistrement fiscal"
        style={{ borderRadius: '10px', height: '42px', border: '1.5px solid #d1d5db' }}
      />
    </Form.Item>

    <Form.Item
      name="adresse"
      label={<strong style={{ color: '#374151' }}>Adresse</strong>}
    >
      <Input
        placeholder="📍 Adresse du fournisseur"
        style={{ borderRadius: '10px', height: '42px', border: '1.5px solid #d1d5db' }}
      />
    </Form.Item>

    <Form.Item
      name="telephone"
      label={<strong style={{ color: '#374151' }}>Numéro de téléphone</strong>}
      rules={[
        {
          pattern: /^\+?\d{7,15}$/,
          message: "Entrez un numéro valide (chiffres uniquement)",
        },
      ]}
    >
      <Input
        placeholder="📞 Numéro de téléphone"
        style={{ borderRadius: '10px', height: '42px', border: '1.5px solid #d1d5db' }}
      />
    </Form.Item>

    <Form.Item
      name="infos_complementaires"
      label={<strong style={{ color: '#374151' }}>Informations complémentaires</strong>}
    >
      <Input.TextArea
        placeholder="📝 Notes, remarques ou détails..."
        rows={3}
        style={{
          borderRadius: '12px',
          border: '1.5px solid #d1d5db',
          resize: 'none',
          fontSize: '14px',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      />
    </Form.Item>
  </Form>
</Modal>

    </Card>
  );
}
