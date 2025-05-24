import React, { useState, useEffect } from "react"; // Import useEffect
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Upload,
  message,
  Typography,
  Card,
  Space,
  Divider,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  PlusOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useProducts } from "../contexts/ProductContext";

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

// Accept productToEdit prop for modification scenarios
const ProductForm = ({
  onSuccess,
  onCancel,
  isModal = false,
  productToEdit = null,
}) => {
  const [form] = Form.useForm();
  // Assuming useProducts provides addProduct and updateProduct
  const { addProduct, updateProduct } = useProducts();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (productToEdit) {
      // Populate form fields from productToEdit
      form.setFieldsValue({
        name: productToEdit.nom_produit,
        material: productToEdit.type_matiere,
        thickness: productToEdit.epaisseur,
        length: productToEdit.longueur,
        surface: productToEdit.surface,
        price: productToEdit.prix,
        description: productToEdit.description,
        // The 'upload' field for Form.Item is controlled by fileList state below
      });

      // Initialize image preview and fileList if an image exists
      if (productToEdit.image) {
        setImagePreview(productToEdit.image);
        setFileList([
          {
            uid: productToEdit.id || "-1", // Use a unique ID, like product ID
            name: "existing_image.png", // Placeholder name, or derive from URL
            status: "done", // Important for Ant Design Upload to show it as an existing file
            url: productToEdit.image, // The URL of the existing image
          },
        ]);
      } else {
        setImagePreview(null);
        setFileList([]); // Ensure fileList is empty if no initial image
      }
    } else {
      // Reset form for adding a new product (if not editing)
      form.resetFields();
      setImagePreview(null);
      setFileList([]);
    }
  }, [productToEdit, form]); // Rerun effect if productToEdit or form instance changes

  // Handle file upload
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);

    // Generate preview for the first file
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj; // This is a File object for new uploads
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result); // Show base64 preview for new files
        reader.readAsDataURL(file);
      } else {
        // If not a new file, it might be the initially loaded one with a URL
        setImagePreview(newFileList[0].url || newFileList[0].thumbUrl);
      }
    } else {
      setImagePreview(null); // No file in uploader (cleared by user)
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

      if (productToEdit && productToEdit.id) {
        // This is an update operation - only send changed fields
        const changedFields = {};

        console.log("=== UPDATE PRODUCT DEBUG ===");
        console.log("productToEdit:", productToEdit);
        console.log("fileList:", fileList);
        console.log("imagePreview:", imagePreview);
        console.log("form values:", values);

        // Check each field for changes
        if (values.name !== productToEdit.nom_produit) {
          changedFields.nom_produit = values.name;
        }
        if (values.material !== productToEdit.type_matiere) {
          changedFields.type_matiere = values.material;
        }
        if (values.thickness !== productToEdit.epaisseur) {
          changedFields.epaisseur = values.thickness;
        }
        if ((values.length || 0) !== productToEdit.longueur) {
          changedFields.longueur = values.length || 0;
        }
        if (values.surface !== productToEdit.surface) {
          changedFields.surface = values.surface;
        }
        if ((values.price || 0) !== productToEdit.prix) {
          changedFields.prix = values.price || 0;
        }
        if ((values.description || "") !== productToEdit.description) {
          changedFields.description = values.description || "";
        }

        console.log("Changed fields before image handling:", changedFields);

        // Handle image changes more carefully
        console.log("=== IMAGE HANDLING LOGIC ===");
        console.log("fileList.length:", fileList.length);
        console.log("productToEdit.image:", productToEdit.image);

        if (fileList.length > 0) {
          const currentFile = fileList[0];
          console.log("currentFile:", currentFile);
          console.log("currentFile.originFileObj:", currentFile.originFileObj);
          console.log("currentFile.url:", currentFile.url);

          if (currentFile.originFileObj) {
            console.log("NEW FILE UPLOAD DETECTED - Converting to base64");
            // New file uploaded - convert to base64
            changedFields.image = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = (e) => reject(e);
              reader.readAsDataURL(currentFile.originFileObj);
            });
            console.log(
              "Image converted to base64, length:",
              changedFields.image?.length
            );
          } else {
            console.log("EXISTING IMAGE DETECTED - No change needed");
            // If it's an existing image (currentFile.url is present, no originFileObj),
            // don't add image to changedFields - this means no change to the image
          }
        } else if (productToEdit.image) {
          console.log("IMAGE REMOVED - Setting to null");
          // Image was removed (fileList is empty, but there was an image initially)
          changedFields.image = null;
        } else {
          console.log("NO IMAGE - No action needed");
        }

        console.log("Changed fields after image handling:", changedFields);

        // Safeguard: If changedFields.image somehow equals the original image URL,
        // it means no actual change was made, so remove it from the payload
        if (
          changedFields.hasOwnProperty("image") &&
          changedFields.image === productToEdit.image &&
          (!fileList.length || !fileList[0]?.originFileObj)
        ) {
          console.log(
            "SAFEGUARD TRIGGERED - Removing unchanged image from payload"
          );
          console.log(
            "changedFields.image === productToEdit.image:",
            changedFields.image === productToEdit.image
          );
          console.log(
            "No new file upload detected, removing image from payload"
          );
          delete changedFields.image;
        }

        console.log("=== FINAL PAYLOAD ===");
        console.log("Sending changed fields:", changedFields);
        console.log(
          "Number of changed fields:",
          Object.keys(changedFields).length
        );

        // Only make the API call if there are actual changes
        if (Object.keys(changedFields).length > 0) {
          await updateProduct(productToEdit.id, changedFields);
          message.success("Produit modifié avec succès");
        } else {
          message.info("Aucune modification détectée");
        }
      } else {
        // This is an add operation - send all required fields
        let imageData = null;
        if (fileList.length > 0) {
          const currentFile = fileList[0];
          if (currentFile.originFileObj) {
            imageData = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = (e) => reject(e);
              reader.readAsDataURL(currentFile.originFileObj);
            });
          }
        }

        const productPayload = {
          nom_produit: values.name,
          type_matiere: values.material,
          epaisseur: values.thickness,
          longueur: values.length || 0,
          surface: values.surface,
          prix: values.price || 0,
          description: values.description || "",
          image: imageData,
        };

        console.log("Sending product data:", productPayload);
        await addProduct(productPayload);
        message.success("Produit ajouté avec succès");

        // Reset form for new product
        form.resetFields();
        setFileList([]);
        setImagePreview(null);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const action = productToEdit ? "modification" : "ajout";
      message.error(`Erreur lors de l'${action} du produit`);
      console.error(
        `Error ${productToEdit ? "updating" : "adding"} product:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={
        <Title level={4}>
          {productToEdit ? "Modifier le produit" : "Ajouter un nouveau produit"}
        </Title>
      }
      extra={isModal && <Button icon={<CloseOutlined />} onClick={onCancel} />}
      style={{ width: "100%" }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        // initialValues prop could also be used if productToEdit is transformed,
        // but useEffect provides more control for side effects like setting fileList.
      >
        <Form.Item
          name="name"
          label="Nom du produit"
          rules={[
            { required: true, message: "Le nom du produit est obligatoire" },
          ]}
        >
          <Input placeholder="Nom du produit" />
        </Form.Item>

        <Form.Item
          name="material"
          label="Type de matériau"
          rules={[
            { required: true, message: "Le type de matériau est obligatoire" },
          ]}
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

        <Space style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <Form.Item
            name="thickness"
            label="Épaisseur (mm)"
            rules={[{ required: true, message: "L'épaisseur est obligatoire" }]}
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
            rules={[{ required: true, message: "La surface est obligatoire" }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber min={0.01} step={0.01} style={{ width: 160 }} />
          </Form.Item>
        </Space>

        <Divider />

        <Form.Item name="price" label="Prix (DT)">
          <InputNumber
            min={0}
            step={0.01}
            formatter={(value) => `${value} DT`}
            parser={(value) => value.replace(" DT", "")}
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea
            rows={4}
            placeholder="Description détaillée du produit"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="upload" // This name should match if using form.setFieldsValue for 'upload'
          label="Image du produit"
          valuePropName="fileList" // Tells Form.Item to use 'fileList' for value and onChange
          getValueFromEvent={normFile} // Normalizes event from Upload component
        >
          <Upload
            listType="picture-card"
            fileList={fileList} // Controlled by component state
            onChange={handleUploadChange}
            beforeUpload={() => false} // Prevent auto upload, handle manually
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
              maxWidth: "100%",
              maxHeight: "200px",
              marginBottom: 16,
              objectFit: "contain",
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
            {productToEdit ? "Modifier le produit" : "Ajouter le produit"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProductForm;
