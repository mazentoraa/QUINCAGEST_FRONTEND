
 import React, { useEffect, useState, useContext } from 'react';

import {
  Table,
  Button,
  message,
  Popconfirm,
  Typography,
  Card,
  Row,
  Col,
  Space,
  Tag,
} from 'antd';
import {
  ReloadOutlined,
  RollbackOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import moment from 'moment';
import { InvoiceContext } from '../../contexts/InvoiceContext';
    import { Table, Button, message, Popconfirm, Typography, Card, Row, Col, Space, Tag } from 'antd';
    import { ReloadOutlined, RollbackOutlined, ArrowLeftOutlined } from '@ant-design/icons';
    

    const { Title } = Typography;

    export default function FactureCorbeille(props) {
        const [deletedInvoices, setDeletedInvoices] = useState([]);
        const [loading, setLoading] = useState(false);
        const [selectedRowKeys, setSelectedRowKeys] = useState([]);
        const navigate = useNavigate();
        const { nature } = useParams();
        const { fetchDeletedInvoices, restoreInvoice } = useContext(InvoiceContext);

        const currentNature = props.nature || nature || 'facture';

        const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }).format(value);
        };



const { Title } = Typography;

const NATURE_CONFIG = {
  'facture': {
    label: 'Facture',
    returnPath: '/reglements/factures',
    icon: '📄'
  },
  'avoir': {
    label: 'Avoir',
    returnPath: '/reglements/avoirs',
    icon: '📋'
  },
  'avoir-facture': {
    label: 'Avoir-Facture',
    returnPath: '/reglements/avoir-factures',
    icon: '📑'
  }
};

