import React, { useState } from "react";
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

  // Handle form initialization and image display
  React.useEffect(() => {
    form.setFieldsValue({
      name: product.name,
      material: product.material_type,
      thickness: product.thickness,
      length: product.length,
      surface: product.surface,
      price: product.price,
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

  // Handle delete confirmation
  const handleDeleteClick = () => {
    console.log("Delete icon clicked"); // Debug log
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    console.log(
      "Confirmation OK clicked, attempting to delete product:",
      product.id
    );

    try {
      if (!deleteProduct) {
        console.error("deleteProduct function is not available from context");
        Modal.error({
          title: "Erreur",
          content: "Fonction de suppression non disponible.",
        });
        return;
      }

      console.log("Calling deleteProduct function...");
      const result = await deleteProduct(product.id);
      console.log("Delete result:", result);

      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting product:", error);
      Modal.error({
        title: "Erreur",
        content: `Impossible de supprimer le produit: ${
          error.message || error
        }`,
      });
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    console.log("Delete cancelled");
    setShowDeleteConfirm(false);
  };

  // Show delete confirmation
  const showDeleteConfirmModal = () => {
    console.log("Delete button clicked for product:", product.id); // Debug log

    // Try using a different approach for the modal
    const modal = Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce produit ?",
      icon: <ExclamationCircleOutlined />,
      content: "Cette action est irréversible.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      centered: true,
      maskClosable: false,
      onOk: async () => {
        console.log(
          "Confirmation OK clicked, attempting to delete product:",
          product.id
        ); // Debug log

        try {
          // Check if deleteProduct function exists
          if (!deleteProduct) {
            console.error(
              "deleteProduct function is not available from context"
            );
            Modal.error({
              title: "Erreur",
              content: "Fonction de suppression non disponible.",
            });
            throw new Error("Delete function not available");
          }

          // Call delete with explicit logging
          console.log("Calling deleteProduct function...");
          const result = await deleteProduct(product.id);
          console.log("Delete result:", result);

          return result;
        } catch (error) {
          console.error("Error deleting product:", error);
          Modal.error({
            title: "Erreur",
            content: `Impossible de supprimer le produit: ${
              error.message || error
            }`,
          });
          throw error; // Re-throw to prevent modal from closing
        }
      },
      onCancel: () => {
        console.log("Delete cancelled"); // Debug log
      },
    });

    console.log("Modal created:", modal); // Debug log to see if modal is created
  };

  // Handle image upload
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      // Get the uploaded file
      const file = newFileList[0]?.originFileObj;
      if (file) {
        // Create a URL for the uploaded image
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          setImageUrl(reader.result);
        };
      } else if (newFileList[0]?.url) {
        // Image already has a URL
        setImageUrl(newFileList[0].url);
      }
    } else {
      setImageUrl(null);
    }
  };

  // Convert file objects to data URLs for API
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // Prepare image data
      let imageData = null;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        imageData = await getBase64(fileList[0].originFileObj);
      } else if (imageUrl) {
        imageData = imageUrl;
      }

      // Map frontend fields to both frontend and backend field names
      const productData = {
        // Backend field names
        nom_produit: values.name,
        type_matiere: values.material,
        epaisseur: values.thickness,
        longueur: values.length || 0,
        surface: values.surface,
        prix: values.price || 0,
        description: values.description || "",
        image: imageData,
        // Frontend field names
        name: values.name,
        material_type: values.material,
        thickness: values.thickness,
        length: values.length || 0,
        price: values.price || 0,
      };

      // Update product
      await updateProduct(product.id, productData);

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  // Helper function to safely format price
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "0.00 DT";

    // Convert to number if it's a string
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;

    // Check if it's a valid number
    if (isNaN(numericPrice)) return "0.00 DT";

    // Format the price
    return numericPrice.toFixed(2) + " DT";
  };

  // Material type color mapping
  const getMaterialColor = (material) => {
    const colors = {
      inox: "blue",
      fer: "volcano",
      aluminium: "green",
      cuivre: "orange",
      laiton: "gold",
    };
    return colors[material] || "default";
  };

  // Render the product edit form
  const renderEditForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        name: product.name,
        material: product.material_type,
        thickness: product.thickness,
        length: product.length,
        surface: product.surface,
        price: product.price,
        description: product.description,
      }}
    >
      <Form.Item
        name="name"
        label="Nom du produit"
        rules={[
          { required: true, message: "Le nom du produit est obligatoire" },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="material"
        label="Type de matériau"
        rules={[
          { required: true, message: "Le type de matériau est obligatoire" },
        ]}
      >
        <Select>
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
        <Space style={{ display: "flex", flexWrap: "wrap" }}>
          <Form.Item
            name="thickness"
            label="Épaisseur (mm)"
            rules={[{ required: true, message: "L'épaisseur est obligatoire" }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber min={0.1} step={0.1} />
          </Form.Item>

          <Form.Item
            name="length"
            label="Longueur (mm)"
            style={{ marginBottom: 0 }}
          >
            <InputNumber min={0} step={1} />
          </Form.Item>

          <Form.Item
            name="surface"
            label="Surface (m²)"
            rules={[{ required: true, message: "La surface est obligatoire" }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber min={0.01} step={0.01} />
          </Form.Item>
        </Space>
      </Form.Item>

      <Form.Item name="price" label="Prix (DT)">
        <InputNumber min={0} step={0.01} />
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

  // Render product details
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
            alt={product.name}
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
          {product.name}
        </Typography.Title>

        <Space>
          <Tag color={getMaterialColor(product.material_type)}>
            {product.material_type}
          </Tag>
          {product.price > 0 && (
            <Tag color="green">{formatPrice(product.price)}</Tag>
          )}
        </Space>

        <Space style={{ marginTop: 8 }}>
          <Text type="secondary">Épaisseur: </Text>
          <Text strong>{product.thickness} mm</Text>

          {product.length > 0 && (
            <>
              <Text type="secondary">Longueur: </Text>
              <Text strong>{product.length} mm</Text>
            </>
          )}

          <Text type="secondary">Surface: </Text>
          <Text strong>{product.surface} m²</Text>
        </Space>

        {product.description && (
          <Paragraph
            ellipsis={{ rows: 3, expandable: true, symbol: "plus" }}
            style={{ marginTop: 8 }}
          >
            {product.description}
          </Paragraph>
        )}

        {product.created_at && (
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Créé le {product.created_at.toLocaleDateString()}
          </Text>
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
          <DeleteOutlined key="delete" onClick={handleDeleteClick} />,
        ]}
      >
        {isEditing ? renderEditForm() : renderProductDetails()}
      </Card>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        title="Confirmation de suppression"
        open={showDeleteConfirm}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Oui, supprimer"
        cancelText="Annuler"
        okType="danger"
        centered
      >
        <Space>
          <ExclamationCircleOutlined
            style={{ color: "#ff4d4f", fontSize: "22px" }}
          />
          <div>
            <p>
              <strong>Êtes-vous sûr de vouloir supprimer ce produit ?</strong>
            </p>
            <p>Cette action est irréversible.</p>
            <p style={{ color: "#666" }}>Produit: {product.name}</p>
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default ProductCard;
