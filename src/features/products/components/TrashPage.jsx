import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  message,
  Popconfirm,
  Empty,
  Spin,
  Tag,
  Image,
  Row,
  Col
} from 'antd';
import {
  RedoOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClearOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ProductService from '../services/ProductService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import './TrashPage.css';

// Configuration de dayjs
dayjs.extend(relativeTime);
dayjs.locale('fr');

const { Title, Text } = Typography;
const { confirm } = Modal;

const TrashPage = () => {
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState({});
  const [permanentDeleting, setPermanentDeleting] = useState({});
  const navigate = useNavigate();

  // Charger les produits supprimés
  const fetchDeletedProducts = async () => {
    setLoading(true);
    try {
      const data = await ProductService.getDeletedProducts();
      setDeletedProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Erreur lors du chargement de la corbeille');
      console.error('Error fetching deleted products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedProducts();
  }, []);

  // Restaurer un produit
  const handleRestore = async (productId, productName) => {
    setRestoring(prev => ({ ...prev, [productId]: true }));
    try {
      await ProductService.restoreProduct(productId);
      message.success(`Produit "${productName}" restauré avec succès`);
      // Retirer le produit de la liste
      setDeletedProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      message.error('Erreur lors de la restauration du produit');
      console.error('Error restoring product:', error);
    } finally {
      setRestoring(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Suppression définitive d'un produit
  const handlePermanentDelete = async (productId, productName) => {
    setPermanentDeleting(prev => ({ ...prev, [productId]: true }));
    try {
      await ProductService.permanentDeleteProduct(productId);
      message.success(`Produit "${productName}" supprimé définitivement`);
      // Retirer le produit de la liste
      setDeletedProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      message.error('Erreur lors de la suppression définitive du produit');
      console.error('Error permanently deleting product:', error);
    } finally {
      setPermanentDeleting(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Vider complètement la corbeille
  const handleEmptyTrash = () => {
    if (deletedProducts.length === 0) {
      message.info('La corbeille est déjà vide');
      return;
    }

    confirm({
      title: 'Vider la corbeille ?',
      icon: <ExclamationCircleOutlined />,
      content: `Êtes-vous sûr de vouloir supprimer définitivement tous les ${deletedProducts.length} produits de la corbeille ? Cette action est irréversible.`,
      okText: 'Oui, vider',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        setLoading(true);
        try {
          await ProductService.emptyTrash();
          message.success('Corbeille vidée avec succès');
          setDeletedProducts([]);
        } catch (error) {
          message.error('Erreur lors du vidage de la corbeille');
          console.error('Error emptying trash:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Configuration des colonnes du tableau
  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image) => (
        <div style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {image ? (
            <Image
              src={image}
              alt="Produit"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                borderRadius: '8px' 
              }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN..."
            />
          ) : (
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}
            >
              N/A
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Nom du produit',
      dataIndex: 'nom_produit',
      key: 'nom_produit',
      ellipsis: true,
      width: 200,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Code',
      dataIndex: 'ref_produit',
      key: 'ref_produit',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Type de matière',
      dataIndex: 'materiau',
      key: 'materiau',
      width: 150,
      render: (type) => {
        const colors = {
          acier: 'red',
          acier_inoxydable: 'blue',
          aluminium: 'green',
          laiton: 'orange',
          cuivre: 'gold',
          acier_galvanise: 'purple',
          autre: 'gray'
        };
        return <Tag color={colors[type] || 'gray'}>{type}</Tag>;
      }
    },
    {
      title: 'Prix',
      dataIndex: 'prix_unitaire',
      key: 'prix_unitaire',
      width: 120,
      render: (prix) => prix ? `${prix.toFixed(2)} ` : 'N/A'
    },

    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<RedoOutlined />}
            onClick={() => handleRestore(record.id, record.nom_produit)}
            loading={restoring[record.id]}
            size="small"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Restaurer
          </Button>
          
          <Popconfirm
            title="Suppression définitive"
            description={`Êtes-vous sûr de vouloir supprimer définitivement "${record.nom_produit}" ? Cette action est irréversible.`}
            onConfirm={() => handlePermanentDelete(record.id, record.nom_produit)}
            okText="Oui, supprimer"
            cancelText="Annuler"
            okType="danger"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={permanentDeleting[record.id]}
              size="small"
            >
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{ borderRadius: '8px' }}
              >
                Retour
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                Corbeille ({deletedProducts.length})
              </Title>
            </Space>
          </Col>
          
          <Col>
            <Button
              danger
              icon={<ClearOutlined />}
              onClick={handleEmptyTrash}
              disabled={deletedProducts.length === 0}
              style={{ borderRadius: '8px' }}
            >
              Vider la corbeille
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Chargement de la corbeille...</Text>
            </div>
          </div>
        ) : deletedProducts.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                La corbeille est vide
                <br />
                <Text type="secondary">Les produits supprimés apparaîtront ici</Text>
              </span>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={deletedProducts}
            rowKey="id"
            pagination={{
              total: deletedProducts.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} sur ${total} produits supprimés`,
            }}
          
            style={{ borderRadius: '8px' }}
          />
        )}
      </Card>
    </div>
  );
};

export default TrashPage;