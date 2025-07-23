// TrashModal.jsx - Nouveau composant pour gérer la corbeille
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  Image,
  Typography,
  Tag,
  Popconfirm,
  message,
  Empty,
  Tooltip
} from 'antd';
import {
  RollbackOutlined, // ← icône alternative valide
  DeleteOutlined,
  ClearOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

import { useProducts } from '../contexts/ProductContext';

const { Text } = Typography;

const TrashModal = ({ visible, onClose }) => {
  const { restoreProduct, permanentDeleteProduct, emptyTrash } = useProducts();
  const [trashedProducts, setTrashedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fonction pour récupérer les produits supprimés
  const fetchTrashedProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/produits/trash/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrashedProducts(data);
      } else {
        message.error('Erreur lors du chargement de la corbeille');
      }
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors du chargement de la corbeille');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchTrashedProducts();
    }
  }, [visible]);

  const handleRestore = async (productId) => {
    try {
      await restoreProduct(productId);
      message.success('Produit restauré avec succès');
      fetchTrashedProducts(); // Recharger la liste
    } catch (error) {
      message.error('Erreur lors de la restauration');
    }
  };

  const handlePermanentDelete = async (productId) => {
    try {
      await permanentDeleteProduct(productId);
      message.success('Produit supprimé définitivement');
      fetchTrashedProducts(); // Recharger la liste
    } catch (error) {
      message.error('Erreur lors de la suppression définitive');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash();
      message.success('Corbeille vidée avec succès');
      setTrashedProducts([]);
    } catch (error) {
      message.error('Erreur lors du vidage de la corbeille');
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

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image, record) => (
        <div style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {image ? (
            <Image
              width={60}
              height={60}
              src={image}
              alt={record.nom_produit}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={false}
            />
          ) : (
            <div
              style={{
                width: 60,
                height: 60,
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4
              }}
            >
              <Text type="secondary" style={{ fontSize: 10 }}>Pas d'image</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Nom du produit',
      dataIndex: 'nom_produit',
      key: 'nom_produit',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.code_produit}
          </Text>
        </div>
      ),
    },
    {
      title: 'Matériau',
      dataIndex: 'type_matiere',
      key: 'type_matiere',
      render: (material) => (
        <Tag color={getMaterialColor(material)}>
          {material}
        </Tag>
      ),
    },
    {
      title: 'Prix',
      dataIndex: 'prix',
      key: 'prix',
      render: (price) => (
        <Tag color="green">{formatPrice(price)}</Tag>
      ),
    },
    {
      title: 'Supprimé le',
      dataIndex: 'deleted_at',
      key: 'deleted_at',
      render: (date) => (
        <Text type="secondary">
          {new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Restaurer">
            <Button
              type="primary"
              icon={<RollbackOutlined  />}
              size="small"
              onClick={() => handleRestore(record.id)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            />
          </Tooltip>
          <Popconfirm
            title="Suppression définitive"
            description="Êtes-vous sûr de vouloir supprimer définitivement ce produit ?"
            onConfirm={() => handlePermanentDelete(record.id)}
            okText="Supprimer"
            cancelText="Annuler"
            okType="danger"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Tooltip title="Supprimer définitivement">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DeleteOutlined />
          <span>Corbeille ({trashedProducts.length} produits)</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Space key="actions">
          {trashedProducts.length > 0 && (
            <Popconfirm
              title="Vider la corbeille"
              description="Êtes-vous sûr de vouloir supprimer définitivement tous les produits de la corbeille ?"
              onConfirm={handleEmptyTrash}
              okText="Vider"
              cancelText="Annuler"
              okType="danger"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            >
              <Button
                danger
                icon={<ClearOutlined />}
              >
                Vider la corbeille
              </Button>
            </Popconfirm>
          )}
          <Button onClick={onClose}>
            Fermer
          </Button>
        </Space>
      ]}
    >
      {trashedProducts.length === 0 ? (
        <Empty
          description="Aucun produit dans la corbeille"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={trashedProducts}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} sur ${total} produits`,
          }}
          scroll={{ x: 800 }}
        />
      )}
    </Modal>
  );
};

export default TrashModal;