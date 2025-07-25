    import React, { useEffect, useState, useContext } from 'react';
    import { Table, Button, message, Popconfirm, Typography, Card, Row, Col, Space, Tag } from 'antd';
    import { ReloadOutlined, RollbackOutlined, ArrowLeftOutlined } from '@ant-design/icons';
    import { useNavigate, useParams } from 'react-router-dom';
    import moment from 'moment';
    import { InvoiceContext } from '../../contexts/InvoiceContext';

    const { Title } = Typography;

    export default function BonLivraisonDecoupeCorbeille() {
        const [deletedInvoices, setDeletedInvoices] = useState([]);
        const [loading, setLoading] = useState(false);
        const [selectedRowKeys, setSelectedRowKeys] = useState([]);
        const navigate = useNavigate();
        const {fetchDeletedBonLivraisonDecoupe, restoreBonLivraisonDecoupe } = useContext(InvoiceContext);

        const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }).format(value);
        };


    const loadDeletedInvoices = async () => {
        setLoading(true);
        try {
        const data = await fetchDeletedBonLivraisonDecoupe();
        const invoices = Array.isArray(data) ? data : (data.results || []);
        setDeletedInvoices(invoices);
        } catch (err) {
        message.error(`Erreur lors du chargement des bons supprimées.`);
        console.error(err);
        } finally {
        setLoading(false);
        }
    };

    const handleRestore = async (id) => {
        try {
        setLoading(true);
        await restoreBonLivraisonDecoupe(id);
        message.success(`Bon de livraison découpe restauré avec succès.`);
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
        message.warn('Aucun bon sélectionnée');
        return;
        }

        try {
            setLoading(true);
            await Promise.all(selectedIds.map(id => restoreBonLivraisonDecoupe(id)));
            message.success(`${selectedIds.length} Bon(s) restaurée(s) avec succès.`);
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
    }, []);

    const formatInvoiceNumber = (record) => {
        return record.numero_facture;
    };

    const getStatusColor = (status) => {
        const statusColors = {
        draft: "orange",
        sent: "blue",
        paid: "green",
        cancelled: "red",
        };
        return statusColors[status] || "default";
    };

    const translateOrderStatus = (status) => {
        const statusTranslations = {
            draft: "Brouillon",
            sent: "Envoyée",
            paid: "Payée",
            cancelled: "Annulée",
        };
        return statusTranslations[status] || status;
    };

    const columns = [
        {
        title: `N° Bon`,
        dataIndex: "numero_facture",
        key: "numero_facture",
        render: (_, record) => formatInvoiceNumber(record),
        sorter: (a, b) => (a.id || 0) - (b.id || 0),
        },
        {
        title: "Client",
        dataIndex: ["client", "nom_client"],
        key: "nom_client",
        render: (_, record) => record.client_details.nom_client,
        sorter: (a, b) => {
            const nameA = a.client_details?.nom_client || a.nom_client || '';
            const nameB = b.client_details?.nom_client || b.nom_client || '';
            return nameA.localeCompare(nameB);
        }
        },
        {
        title: "Code Client",
        dataIndex: ["client", "code_client"],
        key: "code_client",
        render: (_, record) => record.client_details?.code_client || record.code_client || 'N/A'
        },
        {
        title: `Date émission`,
        dataIndex: "date_emission",
        key: "date_emission",
        render: (date) => date ? moment(date).format("DD/MM/YYYY") : 'N/A',
        sorter: (a, b) => moment(a.date_emission).valueOf() - moment(b.date_emission).valueOf(),
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
        dataIndex: "total_ttc",
        key: "total_ttc",
        render: (amount) => formatCurrency(Number(amount) || 0),
        sorter: (a, b) => (Number(a.total_ttc) || 0) - (Number(b.total_ttc) || 0),
        },
        {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
            <Space>
            <Popconfirm
                title={`Restaurer ce bon?`}
                description="Le bon sera restauré avec son numéro d'origine."
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
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/bons/livraison-decoupe")}>
                Retour
                </Button>
            </Col>
            <Col flex="auto">
                <Title level={2} style={{ margin: 0 }}>
                🗑️ Bons Supprimées
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
                `${range[0]}-${range[1]} sur ${total} bons supprimées`
            }}
            scroll={{ x: 1200 }}
            />
        </Card>
        </div>
    );
    }
