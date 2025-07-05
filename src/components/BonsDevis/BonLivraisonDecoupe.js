import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tooltip,
  Drawer,
  InputNumber,
  Form,
  Select,
  DatePicker,
  Typography,
  Tag,
  Empty,
  Spin,
  Divider,
  Row,
  Col,
  message,
  notification,
  Modal,
  List,
  Badge,
  Popconfirm
} from "antd";
import {
  FilterOutlined,

  FileSearchOutlined,
  PrinterOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileDoneOutlined,
  AppstoreOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { debounce } from "lodash";

// Import services
import InvoiceService from "../../features/manifeste/services/InvoiceService";
import ClientService from "../../features/clientManagement/services/ClientService";
// Import new PDF service
import BonLivraisonDecoupePdfService from "../../services/BonLivraisonDecoupePdfService";


const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const BonLivraisonDecoupe = () => {
  // State for invoices
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]); // Add filtered invoices state
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
const computeGlobalStats = useCallback(() => {
  const stats = {
    totalBon: filteredInvoices.length,
    totalArticles: 0,
    totalHT: 0,
    totalTTC: 0,
  };

  filteredInvoices.forEach((invoice) => {
    stats.totalArticles += invoice.itemsCount || 0;
    stats.totalHT += invoice.calculatedTotals?.totalHT || 0;
    stats.totalTTC += invoice.calculatedTotals?.totalTTC || 0;
  });

  return stats;
}, [filteredInvoices]);

  // State for filters
