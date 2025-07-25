import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message, Typography, Space } from "antd";
import OrderService from "../../services/OrderService";
import { RollbackOutlined, DeleteOutlined } from "@ant-design/icons";

const TrashOrders = () => {
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeletedOrders = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getDeletedOrders();
      setDeletedOrders(data);
    } catch (error) {
      message.error("Erreur lors du chargement des commandes supprimées");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      await OrderService.restoreOrder(id);
      message.success("Commande restaurée !");
      fetchDeletedOrders();
    } catch (error) {
      message.error("Échec de la restauration");
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await OrderService.deleteOrder(id);
      message.success("Commande supprimée définitivement !");
      fetchDeletedOrders();
    } catch (error) {
      message.error("Échec de la suppression");
    }
  };

  useEffect(() => {
    fetchDeletedOrders();
  }, []);

  const columns = [
    {
      title: "Numéro",
      dataIndex: "numero_commande",
      key: "numero_commande",
    },
    {
      title: "Client",
      dataIndex: ["client", "nom_client"],
      key: "client",
    },
    {
      title: "Date commande",
      dataIndex: "date_commande",
      key: "date_commande",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            icon={<RollbackOutlined />}
            onClick={() => handleRestore(record.id)}
          >
            Restaurer
          </Button>
          <Popconfirm
            title="Supprimer définitivement ?"
            onConfirm={() => handlePermanentDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button danger icon={<DeleteOutlined />}>
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3}>Corbeille des Commandes</Typography.Title>
      <Table
        columns={columns}
        dataSource={deletedOrders}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
};

export default TrashOrders;