export default function FactureCorbeille() {
  const [deletedInvoices, setDeletedInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const navigate = useNavigate();
  const { nature } = useParams();
  const location = useLocation();
  
  const {
    fetchDeletedInvoices,
    restoreInvoice,
    permanentlyDeleteInvoice
  } = useContext(InvoiceContext);

  // Déterminer la nature depuis l'URL ou les paramètres
  const getCurrentNature = () => {
    if (nature) return nature;
    
    // Si pas de paramètre nature, déduire depuis le chemin
    const path = location.pathname;
    if (path.includes('/factures/')) return 'facture';
    if (path.includes('/avoirs/')) return 'avoir';
    if (path.includes('/avoir-factures/')) return 'avoir-facture';
    
    return 'facture'; // par défaut
  };

  const currentNature = getCurrentNature();
  const config = NATURE_CONFIG[currentNature] || NATURE_CONFIG['facture'];

  const formatCurrency = (value) =>
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(value);

  const loadDeletedInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchDeletedInvoices(currentNature);
      const invoices = Array.isArray(data) ? data : data.results || [];
      setDeletedInvoices(invoices);
      setSelectedRowKeys([]); // Reset selection
    } catch (err) {
      message.error(`Erreur lors du chargement des ${config.label}s supprimé(e)s.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      setLoading(true);
      await restoreInvoice(id, currentNature);
      message.success(`${config.label} restauré(e) avec succès.`);
      await loadDeletedInvoices();
    } catch (err) {
      message.error("Erreur lors de la restauration.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await permanentlyDeleteInvoice(id);
      message.success(`${config.label} supprimé(e) définitivement.`);
      await loadDeletedInvoices();
    } catch (err) {
      message.error("Erreur lors de la suppression définitive.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warn(`Aucun(e) ${config.label.toLowerCase()} sélectionné(e)`);
      return;
    }

    try {
      setLoading(true);
      const promises = selectedRowKeys.map(id => restoreInvoice(id, currentNature));
      await Promise.allSettled(promises);
      
      message.success(`${selectedRowKeys.length} ${config.label}(s) restaurée(s) avec succès.`);
      await loadDeletedInvoices();
    } catch (err) {
      message.error("Erreur lors de la restauration multiple.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warn(`Aucun(e) ${config.label.toLowerCase()} sélectionné(e)`);
      return;
    }

    try {
      setLoading(true);
      const promises = selectedRowKeys.map(id => permanentlyDeleteInvoice(id));
      await Promise.allSettled(promises);
      
      message.success(`${selectedRowKeys.length} ${config.label}(s) supprimée(s) définitivement.`);
      await loadDeletedInvoices();
    } catch (err) {
      message.error("Erreur lors de la suppression multiple.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedInvoices();
  }, [currentNature]);

  const formatInvoiceNumber = (record) => {
    switch (currentNature) {
      case 'facture':
        return record.numero_facture || record.numero_commande || `#${record.id}`;
      case 'avoir':
        return record.numero_avoir || record.numero_commande || `#${record.id}`;
      case 'avoir-facture':
        return record.numero_avoir_facture || record.numero_commande || `#${record.id}`;
      default:
        return record.numero_commande || `#${record.id}`;
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "orange",
      processing: "blue",
      completed: "green",
      cancelled: "red",
      invoiced: "purple",
      paid: "green",
      partially_paid: "orange",
    };
    return statusColors[status] || "default";
  };

  const translateOrderStatus = (status) => {
    const statusTranslations = {
      pending: "En attente",
      processing: "En cours",
      completed: "Terminée",
      cancelled: "Annulée",
      invoiced: "Facturée",
      paid: "Payée",
      partially_paid: "Partiellement payée",
    };
    return statusTranslations[status] || status;
  };

  const getDateFieldName = () => {
    switch (currentNature) {
      case 'facture':
        return 'date_facture';
      case 'avoir':
        return 'date_avoir';
      case 'avoir-facture':
        return 'date_avoir_facture';
      default:
        return 'date_commande';
    }
  };

  const columns = [
    {
      title: `N° ${config.label}`,
      dataIndex: "numero_commande",
      key: "numero_commande",
      render: (_, record) => formatInvoiceNumber(record),
      sorter: (a, b) => (a.id || 0) - (b.id || 0),
    },
    {
      title: "Client",
      dataIndex: ["client", "nom_client"],
      key: "client_nom",
      render: (_, record) => record.client?.nom_client || record.nom_client || 'N/A',
      sorter: (a, b) => {
        const nameA = a.client?.nom_client || a.nom_client || '';
        const nameB = b.client?.nom_client || b.nom_client || '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: "Code Client",
      dataIndex: ["client", "code_client"],
      key: "code_client",
      render: (_, record) => record.client?.code_client || record.code_client || 'N/A',
    },
    {
      title: `Date ${config.label}`,
      dataIndex: getDateFieldName(),
      key: "date",
      render: (date, record) => {
        // Essayer différents champs de date selon la nature
        const dateValue = date || record.date_commande || record.date_facture || record.date_avoir;
        return dateValue ? moment(dateValue).format("DD/MM/YYYY") : 'N/A';
      },
      sorter: (a, b) => {
        const dateA = a[getDateFieldName()] || a.date_commande;
        const dateB = b[getDateFieldName()] || b.date_commande;
        return moment(dateA).valueOf() - moment(dateB).valueOf();
      },
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {translateOrderStatus(status)}
        </Tag>
      ),
    },
    {
      title: "Montant TTC",
      dataIndex: "montant_ttc",
      key: "montant_ttc",
      render: (amount) => formatCurrency(Number(amount) || 0),
      sorter: (a, b) => (Number(a.montant_ttc) || 0) - (Number(b.montant_ttc) || 0),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={`Restaurer cette ${config.label.toLowerCase()} ?`}
            description={`La ${config.label.toLowerCase()} sera restaurée avec son numéro d'origine.`}
            onConfirm={() => handleRestore(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button 
              icon={<RollbackOutlined />} 
              type="primary" 
              size="small" 
              disabled={loading}
            >
              Restaurer
            </Button>
          </Popconfirm>


    return (
        <div style={{ padding: 24 }}>
        <Card>
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
            <Col>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(currentNature==='facture'?"/reglements/factures":currentNature=='avoir'?"/bons/avoir":"/reglements/avoir-facture")}>
                Retour
                </Button>
            </Col>
            <Col flex="auto">
                <Title level={2} style={{ margin: 0 }}>
                🗑️ {currentNature === 'facture' ? 'Factures' : 'Avoirs'} Supprimées
                </Title>
            </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col>
                <Button icon={<ReloadOutlined />} onClick={loadDeletedInvoices} loading={loading}>
                Recharger
                </Button>
            </Col>
            {selectedRowKeys.length > 0 && (
                <Col>

          <Popconfirm
            title="Supprimer définitivement ?"
            description="Cette action est irréversible."
            onConfirm={() => handleDelete(record.id)}
            okText="Supprimer"
            okType="danger"
            cancelText="Annuler"
          >
            <Button 
              icon={<DeleteOutlined />} 
              type="primary" 
              danger 
              size="small" 
              disabled={loading}
            >
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(config.returnPath)}
            >
              Retour
            </Button>
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0 }}>
              {config.icon} {config.label}s Supprimé(e)s
            </Title>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadDeletedInvoices} 
              loading={loading}
            >
              Recharger
            </Button>
          </Col>
          
          {selectedRowKeys.length > 0 && (
            <>
              <Col>

                <Button
                  type="primary"
                  icon={<RollbackOutlined />}
                  onClick={handleRestoreSelected}
                  loading={loading}
                >
                  Restaurer Sélectionnées ({selectedRowKeys.length})
                </Button>
              </Col>
              <Col>
                <Popconfirm
                  title={`Supprimer définitivement ${selectedRowKeys.length} ${config.label.toLowerCase()}(s) ?`}
                  description="Cette action est irréversible."
                  onConfirm={handleDeleteSelected}
                  okText="Supprimer"
                  okType="danger"
                  cancelText="Annuler"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={loading}
                  >
                    Supprimer Sélectionnées ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              </Col>
            </>
          )}
        </Row>

        <Table
          rowKey="id"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={deletedInvoices}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} sur ${total} ${config.label}s supprimé(e)s`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}