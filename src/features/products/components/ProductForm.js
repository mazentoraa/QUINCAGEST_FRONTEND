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
// ... (importations inchangées)
//           message.error("Session expirée, veuillez vous reconnecter.");
const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const ProductForm = ({
  onSuccess,
  onCancel,
  isModal = false,
  productToEdit = null,
}) => {
  const [form] = Form.useForm();
  const { addProduct, updateProduct } = useProducts();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (productToEdit) {
      form.setFieldsValue({
        name: productToEdit.nom_produit,
        code_produit: productToEdit.code_produit,
        material: productToEdit.type_matiere,
        thickness: productToEdit.epaisseur,
        length: productToEdit.longueur,
        width: productToEdit.largeur,
        surface: productToEdit.surface,
        price: productToEdit.prix,
        description: productToEdit.description,
      });

      if (productToEdit.image) {
        setImagePreview(productToEdit.image);
        setFileList([
          {
            uid: productToEdit.id || "-1",
            name: "existing_image.png",
            status: "done",
            url: productToEdit.image,
          },
        ]);
      } else {
        setImagePreview(null);
        setFileList([]);
      }
    } else {
      form.resetFields();
      setImagePreview(null);
      setFileList([]);
    }
  }, [productToEdit, form]);

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
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

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList || []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      if (productToEdit && productToEdit.id) {
        const changedFields = {};
        if (values.name !== productToEdit.nom_produit)
          changedFields.nom_produit = values.name;
        if (values.code_produit !== productToEdit.code_produit)
          changedFields.code_produit = values.code_produit;
        if (values.material !== productToEdit.type_matiere)
          changedFields.type_matiere = values.material;
        if (values.thickness !== productToEdit.epaisseur)
          changedFields.epaisseur = values.thickness;
        if ((values.length || 0) !== productToEdit.longueur)
          changedFields.longueur = values.length || 0;
        if ((values.width || 0) !== productToEdit.largeur) {
          changedFields.largeur = values.width || 0;
        }

        if (values.surface !== productToEdit.surface)
          changedFields.surface = values.surface;
        if ((values.price || 0) !== productToEdit.prix)
          changedFields.prix = values.price || 0;
        if ((values.description || "") !== productToEdit.description)
          changedFields.description = values.description || "";

        if (fileList.length > 0) {
          const currentFile = fileList[0];
          if (currentFile.originFileObj) {
            changedFields.image = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = (e) => reject(e);
              reader.readAsDataURL(currentFile.originFileObj);
            });
          }
        } else if (productToEdit.image) {
          changedFields.image = null;
        }

        if (
          changedFields.hasOwnProperty("image") &&
          changedFields.image === productToEdit.image &&
          (!fileList.length || !fileList[0]?.originFileObj)
        ) {
          delete changedFields.image;
        }

        if (Object.keys(changedFields).length > 0) {
          await updateProduct(productToEdit.id, changedFields);
          message.success("Produit modifié avec succès");
        } else {
          message.info("Aucune modification détectée");
        }
      } else {
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
          code_produit: values.code_produit, 
          type_matiere: values.material,
          epaisseur: values.thickness,
          longueur: values.length || 0,
          largeur: values.width || 0,
          surface: values.surface,
          prix: values.price || 0,
          description: values.description || "",
          image: imageData ?? null 
        };
        console.log("Payload to send:", productPayload);


        await addProduct(productPayload);
        message.success("Produit ajouté avec succès");
        form.resetFields();
        setFileList([]);
        setImagePreview(null);
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      const action = productToEdit ? "modification" : "ajout";
      message.error(`Erreur lors de l'${action} du produit`);
      console.error(error);
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
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
          name="code_produit"
          label="Code du produit"
          rules={[]}
        >
          <Input  />
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

        <Divider orientation="left">Dimensions</Divider>

        <Space style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <Form.Item name="thickness" label="Épaisseur (mm)">
            <InputNumber min={0} step={1} style={{ width: 160 }}
            onKeyDown={(e) => {
    const allowed = [
      "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
      ...Array.from({ length: 10 }, (_, i) => `${i}`),
      "."
    ];
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
            <InputNumber min={0} step={1} style={{ width: 160 }} onKeyDown={(e) => {
    const allowed = [
      "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
      ...Array.from({ length: 10 }, (_, i) => `${i}`),
      "."
    ];
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
  }} />
          </Form.Item>

          <Form.Item name="width" label="Largeur (mm)">
            <InputNumber min={0} step={1} style={{ width: 160 }} onKeyDown={(e) => {
    const allowed = [
      "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
      ...Array.from({ length: 10 }, (_, i) => `${i}`),
      "."
    ];
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
  }} />
          </Form.Item>

          <Form.Item name="surface" label="Surface (m²)">
            <InputNumber min={0} step={1} style={{ width: 160 }} onKeyDown={(e) => {
    const allowed = [
      "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
      ...Array.from({ length: 10 }, (_, i) => `${i}`),
      "."
    ];
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
  }} />
          </Form.Item>
        </Space>

        <Divider />

        <Form.Item name="price" label="Prix">
          <InputNumber
            min={0}
            step={1}
        
            style={{ width: 200 }}
            onKeyDown={(e) => {
              const allowed = [
                "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete",
                ...Array.from({ length: 10 }, (_, i) => `${i}`),
                "."
              ];
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
