    import React, { useEffect, useState, useContext } from 'react';
    import { Table, Button, message, Popconfirm, Typography, Card, Row, Col, Space, Tag } from 'antd';
    import { ReloadOutlined, RollbackOutlined, ArrowLeftOutlined } from '@ant-design/icons';
    import { useNavigate, useParams } from 'react-router-dom';
    import moment from 'moment';
    import { InvoiceContext } from '../../contexts/InvoiceContext';

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


    const loadDeletedInvoices = async () => {
        setLoading(true);
        try {
        const data = await fetchDeletedInvoices(currentNature);
        const invoices = Array.isArray(data) ? data : (data.results || []);
        setDeletedInvoices(invoices);
        } catch (err) {
        message.error(`Erreur lors du chargement des ${currentNature}s supprimées.`);
        console.error(err);
        } finally {
        setLoading(false);
        }
    };

    const handleRestore = async (id) => {
        try {
        setLoading(true);
        await restoreInvoice(id);
        message.success(`${currentNature === 'facture' ? 'Facture' : 'Avoir'} restauré(e) avec succès.`);
        await loadDeletedInvoices();
        } catch (err) {
        message.error("Erreur lors de la restauration.");
        console.error(err);
        } finally {
        setLoading(false);
        }
    };

    const handleRestoreSelected = async (selectedIds) => {
        if (selectedIds.length === 0) {
        message.warn('Aucune facture sélectionnée');
        return;
        }

        try {
        setLoading(true);
        await Promise.all(selectedIds.map(id => restoreInvoice(id)));
        message.success(`${selectedIds.length} ${currentNature}(s) restaurée(s) avec succès.`);
        await loadDeletedInvoices();
        } catch (err) {
        message.error("Erreur lors de la restauration multiple.");
        console.error(err);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        loadDeletedInvoices();
    }, [currentNature]);

    const formatInvoiceNumber = (record) => {
        return record.numero_commande || record.numero_facture || `#${record.id}`;
    };

    const getStatusColor = (status) => {
        const statusColors = {
        pending: "orange",
        processing: "blue",
        completed: "green",
        cancelled: "red",
        invoiced: "purple",
        };
        return statusColors[status] || "default";
    };

    const translateOrderStatus = (status) => {
        const statusTranslations = {
        pending: "En attente",
        processing: "En cours",
        completed: "Terminée",
        cancelled: "Annulée",
        invoiced: "Facturée"
        };
        return statusTranslations[status] || status;
    };

    const columns = [
        {
        title: `N° ${currentNature === 'facture' ? 'Facture' : 'Avoir'}`,
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
        }
        },
        {
        title: "Code Client",
        dataIndex: ["client", "code_client"],
        key: "code_client",
        render: (_, record) => record.client?.code_client || record.code_client || 'N/A'
        },
        {
        title: `Date ${currentNature === 'facture' ? 'Facture' : 'Avoir'}`,
        dataIndex: "date_commande",
        key: "date_commande",
        render: (date) => date ? moment(date).format("DD/MM/YYYY") : 'N/A',
        sorter: (a, b) => moment(a.date_commande).valueOf() - moment(b.date_commande).valueOf(),
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
                title={`Restaurer ${currentNature === 'facture' ? 'cette facture' : 'cet avoir'} ?`}
                description="La facture sera restaurée avec son numéro d'origine."
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
                <Button
                    type="primary"
                    icon={<RollbackOutlined />}
                    onClick={() => handleRestoreSelected(selectedRowKeys)}
                    loading={loading}
                >
                    Restaurer Sélectionnées ({selectedRowKeys.length})
                </Button>
                </Col>
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
                `${range[0]}-${range[1]} sur ${total} ${currentNature}s supprimées`
            }}
            scroll={{ x: 1200 }}
            />
        </Card>
        </div>
    );
    }
