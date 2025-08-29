import React, { useState, useEffect, useContext } from "react";
import {
  Row,
  Col,
  Empty,
  Spin,
  Alert,
  Select,
  Space,
  Typography,
  Card,
  Button,
  Input,
  Badge,
  Modal,
  Tree,
  message,
  Radio,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
  ClearOutlined,
  AppstoreOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOutlined,
  FileOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useProducts } from "../contexts/ProductContext";
import { StockContext } from "../../stock/contexts/StockContext";
import ProductCard from "./ProductCard";
import ProductForm from "./ProductForm";
import { useNavigate } from 'react-router-dom';
import { categoryService } from "../services/CategoryService";
const { Option } = Select;
const { Title, Text } = Typography;
const { Search } = Input;

const ProductList = ({ onDuplicateSuccess }) => {
  const {
    products,
    loading,
    error,
    selectedMaterial,
    filterByMaterial,
    refreshProducts,
  } = useProducts();
  const navigate = useNavigate();

  // Auto refresh products every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshProducts();
    }, 30000); // 30000 ms = 30 seconds

    return () => clearInterval(intervalId);
  }, [refreshProducts]);
  
  const handleAddCategorie = async () => {
    if (!nomCategorie) return message.error("Veuillez entrer un nom de catégorie");
    try {
      let res;
      if (typeCategorie === "categorie") {
        res = await categoryService.createCategorie({ nom: nomCategorie });
      } else {
        res = await categoryService.createSousCategorie({
          nom: nomCategorie,
          categorie_id: selectedCategorie,
        });
      }      
      message.success("Catégorie ajoutée !");
      setNomCategorie("");
      setIsCategorieModalVisible(false);
      // Fetch updated categories after adding
      const categoriesRes = await categoryService.getCategories();
      setCategories(categoriesRes.data); // update state with new data
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la création de la catégorie");
    }
  };
  
  const handleSelect = (keys, info) => {
    console.log("Selected category:", info.node.key);
    // TODO: load products by category
  };
  
  const handleTrashClick = () => {
    navigate('/trash'); // ou '/products/trash' selon votre routing
  };
  // Integration StockManagement
  const { filteredProducts } = useContext(StockContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isCategorieModalVisible, setIsCategorieModalVisible] = useState(false);
  const [typeCategorie, setTypeCategorie] = useState("categorie"); // "categorie" or "sous-categorie"
  const [nomCategorie, setNomCategorie] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState(null);
  const [categories, setCategories] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [displayedProducts, setDisplayedProducts] = useState([]);
  
  useEffect(() => {
    // load categories for sous-categorie
    categoryService.getCategories().then(res => setCategories(res.data));
  }, []);
  
  const getRandomColor = () => {
    const colors = ["#FF6B6B", "#6BCB77", "#4D96FF", "#FFD93D", "#FF6FFF"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formattedCategories = () => {
    return (categories ?? []).map(cat => ({
      title: (
        <Tooltip title={`${cat.nom} (${cat.count} produits)`}>
          <span style={{ color: getRandomColor(), fontWeight: "bold" }}>{cat.nom} ({cat.count})</span>
        </Tooltip>
      ),
      key: cat.id ?? `cat-${cat.nom}`,
      icon: <ToolOutlined style={{ color: getRandomColor() }} />,
      children: Array.isArray(cat.children)
        ? cat.children.map(sub => ({
            title: (
              <Tooltip title={`${sub.nom} (${sub.count})`}>
                <span style={{ color: getRandomColor() }}>{sub.nom} ({sub.count})</span>
              </Tooltip>
            ),
            key: sub.id ?? `sub-${sub.nom}-${cat.id}`,
            icon: <AppstoreOutlined style={{ color: getRandomColor() }} />,
          }))
        : [],
    }));
  };

  console.log(formattedCategories())

  useEffect(() => {
    if (!Array.isArray(products)) {
      setDisplayedProducts([]);
      return;
    }
    
    let filtered = products;
    
    if (selectedMaterial && selectedMaterial !== "all") {
      filtered = filtered.filter((product) => {
        const productMaterial = product.type_matiere || product.material_type;
        return (
          productMaterial?.trim().toLowerCase() ===
          selectedMaterial.toLowerCase()
        );
      });
    }

    const searchFiltered = filtered.filter(
      (product) =>
        !searchTerm ||
        (product.nom_produit || product.name)
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(product.id)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setDisplayedProducts(searchFiltered);
  }, [products, searchTerm, selectedMaterial]);

  // Gestion du message de succès
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSearch = (value) => setSearchTerm(value);
  const handleMaterialFilter = (value) => filterByMaterial(value);
  const handleClearFilters = () => {
    setSearchTerm("");
    filterByMaterial("all");
  };

  // Gestion du modal
  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleProductAdded = () => {
    setIsModalVisible(false);
    setSuccessMessage(" ✅ Produit créé avec succès");
  };

  const handleDuplicateSuccess = () => {
    console.log("Received onDuplicateSuccess in ProductList!");
    setSuccessMessage(" ✅ Produit dupliqué avec succès");
    if (onDuplicateSuccess) {
      onDuplicateSuccess();
    }
  };

  const hasActiveFilters =
    searchTerm || (selectedMaterial && selectedMaterial !== "all");

  const materialOptions = [
    { value: "all", label: "Tous les matériaux" },
    { value: "acier", label: "Acier" },
    { value: "acier_inoxydable", label: "Acier inoxydable" },
    { value: "aluminium", label: "Aluminium" },
    { value: "laiton", label: "Laiton" },
    { value: "cuivre", label: "Cuivre" },
    { value: "acier_galvanise", label: "Acier galvanisé" },
    { value: "autre", label: "Autre" },
  ];

  if (error) {
    return (
      <Alert
        message="Erreur de chargement"
        description="Impossible de charger les produits. Veuillez réessayer plus tard."
        type="error"
        showIcon
        action={
          <Button icon={<ReloadOutlined />} onClick={refreshProducts}>
            Réessayer
          </Button>
        }
        style={{
          margin: "24px",
          borderRadius: "12px",
          border: "1px solid #ffccc7",
        }}
      />
    );
  }

return (
  <div>
    <div
      style={{
        background: "#ffffff",
        borderRadius: "13px", // arrondi sur les côtés et coins
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)", // ombre légère
        width: "100%",
        maxWidth: "100%",
        minHeight: 'calc(100vh - 80px)', // prend toute la hauteur visible moins padding
        padding: "20px 30px", // padding interne plus généreux
        margin: "0 auto", // centrer le contenu
        boxSizing: "border-box",
      }}
    >
      {/* Message de succès */}
      {successMessage && (
        <div
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            padding: "12px",
            marginBottom: "24px",
            borderRadius: "8px",
            color: "#389e0d",
            fontWeight: "500",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 32, position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space size="large" align="center">
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "#1890ff",
                  borderRadius: 16,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
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
                {products?.length || 0}
              </div>
            </div>

            <div>
              <Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "#1890ff",
                  fontSize: "28px",
                }}
              >
                Catalogue des Produits
              </Title>
              <Text
                type="secondary"
                style={{
                  color: "#64748b",
                  fontSize: '14px'
                
                }}
              >
                {products?.length || 0} produit{products?.length > 1 ? "s" : ""} enregistré{products?.length > 1 ? "s" : ""}
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
      onClick={handleTrashClick}
      style={{
        borderRadius: '12px',
        height: '48px',
        padding: '0 20px',
        border: '2px solid #ef4444',
        color: '#ef4444',
        fontWeight: 600,
        background: '#ffffff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: '15px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
      }}
      onMouseEnter={(e) => {
        e.target.style.borderColor = '#dc2626';
        e.target.style.color = '#ffffff';
        e.target.style.background = '#ef4444';
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = '#ef4444';
        e.target.style.color = '#ef4444';
        e.target.style.background = '#ffffff';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)';
      }}
    >
      Corbeille
    </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={showModal}
              style={{
                borderRadius: '12px',
                height: '48px',
                padding: '0 24px',
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none',
                fontWeight: 600,
                fontSize: '15px',
                boxShadow: '0 6px 20px rgba(24, 144, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 30px rgba(24, 144, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(24, 144, 255, 0.3)';
              }}
            >
              Ajouter un produit
            </Button>
          </Space>
        </div>
      </div>

      {/* Filtres */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          border: "1px solid #f0f0f0",
          marginBottom: 24
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 8 }}>Recherche et filtres</Title>
          <Text type="secondary">Affinez votre recherche de produits</Text>
        </div>
        <Space wrap size="middle" style={{ marginBottom: 16 }}>
          <Search
            placeholder="Rechercher un produit..."
            value={searchTerm}
            allowClear
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 280 }}
            prefix={<SearchOutlined />}
          />

          <Select
            placeholder="Filtrer par matériau"
            style={{ width: 220 }}
            value={selectedMaterial || "all"}
            onChange={handleMaterialFilter}
            suffixIcon={<FilterOutlined />}
          >
            {materialOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <Button
            onClick={handleClearFilters}
            icon={<ClearOutlined />}
            disabled={!hasActiveFilters}
          >
            Effacer les filtres
          </Button>

          <Button
            onClick={refreshProducts}
            icon={<ReloadOutlined />}
            loading={loading}
          >
            Actualiser
          </Button>
        </Space>

        {hasActiveFilters && (
          <div style={{ marginTop: 12 }}>
            <Space>
              <Text type="secondary">Filtres actifs :</Text>
              {searchTerm && (
                <Badge count={`Recherche : "${searchTerm}"`} style={{ background: "#e6f7ff", color: "#1890ff" }} />
              )}
              {selectedMaterial !== "all" && (
                <Badge
                  count={materialOptions.find(opt => opt.value === selectedMaterial)?.label}
                  style={{ background: "#fffbe6", color: "#faad14" }}
                />
              )}
            </Space>
          </div>
        )}
        </Card>
      <Row gutter={24} align="top">
        {/* Catégories */}
        <Col span={10}>
          <Card
            title="Hiérarchie des Catégories"
            extra={
              <Button type="primary" size="medium" icon={<PlusOutlined />} onClick={setIsCategorieModalVisible}>
                Ajouter catégorie
              </Button>
            }
            style={{ height: "100%" }}
          >
            {categories && (
              <Tree
                treeData={formattedCategories()}
                defaultExpandAll
                showLine={{ showLeafIcon: true }}
                style={{ maxHeight: "500px", overflowY: "auto", padding: "10px", background: "#f0f2f5", borderRadius: "10px" }}
              />
            )}
          </Card>
        </Col>
        <Col span={14}>
          {/* Résultat Produits */}
          <Card
            title={
              <div>
                <div>Produits - Outillage à main</div>
                <Typography.Text style={{ color: 'grey', fontSize: 12 }}>
                  xx produits dans cette catégorie
                </Typography.Text>
              </div>
            }
            style={{ height: "100%" }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Spin size="large" />
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Chargement des produits...</Text>
                </div>
              </div>
            ) : displayedProducts.length === 0 ? (
              <Empty
              description={
                <>
                    <Text strong>Aucun produit trouvé</Text>
                    <br />
                    <Text type="secondary">
                      {hasActiveFilters
                        ? "Essayez d'ajuster vos filtres"
                        : "Aucun produit disponible pour le moment"}
                    </Text>
                  </>
                }
                style={{ padding: "80px 0" }}
                >
                {hasActiveFilters && (
                  <Button type="primary" onClick={handleClearFilters}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </Empty>
            ) : (
              <Row gutter={[24, 24]}>
                {displayedProducts.map((product) => (
                  <Col span={8} key={product.id}>
                    <ProductCard
                      product={product}
                      onDuplicateSuccess={handleDuplicateSuccess}
                      />
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

        {/* Modal pour ajouter un produit */}
        <Modal
          title="Formulaire d'ajout de produit"
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          destroyOnClose={true}
          width={800}
          style={{ top: 20 }}
          >
          <ProductForm onSuccess={handleProductAdded} />
        </Modal>
        {/* Modal pour ajouter une catégorie */}
        <Modal
          title="Ajouter une catégorie ou sous-catégorie"
          open={isCategorieModalVisible}
          onOk={handleAddCategorie}
          onCancel={()=>setIsCategorieModalVisible(false)}
          confirmLoading={loading}
        >
          <Radio.Group
            onChange={(e) => setTypeCategorie(e.target.value)}
            value={typeCategorie}
            style={{ marginBottom: 16 }}
          >
            <Radio value="categorie">Catégorie</Radio>
            <Radio value="sous-categorie">Sous-catégorie</Radio>
          </Radio.Group>

          {typeCategorie === "sous-categorie" && (
            <Select
              placeholder="Choisir la catégorie parente"
              style={{ width: "100%", marginBottom: 16 }}
              value={selectedCategorie}
              onChange={setSelectedCategorie}
            >
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.nom}
                </Option>
              ))}
            </Select>
          )}
          <Input
            placeholder={typeCategorie === "categorie" ? "Nom de la catégorie" : "Nom de la sous-catégorie"}
            value={nomCategorie}
            onChange={(e) => setNomCategorie(e.target.value)}
          />
        </Modal>
    </div>
  </div>
);

};

export default ProductList;