import React, { useState, useEffect } from "react";
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
} from "antd";
import {
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useProducts } from "../contexts/ProductContext";
import ProductCard from "./ProductCard";

const { Option } = Select;
const { Title } = Typography;
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

  const [searchTerm, setSearchTerm] = useState("");
  const [displayedProducts, setDisplayedProducts] = useState([]);

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

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleMaterialFilter = (value) => {
    filterByMaterial(value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    filterByMaterial("all");
  };

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
        message="Erreur"
        description="Impossible de charger les produits. Veuillez réessayer plus tard."
        type="error"
        showIcon
      />
    );
  }

  return (
    <Card className="product-list-container">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Liste des produits ({displayedProducts.length})
          </Title>
          <Space wrap>
            <Search
              placeholder="Rechercher un produit..."
              allowClear
              value={searchTerm}
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              style={{ width: 200 }}
              placeholder="Filtrer par matériau"
              onChange={handleMaterialFilter}
              value={selectedMaterial || "all"}
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
              type="default"
            >
              Effacer les filtres
            </Button>
  
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : displayedProducts.length === 0 ? (
          <Empty
            description="Aucun produit ne correspond à votre recherche"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {displayedProducts.map((product) => (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <ProductCard
                  product={product}
                  onDuplicateSuccess={onDuplicateSuccess}
                />
              </Col>
            ))}
          </Row>
        )}
      </Space>
    </Card>
  );
};

export default ProductList;
