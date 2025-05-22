import React, { useState } from 'react';
import { Form, Input, Button, Select, InputNumber, Upload, message, Typography, Card, Space, Divider } from 'antd';
import { UploadOutlined, SaveOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useProducts } from '../contexts/ProductContext';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const ProductForm = ({ onSuccess, onCancel, isModal = false }) => {
  const [form] = Form.useForm();
  const { addProduct } = useProducts();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Handle file upload
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    
    // Generate preview for the first file
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(newFileList[0].url || newFileList[0].thumbUrl);
      }
    } else {
      setImagePreview(null);
    }
  };

  // Convert upload component value to file list
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList || [];
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Process the image if one exists
      let imageData = null;
      if (fileList.length > 0) {
        if (fileList[0].originFileObj) {
          // Convert File object to base64
          const file = fileList[0].originFileObj;
          imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });
        } else if (fileList[0].url) {
          // Use existing URL
          imageData = fileList[0].url;
        }
      }
      
      // Prepare product data with proper field mapping for the backend
      const productData = {
        nom_produit: values.name,
        type_matiere: values.material,
        epaisseur: values.thickness,
        longueur: values.length || 0,
        surface: values.surface,
        prix: values.price || 0,
        description: values.description || '',
        image: imageData,
        // Also include frontend field names
        name: values.name,
        material_type: values.material,
        thickness: values.thickness,
        length: values.length || 0,
        price: values.price || 0
      };
      
      console.log('Sending product with data:', productData);
      
      // Call API to add product
      await addProduct(productData);
      
      // Reset form
      form.resetFields();
      setFileList([]);
      setImagePreview(null);
      
      message.success('Produit ajouté avec succès');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error('Erreur lors de l\'ajout du produit');
      console.error('Error adding product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={<Title level={4}>Ajouter un nouveau produit</Title>}
      extra={isModal && <Button icon={<CloseOutlined />} onClick={onCancel} />}
      style={{ width: '100%' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="Nom du produit"
          rules={[{ required: true, message: 'Le nom du produit est obligatoire' }]}
        >
          <Input placeholder="Nom du produit" />
        </Form.Item>
        
        <Form.Item
          name="material"
          label="Type de matériau"
          rules={[{ required: true, message: 'Le type de matériau est obligatoire' }]}
        >
          <Select placeholder="Sélectionner un matériau">
            <Option value="acier">Acier</Option>
            <Option value="inox">Acier inoxydable</Option>
            <Option value="aluminium">Aluminium</Option>
            <Option value="laiton">Laiton</Option>
            <Option value="cuivre">Cuivre</Option>
            <Option value="acier_galvanise">Acier galvanisé</Option>
            <Option value="autre">Autre</Option>
          </Select>
        </Form.Item>
        
        <Divider orientation="left">Dimensions</Divider>
        
        <Space style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <Form.Item
            name="thickness"
            label="Épaisseur (mm)"
            rules={[{ required: true, message: 'L\'épaisseur est obligatoire' }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber min={0.1} step={0.1} style={{ width: 160 }} />
          </Form.Item>
          
          <Form.Item
            name="length"
            label="Longueur (mm)"
            style={{ marginBottom: 0 }}
          >
            <InputNumber min={0} step={1} style={{ width: 160 }} />
          </Form.Item>
          
          <Form.Item
            name="surface"
            label="Surface (m²)"
            rules={[{ required: true, message: 'La surface est obligatoire' }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber min={0.01} step={0.01} style={{ width: 160 }} />
          </Form.Item>
        </Space>
        
        <Divider />
        
        <Form.Item
          name="price"
          label="Prix (DT)"
        >
          <InputNumber 
            min={0} 
            step={0.01} 
            formatter={value => `${value} DT`}
            parser={value => value.replace(' DT', '')}
            style={{ width: 200 }}
          />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={4} 
            placeholder="Description détaillée du produit"
            showCount
            maxLength={500}
          />
        </Form.Item>
        
        <Form.Item
          name="upload"
          label="Image du produit"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={() => false} // Prevent auto upload
            maxCount={1}
          >
            {fileList.length < 1 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Télécharger</div>
              </div>
            )}
          </Upload>
        </Form.Item>
        
        {imagePreview && (
          <img 
            src={imagePreview} 
            alt="Aperçu" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '200px',
              marginBottom: 16,
              objectFit: 'contain' 
            }}
          />
        )}
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
          >
            Ajouter le produit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProductForm;