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
  const { client_id } = useParams();
  const location = useLocation();
  const client_name = location.state?.client_name || 'Client';

  const [materials, set_materials] = useState([]);
  const [loading, set_loading] = useState(false);
  const [is_modal_visible, set_is_modal_visible] = useState(false);
  const [editing_material, set_editing_material] = useState(null);
  const [form] = Form.useForm();

  // Material types options
  const material_types = [
    { value: "acier", label: "Acier" },
    { value: "acier_inoxydable", label: "Acier inoxydable" },
    { value: "aluminium", label: "Aluminium" },
    { value: "laiton", label: "Laiton" },
    { value: "cuivre", label: "Cuivre" },
    { value: "acier_galvanise", label: "Acier galvanisé" },
    { value: "autre", label: "Autre" },
  ];
  
  // Function to get readable material type label
  const getMaterialTypeLabel = (type) => {
    const materialType = material_types.find(item => item.value === type);
    return materialType ? materialType.label : type;
  };

  // Fetch client materials
  useEffect(() => {
    const fetch_materials = async () => {
      set_loading(true);
      try {
        const response = await RawMaterialService.get_materials_by_client_id(client_id);
        // Transform the data to display formatted material types
        const formattedMaterials = response.map(material => ({
          ...material,
          display_type: getMaterialTypeLabel(material.type_matiere)
        }));
        set_materials(formattedMaterials);
        set_loading(false);
      } catch (error) {
        console.error('Error fetching materials:', error);
        notification.error({
          message: 'Erreur',
          description: 'Impossible de récupérer la liste des matières premières.'
        });
        set_loading(false);
      }
    };

    if (client_id) {
      fetch_materials();
    }
  }, [client_id]);

  // Table columns
  const columns = [
    {
      title: 'N° Bon de livraison',
      dataIndex: 'delivery_note',
      key: 'delivery_note',
    },
    {
      title: 'Date de réception',
      dataIndex: 'reception_date',
      key: 'reception_date',
    },
    {
      title: 'Type de matériau',
      dataIndex: 'type_matiere',
      key: 'type_matiere',
      render: (type) => getMaterialTypeLabel(type),
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
      dataIndex: 'quantite',
      key: 'quantite',
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
          <Button type="link" onClick={() => handle_edit(record)}>Modifier</Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette matière première?"
            onConfirm={() => handle_delete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="link" danger>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handle_edit = (material) => {
    set_editing_material(material);
    form.setFieldsValue({
      ...material,
      reception_date: moment(material.reception_date)
    });
    set_is_modal_visible(true);
  };

  const handle_delete = async (id) => {
    try {
      await RawMaterialService.delete_material(id);
      set_materials(materials.filter(material => material.id !== id));
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
  const handle_submit = async (values) => {
    try {
      let new_material;
      // Convert client_id to integer explicitly
      const client_id_int = parseInt(client_id, 10);
      
      if (editing_material) {
        // Update existing material
        new_material = await RawMaterialService.update_material(editing_material.id, {
          ...values,
          reception_date: values.reception_date.format('YYYY-MM-DD'),
          client_id: client_id_int  // Explicitly set client_id as integer
        });
        // Add display_type for the updated material
        new_material.display_type = getMaterialTypeLabel(new_material.type_matiere);
        set_materials(materials.map(material => 
          material.id === editing_material.id ? new_material : material
        ));
        notification.success({
          message: 'Succès',
          description: 'Matière première modifiée avec succès.'
        });
      } else {
        // Add new material
        new_material = await RawMaterialService.add_material_to_client(client_id_int, {
          ...values,
          reception_date: values.reception_date.format('YYYY-MM-DD'),
          client_id: client_id_int  // Explicitly set client_id as integer
        });
        // Add display_type for the new material
        new_material.display_type = getMaterialTypeLabel(new_material.type_matiere);
        set_materials([...materials, new_material]);
        notification.success({
          message: 'Succès',
          description: 'Matière première ajoutée avec succès.'
        });
      }
      
      set_is_modal_visible(false);
      form.resetFields();
      set_editing_material(null);
    } catch (error) {
      console.error('Error saving material:', error);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de sauvegarder la matière première.'
      });
    }
  };

  const handle_cancel = () => {
    set_is_modal_visible(false);
    form.resetFields();
    set_editing_material(null);
  };

  return (
    <div className="client-materials-container">
      <Card>
        <div className="client-header">
          <Title level={2}>Matières Premières Client</Title>
          <div className="client-info">
            <Text strong>Nom du client: </Text>
            <Text>{client_name || 'N/A'}</Text>
            <Divider type="vertical" />
            <Text strong>ID Client: </Text>
            <Text>{client_id || 'N/A'}</Text>
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
            onClick={() => set_is_modal_visible(true)}
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
        title={editing_material ? "Modifier une matière première" : "Réception de matière première client"}
        open={is_modal_visible}
        onCancel={handle_cancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handle_submit}
        >
          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Informations client</Title>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label="Nom du client"
                style={{ flex: 1 }}
              >
                <Input value={client_name} disabled />
              </Form.Item>
              <Form.Item
                label="ID Client"
                style={{ flex: 1 }}
              >
                <Input value={client_id} disabled />
              </Form.Item>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Title level={4}>Informations livraison</Title>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="delivery_note"
                label="N° Bon de livraison"
                rules={[{ required: true, message: 'Veuillez saisir le numéro de bon de livraison' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Ex: BL-2023-001" />
              </Form.Item>
              <Form.Item
                name="reception_date"
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
                  {material_types.map(type => (
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
                name="quantite"
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
              <Button onClick={handle_cancel}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit">
                {editing_material ? 'Mettre à jour' : 'Enregistrer'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientRawMaterialsPage;
