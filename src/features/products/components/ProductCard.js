import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Image,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useProducts } from "../contexts/ProductContext";

const { Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ProductCard = ({ product }) => {
  const { updateProduct, deleteProduct } = useProducts();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [imageUrl, setImageUrl] = useState(product.image);

  useEffect(() => {
    form.setFieldsValue({
      name: product.nom_produit,
      code_produit : product.code_produit,
      material: product.type_matiere,
      thickness: product.epaisseur,
      length: product.longueur,
      width: product.largeur,
      surface: product.surface,
      price: product.prix,
      description: product.description,
    });

    if (product.image) {
      setImageUrl(product.image);
      setFileList([
        {
          uid: "-1",
          name: "product-image.png",
          status: "done",
          url: product.image,
        },
      ]);
    } else {
      setFileList([]);
      setImageUrl(null);
    }
  }, [product, form]);

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      const file = newFileList[0]?.originFileObj;
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setImageUrl(reader.result);
        reader.readAsDataURL(file);
      } else if (newFileList[0]?.url) {
        setImageUrl(newFileList[0].url);
      }
    } else {
      setImageUrl(null);
    }
  };

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (values) => {
    try {
      let imageData = null;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        imageData = await getBase64(fileList[0].originFileObj);
      } else if (imageUrl) {
        imageData = imageUrl;
      }

      const updatedProduct = {
        nom_produit: values.name,
        code_produit : values.code_produit ,
        type_matiere: values.material,
        epaisseur: values.thickness,
        longueur: values.length,
        largeur: values.width,
        surface: values.surface,
        prix: values.price,
        description: values.description,
      };

      if (imageData !== null) {
        updatedProduct.image = imageData;
      }

      await updateProduct(product.id, updatedProduct);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(product.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const formatPrice = (price) =>
    price ? `${parseFloat(price).toFixed(2)} DT` : "0.00 DT";

  const getMaterialColor = (material) => {
    const colors = {
      inox: "blue",
      acier: "gray",
      aluminium: "green",
      cuivre: "orange",
      laiton: "gold",
      acier_galvanise: "purple",
      autre: "default",
    };
    return colors[material] || "default";
  };

  const renderEditForm = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item name="name" label="Nom du produit">
        <Input />
      </Form.Item>
      <Form.Item name="code_produit" label="Code produit">
        <Input />
      </Form.Item>
      <Form.Item name="material" label="Type de matériau">
        <Select placeholder="Sélectionner un matériau">
          <Option value="acier">Acier</Option>
          <Option value="acier_inoxydable">Acier inoxydable</Option>
          <Option value="aluminium">Aluminium</Option>
          <Option value="laiton">Laiton</Option>
          <Option value="cuivre">Cuivre</Option>
          <Option value="acier_galvanise">Acier galvanisé</Option>
          <Option value="autre">Autre</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Dimensions">
        <Space style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <Form.Item name="thickness" label="Épaisseur (mm)">
            <InputNumber min={0} 
              onKeyDown={(e) => {
                const allowed = [
                  "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
                  ...Array.from({ length: 10 }, (_, i) => `${i}`),
                  "."
                ];
                if (e.key === "+" || e.key === "-") {
                  e.preventDefault();
                }
                if (
                  !allowed.includes(e.key) &&
                  !(e.ctrlKey || e.metaKey) // allow Ctrl+V, etc.
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const value = e.clipboardData.getData("text");
                if (!/^\d*\.?\d*$/.test(value)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
          <Form.Item name="length" label="Longueur (mm)">
            <InputNumber min={0} 
              onKeyDown={(e) => {
                const allowed = [
                  "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
                  ...Array.from({ length: 10 }, (_, i) => `${i}`),
                  "."
                ];
                if (e.key === "+" || e.key === "-") {
                  e.preventDefault();
                }
                if (
                  !allowed.includes(e.key) &&
                  !(e.ctrlKey || e.metaKey) // allow Ctrl+V, etc.
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const value = e.clipboardData.getData("text");
                if (!/^\d*\.?\d*$/.test(value)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
          <Form.Item name="width" label="Largeur (mm)">
            <InputNumber min={0} 
              onKeyDown={(e) => {
                const allowed = [
                  "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
                  ...Array.from({ length: 10 }, (_, i) => `${i}`),
                  "."
                ];
                if (e.key === "+" || e.key === "-") {
                  e.preventDefault();
                }
                if (
                  !allowed.includes(e.key) &&
                  !(e.ctrlKey || e.metaKey) // allow Ctrl+V, etc.
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const value = e.clipboardData.getData("text");
                if (!/^\d*\.?\d*$/.test(value)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
          <Form.Item name="surface" label="Surface (m²)">
            <InputNumber min={0} 
              onKeyDown={(e) => {
                const allowed = [
                  "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
                  ...Array.from({ length: 10 }, (_, i) => `${i}`),
                  "."
                ];
                if (e.key === "+" || e.key === "-") {
                  e.preventDefault();
                }
                if (
                  !allowed.includes(e.key) &&
                  !(e.ctrlKey || e.metaKey) // allow Ctrl+V, etc.
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const value = e.clipboardData.getData("text");
                if (!/^\d*\.?\d*$/.test(value)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
        </Space>
      </Form.Item>

      <Form.Item name="price" label="Prix (DT)">
        <InputNumber min={0} step={0.01} 
          onKeyDown={(e) => {
            const allowed = [
              "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
              ...Array.from({ length: 10 }, (_, i) => `${i}`),
              "."
            ];
            if (e.key === "+" || e.key === "-") {
              e.preventDefault();
            }
            if (
              !allowed.includes(e.key) &&
              !(e.ctrlKey || e.metaKey) // allow Ctrl+V, etc.
            ) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            const value = e.clipboardData.getData("text");
            if (!/^\d*\.?\d*$/.test(value)) {
              e.preventDefault();
            }
          }}
        />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea rows={4} />
      </Form.Item>

      <Form.Item label="Image">
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={handleUploadChange}
          beforeUpload={() => false}
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

      <Space>
        <Button type="primary" htmlType="submit">
          Enregistrer
        </Button>
        <Button onClick={() => setIsEditing(false)}>Annuler</Button>
      </Space>
    </Form>
  );

  const renderProductDetails = () => (
    <>
      <div
        style={{
          height: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        {product.image ? (
          <Image
            width="100%"
            height={200}
            src={product.image}
            alt={product.nom_produit}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text type="secondary">Pas d'image</Text>
          </div>
        )}
      </div>

      <Space direction="vertical" size="small" style={{ width: "100%" }}>

        
        <Typography.Title level={5} style={{ margin: 0 }}>
          {product.nom_produit}
        </Typography.Title>

        <Typography.Title level={5} style={{ margin: 0 }} color="grey">
          {product.code_produit}
        </Typography.Title>
        

        <Space>
          <Tag color={getMaterialColor(product.type_matiere)}>
            {product.type_matiere}
          </Tag>
          <Tag color="green">{formatPrice(product.prix)}</Tag>
        </Space>

        <Space direction="vertical" size={4}>
          {product.epaisseur !== null && product.epaisseur !== undefined && (
            <Text>Épaisseur : {product.epaisseur} mm</Text>
          )}
          {product.longueur !== null && product.longueur !== undefined && (
            <Text>Longueur : {product.longueur} mm</Text>
          )}
          {(product.largeur !== null && product.largeur !== undefined && product.largeur !== '') ? (
            <Text>Largeur : {product.largeur} mm</Text>
          ) : (
            <Text>Largeur : N/A</Text>
          )}
          {product.surface !== null && product.surface !== undefined && (
            <Text>Surface : {product.surface} m²</Text>
          )}
            {product.created_at !== null && product.created_at !== undefined && (
            <Text>Crée Le : { new Date(product.created_at).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })} </Text>
            
          )}
          {product.updated_at !== null && product.updated_at !== undefined && (
            <Text>Dernière Modification Le : {
                new Date(product.updated_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })} </Text>
            
          )}
        </Space>

        {product.description && (
          <Paragraph
            ellipsis={{ rows: 3, expandable: true, symbol: "plus" }}
            style={{ marginTop: 8 }}
          >
            {product.description}
          </Paragraph>
        )}
      </Space>
    </>
  );

  return (
    <>
      <Card
        hoverable
        className="product-card"
        style={{ height: "100%" }}
        actions={[
          <EditOutlined key="edit" onClick={() => setIsEditing(true)} />,
          <DeleteOutlined key="delete" onClick={() => setShowDeleteConfirm(true)} />,
        ]}
      >
        {isEditing ? renderEditForm() : renderProductDetails()}
      </Card>

      <Modal
        title="Confirmation de suppression"
        open={showDeleteConfirm}
        onOk={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        okText="Oui, supprimer"
        cancelText="Annuler"
        okType="danger"
        centered
      >
        <Space>
          <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: "22px" }} />
          <div>
            <p><strong>Êtes-vous sûr de vouloir supprimer ce produit ?</strong></p>
            <p>Cette action est irréversible.</p>
            <p style={{ color: "#666" }}>Produit : {product.nom_produit}</p>
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default ProductCard;
