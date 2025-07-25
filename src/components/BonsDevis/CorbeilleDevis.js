import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Popconfirm,
  message,
  Card,
  Typography,
  Space,
  Empty,
  Tooltip,
} from "antd";
import {
  RollbackOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import devisService from "../../services/DevisService";

const { Title } = Typography;

const CorbeilleDevis = () => {
  const [devisSupprimes, setDevisSupprimes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Récupérer la liste des devis supprimés
  const fetchDeletedDevis = async () => {
    try {
      setLoading(true);
      const data = await devisService.getDevisSupprimes();
      setDevisSupprimes(data);
    } catch (error) {
      message.error("Erreur lors du chargement des devis supprimés");
    } finally {
      setLoading(false);
    }
  };

  // Restaurer un devis
  const handleRestore = async (id) => {
    try {
      await devisService.restoreDevis(id);
      message.success("Devis restauré avec succès");
      await fetchDeletedDevis();
    } catch (err) {
      message.error("Erreur lors de la restauration");
    }
  };

  // Suppression définitive
  const handleDeleteDefinitif = async (id) => {
    try {
      await devisService.deleteDevis(id);
      message.success("Devis supprimé définitivement");
      await fetchDeletedDevis();
    } catch (err) {
      message.error("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    fetchDeletedDevis();
  }, []);

  const columns = [
    {
      title: "Numéro",
      dataIndex: "numero_devis",
      key: "numero_devis",
    },
    {
      title: "Client",
      dataIndex: ["client", "nom_client"],
      key: "client",
    },
    {
      title: "Date émission",
      dataIndex: "date_emission",
      key: "date_emission",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Restaurer le devis">
            <Button
              icon={<RollbackOutlined />}
              type="link"
              onClick={() => handleRestore(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Supprimer définitivement ce devis ?"
            onConfirm={() => handleDeleteDefinitif(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Tooltip title="Supprimer définitivement">
              <Button icon={<DeleteOutlined />} type="link" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <InboxOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Corbeille des devis supprimés
          </Title>
        </Space>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchDeletedDevis}
          loading={loading}
        >
          Recharger
        </Button>
      }
    >
      {devisSupprimes.length === 0 ? (
        <Empty description="Aucun devis supprimé pour le moment" />
      ) : (
        <Table
          rowKey="id"
          dataSource={devisSupprimes}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 6 }}
        />
      )}
    </Card>
  );
};

export default CorbeilleDevis;
