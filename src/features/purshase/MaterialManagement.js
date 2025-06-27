import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import AddMaterialAchatForm from "./AddMaterialAchatForm";
import MaterialAchatService from "./Services/MaterialAchatService";
import MaterialModel from "./models/MaterialModel";

const { Title, Text } = Typography;
const { Option } = Select;

export default function MaterialAchatManagement() {
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [materialList, setMaterialList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("all");

  const getStatus = (remaining, min) => {
    if (remaining < min) return "ALERTE";
    return "OK";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ALERTE":
        return "red";
      case "OK":
        return "green";
      default:
        return "gray";
    }
  };

  const columns = [
    { title: "Référence", dataIndex: "ref", key: "ref" },
    { title: "Nom Matière", dataIndex: "nom_matiere", key: "nom_matiere" },
    {
      title: "Catégorie",
      dataIndex: "categorie",
      key: "categorie",
      render: (cat) => <Tag>{cat}</Tag>,
    },
    {
      title: "Quantité",
      dataIndex: "remaining_quantity",
      key: "remaining_quantity",
      render: (qty, record) => `${qty} ${record.unite_mesure || ''}`,
    },
    {
      title: "Stock Min",
      dataIndex: "stock_minimum",
      key: "stock_minimum",
      render: (qty, record) => `${qty} ${record.unite_mesure || ''}`,
    },
   
    {
      title: "Prix Unitaire",
      dataIndex: "prix_unitaire",
      key: "prix_unitaire",
      render: (prix) => `${prix} TND`,
    },
    { title: "Fournisseur", dataIndex: "fournisseur_principal", key: "fournisseur_principal" },
    { title: "Date Réception", dataIndex: "date_reception", key: "date_reception" },
     {
      title: "Statut",
      key: "statut",
      render: (_, record) => {
        const statut = getStatus(record.remaining_quantity, record.stock_minimum);
        const color = getStatusColor(statut);
        const fontWeight = statut === "ALERTE" ? "bold" : "normal";
        return <Tag color={color} style={{ fontWeight }}>{statut}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditMaterial(record)} />
          <Popconfirm
            title="Supprimer cette matière ?"
            onConfirm={() => handleDeleteMaterial(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fetchMaterial = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchText) params.search = searchText;
      if (selectedCategorie !== "all") params.categorie = selectedCategorie;

      const result = await MaterialAchatService.getAllMaterial(params);
      setMaterialList(result);
    } catch (err) {
      console.error(err);
      message.error("Erreur lors du chargement des matières achetées");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterial();
  }, [searchText, selectedCategorie]);

  const handleAddMaterial = () => {
    setCurrentMaterial(MaterialModel.createEmpty());
    setIsEditing(false);
    setIsModalVisible(true);
  };

  const handleEditMaterial = (mat) => {
    setCurrentMaterial(new MaterialModel(mat));
    setIsEditing(true);
    setIsModalVisible(true);
  };

  const handleDeleteMaterial = async (id) => {
    setLoading(true);
    try {
      await MaterialAchatService.deleteMaterial(id);
      message.success("Matière supprimée !");
      fetchMaterial();
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formValues) => {
    setLoading(true);
    try {
      const material = new MaterialModel(formValues);
      const payload = material.to_api_format();

      if (isEditing) {
        await MaterialAchatService.updateMaterial(currentMaterial.id, payload);
        message.success("Matière mise à jour !");
        fetchMaterial();
      } else {
        const createdMaterial = await MaterialAchatService.createMaterial(payload);
        message.success("Matière ajoutée !");
        setMaterialList((prev) => [createdMaterial, ...prev]);
      }

      setIsModalVisible(false);
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearchText("");
    setSelectedCategorie("all");
    fetchMaterial();
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={2}>Matières Premières Achetées</Title>
        <Text type="secondary">Suivi des matières</Text>

        <Row justify="space-between" align="middle" style={{ marginTop: 20 }} gutter={[16, 16]}>
          <Col span={8}>
            <Input
              placeholder="Rechercher une matière..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              style={{ width: "100%" }}
              value={selectedCategorie}
              onChange={(value) => setSelectedCategorie(value)}
              placeholder="Tous les matériaux"
              suffixIcon={<FilterOutlined />}
              showArrow
            >
              <Option value="all">Tous les matériaux</Option>
              <Option value="acier">Acier</Option>
              <Option value="acier_inoxydable">Acier inoxydable</Option>
              <Option value="aluminium">Aluminium</Option>
              <Option value="laiton">Laiton</Option>
              <Option value="cuivre">Cuivre</Option>
              <Option value="acier_galvanise">Acier galvanisé</Option>
              <Option value="autre">Autre</Option>
            </Select>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                Actualiser
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMaterial}>
                Nouvelle matière achetée
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={materialList}
        rowKey={(record) => record.id || record.ref}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="Aucune matière trouvée" /> }}
      />

      <Modal
        open={isModalVisible}
        footer={null}
        onCancel={() => setIsModalVisible(false)}
        title={isEditing ? "Modifier la matière achetée" : "Nouvelle matière achetée"}
        width={1000}
      >
        <AddMaterialAchatForm
          initial_values={currentMaterial}
          on_finish={handleFormSubmit}
          setIsModalVisible={setIsModalVisible}
          loading={loading}
          isEditing={isEditing}
        />
      </Modal>
    </div>
  );
}
