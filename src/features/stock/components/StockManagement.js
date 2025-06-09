import React, { useContext } from 'react';
import { StockContext } from '../contexts/StockContext';
import ProductList from '../../products/components/ProductList';
import ProductForm from '../../products/components/ProductForm';
import { Button, Typography, Modal, Layout } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import './StockManagement.css';

const { Title } = Typography;
const { Content } = Layout;

function StockManagement() {
  const { filteredProducts } = useContext(StockContext);
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const handleProductAdded = () => {
    setIsModalVisible(false);
  };

  return (
    <Content className="stock-management">
      <div className="stock-header">
        <Title level={2}>Gestion des produits</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showModal}
        >
          Ajouter un produit
        </Button>
      </div>
      
      <ProductList products={filteredProducts} />
      
      <Modal
        title="Ajouter un nouveau produit"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden={true}
      >
        <ProductForm onComplete={handleCancel} />
      </Modal>
    </Content>
  );
}

export default StockManagement;