const [filters, setFilters] = useState({
  clientId: null,
  dateRange: null,
  numeroSearch: "",
  montantRange: [null, null], // <-- au lieu de montantMin/montantMax
});



  // State for data display
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // State for detail view
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // State for advanced filter drawer
  const [clientOptions, setClientOptions] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);

  // Form for filters
  const [filterForm] = Form.useForm();

  // Calculate total amount for an invoice - memoize it
  const calculateInvoiceTotal = useCallback((invoice) => {
    if (!invoice) return { totalHT: 0, totalTVA: 0, totalTTC: 0 };

    // Use the totals already calculated by the backend
    const totalHT = invoice.total_ht || 0;
    const totalTVA = invoice.total_tax || 0;
    const totalTTC = invoice.total_ttc || 0;

    return {
      totalHT: totalHT,
      totalTVA: totalTVA,
      totalTTC: totalTTC,
    };
  }, []);

  // Fetch invoices without any filters - get all data
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
      };

      // Remove all filter parameters - fetch all data
      const response = await InvoiceService.getAllInvoices(params);
      
      const processInvoices = (invoiceList) => {
        return invoiceList.map((invoice) => {
          const totals = calculateInvoiceTotal(invoice);
          return {
            ...invoice,
            calculatedTotals: totals,
            itemsCount: invoice.items ? invoice.items.length : 0,
          };
        });
      };

      if (
        response &&
        typeof response.count === "number" &&
        Array.isArray(response.results)
      ) {
        const processedInvoices = processInvoices(response.results);
        setInvoices(processedInvoices);
        setTotalRecords(response.count);

        // Apply client-side filtering immediately
        applyClientSideFilters(processedInvoices, filters);
      } else if (Array.isArray(response)) {
        const processedInvoices = processInvoices(response);
        setInvoices(processedInvoices);
        setTotalRecords(response.length);

        // Apply client-side filtering immediately
        applyClientSideFilters(processedInvoices, filters);
      } else {
        setInvoices([]);
        setFilteredInvoices([]);
        setTotalRecords(0);
        console.warn(
          "Unexpected API response structure for invoices:",
          response
        );
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      message.error("Erreur lors de la récupération des factures.");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, calculateInvoiceTotal]);

  // Add client-side filtering function
  const applyClientSideFilters = useCallback((invoiceList, currentFilters) => {
    let filtered = [...invoiceList];

    // Filter by client
    if (currentFilters.clientId) {
      filtered = filtered.filter((invoice) => {
        const clientId = invoice.client_details?.id || invoice.client_id;
        return clientId === currentFilters.clientId;
      });
    }

    // Filter by date range
    if (currentFilters.dateRange && currentFilters.dateRange.length === 2) {
      const startDate = currentFilters.dateRange[0];
      const endDate = currentFilters.dateRange[1];

      filtered = filtered.filter((invoice) => {
        const invoiceDate = moment(invoice.date_emission);
        return invoiceDate.isBetween(startDate, endDate, "day", "[]"); // inclusive
      });
    }

    // Filter by invoice number
    if (currentFilters.numeroSearch) {
      const searchTerm = currentFilters.numeroSearch.toLowerCase();
      filtered = filtered.filter((invoice) =>
        invoice.numero_facture?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by montant TTC min/max
if (currentFilters.montantRange) {
  const [min, max] = currentFilters.montantRange;

  if (min != null) {
    filtered = filtered.filter(
      (invoice) =>
        (invoice.calculatedTotals?.totalTTC || 0) >= min
    );
  }

  if (max != null) {
    filtered = filtered.filter(
      (invoice) =>
        (invoice.calculatedTotals?.totalTTC || 0) <= max
    );
  }
}



    setFilteredInvoices(filtered);
  }, []);

  // Update useEffect to only depend on pagination for fetching
  useEffect(() => {
    fetchInvoices();
  }, [pagination.current, pagination.pageSize]);

  // Add useEffect to apply filters when filters change
  useEffect(() => {
    if (invoices.length > 0) {
      applyClientSideFilters(invoices, filters);
    }
  }, [invoices, filters, applyClientSideFilters]);

  // Fetch initial clients for dropdown
  const fetchInitialClients = useCallback(async () => {
    setClientSearchLoading(true);
    try {
      const clientData = await ClientService.get_all_clients(); // Use same method as BonLivraisonReception
      const options = clientData.map((client) => ({
        value: client.id,
        label: client.nom_client,
      }));
      setClientOptions(options);
    } catch (error) {
      console.error("Error fetching initial clients:", error);
      message.error("Erreur lors de la récupération des clients.");
    } finally {
      setClientSearchLoading(false);
    }
  }, []);

  // Combined useEffect for initial data loading
  useEffect(() => {
    fetchInvoices();
  }, [pagination.current, pagination.pageSize]); // Only pagination changes

  useEffect(() => {
    fetchInitialClients();
  }, [fetchInitialClients]);

  // Handle client search with debounce
  const handleClientSearch = async (value) => {
    // Always allow empty search to get all clients
    setClientSearchLoading(true);

    try {
      // Use empty string if value is less than 2 chars to fetch all clients
      const searchValue = value && value.length >= 2 ? value : "";
      const clientsData = await ClientService.search_clients(searchValue); // Use same method as BonLivraisonReception

      setClientOptions(
        clientsData.map((client) => ({
          value: client.id,
          label: `${
            client.nom_client || client.name || "Client sans nom"
          } (ID: ${client.id})`,
        }))
      );
    } catch (err) {
      console.error("Error searching clients:", err);
      notification.error({
        message: "Erreur",
        description: "Erreur lors de la recherche des clients.",
      });
    } finally {
      setClientSearchLoading(false);
    }
  };

  const debouncedClientSearch = debounce(handleClientSearch, 500);

  // Handle quick search (numero facture)
  const handleQuickSearch = (value) => {
    const newFilters = {
      ...filters,
      numeroSearch: value,
    };
    setFilters(newFilters);
    setPagination({
      ...pagination,
      current: 1, // Reset to first page when searching
    });
  };

  // Apply advanced filters
  const applyFilters = (values) => {
    console.log("Applying filters:", values);

    const newFilters = {
      clientId: values.clientId,
      dateRange: values.dateRange,
      numeroSearch: values.numeroSearch || filters.numeroSearch,
      status: values.status,
    };

    console.log("New filters state:", newFilters);

    setFilters(newFilters);
    setPagination({
      current: 1, // Reset to first page
      pageSize: pagination.pageSize,
    });

  
  };

  // Reset filters
  const resetFilters = () => {
    filterForm.resetFields();
    setFilters({
      clientId: null,
      dateRange: null,
      numeroSearch: "",
      status: null,
    });
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  // Update handleTableChange to work with filtered data
  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  // View invoice details
  const viewInvoiceDetails = (record) => {
    setSelectedInvoice(record);
    setDetailDrawerVisible(true);
  };

    const handleDeleteInvoice = async (Id) => {
    try {
      setLoading(true);
      await InvoiceService.deleteInvoice(Id)
      message.success("Bon de Livraison  supprimée avec succès"); 
      fetchInvoices()
    } catch(error){
      message.error("Erreur lors de la suppression: " + error.message);
    } finally {
      setLoading(false)
    }

  }
  // Print invoice function - Updated to use new PDF service
  const printInvoice = async (invoice) => {
    try {
      message.loading({
        content: "Génération de la facture...",
        key: "generatePDF",
      });
      const fetchedInvoice = await InvoiceService.getInvoiceById(invoice.id)
      console.log(fetchedInvoice)

      // Use the new PDF API service
      await BonLivraisonDecoupePdfService.generateDecoupeInvoicePDF(
        fetchedInvoice,
        `facture-decoupe-${invoice.numero_facture}.pdf`
      );

      message.success({
        content: "Facture générée avec succès!",
        key: "generatePDF",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error({
        content: `Erreur lors de la génération: ${error.message}`,
        key: "generatePDF",
      });
    }
  };

  // Table columns
  const columns = [
    {
      title: "N° Bon",
      dataIndex: "numero_facture",
      key: "numero_facture",
      width: "15%",
      render: (text) => <span className="invoice-number">{text}</span>,
    },
    {
      title: "Client",
      dataIndex: ["client_details", "nom_client"],
      key: "client",
      width: "20%",
      render: (nomClient, record) => {
        // Fallback to getting client name from different possible locations
        return (
          nomClient ||
          record.client?.nom_client ||
          `Client ID: ${record.client_id}` ||
          "-"
        );
      },
    },
    {
      title: "Date d'émission",
      dataIndex: "date_emission",
      key: "date_emission",
      width: "13%",
      sorter: (a, b) =>
        moment(a.date_emission).unix() - moment(b.date_emission).unix(),
    },
    {
      title: "Articles",
      dataIndex: "itemsCount",
      key: "itemsCount",
      width: "10%",
      render: (count) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: "Total HT",
      key: "totalHT",
      width: "12%",
      render: (_, record) => (
        <span>
          {record.calculatedTotals?.totalHT?.toFixed(3) || "0.000"} 
        </span>
      ),
    },
    {
      title: "Total TTC",
      key: "totalTTC",
      width: "12%",
      render: (_, record) => (
        <span>
          {record.calculatedTotals?.totalTTC?.toFixed(3) || "0.000"} 
        </span>
      ),
    },
    // {
    //   title: "Statut",
    //   dataIndex: "statut",
    //   key: "statut",
    //   width: "10%",
    //   render: (status) => {
    //     const statusColors = {
    //       draft: "orange",
    //       sent: "blue",
    //       paid: "green",
    //       cancelled: "red",
    //     };
    //     return (
    //       <Tag color={statusColors[status] || "default"}>
    //         {status || "Draft"}
    //       </Tag>
    //     );
    //   },
    // },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <Space size="small">
          {/* <Tooltip title="Détails">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => viewInvoiceDetails(record)}
            />
          </Tooltip> */}
          <Tooltip title="Imprimer">
            <Button
              type="default"
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => printInvoice(record)}
            />
          </Tooltip>
           <Tooltip title="Supprimer"> 
           <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer ce bon?"
              onConfirm={() => handleDeleteInvoice(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="bon-livraison-decoupe">
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Title level={2}><FileDoneOutlined /> Bon de Livraison Découpe</Title>
          
        </div>
{/* Résumé global des bons de livraison */}

<Card style={{ marginBottom: 24 }}>
  <Row gutter={16}>
    {/* Total Bons */}
    <Col span={6}>
      <Card bordered={false}>
        <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
          Total Bons
        </Title>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
          }}
        >
          <FileDoneOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          {computeGlobalStats().totalBon}
        </Text>
      </Card>
    </Col>

    {/* Total Articles */}
    <Col span={6}>
      <Card bordered={false}>
        <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
          Total Articles
        </Title>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
          }}
        >
          <AppstoreOutlined style={{ marginRight: 8, color: "#722ed1" }} />
          {computeGlobalStats().totalArticles}
        </Text>
      </Card>
    </Col>

    {/* Montant HT */}
    <Col span={6}>
      <Card bordered={false}>
        <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
          Montant HT
        </Title>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
          }}
        >
          <DollarOutlined style={{ marginRight: 8, color: "#faad14" }} />
          {computeGlobalStats().totalHT.toFixed(3)}
        </Text>
      </Card>
    </Col>

    {/* Montant TTC */}
    <Col span={6}>
      <Card bordered={false}>
        <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
          Montant TTC
        </Title>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
          }}
        >
          <DollarOutlined style={{ marginRight: 8, color: "#52c41a" }} />
          
          
          {computeGlobalStats().totalTTC.toFixed(3)}
        </Text>
      </Card>
    </Col>
  </Row>
