import React, { useContext ,useEffect } from "react";
import { StockContext } from "../contexts/StockContext";
import ProductList from "../../products/components/ProductList";
import ProductForm from "../../products/components/ProductForm";
import { Button, Typography, Modal, Layout } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import "./StockManagement.css";

const { Title } = Typography;
const { Content } = Layout;

function StockManagement() {
  const { filteredProducts } = useContext(StockContext);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");

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
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  

  return (
    <Content className="stock-management">
      <div className="stock-header">
       

      </div>
      {successMessage && (
  <div style={{ background: "#f6ffed", border: "1px solid #b7eb8f", padding: "12px", marginBottom: "16px", borderRadius: "4px", color: "#389e0d" }}>
    {successMessage}
  </div>
)}



  <ProductList
  onDuplicateSuccess={() => {
    console.log("Received onDuplicateSuccess in StockManagement!");
    setSuccessMessage(" ✅ Produit créé avec succès");
  }}
/>



      <Modal
    
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose={true} // fix typo from "destroyOnHidden"
      >
        <ProductForm onSuccess={handleProductAdded} />
      </Modal>
    </Content>
  );
}

export default StockManagement;
