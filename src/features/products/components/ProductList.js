import React, { useState, useEffect } from 'react';
import { Row, Col, Empty, Spin, Alert, Select, Space, Typography, Card, Button, Input } from 'antd';
import { ReloadOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { useProducts } from '../contexts/ProductContext';
import ProductCard from './ProductCard';

const { Option } = Select;
const { Title } = Typography;
const { Search } = Input;

const ProductList = () => {
  const { 
    products, 
    loading, 
    error, 
    selectedMaterial, 
    filterByMaterial,
    refreshProducts 
  } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [displayedProducts, setDisplayedProducts] = useState([]);
  
  // Add debugging logs to see what's happening
  useEffect(() => {
    console.log('Raw products from context:', products);
    console.log('Selected material:', selectedMaterial);
    console.log('Search term:', searchTerm);
    
    // Make sure products is an array before filtering
    if (!Array.isArray(products)) {
      console.error('Products is not an array:', products);
      setDisplayedProducts([]);
      return;
    }
    
    let materialFilteredProducts = products;
    if (selectedMaterial && selectedMaterial !== "all") {
      materialFilteredProducts = products.filter(product => 
        product.material_type?.trim().toLowerCase() === selectedMaterial.toLowerCase()
      );
    }
    
    const searchFilteredProducts = materialFilteredProducts.filter(product => 
      !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(product.id)?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('Filtered products (after material and search):', searchFilteredProducts);
    setDisplayedProducts(searchFilteredProducts);
  }, [products, searchTerm, selectedMaterial]); // Added selectedMaterial to dependencies
  
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleMaterialFilter = (value) => {
    filterByMaterial(value);
  };

  const materialOptions = [
    { value: "all", label: "Tous les matériaux" },
    { value: "inox", label: "Inox" },
    { value: "fer", label: "Fer" },
    { value: "aluminium", label: "Aluminium" },
    { value: "cuivre", label: "Cuivre" },
    { value: "laiton", label: "Laiton" },
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

  // Add a debug display to see what's happening with our state
  console.log('Rendering with displayedProducts:', displayedProducts);
  
  return (
    <Card className="product-list-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <Title level={4} style={{ margin: 0 }}>Liste des produits ({displayedProducts.length})</Title>
          <Space wrap>
            <Search
              placeholder="Rechercher un produit..."
              allowClear
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
              {materialOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshProducts}
              loading={loading}
            >
              Actualiser
            </Button>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : displayedProducts.length === 0 ? (
          <Empty 
            description="Aucun produit ne correspond à votre recherche" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {displayedProducts.map(product => (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}
      </Space>
    </Card>
  );
};

export default ProductList;