</Card>


{/* Filtres simples visibles */}
<div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
  {/* N° Bon Search */}
  <Input.Search
    placeholder="Rechercher par N° Bon"
    allowClear
    style={{ width: 200 }}
    value={filters.numeroSearch}
    onChange={(e) => handleQuickSearch(e.target.value)}
    onSearch={handleQuickSearch}
  />

  {/* Client */}
  <Select
    allowClear
    showSearch
    style={{ width: 220 }}
    placeholder="Client"
    loading={clientSearchLoading}
    onSearch={debouncedClientSearch}
    value={filters.clientId}
    options={clientOptions}
    onChange={(value) =>
      setFilters((prev) => ({ ...prev, clientId: value }))
    }
  />

  {/* Période */}
<Row gutter={8} align="middle" style={{ marginBottom: 8 }}>
  <Col>
    <RangePicker
      style={{ width: 280 }}
      format="DD/MM/YYYY"
      value={filters.dateRange}
      onChange={(value) =>
        setFilters((prev) => ({ ...prev, dateRange: value }))
      }
    />
  </Col>

  <Col>
    <Input.Group compact>
  <InputNumber
    style={{ width: 120, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
    placeholder="Montant min"
    min={0}
    value={filters.montantRange?.[0] || null}
    onChange={(value) =>
      setFilters((prev) => ({
        ...prev,
        montantRange: [value || null, prev.montantRange?.[1] || null],
      }))
    }
  />
  <InputNumber
    style={{ width: 120, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
    placeholder="Montant max"
    min={0}
    value={filters.montantRange?.[1] || null}
    onChange={(value) =>
      setFilters((prev) => ({
        ...prev,
        montantRange: [prev.montantRange?.[0] || null, value || null],
      }))
    }
  />
</Input.Group>


  </Col>
  <Col>
    {/* Bouton reset */}
 <Button onClick={resetFilters}>
    Effacer les filtres
  </Button>
  </Col>
</Row>



</div>


        

        {/* Data table */}
        <Table
          columns={columns}
          dataSource={filteredInvoices} // Use filtered data instead of invoices
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredInvoices.length, // Use filtered length instead of totalRecords
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} factures`,
          }}
          onChange={handleTableChange}
          rowKey="id"
          bordered
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Aucune Bon trouvée"
              />
            ),
          }}
        />
      </Card>



      {/* Detail drawer */}
      <Drawer
        title={`Détails de la Bon ${selectedInvoice?.numero_facture}`}
        width={800}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        extra={
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => selectedInvoice && printInvoice(selectedInvoice)}
          >
            Imprimer
          </Button>
        }
      >
        {selectedInvoice ? (
          <>
            <div className="detail-header" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div className="detail-item">
                    <Text type="secondary">N° Bon</Text>
                    <Title level={4}>{selectedInvoice.numero_facture}</Title>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="detail-item">
                    <Text type="secondary">Date d'émission</Text>
                    <Title level={4}>{selectedInvoice.date_emission}</Title>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="detail-item">
                    <Text type="secondary">Statut</Text>
                    <Title level={4}>
                      <Tag
                        color={
                          selectedInvoice.statut === "paid" ? "green" : "orange"
                        }
                      >
                        {selectedInvoice.statut || "Draft"}
                      </Tag>
                    </Title>
                  </div>
                </Col>
              </Row>
            </div>

            <Divider orientation="left">Informations client</Divider>
            {selectedInvoice.client_details ? (
              <div className="client-details" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Text strong>Nom: </Text>
                    <Text>{selectedInvoice.client_details.nom_client}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Téléphone: </Text>
                    <Text>
                      {selectedInvoice.client_details.telephone || "-"}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Email: </Text>
                    <Text>{selectedInvoice.client_details.email || "-"}</Text>
                  </Col>
                  <Col span={24}>
                    <Text strong>Adresse: </Text>
                    <Text>{selectedInvoice.client_details.adresse || "-"}</Text>
                  </Col>
                </Row>
              </div>
            ) : (
              <Empty description="Aucune information client disponible" />
            )}

            <Divider orientation="left">Articles facturés</Divider>
            {selectedInvoice.items?.length > 0 ? (
              <>
                <List
                  dataSource={selectedInvoice.items}
                  renderItem={(item, index) => (
                    <List.Item>
                      <Card
                        title={`Article ${index + 1}: ${
                          item.produit_name || "Produit"
                        }`}
                        style={{ width: "100%" }}
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Text strong>Description: </Text>
                            <Text>{item.description || "-"}</Text>
                          </Col>
                          <Col span={6}>
                            <Text strong>Quantité: </Text>
                            <Text>{item.billable?.quantite || 0}</Text>
                          </Col>
                          <Col span={6}>
                            <Text strong>Prix unitaire: </Text>
                            <Text>
                              {(item.billable?.prix_unitaire || 0).toFixed(3)}{" "}
                              
                            </Text>
                          </Col>
                        </Row>

                        {item.matiere_usages &&
                          item.matiere_usages.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                              <Text strong>Matériaux utilisés:</Text>
                              <Table
                                size="small"
                                pagination={false}
                                dataSource={item.matiere_usages}
                                columns={[
                                  {
                                    title: "Matériau",
                                    dataIndex: "nom_matiere",
                                    key: "nom_matiere",
                                  },
                                  {
                                    title: "Type",
                                    dataIndex: "type_matiere",
                                    key: "type_matiere",
                                  },
                                  {
                                    title: "Quantité",
                                    dataIndex: "quantite_utilisee",
                                    key: "quantite_utilisee",
                                  },
                                  {
                                    title: "Prix unitaire",
                                    dataIndex: "prix_unitaire",
                                    key: "prix_unitaire",
                                    render: (val) =>
                                      `${(val || 0).toFixed(3)} `,
                                  },
                                  {
                                    title: "Total",
                                    dataIndex: "total",
                                    key: "total",
                                    render: (val) =>
                                      `${(val || 0).toFixed(3)} `,
                                  },
                                ]}
                              />
                            </div>
                          )}
                      </Card>
                    </List.Item>
                  )}
                />

                <Card style={{ marginTop: 16 }}>
                  <Row justify="end">
                    <Col span={8}>
                      <div style={{ textAlign: "right" }}>
                        <p>
                          <strong>Total HT:</strong>{" "}
                          {selectedInvoice.calculatedTotals?.totalHT?.toFixed(
                            3
                          ) || "0.000"}{" "}
                          
                        </p>
                        <p>
                          <strong>
                            TVA ({selectedInvoice.tax_rate || 19}%):
                          </strong>{" "}
                          {selectedInvoice.calculatedTotals?.totalTVA?.toFixed(
                            3
                          ) || "0.000"}{" "}
                          
                        </p>
                        <p style={{ fontSize: "16px", fontWeight: "bold" }}>
                          <strong>Total TTC:</strong>{" "}
                          {selectedInvoice.calculatedTotals?.totalTTC?.toFixed(
                            3
                          ) || "0.000"}{" "}
                          
                        </p>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </>
            ) : (
              <Empty description="Aucun article dans cette facture" />
            )}
          </>
        ) : (
          <Spin />
        )}
      </Drawer>
    </div>
  );
};

export default BonLivraisonDecoupe;
