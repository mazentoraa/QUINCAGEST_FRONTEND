import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  AppstoreOutlined,
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
      render: (qty, record) => `${qty} ${record.unite_mesure || ""}`,
    },
    {
      title: "Stock Min",
      dataIndex: "stock_minimum",
      key: "stock_minimum",
      render: (qty, record) => `${qty} ${record.unite_mesure || ""}`,
    },
    {
      title: "Prix Unitaire",
      dataIndex: "prix_unitaire",
      key: "prix_unitaire",
      render: (prix) => `${prix} TND`,
    },
    {
      title: "Fournisseur",
      dataIndex: "fournisseur_principal",
      key: "fournisseur_principal",
    },
    { title: "Date Réception", dataIndex: "date_reception", key: "date_reception" },
    {
      title: "Statut",
      key: "statut",
      render: (_, record) => {
        const statut = getStatus(record.remaining_quantity, record.stock_minimum);
        const color = getStatusColor(statut);
        const fontWeight = statut === "ALERTE" ? "bold" : "normal";
        return (
          <Tag color={color} style={{ fontWeight }}>
            {statut}
          </Tag>
        );
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
    <div style={{
    marginBottom: 16,
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    padding: 24,
  }} >
      
      <Card style={{ marginBottom: 16 }}>
        {/* Header stylisé */}
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
                  {materialList?.length || 0}
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
                  Matières Premières Achetées
                </Title>
                <Text
                  type="secondary"
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  {materialList?.length || 0} matière
                  {materialList?.length > 1 ? "s" : ""} enregistrée
                  {materialList?.length > 1 ? "s" : ""}
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

            {/* Boutons modernisés à droite */}
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
                onClick={handleRefresh}
              >
                Corbeille
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleAddMaterial}
                style={{
                  borderRadius: "12px",
                  height: "48px",
                  padding: "0 24px",
                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                  border: "none",
                  fontWeight: 600,
                  fontSize: "15px",
                  boxShadow: '0 6px 20px rgba(24, 144, 255, 0.3)',
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  color: "#fff",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = '0 10px 30px rgba(24, 144, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = '0 6px 20px rgba(24, 144, 255, 0.3)';
                }}
              >
                Nouvelle matière achetée
              </Button>
            </Space>
          </div>
        </div>

        {/* --- Le reste du Card : recherche, filtre, etc --- */}
      <Row justify="start" align="middle" style={{ marginTop: 50 }} gutter={[8, 16]}>
  <Col span={6}>
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
      <Option value="metaux">Métaux</Option>
      <Option value="autre">Autre</Option>
    </Select>
  </Col>
  <Col>
    <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
      Actualiser
    </Button>
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
