import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tooltip,
  Drawer,
  Form,
  Select,
  DatePicker,
  Typography,
  Tag,
  Empty,
  Spin,
  Divider,
  Popconfirm,
  Row,
  Col,
  message,
  notification,
  
} from "antd";
import {
  FilterOutlined,
  ReloadOutlined,
  FileSearchOutlined,
  PrinterOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { debounce } from "lodash";

import ClientMaterialService from "../../features/clientMaterials/services/ClientMaterialService";
import ClientService from "../../features/clientManagement/services/ClientService";
import ClientMaterialPdfService from "../../features/clientMaterials/services/ClientMaterialPdfService";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const BonLivraisonReception = () => {
  // State for delivery notes
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // State for filters
  const [filters, setFilters] = useState({
    clientId: null,
    dateRange: null,
    numeroSearch: "",
    status: null,
  });

  // State for data display
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // State for detail view
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState(null);

  // State for advanced filter drawer
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [clientOptions, setClientOptions] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);

  // Form for filters
  const [filterForm] = Form.useForm();
   const handleDeleteInvoice = async (Id) => {
      try {
        setLoading(true);
        await ClientMaterialService.deleteMaterialInvoice(Id)
        message.success("Bon de Livraison  supprimée avec succès"); 
        setDeliveryNotes(prevNotes => prevNotes.filter(note => note.id !== Id));
        setTotalRecords(prevTotal => prevTotal - 1);
      } catch(error){
        message.error("Erreur lors de la suppression: " + error.message);
      } finally {
        setLoading(false)
      }
  
    }
  // Material types options for display
  const material_types = [
    { value: "acier", label: "Acier" },
    { value: "acier_inoxydable", label: "Acier inoxydable" },
    { value: "aluminium", label: "Aluminium" },
    { value: "laiton", label: "Laiton" },
    { value: "cuivre", label: "Cuivre" },
    { value: "acier_galvanise", label: "Acier galvanisé" },
    { value: "autre", label: "Autre" },
  ];

  // Calculate total quantity for a delivery note - memoize it
  const calculateTotalQuantity = useCallback((materials) => {
    if (!materials || !Array.isArray(materials)) return 0;
    return materials.reduce(
      (sum, item) => sum + (parseFloat(item.quantite) || 0),
      0
    );
  }, []); // No dependencies, it's a pure function of its arguments

  const [data, setData] = useState([]) ; 
  const fetchData = async () => {
    try {
      const res = await ClientMaterialService.getAllMaterialInvoices();
      setData(res);
    } catch (error) {
      message.error('Échec du chargement des données');
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
  
    setDeliveryNotes(prev =>
      Array.isArray(prev) ? prev.filter(note => note.id !== id) : []);
  
  
    setTotalRecords(prev => prev - 1);
  
    try {
      await ClientMaterialService.deleteMaterialInvoice(id);
      message.success("Supprimé avec succès");
    } catch (err) {
      message.error("Échec de la suppression – annulation");
    
      fetchDeliveryNotes();            
    }
  };

  // Fetch delivery notes based on current filters and pagination
  const fetchDeliveryNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
      };

      if (filters.clientId) {
        params.client_id = filters.clientId;
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.date_after = filters.dateRange[0].format("YYYY-MM-DD");
        params.date_before = filters.dateRange[1].format("YYYY-MM-DD");
      }
      if (filters.numeroSearch) {
        params.search = filters.numeroSearch; // Assumes backend handles 'search' for numero_bon
      }
      if (filters.status) {
        params.status = filters.status; // Assumes backend handles 'status'
      }

      const response = await ClientMaterialService.getAllMaterialInvoices(
        params
      );

      const processNotes = (notes) => {
        return notes.map((note) => {
          const currentMatieresDetails = Array.isArray(note.matieres_details)
            ? note.matieres_details
            : [];
          return {
            ...note,
            matieres_details: currentMatieresDetails, // Ensure it's always an array
            materialsCount: currentMatieresDetails.length,
            totalQuantity: calculateTotalQuantity(currentMatieresDetails),
          };
        });
      };

      if (
        response &&
        typeof response.count === "number" &&
        Array.isArray(response.results)
      ) {
        setDeliveryNotes(processNotes(response.results));
        setTotalRecords(response.count);
      } else if (Array.isArray(response)) {
        setDeliveryNotes(processNotes(response));
        setTotalRecords(response.length);
      } else {
        // Fallback for unexpected response structure
        setDeliveryNotes([]);
        setTotalRecords(0);
        console.warn(
          "Unexpected API response structure for delivery notes:",
          response
        );
      }
    } catch (error) {
      console.error("Error fetching delivery notes:", error);
      message.error("Erreur lors de la récupération des bons de livraison.");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination, calculateTotalQuantity]); // Updated dependencies

  // Fetch initial clients for dropdown - always execute this on component mount
  const fetchInitialClients = useCallback(async () => {
    setClientSearchLoading(true);
    try {
      const clientData = await ClientService.get_all_clients();
      const options = clientData.map((client) => ({
        value: client.id, // Assuming ClientModel has id
        label: client.nom_client, // Assuming ClientModel has nom_client
      }));
      setClientOptions(options);
    } catch (error) {
      console.error("Error fetching initial clients:", error);
      message.error("Erreur lors de la récupération des clients.");
    } finally {
      setClientSearchLoading(false);
    }
  }, [setClientSearchLoading, setClientOptions]);

  // Combined useEffect for initial data loading
  useEffect(() => {
    fetchDeliveryNotes();
  }, [fetchDeliveryNotes]);

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
      const clientsData = await ClientService.search_clients(searchValue);

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

  // Create a debounced search function
  const debouncedClientSearch = debounce(handleClientSearch, 500);

  // Handle quick search (numero bon)
  const handleQuickSearch = (value) => {
    setFilters({
      ...filters,
      numeroSearch: value,
    });
    setPagination({
      ...pagination,
      current: 1, // Reset to first page when searching
    });
  };

  // Apply advanced filters
  const applyFilters = (values) => {
    const newFilters = {
      clientId: values.clientId,
      dateRange: values.dateRange,
      numeroSearch: values.numeroSearch || filters.numeroSearch,
      status: values.status,
    };

    setFilters(newFilters);
    setPagination({
      ...pagination,
      current: 1, // Reset to first page when filtering
    });

    setFilterDrawerVisible(false);

    // Trigger fetch with new filters
    fetchDeliveryNotes();
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
    fetchDeliveryNotes();
  };

  // Handle table change (pagination, filters, sorter)
  const handleTableChange = (newPagination, tableFilters, sorter) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  // View delivery note details
  const viewDeliveryNoteDetails = (record) => {
    setSelectedDeliveryNote(record);
    setDetailDrawerVisible(true);
  };

  // Print delivery note - Updated to use PDF API service like ClientMaterialManagement
  const printDeliveryNote = async (record) => {
    console.log("Printing delivery note with data:", record);
    try {
      if (!record.matieres_details || record.matieres_details.length === 0) {
        notification.error({
          message: "Aucune matière à imprimer",
          description:
            "Ce bon de livraison ne contient aucune matière première.",
        });
        return;
      }

      message.loading({
        content: "Génération du bon de livraison...",
        key: "generatePDF",
      });

      // Get material type label function (same as ClientMaterialManagement)
      const getMaterialTypeLabel = (type) => {
        const materialType = material_types.find((item) => item.value === type);
        return materialType ? materialType.label : type;
      };

      // Prepare client information
      const clientName =
        record.client_details?.nom_client || "Client non spécifié";
      const clientAddress =
        record.client_details?.adresse || "Adresse non spécifiée";
      const clientPhone = record.client_details?.telephone || "N/A";
      const clientEmail = record.client_details?.email || "N/A";
      const clientTaxId = record.client_details?.numero_fiscal || "N/A";
      const clientCode = record.client_details?.id || record.client || "N/A";

      const totalQuantity = calculateTotalQuantity(record.matieres_details);

      // Prepare data for PDF generation (same structure as ClientMaterialManagement)
      const pdfData = {
        deliveryNumber: record.numero_bon,
        deliveryDate: record.date_reception,
        clientName: clientName,
        clientAddress: clientAddress,
        clientTaxId: clientTaxId,
        clientPhone: clientPhone,
        clientCode: clientCode,
        materials: record.matieres_details.map((item) => ({
          numero_bon: record.numero_bon, // Use the delivery note number for all items
          reception_date: record.date_reception,
          type_matiere: getMaterialTypeLabel(item.type_matiere), // Use the label instead of value
          thickness: item.thickness || item.epaisseur || "-",
          length: item.length || item.longueur || "-",
          width: item.width || item.largeur || "-",
          quantite: item.quantite || 0,
          description: item.description || "",
          surface: item.surface ? `${item.surface} m²` : "-",
        })),
        totalQuantity: totalQuantity,
        notes: record.notes || "",
      };

      console.log("PDF data for delivery note:", pdfData);

      // Use the same PDF API service as ClientMaterialManagement
      await ClientMaterialPdfService.generateClientMaterialsPDF(
        pdfData,
        `bon-livraison-${record.numero_bon}.pdf`
      );

      message.success({
        content: "Bon de livraison généré avec succès!",
        key: "generatePDF",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error({
        content: `Erreur lors de la génération: ${error.message}`,
        key: "generatePDF",
      });

      notification.error({
        message: "Erreur PDF",
        description: `Impossible de générer le PDF: ${error.message}`,
      });
    }
  };

  // Table columns data
  const columns = [
    {
      title: "N° Bon",
      dataIndex: "numero_bon",
      key: "numero_bon",
      width: "15%",
      render: (text) => <span className="invoice-number">{text}</span>,
    },
    {
      title: "Client",
      dataIndex: ["client_details", "nom_client"], // Use array for nested path
      key: "client", // Simplified key
      width: "20%",
      render: (nomClient) => nomClient || "-", // Safely render name or provide fallback
    },
    {
      title: "Date de réception",
      dataIndex: "date_reception",
      key: "date_reception",
      width: "13%",
      sorter: (a, b) =>
        moment(a.date_reception).unix() - moment(b.date_reception).unix(),
    },
    {
      title: "Matières",
      dataIndex: "materialsCount",
      key: "materialsCount",
      width: "10%",
      render: (count) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: "Quantité totale",
      dataIndex: "totalQuantity",
      key: "totalQuantity",
      width: "12%",
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      width: "15%",
      ellipsis: true,
      render: (text) => text || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Détails">
            <Button
              type="primary"
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => viewDeliveryNoteDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Imprimer">
            <Button
              type="default"
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => printDeliveryNote(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
           <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cette commande ?"
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

  // Render material type with proper label
  const renderMaterialType = (type) => {
    const materialType = material_types.find((item) => item.value === type);
    return materialType ? materialType.label : type;
  };

  // Get color for material type tag
const getMaterialTypeColor = (type) => {
  switch (type) {
    case "acier":
      return "lightblue"; // changed from blue
    case "acier_inoxydable":
      return "lightcyan"; // changed from cyan
    case "aluminium":
      return "lightgray"; // changed from blue
    case "laiton":
      return "lightgoldenrodyellow"; // changed from gold
    case "cuivre":
      return "lightsalmon"; // changed from orange
    case "acier_galvanise":
      return "plum"; // changed from purple
    default:
      return "default";
  }
};

  return (
    <div className="bon-livraison-reception">
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
        
          <Title level={2}>Bons de Livraison (Réception)</Title>
          <Space size="middle">
            <Tooltip title="Rafraîchir">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchDeliveryNotes()}
              />
            </Tooltip>
          </Space>
        </div>

        {/* Quick filters */}
        <div style={{ display: "flex", marginBottom: 16, gap: 16 }}>
          <Input.Search
            placeholder="Rechercher par N° bon"
            allowClear
            style={{ width: 300 }}
            value={filters.numeroSearch}
            onChange={(e) => handleQuickSearch(e.target.value)}
            onSearch={handleQuickSearch}
          />
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterDrawerVisible(true)}
          >
            Filtres avancés
          </Button>

          {(filters.clientId ||
            (filters.dateRange && filters.dateRange.length) ||
            filters.status) && (
            <Button danger onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          )}
        </div>

        {/* Active filters display */}
        {(filters.clientId ||
          (filters.dateRange && filters.dateRange.length) ||
          filters.status) && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Filtres actifs: </Text>
            <Space size="small">
              {filters.clientId && (
                <Tag
                  color="blue"
                  closable
                  onClose={() => {
                    setFilters({ ...filters, clientId: null });
                    fetchDeliveryNotes();
                  }}
                >
                  Client:{" "}
                  {clientOptions.find((c) => c.value === filters.clientId)
                    ?.label || `ID: ${filters.clientId}`}
                </Tag>
              )}

              {filters.dateRange && filters.dateRange.length === 2 && (
                <Tag
                  color="blue"
                  closable
                  onClose={() => {
                    setFilters({ ...filters, dateRange: null });
                    fetchDeliveryNotes();
                  }}
                >
                  Période: {filters.dateRange[0].format("DD/MM/YYYY")} -{" "}
                  {filters.dateRange[1].format("DD/MM/YYYY")}
                </Tag>
              )}

              {filters.status && (
                <Tag
                  color="blue"
                  closable
                  onClose={() => {
                    setFilters({ ...filters, status: null });
                    fetchDeliveryNotes();
                  }}
                >
                  Statut: {filters.status}
                </Tag>
              )}
            </Space>
          </div>
        )}

        {/* Data table */}
        <Table
          columns={columns}
          dataSource={deliveryNotes}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: totalRecords,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} bons de livraison`,
          }}
          onChange={handleTableChange}
          rowKey="id"
          bordered
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Aucun bon de livraison trouvé"
              />
            ),
          }}
        />
      </Card>

      {/* Advanced filter drawer */}
      <Drawer
        title="Filtres avancés"
        width={400}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={() => setFilterDrawerVisible(false)}>
              Annuler
            </Button>
            <Button onClick={() => filterForm.submit()} type="primary">
              Appliquer
            </Button>
          </Space>
        }
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={applyFilters}
          initialValues={{
            clientId: filters.clientId,
            dateRange: filters.dateRange,
            numeroSearch: filters.numeroSearch,
            status: filters.status,
          }}
        >
          <Form.Item name="clientId" label="Client">
            <Select
              allowClear
              showSearch
              placeholder="Sélectionner un client"
              optionFilterProp="label"
              loading={clientSearchLoading}
              onSearch={debouncedClientSearch}
              options={clientOptions}
            />
          </Form.Item>

          <Form.Item name="dateRange" label="Période de réception">
            <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="numeroSearch" label="N° Bon de livraison">
            <Input placeholder="Rechercher par numéro" />
          </Form.Item>

          <Divider />

          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={() => filterForm.resetFields()}>
                Effacer les filtres
              </Button>
              <Button type="primary" htmlType="submit">
                Appliquer les filtres
              </Button>
            </Space>
          </div>
        </Form>
      </Drawer>

      {/* Detail drawer */}
      <Drawer
        title={`Détails du bon de livraison ${selectedDeliveryNote?.numero_bon}`}
        width={700}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        extra={
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() =>
              selectedDeliveryNote && printDeliveryNote(selectedDeliveryNote)
            }
          >
            Imprimer
          </Button>
        }
      >
        {selectedDeliveryNote ? (
          <>
            <div className="detail-header" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="detail-item">
                    <Text type="secondary">N° Bon</Text>
                    <Title level={4}>{selectedDeliveryNote.numero_bon}</Title>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="detail-item">
                    <Text type="secondary">Date de réception</Text>
                    <Title level={4}>
                      {selectedDeliveryNote.date_reception}
                    </Title>
                  </div>
                </Col>
              </Row>
            </div>

            <Divider orientation="left">Informations client</Divider>
            {selectedDeliveryNote.client_details ? (
              <div className="client-details" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Text strong>Nom: </Text>
                    <Text>
                      {selectedDeliveryNote.client_details.nom_client}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Téléphone: </Text>
                    <Text>
                      {selectedDeliveryNote.client_details.telephone || "-"}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Email: </Text>
                    <Text>
                      {selectedDeliveryNote.client_details.email || "-"}
                    </Text>
                  </Col>
                  <Col span={24}>
                    <Text strong>Adresse: </Text>
                    <Text>
                      {selectedDeliveryNote.client_details.adresse || "-"}
                    </Text>
                  </Col>
                </Row>
              </div>
            ) : (
              <Empty description="Aucune information client disponible" />
            )}

            <Divider orientation="left">Matières reçues</Divider>
            {selectedDeliveryNote.matieres_details?.length > 0 ? (
              <Table
                dataSource={selectedDeliveryNote.matieres_details}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Type",
                    dataIndex: "type_matiere",
                    key: "type_matiere",
                    render: (type) => (
                      <Tag color={getMaterialTypeColor(type)}>
                        {renderMaterialType(type)}
                      </Tag>
                    ),
                  },
                  {
                    title: "Description",
                    dataIndex: "description",
                    key: "description",
                    render: (text) => text || "-",
                  },
                  {
                    title: "Quantité",
                    dataIndex: "quantite",
                    key: "quantite",
                  },
                  {
                    title: "Surface",
                    dataIndex: "surface",
                    key: "surface",
                    render: (val) => (val ? `${val} m²` : "-"),
                  },
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      Total
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      {calculateTotalQuantity(
                        selectedDeliveryNote.matieres_details
                      )}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}></Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            ) : (
              <Empty description="Aucune matière première dans ce bon de livraison" />
            )}

            {selectedDeliveryNote.notes && (
              <>
                <Divider orientation="left">Notes</Divider>
                <div className="notes-section" style={{ marginBottom: 24 }}>
                  <Text>{selectedDeliveryNote.notes}</Text>
                </div>
              </>
            )}
          </>
        ) : (
          <Spin />
        )}
      </Drawer>
    </div>
  );
};

export default BonLivraisonReception;
