import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  InputNumber, 
  Select, 
  Divider, 
  Space, 
  notification,
  Popconfirm
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import RawMaterialService from '../services/RawMaterialService';
import moment from 'moment';
import { useParams, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const ClientRawMaterialsPage = () => {
  const { clientId } = useParams();
  const location = useLocation();
  const clientName = location.state?.clientName || 'Client';

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [form] = Form.useForm();

  // Material types options
  const materialTypes = [
    { value: "acier", label: "Acier" },
    { value: "acier_inoxydable", label: "Acier inoxydable" },
    { value: "aluminium", label: "Aluminium" },
    { value: "laiton", label: "Laiton" },
    { value: "cuivre", label: "Cuivre" },
    { value: "acier_galvanise", label: "Acier galvanisé" },
    { value: "autre", label: "Autre" },
  ];

  // Fetch client materials
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const response = await RawMaterialService.getMaterialsByClientId(clientId);
        setMaterials(response);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching materials:', error);
        notification.error({
          message: 'Erreur',
          description: 'Impossible de récupérer la liste des matières premières.'
        });
        setLoading(false);
      }
    };

    if (clientId) {
      fetchMaterials();
    }
  }, [clientId]);

  // Table columns
  const columns = [
    {
      title: 'N° Bon de livraison',
      dataIndex: 'deliveryNote',
      key: 'deliveryNote',
    },
    {
      title: 'Date de réception',
      dataIndex: 'receptionDate',
      key: 'receptionDate',
    },
    {
      title: 'Type de matériau',
      dataIndex: 'type_material',
      key: 'type_material',
    },
    {
      title: 'Épaisseur (mm)',
      dataIndex: 'thickness',
      key: 'thickness',
    },
    {
      title: 'Longueur (mm)',
      dataIndex: 'length',
      key: 'length',
    },
    {
      title: 'Largeur (mm)',
      dataIndex: 'width',
      key: 'width',
    },
    {
      title: 'Quantité',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => handleEdit(record)}>Modifier</Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette matière première?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="link" danger>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (material) => {
    setEditingMaterial(material);
    form.setFieldsValue({
      ...material,
      receptionDate: moment(material.receptionDate)
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await RawMaterialService.deleteMaterial(id);
      setMaterials(materials.filter(material => material.id !== id));
      notification.success({
        message: 'Succès',
        description: 'Matière première supprimée avec succès.'
      });
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: 'Impossible de supprimer la matière première.'
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      let newMaterial;
      if (editingMaterial) {
        // Update existing material
        newMaterial = await RawMaterialService.updateMaterial(editingMaterial.id, {
          ...values,
          receptionDate: values.receptionDate.format('YYYY-MM-DD')
        });
        setMaterials(materials.map(material => 
          material.id === editingMaterial.id ? newMaterial : material
        ));
        notification.success({
          message: 'Succès',
          description: 'Matière première modifiée avec succès.'
        });
      } else {
        // Add new material
        newMaterial = await RawMaterialService.addMaterialToClient(clientId, {
          ...values,
          receptionDate: values.receptionDate.format('YYYY-MM-DD')
        });
        setMaterials([...materials, newMaterial]);
        notification.success({
          message: 'Succès',
          description: 'Matière première ajoutée avec succès.'
        });
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingMaterial(null);
    } catch (error) {
      console.error('Error saving material:', error);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de sauvegarder la matière première.'
      });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingMaterial(null);
  };

  return (
    <div className="client-materials-container">
      <Card>
        <div className="client-header">
          <Title level={2}>Matières Premières Client</Title>
          <div className="client-info">
            <Text strong>Nom du client: </Text>
            <Text>{clientName || 'N/A'}</Text>
            <Divider type="vertical" />
            <Text strong>ID Client: </Text>
            <Text>{clientId || 'N/A'}</Text>
          </div>
          <Text type="secondary">
            Gestion des matières premières reçues du client pour la production
          </Text>
        </div>
        
        <Divider />
        
        <div className="materials-actions">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            style={{ marginBottom: 16 }}
          >
            Ajouter une matière première
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={materials}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal for adding or editing material */}
      <Modal
        title={editingMaterial ? "Modifier une matière première" : "Réception de matière première client"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Informations client</Title>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label="Nom du client"
                style={{ flex: 1 }}
              >
                <Input value={clientName} disabled />
              </Form.Item>
              <Form.Item
                label="ID Client"
                style={{ flex: 1 }}
              >
                <Input value={clientId} disabled />
              </Form.Item>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Informations livraison</Title>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="deliveryNote"
                label="N° Bon de livraison"
                rules={[{ required: true, message: 'Veuillez saisir le numéro de bon de livraison' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Ex: BL-2023-001" />
              </Form.Item>
              <Form.Item
                name="receptionDate"
                label="Date de réception"
                rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Caractéristiques du matériau</Title>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="type_matiere"
                label="Type de matériau"
                rules={[{ required: true, message: 'Veuillez sélectionner un type de matériau' }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="Sélectionnez un type">
                  {materialTypes.map(type => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="thickness"
                label="Épaisseur (mm)"
                rules={[{ required: true, message: 'Veuillez saisir l\'épaisseur' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={1} />
              </Form.Item>
            </div>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="length"
                label="Longueur (mm)"
                rules={[{ required: true, message: 'Veuillez saisir la longueur' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item
                name="width"
                label="Largeur (mm)"
                rules={[{ required: true, message: 'Veuillez saisir la largeur' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item
                name="quantity"
                label="Quantité"
                rules={[{ required: true, message: 'Veuillez saisir la quantité' }]}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} min={1} precision={0} />
              </Form.Item>
            </div>
            
            <Form.Item
              name="description"
              label="Description / Observations"
            >
              <Input.TextArea rows={4} placeholder="Observations supplémentaires sur la matière première..." />
            </Form.Item>
          </div>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
              <Button onClick={handleCancel}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit">
                {editingMaterial ? 'Mettre à jour' : 'Enregistrer'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientRawMaterialsPage;
