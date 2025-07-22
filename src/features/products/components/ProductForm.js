import React, { useState, useEffect } from "react";
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
  Row,
  Col,
  Tooltip,
  Progress,
  Badge,
} from "antd";
import {
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  CameraOutlined,
  TagOutlined,
  ColumnHeightOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useProducts } from "../contexts/ProductContext";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

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
  const [formProgress, setFormProgress] = useState(0);

  // Calcul du progrès du formulaire
  const calculateProgress = () => {
    const values = form.getFieldsValue();
    const requiredFields = ['name'];
    const optionalFields = ['code_produit', 'material', 'thickness', 'length', 'width', 'surface', 'price', 'description'];
    
    let filledRequired = 0;
    let filledOptional = 0;

    requiredFields.forEach(field => {
      if (values[field] && values[field].toString().trim()) filledRequired++;
    });

    optionalFields.forEach(field => {
      if (values[field] && values[field].toString().trim()) filledOptional++;
    });

    const progress = ((filledRequired / requiredFields.length) * 60) + 
                    ((filledOptional / optionalFields.length) * 30) + 
                    (imagePreview ? 10 : 0);
    
    setFormProgress(Math.min(100, progress));
  };

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
      calculateProgress();
    } else {
      form.resetFields();
      setImagePreview(null);
      setFileList([]);
      setFormProgress(0);
    }
  }, [productToEdit, form]);

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result);
          calculateProgress();
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(newFileList[0].url || newFileList[0].thumbUrl);
        calculateProgress();
      }
    } else {
      setImagePreview(null);
      calculateProgress();
    }
  };

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList || []);

  const onlyNumbersAndDot = (e) => {
    const allowed = [
      "Backspace",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Delete",
      ...Array.from({ length: 10 }, (_, i) => `${i}`),
      ".",
    ];
    if (!allowed.includes(e.key) && !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  };

  const handlePasteNumbersOnly = (e) => {
    const value = e.clipboardData.getData("text");
    if (!/^\d*\.?\d*$/.test(value)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const changedFields = {};

      if (productToEdit && productToEdit.id) {
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
        if ((values.width || 0) !== productToEdit.largeur)
          changedFields.largeur = values.width || 0;
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
          changedFields.image = "";
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
          image: imageData ?? null,
        };

        await addProduct(productPayload);
        message.success("Produit ajouté avec succès");
        form.resetFields();
        setFileList([]);
        setImagePreview(null);
        setFormProgress(0);
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

  const SectionCard = ({ icon, title, description, color, children }) => (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
      border: `2px solid ${color}15`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '20px' 
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          backgroundColor: color,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 12px ${color}25`
        }}>
          {React.cloneElement(icon, { 
            style: { color: '#ffffff', fontSize: '20px' } 
          })}
        </div>
        <div>
          <Text style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: '#1a1a1a',
            display: 'block',
            lineHeight: '1.2'
          }}>
            {title}
          </Text>
          {description && (
            <Text style={{ 
              fontSize: '13px', 
              color: '#6b7280',
              marginTop: '2px',
              display: 'block'
            }}>
              {description}
            </Text>
          )}
        </div>
        {!productToEdit && title === "Informations générales" && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text style={{ color: '#6b7280', fontSize: '12px' }}>Progression</Text>
            </div>
            <Progress 
              percent={formProgress} 
              size="small" 
              strokeColor={{
                '0%': '#ff9a56',
                '50%': '#ffad56',
                '100%': '#52c41a',
              }}
              style={{ width: '120px' }}
            />
          </div>
        )}
      </div>
      {children}
    </div>
  );

  const StyledFormItem = ({ children, ...props }) => (
    <Form.Item {...props}>
      {React.cloneElement(children, {
        ...children.props,
        style: {
          borderRadius: '10px',
          height: children.type?.displayName === 'TextArea' ? 'auto' : '44px',
          border: '2px solid #e5e7eb',
          transition: 'all 0.3s ease',
          fontSize: '15px',
          ...children.props.style
        },
        onFocus: (e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        },
        onBlur: (e) => {
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'none';
        }
      })}
    </Form.Item>
  );

  const RequiredLabel = ({ children }) => (
    <span style={{ fontWeight: '600', color: '#374151' }}>
      {children} <span style={{ color: '#ef4444' }}>*</span>
    </span>
  );

  const OptionalLabel = ({ children }) => (
    <span style={{ fontWeight: '500', color: '#374151' }}>
      {children}
    </span>
  );

  return (
    <div style={{ 
      maxHeight: '85vh', 
      overflowY: 'auto', 
      paddingRight: '12px',
     
      margin: isModal ? '-16px' : '0',
      padding: '24px'
    }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        scrollToFirstError
        onValuesChange={calculateProgress}
      >
        {/* Section Informations générales */}
        <SectionCard
          icon={<TagOutlined />}
          title="Informations générales"
          description="Nom, code et type de matériau du produit"
          color="#3b82f6"
        >
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={12}>
              <StyledFormItem
                name="name"
                label={<RequiredLabel>Nom du produit</RequiredLabel>}
                rules={[{ required: true, message: "Le nom du produit est obligatoire" }]}
              >
                <Input 
                  placeholder="🏷️ Entrez le nom du produit" 
                  prefix={<TagOutlined style={{ color: '#9ca3af' }} />}
                />
              </StyledFormItem>
            </Col>
            <Col xs={24} sm={12}>
              <StyledFormItem 
                name="code_produit" 
                label={
                  <OptionalLabel>
                    Code du produit
                    <Tooltip title="Code unique pour identifier le produit">
                      <InfoCircleOutlined style={{ marginLeft: 4, color: '#bfbfbf' }} />
                    </Tooltip>
                  </OptionalLabel>
                }
              >
                <Input 
                  placeholder="🔢 Ex: ACIER-001" 
                  prefix={<TagOutlined style={{ color: '#9ca3af' }} />}
                />
              </StyledFormItem>
            </Col>
          </Row>

          <StyledFormItem 
            name="material" 
            label={<OptionalLabel>Type de matériau</OptionalLabel>}
          >
            <Select 
              placeholder="🔧 Sélectionner un matériau" 
              allowClear
              style={{ 
                height: '44px',
              }}
            >
              <Option value="acier">🔩 Acier</Option>
              <Option value="acier_inoxydable">✨ Acier inoxydable</Option>
              <Option value="aluminium">⚡ Aluminium</Option>
              <Option value="laiton">🟡 Laiton</Option>
              <Option value="cuivre">🟠 Cuivre</Option>
              <Option value="acier_galvanise">🛡️ Acier galvanisé</Option>
              <Option value="autre">❓ Autre</Option>
            </Select>
          </StyledFormItem>
        </SectionCard>

        {/* Section Dimensions */}
        <SectionCard
          icon={<ColumnHeightOutlined />}
          title="Dimensions & Spécifications"
          description="Mesures précises du produit en millimètres"
          color="#10b981"
        >
          <Row gutter={[20, 0]}>
            <Col xs={12} sm={6}>
              <Form.Item 
                name="thickness" 
                label={<OptionalLabel>Épaisseur (mm)</OptionalLabel>}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ 
                    width: "100%", 
                    height: '44px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px'
                  }}
                  onKeyDown={onlyNumbersAndDot}
                  onPaste={handlePasteNumbersOnly}
                  placeholder="📏 1.5"
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item 
                name="length" 
                label={<OptionalLabel>Longueur (mm)</OptionalLabel>}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ 
                    width: "100%", 
                    height: '44px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px'
                  }}
                  onKeyDown={onlyNumbersAndDot}
                  onPaste={handlePasteNumbersOnly}
                  placeholder="📐 1000"
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item 
                name="width" 
                label={<OptionalLabel>Largeur (mm)</OptionalLabel>}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ 
                    width: "100%", 
                    height: '44px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px'
                  }}
                  onKeyDown={onlyNumbersAndDot}
                  onPaste={handlePasteNumbersOnly}
                  placeholder="📏 500"
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item 
                name="surface" 
                label={<OptionalLabel>Surface (m²)</OptionalLabel>}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ 
                    width: "100%", 
                    height: '44px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px'
                  }}
                  onKeyDown={onlyNumbersAndDot}
                  onPaste={handlePasteNumbersOnly}
                  placeholder="📐 2.5"
                />
              </Form.Item>
            </Col>
          </Row>
        </SectionCard>

        {/* Section Prix et Description */}
        <SectionCard
          icon={<DollarOutlined />}
          title="Prix & Description"
          description="Informations commerciales du produit"
          color="#f59e0b"
        >
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item 
                name="price" 
                label={<OptionalLabel>Prix </OptionalLabel>}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ 
                    width: "100%", 
                    height: '44px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px'
                  }}
                  onKeyDown={onlyNumbersAndDot}
                  onPaste={handlePasteNumbersOnly}
                  placeholder="💰 100.00"
                 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="description" 
            label={<OptionalLabel>Description</OptionalLabel>}
          >
            <TextArea
              rows={5}
              placeholder="📝 Description détaillée du produit..."
              showCount
              maxLength={500}
              style={{ 
                borderRadius: '12px',
                resize: 'none',
                border: '2px solid #e5e7eb',
                fontSize: '15px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Item>
        </SectionCard>

        {/* Section Image */}
        <SectionCard
          icon={<CameraOutlined />}
          title="Image du produit"
          description="Formats supportés: JPG, PNG • Taille max: 5MB"
          color="#722ed1"
        >
        <Form.Item
  name="upload"
  valuePropName="fileList"
  getValueFromEvent={normFile}
>
  <Upload
    listType="picture-card"
    fileList={fileList}
    onChange={handleUploadChange}
    beforeUpload={() => false}
    maxCount={1}
    accept="image/png,image/jpeg,image/jpg,image/webp"
    className="custom-upload"
  >
    {fileList.length < 1 && (
      <div className="upload-content">
        
        <div className="upload-text">
          📸 Ajouter une image 
        </div>
     
      </div>
    )}
  </Upload>
</Form.Item>

{/* CSS à ajouter */}
<style jsx>{`
  .custom-upload .ant-upload-select {
    background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
    border: 2px dashed #d9d9d9;
    border-radius: 12px;
    transition: all 0.3s ease;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .custom-upload .ant-upload-select:hover {
    border-color: #722ed1;
    background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(114, 46, 209, 0.15);
  }

  .upload-content {
    text-align: center;
    padding: 20px;
  }

  .upload-icon {
    font-size: 24px;
    color: #722ed1;
    margin-bottom: 12px;
    transition: transform 0.2s ease;
  }

  .custom-upload .ant-upload-select:hover .upload-icon {
    transform: scale(1.1);
  }

  .upload-text {
    color: #722ed1;
    font-weight: 500;
    font-size: 16px;
    margin-bottom: 4px;
  }

  .upload-hint {
    color: #8c8c8c;
    font-size: 12px;
    margin-top: 4px;
  }

  .custom-upload .ant-upload-list-picture-card-container {
    width: 100%;
  }

  .custom-upload .ant-upload-list-picture-card .ant-upload-list-item {
    border-radius: 12px;
  }
`}</style>
          {imagePreview && (
            <div style={{ 
              textAlign: "center", 
              marginTop: '24px',
              padding: '20px',
              background: 'linear-gradient(135deg, #fafafa, #f5f5f5)',
              borderRadius: '16px',
            }}>
              <Badge 
                status="success" 
                text={
                  <span style={{ color: '#52c41a', fontWeight: 500 }}>
                    <CheckCircleOutlined /> Image ajoutée avec succès
                  </span>
                }
                style={{ marginBottom: '16px', display: 'block' }}
              />
              <img
                src={imagePreview}
                alt="Aperçu du produit"
                style={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  borderRadius: 16,
                  objectFit: "contain",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  border: '4px solid white',
                }}
              />
            </div>
          )}
        </SectionCard>

        {/* Actions */}
        <div style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            alignItems: 'center'
          }}>
            {onCancel && (
              <Button 
                onClick={onCancel}
                size="large"
                style={{
                  borderRadius: '10px',
                  height: '48px',
                  padding: '0 28px',
                  border: '2px solid #e5e7eb',
                  color: '#6b7280',
                  fontWeight: 600,
                  fontSize: '15px',
                  minWidth: '120px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.color = '#6b7280';
                }}
              >
                ❌ Annuler
              </Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                borderRadius: '10px',
                height: '48px',
                padding: '0 32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)',
                minWidth: '140px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.25)';
              }}
            >
              {productToEdit ? "✅ Mettre à jour" : "➕ Créer le produit"}
            </Button>
          </div>
          
          <div style={{
            marginTop: '16px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '13px',
            fontStyle: 'italic'
          }}>
            💡 Les champs marqués d'un * sont obligatoires
          </div>
        </div>
      </Form>
    </div>
  );
};

export default ProductForm;