import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Button,
  message,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  Spin,
  Divider,
  Card,
  List,
  Tag,
  Badge,
  DatePicker,
  Row,
  Col,
  Tooltip,
  Flex,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  PrinterOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";
import moment from "moment";
// Import our new PDF API service
import PdfApiService from "../services/PdfApiService";
import WorkService from "../services/WorkService";
import ClientService from "../services/ClientService";
import ProductService from "../services/ProductService";
// Import the RawMaterialService and InvoiceService
import RawMaterialService from "../services/RawMaterialService";
import InvoiceService from "../services/InvoiceService"; // Import CSS
import "./WorkManagementPage.css";
import { getApiService } from "../../../services/apiServiceFactory";
import BonLivraisonDecoupePdfService from "../../../services/BonLivraisonDecoupePdfService";

const { Option } = Select;
const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { cdsService } = getApiService();

const WorkManagementPage = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [form] = Form.useForm();
  const [created, setCreated] = useState(false);

  // For client and product selection
  const [clientOptions, setClientOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  // Add new state for client materials - RESTORED
  const [clientMaterials, setClientMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Add state for bill generation
  const [billableData, setBillableData] = useState([]);
  const [isBillModalVisible, setIsBillModalVisible] = useState(false);
  const [taxRate, setTaxRate] = useState(19); // Default tax rate of 19%
  const [billDate, setBillDate] = useState(moment().format("YYYY-MM-DD"));
  const [invoiceNumber, setInvoiceNumber] = useState(""); // State for invoice number

  // Add new state for client filter
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);

  // Add state for selected rows
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRowsData, setSelectedRowsData] = useState([]);

  useEffect(() => {
    if (created) {
      console.log("✅ Modal.success triggered");
      Modal.success({
        title: "Facture créée avec succès",
        content: "La facture a bien été générée et enregistrée.",
        centered: true,
        onOk: () => setCreated(false),
        afterClose: () => setCreated(false),
      });
    }
  }, [created]);

  useEffect(() => {
    if (created) {
      const timer = setTimeout(() => {
        setCreated(false);
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [created]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchWorks();
    fetchInitialOptions();
  }, [selectedClientFilter]); // Re-fetch works when client filter changes

  const fetchWorks = async () => {
    setLoading(true);
    try {
      let data;
      if (selectedClientFilter) {
        // Fetch works for specific client
        data = await WorkService.getWorksByClientId(selectedClientFilter);
      } else {
        // Fetch all works
        data = await WorkService.getAllWorks();
      }
      setWorks(data);
    } catch (error) {
      message.error("Erreur lors du chargement des travaux");
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialOptions = async () => {
    try {
      // Fetch initial clients for dropdown
      const clients = await ClientService.getAllClients();
      setClientOptions(
        clients.map((client) => ({
          label: client.nom_client,
          value: client.id,
        }))
      );

      // Fetch initial products for dropdown
      const products = await ProductService.getAllProducts();
      setProductOptions(
        products.map((product) => ({
          label: product.nom_produit,
          value: product.id,
        }))
      );
    } catch (error) {
      message.error("Erreur lors du chargement des options");
    }
  };

  const handleSearch = async (value, type) => {
    if (value.length < 2) return;

    if (type === "client") {
      setClientSearchLoading(true);
      try {
        const clients = await ClientService.searchClients(value);
        setClientOptions(
          clients.map((client) => ({
            label: client.nom_client,
            value: client.id,
          }))
        );
      } catch (error) {
        console.error("Error searching clients:", error);
      } finally {
        setClientSearchLoading(false);
      }
    } else if (type === "product") {
      setProductSearchLoading(true);
      try {
        const products = await ProductService.searchProducts(value);
        setProductOptions(
          products.map((product) => ({
            label: product.nom_produit,
            value: product.id,
          }))
        );
      } catch (error) {
        console.error("Error searching products:", error);
      } finally {
        setProductSearchLoading(false);
      }
    }
  };

  const debouncedSearch = debounce(handleSearch, 500);

  const handleAdd = () => {
    form.resetFields();
    setEditingWork(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingWork(record);
    form.setFieldsValue({
      client_id: record.client_id,
      produit_id: record.produit_id,
      duree: record.duree,
      quantite: record.quantite,
      description: record.description,
    });

    // Fetch materials for this client - RESTORED
    if (record.client_id) {
      handleClientChange(record.client_id);
    }

    // Pre-populate selected materials if record has matiere_usages - RESTORED
    if (record.matiere_usages && record.matiere_usages.length > 0) {
      const initialSelectedMaterials = record.matiere_usages.map((usage) => ({
        materialId: usage.matiere_id,
        quantite: usage.quantite_utilisee,
      }));
      setSelectedMaterials(initialSelectedMaterials);
    } else {
      setSelectedMaterials([]);
    }

    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await WorkService.deleteWork(id);
      message.success("Travail supprimé avec succès");
      fetchWorks();
    } catch (error) {
      message.error("Erreur lors de la suppression");
    }
  };

  // handleClientChange - RESTORED
  const handleClientChange = async (clientId) => {
    if (!clientId) {
      setClientMaterials([]);
      setSelectedMaterials([]);
      return;
    }

    setLoadingMaterials(true);
    try {
      console.log("Fetching materials for client ID:", clientId);
      const materials = await RawMaterialService.get_materials_by_client_id(
        clientId
      );
      console.log("Retrieved materials:", materials);
      setClientMaterials(materials);
      setSelectedMaterials([]); // Reset selected materials when client changes
    } catch (error) {
      console.error("Error fetching client materials:", error);
      message.error(
        "Erreur lors du chargement des matières premières du client."
      );
    } finally {
      setLoadingMaterials(false);
    }
  };

  // handleMaterialSelect - RESTORED
  const handleMaterialSelect = (materialId, quantite) => {
    const existingIndex = selectedMaterials.findIndex(
      (m) => m.materialId === materialId
    );

    if (quantite === null || quantite === 0) {
      // If quantity is cleared or zero, remove it
      if (existingIndex >= 0) {
        setSelectedMaterials(
          selectedMaterials.filter((m) => m.materialId !== materialId)
        );
      }
      return;
    }

    if (existingIndex >= 0) {
      const updatedMaterials = [...selectedMaterials];
      updatedMaterials[existingIndex].quantite = quantite;
      setSelectedMaterials(updatedMaterials);
    } else {
      setSelectedMaterials([...selectedMaterials, { materialId, quantite }]);
    }
  };

  // handleRemoveMaterial - RESTORED
  const handleRemoveMaterial = (materialId) => {
    setSelectedMaterials(
      selectedMaterials.filter((m) => m.materialId !== materialId)
    );
  };

  const handleSubmit = async (values) => {
    try {
      // Temporary workaround: halve the quantity of each selected material before sending
      const adjustedMaterials = selectedMaterials.map((material) => ({
        materialId: material.materialId,
        quantite: material.quantite / 2,
      }));

      const workData = {
        ...values,
        materialsUsed: adjustedMaterials,
      };
      console.log("workdata", workData);
      if (editingWork) {
        await WorkService.updateWork(editingWork.id, workData);
        message.success("Travail mis à jour avec succès");
      } else {
        await WorkService.createWork(workData);
        message.success("Travail ajouté avec succès");
      }
      setIsModalVisible(false);
      fetchWorks();

      setSelectedMaterials([]);
      setClientMaterials([]);
      form.resetFields();
    } catch (error) {
      message.error("Erreur lors de l'enregistrement");
    }
  };

  // Function to handle selected works and prepare bill data
  const handleProcessSelectedWorks = async () => {
    try {
      if (!selectedRowsData || selectedRowsData.length === 0) {
        message.error("Aucun travail sélectionné");
        return;
      }

      // Show loading
      message.loading({
        content: "Récupération des détails...",
        key: "materialsLoading",
      });
      console.log("selected", selectedRowsData);
      // Process each work to add client and material details
      const enrichedWorksData = await Promise.all(
        selectedRowsData.map(async (work) => {
          const enrichedWork = { ...work };

          // Ensure client_id is always included and available
          if (!work.client_id && work.client?.id) {
            enrichedWork.client_id = work.client.id;
          }

          // If client data is not already present, fetch it
          if (enrichedWork.client_id && (!work.clientDetails || !work.client)) {
            try {
              const clientData = await ClientService.getClientById(
                enrichedWork.client_id
              );
              enrichedWork.clientDetails = {
                id: clientData.id, // Ensure client ID is preserved
                nom_cf: clientData.nom_client,
                adresse: clientData.adresse,
                matricule_fiscale: clientData.numero_fiscal,
                tel: clientData.telephone,
                email: clientData.email,
                nom_responsable: clientData.nom_responsable,
                email_responsable: clientData.email_responsable,
                telephone_responsable: clientData.telephone_responsable,
                autre_numero: clientData.autre_numero,
              };
            } catch (error) {
              console.error(
                `Error fetching client ${enrichedWork.client_id}:`,
                error
              );
            }
          } else if (work.client) {
            // If client data is already present, still format it consistently
            enrichedWork.clientDetails = {
              id: work.client.id, // Ensure client ID is preserved
              nom_cf: work.client.nom_client,
              adresse: work.client.adresse,
              matricule_fiscale: work.client.numero_fiscal,
              tel: work.client.telephone,
              email: work.client.email,
              nom_responsable: work.client.nom_responsable,
              email_responsable: work.client.email_responsable,
              telephone_responsable: work.client.telephone_responsable,
              autre_numero: work.client.autre_numero,
            };
          }

          // Ensure product details, including unit price, are available for billing
          let productUnitPrice = 0;
          if (work.produit && typeof work.produit.prix !== "undefined") {
            productUnitPrice = work.produit.prix;
          } else if (work.produit_id) {
            try {
              const productDetails = await ProductService.getProductById(
                work.produit_id
              );
              if (productDetails) {
                productUnitPrice = productDetails.prix;
                enrichedWork.produit = productDetails;

                enrichedWork.code_produit =
                  productDetails.code_produit || "N/A";
              }
            } catch (error) {
              console.error(
                `Error fetching product details for ID ${work.produit_id}:`,
                error
              );
            }
          }

          if (typeof productUnitPrice !== "number" || isNaN(productUnitPrice)) {
            productUnitPrice = 0; // Default to 0 if undefined, null, or NaN
          }

          // If material usage data is present but missing details, enrich it
          if (work.matiere_usages && work.matiere_usages.length > 0) {
            const enrichedMaterialUsages = await Promise.all(
              work.matiere_usages.map(async (usage) => {
                // If the usage already has all necessary data, just return it
                if (
                  usage.nom_matiere &&
                  usage.type_matiere &&
                  usage.prix_unitaire
                ) {
                  return usage;
                }

                try {
                  // Get material details
                  const materialDetail =
                    await RawMaterialService.getMaterialById(usage.matiere_id);
                  return {
                    ...usage,
                    nom_matiere:
                      materialDetail.nom_matiere || materialDetail.designation,
                    type_matiere: materialDetail.type_matiere,
                    prix_unitaire: materialDetail.prix_unitaire || 0,
                    thickness: materialDetail.thickness,
                    length: materialDetail.length,
                    width: materialDetail.width,
                  };
                } catch (error) {
                  console.error(
                    `Error fetching material details for ID ${usage.matiere_id}:`,
                    error
                  );
                  return usage;
                }
              })
            );

            enrichedWork.matiere_usages = enrichedMaterialUsages;
          }

          // Add billable data fields with default values
          enrichedWork.billable = {
            date_facturation: moment().format("YYYY-MM-DD"),
            prix_unitaire_produit: productUnitPrice, // Use fetched product unit price as default
            quantite_produit: enrichedWork.quantite || 1, // Quantity of the product
            taxe: taxRate,
            remise: enrichedWork.remise || 0,
            // total_ht will be calculated dynamically in the modal/PDF
          };

          return enrichedWork;
        })
      );

      console.log(
        "Enriched works data with client details:",
        enrichedWorksData
      );

      // Hide loading
      message.success({
        content: "Détails récupérés",
        key: "materialsLoading",
        duration: 1,
      });

      // Set the billable data
      setBillableData(enrichedWorksData);
      const invoicesData = await InvoiceService.getAllInvoices();

      // Generate invoice number using InvoiceService
      const generatedInvoiceNumber = InvoiceService.generateInvoiceNumber(
        invoicesData.results
      );
      setInvoiceNumber(generatedInvoiceNumber);

      // Show the bill modal
      setIsBillModalVisible(true);
    } catch (error) {
      console.error("Error processing selected works:", error);
      message.error("Erreur lors du traitement des travaux sélectionnés");
    }
  };
  const sendDataToFacture = async () => {
    try {
      // Fallback: if billableData is empty, process selectedRowsData on the fly
      let workingData = billableData;
      if (!billableData || billableData.length === 0) {
        if (!selectedRowsData || selectedRowsData.length === 0) {
          message.error("Aucun travail sélectionné");
          return;
        }

        message.loading({
          content: "Préparation de la facture...",
          key: "facturePrep",
        });

        workingData = await Promise.all(
          selectedRowsData.map(async (work) => {
            const enrichedWork = { ...work };

            if (!work.client_id && work.client?.id) {
              enrichedWork.client_id = work.client.id;
            }

            if (
              enrichedWork.client_id &&
              (!work.clientDetails || !work.client)
            ) {
              const clientData = await ClientService.getClientById(
                enrichedWork.client_id
              );
              enrichedWork.clientDetails = {
                id: clientData.id,
                nom_cf: clientData.nom_client,
                adresse: clientData.adresse,
                matricule_fiscale: clientData.numero_fiscal,
                tel: clientData.telephone,
                email: clientData.email,
                nom_responsable: clientData.nom_responsable,
                email_responsable: clientData.email_responsable,
                telephone_responsable: clientData.telephone_responsable,
                autre_numero: clientData.autre_numero,
              };
            }

            let productUnitPrice = 0;
            if (work.produit && typeof work.produit.prix !== "undefined") {
              productUnitPrice = work.produit.prix;
            } else if (
              work.produit_id &&
              (!work.produit || !work.produit.code_produit)
            ) {
              try {
                const productDetails = await ProductService.getProductById(
                  work.produit_id
                );
                if (productDetails) {
                  enrichedWork.produit = productDetails;
                  enrichedWork.code_produit =
                    productDetails.code_produit || "N/A";
                }
              } catch (err) {
                console.warn("Could not fetch full product:", err);
              }
            }
            console.log(
              "✅ Processed work:",
              enrichedWork.produit?.code_produit
            );

            if (work.matiere_usages?.length > 0) {
              enrichedWork.matiere_usages = await Promise.all(
                work.matiere_usages.map(async (usage) => {
                  if (usage.nom_matiere && usage.prix_unitaire) return usage;
                  const mat = await RawMaterialService.getMaterialById(
                    usage.matiere_id
                  );
                  return {
                    ...usage,
                    nom_matiere: mat.nom_matiere || mat.designation,
                    type_matiere: mat.type_matiere,
                    prix_unitaire: mat.prix_unitaire || 0,
                    thickness: mat.thickness,
                    length: mat.length,
                    width: mat.width,
                  };
                })
              );
            }

            enrichedWork.billable = {
              date_facturation: moment().format("YYYY-MM-DD"),
              prix_unitaire_produit: productUnitPrice,
              quantite_produit: enrichedWork.quantite || 1,
              taxe: taxRate,
              remise: enrichedWork.remise || 0,
            };

            return enrichedWork;
          })
        );

        setBillableData(workingData);
        message.success({
          content: "Données enrichies",
          key: "facturePrep",
          duration: 1,
        });
      }

      // From here: build orderPayload and send API request
      const client =
        workingData[0].clientDetails || workingData[0].client || {};
      const selectedClientId = client.id;

      let finalMontantHt = 0;

      const produits = workingData.flatMap((item) => {
        const produitId = item.produit_id || item.produit?.id;
        const quantite = item.billable?.quantite_produit || 0;
        const prixUnitaire = item.billable?.prix_unitaire_produit || 0;
        const remise = item.billable?.remise || 0;

        const produitTotal = quantite * prixUnitaire - remise;
        finalMontantHt += produitTotal;

        const productLine = [
          {
            produit: produitId,
            quantite,
            prix_unitaire: prixUnitaire,
            remise_pourcentage: 0,
          },
        ];

        const materialLines =
          item.matiere_usages?.map((mat) => {
            const matTotal =
              (mat.prix_unitaire || 0) * (mat.quantite_utilisee || 0);
            finalMontantHt += matTotal;

            return {
              produit: mat.matiere_id,
              quantite: mat.quantite_utilisee || 0,
              prix_unitaire: mat.prix_unitaire || 0,
              remise_pourcentage: 0,
            };
          }) || [];

        return [...productLine, ...materialLines];
      });

      const finalMontantTva = finalMontantHt * (taxRate / 100);
      const finalMontantTtc = finalMontantHt + finalMontantTva;

      const orderPayload = {
        client_id: selectedClientId,
        client: selectedClientId,
        date_commande: moment(billDate).format("YYYY-MM-DD"),
        date_livraison_prevue: null,
        statut: "pending",
        notes: "",
        conditions_paiement: "",
        mode_paiement: "cash",
        tax_rate: taxRate,
        timbre_fiscal: 1,
        montant_ht: finalMontantHt,
        montant_tva: finalMontantTva,
        montant_ttc: finalMontantTtc,
        produits,
      };

      console.log(" Payload prêt à envoyer :", orderPayload);

      const response = await cdsService.createOrder(orderPayload);
      message.success("Facture créée avec succès !");
      console.log("Facture créée :", response);
      setCreated(true);
      return true;
    } catch (error) {
      console.error("Erreur facture :", error);
      message.error(error?.response?.data?.detail || "Erreur inconnue.");
      return false;
    }
  };

  // When fetching works, we should also get material details
  // Updated function to fetch complete material details for a work
  const fetchWorkWithMaterialDetails = async (workId) => {
    try {
      // Get the basic work data
      const workData = await WorkService.getWorkById(workId);

      if (!workData) return null;

      // If the work has material usages, fetch material details
      if (workData.matiere_usages && workData.matiere_usages.length > 0) {
        const enrichedMaterialUsages = await Promise.all(
          workData.matiere_usages.map(async (usage) => {
            try {
              // Get material details
              const materialDetail = await RawMaterialService.getMaterialById(
                usage.matiere_id
              );
              return { ...usage, ...materialDetail };
            } catch (error) {
              return usage; // Return original usage if fetching details fails
            }
          })
        );

        workData.matiere_usages = enrichedMaterialUsages;
      }

      return workData;
    } catch (error) {
      console.error("Error fetching work details:", error);
      return null;
    }
  };

  // Expanded row selection configuration to potentially fetch material details
  const rowSelection = {
    selectedRowKeys,
    onChange: async (keys, selectedRows) => {
      setSelectedRowKeys(keys);

      // If you need to fetch additional material details when selecting rows:
      /*
      const enrichedRows = await Promise.all(selectedRows.map(async (row) => {
        if (row.matiere_usages && row.matiere_usages.some(m => !m.material_name)) {
          // If any material is missing details, fetch them
          const workWithDetails = await fetchWorkWithMaterialDetails(row.id);
          return workWithDetails || row;
        }
        return row;
      }));
      setSelectedRowsData(enrichedRows);
      */

      // Otherwise just use the rows as they are
      setSelectedRowsData(selectedRows);
      console.log(
        "🔎 Selected rows:",
        selectedRows.map((item) => ({
          id: item.id,
          produit: item.produit,
          code_produit: item.produit?.code_produit,
        }))
      );
    },
  };

  const columns = [
    {
      title: "Client",
      dataIndex: "client_name",
      key: "client",
      render: (text, record) => (
        <Space>
          {record.client_name || record.client?.nom_client || "N/A"}
          {record.client_id && (
            <Link
              to={`/clients/${record.client_id}`}
              style={{ color: "inherit" }}
            >
              <ArrowRightOutlined style={{ fontSize: "12px" }} />
            </Link>
          )}
        </Space>
      ),
    },
    {
      title: "Produit",
      dataIndex: "produit_name",
      key: "produit",
      render: (text, record) => (
        <Space>
          {record.produit_name || record.produit?.nom_produit || "N/A"}
          {record.produit_id && (
            <Link
              to={`/products/${record.produit_id}`}
              style={{ color: "inherit" }}
            >
              <ArrowRightOutlined style={{ fontSize: "12px" }} />
            </Link>
          )}
        </Space>
      ),
    },
    {
      title: "Durée",
      dataIndex: "duree",
      key: "duree",
    },
    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      // RESTORED Matériaux utilisés column
      title: "Matériaux utilisés",
      key: "materials",
      render: (_, record) =>
        record.matiere_usages && record.matiere_usages.length > 0 ? (
          <span>{record.matiere_usages.length} matière(s) utilisée(s)</span>
        ) : (
          <span>Aucun</span>
        ),
    },
    {
      title: "Date de création",
      dataIndex: "date_creation",
      key: "date_creation",
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce travail?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Function to generate PDF from bill data using PDF API
  const generateBillPDF = async () => {
    try {
      if (!billableData || billableData.length === 0) {
        message.error("Aucune donnée à imprimer");
        return;
      }

      message.loading({
        content: "Génération de la facture via API...",
        key: "generatePDF",
      });

      // Get client data from the first billable item
      const clientData =
        billableData[0].clientDetails || billableData[0].client || {};
      console.log("Client data for PDF:", clientData);

      // Calculate totals
      let totalHT = 0;
      let totalTVA = 0;

      // Prepare items for the invoice
      const invoiceItems = billableData.flatMap((item) => {
        const productItems = [];

        // Add product as an item
        const remise = item.billable.remise || 0;
        const productTotal =
          (item.billable.prix_unitaire_produit || 0) *
            (item.billable.quantite_produit || 0) -
          remise;
        totalHT += productTotal;

        if (productTotal > 0) {
          productItems.push({
            code: item.code_produit || "",
            description:
              (item.produit_name || "N/A") +
              (item.description ? ` (${item.description})` : ""),
            quantity: item.billable.quantite_produit || item.quantite,
            unitPrice: item.billable.prix_unitaire_produit || 0,
            discount: 0, // Default discount
            taxRate: taxRate,
          });
        }

        // Add materials as items if they exist
        if (item.matiere_usages && item.matiere_usages.length > 0) {
          const materialItems = item.matiere_usages
            .filter((mat) => {
              const matTotal =
                (mat.prix_unitaire || 0) * (mat.quantite_utilisee || 0);
              if (matTotal > 0) {
                totalHT += matTotal;
                return true;
              }
              return false;
            })
            .map((mat) => ({
              code: mat.matiere_id || "",
              description: `Matériau: ${mat.nom_matiere || mat.designation} (${
                mat.type_matiere || ""
              }) ${mat.thickness || ""}x${mat.length || ""}x${
                mat.width || ""
              }mm`,
              quantity: mat.quantite_utilisee,
              unitPrice: mat.prix_unitaire || 0,
              discount: 0,
              taxRate: taxRate,
            }));

          productItems.push(...materialItems);
        }

        return productItems;
      });

      console.log("Invoice items:", invoiceItems);

      // Calculate totals
      totalTVA = totalHT * (taxRate / 100);
      const totalTTC = totalHT + totalTVA;

      // No discount in this implementation
      const discountRate = 0;
      const totalHTAfterDiscount = totalHT;

      // Create invoice data object
      const invoiceData = {
        numero_facture: invoiceNumber,
        date_emission: billDate,
        tax_rate: taxRate,
        client_details: {
          nom_client: clientData.nom_cf || clientData.nom_client || "N/A",
          adresse: clientData.adresse || "N/A",
          numero_fiscal:
            clientData.matricule_fiscale || clientData.numero_fiscal || "N/A",
          telephone: clientData.tel || clientData.telephone || "N/A",
        },
        items: billableData.map((item) => {
          const quantity = item.billable.quantite_produit || 0;
          const unitPrice = item.billable.prix_unitaire_produit || 0;
          const remise = item.billable.remise || 0;
          const remisePercent = (remise / (quantity * unitPrice)) * 100 || 0;
          console.log("📦 PDF item:", {
            produit_id: item.produit_id,
            produit_name: item.produit_name,
            code_produit: item.code_produit,
          });

          return {
            code_produit: item.code_produit || "N/A",
            nom_produit:
              item.produit_name || item.produit?.nom_produit || "N/A",
            description: item.description || "",
            billable: {
              quantite: quantity,
              prix_unitaire: unitPrice,
              remise_percent: parseFloat(remisePercent.toFixed(2)),
              total_ht: quantity * unitPrice - remise,
            },
          };
        }),
        total_ht: totalHT,
        total_tax: totalTVA,
        total_ttc: totalTTC,
      };

      console.log("Final invoice data being sent to PDF API:", invoiceData);

      // Use the PDF API service
      await BonLivraisonDecoupePdfService.generateDecoupeInvoicePDF(
        invoiceData,
        `facture-${billDate}-${invoiceNumber}.pdf`
      );

      message.success({
        content: "Facture générée avec succès!",
        key: "generatePDF",
      });
      return true;
    } catch (error) {
      console.error("Error generating PDF with API:", error);
      message.error({
        content: `Erreur lors de la génération de la facture: ${error.message}`,
        key: "generatePDF",
      });
      return false;
    }
  };

  // Function to save invoice data using InvoiceService
  const saveBillableData = async () => {
    try {
      if (!billableData || billableData.length === 0) {
        message.error("Aucune donnée à enregistrer");
        return false;
      }

      // Extract client ID from the first item (all items should be for the same client)
      // Ensure clientDetails is preferred if available, otherwise fallback to client object
      const firstBillableItemClient =
        billableData[0].clientDetails || billableData[0].client;
      const clientId = firstBillableItemClient?.id;

      if (!clientId) {
        message.error("ID du client manquant dans les données à facturer.");
        return false;
      }

      // Construct the detailed line items for the invoice
      const lineItems = billableData.map((item) => {
        // Ensure product details are available
        const produitName =
          item.produit_name || item.produit?.nom_produit || "Produit inconnu";
        const produitId = item.produit_id || item.produit?.id;
        const code_produit = item.code_produit || item.produit?.code_produit;

        return {
          work_id: item.id, // Original Work ID
          produit_id: produitId,
          produit_name: produitName,
          code_produit: code_produit,
          description_travail: item.description, // Description from the work item
          quantite_produit: item.billable.quantite_produit,
          prix_unitaire_produit: item.billable.prix_unitaire_produit,
          matiere_usages: (item.matiere_usages || []).map((mat) => ({
            matiere_id: mat.matiere_id,
            nom_matiere:
              mat.nom_matiere || mat.designation || "Matériau inconnu",
            type_matiere: mat.type_matiere || "",
            thickness: mat.thickness,
            length: mat.length,
            width: mat.width,
            quantite_utilisee: mat.quantite_utilisee,
            prix_unitaire: mat.prix_unitaire, // Unit price of the material from the bill modal
          })),
        };
      });

      // Create the complete data object to save
      const invoiceToPost = {
        client_id: clientId,
        client: clientId,
        numero_facture: invoiceNumber,
        tax_rate: taxRate,
        date_emission: billDate,
        date_echeance: moment(billDate).add(30, "days").format("YYYY-MM-DD"), // Default due date 30 days from bill date
        statut: "draft", // Or any other appropriate status
        line_items: lineItems,
        // Optionally, include totals if the backend expects them, otherwise, it can calculate them.
        // total_ht: billableData.reduce(...), // Calculate total HT based on line_items
        // total_ttc: billableData.reduce(...), // Calculate total TTC
      };

      // Log the data that will be posted
      console.log(
        "Data to be posted for invoice:",
        JSON.stringify(invoiceToPost, null, 2)
      );

      // Show loading message
      message.loading({
        content: "Enregistrement de la facture...",
        key: "savingInvoice",
      });

      // Use InvoiceService to save the invoice.
      // The InvoiceService.createInvoice method should be adapted to accept this single object.
      const savedInvoice = await InvoiceService.createInvoice(
        invoiceToPost,
        clientId
      );

      message.success({
        content: "Facture enregistrée avec succès!",
        key: "savingInvoice",
        duration: 2,
      });
      console.log("Saved invoice response:", savedInvoice);

      // Optionally, update the local state if the backend returns the full saved invoice object
      // For example, if the backend assigns an ID to the invoice or line items:
      // setInvoiceNumber(savedInvoice.numero_facture); // If it can change or be assigned by backend
      // setBillableData( ... updated billableData with IDs from savedInvoice.line_items ... );

      return true;
    } catch (error) {
      console.error("Error saving invoice data:", error);
      const errorMessage =
        error.response?.data?.detail || error.message || "Erreur inconnue";
      message.error({
        content: `Erreur lors de l'enregistrement: ${errorMessage}`,
        key: "savingInvoice",
        duration: 4,
      });
      return false;
    }
  };

  // Add this function before the return statement
  const testPDFAPI = async () => {
    try {
      message.loading({ content: "Testing PDF API...", key: "testAPI" });
      const result = await PdfApiService.testAPI();

      if (result.success) {
        message.success({ content: result.message, key: "testAPI" });
      } else {
        message.error({ content: result.message, key: "testAPI" });
      }
    } catch (error) {
      message.error({
        content: `Test failed: ${error.message}`,
        key: "testAPI",
      });
    }
  };

  return (
    <Content style={{ padding: "24px", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ background: "#fff", padding: "24px", borderRadius: "2px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <Title level={2}>Gestion des Travaux</Title>
          <Space>
            {selectedRowKeys.length > 0 && (
              <div>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleProcessSelectedWorks}
                  style={{ marginRight: 10 }}
                >
                  Traiter {selectedRowKeys.length} travail(s) sélectionné(s)
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={async () => {
                    const success = await sendDataToFacture();
                    if (success) {
                      setCreated(true);
              
                    
                      return true;
                    }
                  }}
                >
                  Créer une facture
                </Button>
                {created && (
                  <div
                    style={{
                      position: "fixed",
                      top: "20px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#52c41a",
                      color: "white",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      zIndex: 9999,
                      fontSize: "16px",
                      fontWeight: "500",
                      transition: "opacity 0.3s ease-in-out",
                    }}
                  >
                    ✅ Facture créée avec succès !
                  </div>
                )}
              </div>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Ajouter un travail
            </Button>
          </Space>
        </div>

        <div
          style={{ marginBottom: 16, display: "flex", alignItems: "center" }}
        >
          <Text strong style={{ marginRight: 12 }}>
            Filtrer par client:
          </Text>
          <Select
            style={{ width: 300 }}
            placeholder="Sélectionnez un client ou 'Tous'"
            onChange={(value) => setSelectedClientFilter(value)}
            value={selectedClientFilter}
            allowClear
            options={[
              { label: "Tous les clients", value: null },
              ...clientOptions,
            ]}
            loading={clientSearchLoading}
          />
          {selectedClientFilter && (
            <Button
              type="link"
              onClick={() => setSelectedClientFilter(null)}
              style={{ marginLeft: 8 }}
            >
              Réinitialiser le filtre
            </Button>
          )}
        </div>

        {selectedClientFilter && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">
              {clientOptions.find((c) => c.value === selectedClientFilter)
                ?.label || "Client sélectionné"}
            </Tag>
          </div>
        )}

        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Badge
              count={selectedRowKeys.length}
              style={{ backgroundColor: "#108ee9" }}
            >
              <Tag color="processing">Travaux sélectionnés</Tag>
            </Badge>
            <Button
              size="small"
              type="link"
              onClick={() => {
                setSelectedRowKeys([]);
                setSelectedRowsData([]);
              }}
            >
              Effacer la sélection
            </Button>
          </div>
        )}

        <Table
          rowSelection={rowSelection}
          loading={loading}
          columns={columns}
          dataSource={works}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editingWork ? "Modifier un travail" : "Ajouter un travail"}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="client_id"
              label="Client"
              rules={[
                { required: true, message: "Veuillez sélectionner un client" },
              ]}
            >
              <Select
                showSearch
                placeholder="Rechercher un client..."
                filterOption={false}
                onSearch={(value) => debouncedSearch(value, "client")}
                onChange={(value) => {
                  console.log("Client selected:", value);
                  handleClientChange(value);
                }}
                loading={clientSearchLoading}
                notFoundContent={
                  clientSearchLoading ? <Spin size="small" /> : null
                }
                options={clientOptions}
              />
            </Form.Item>

            {/* RESTORED clientMaterials and selectedMaterials sections */}
            {clientMaterials.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Divider orientation="left">
                  Matières Premières Disponibles pour ce Client
                </Divider>
                <List
                  loading={loadingMaterials}
                  dataSource={clientMaterials}
                  renderItem={(material) => {
                    const currentSelection = selectedMaterials.find(
                      (sm) => sm.materialId === material.id
                    );
                    return (
                      <List.Item>
                        <Card style={{ width: "100%" }} size="small">
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <Tag color="blue">
                                {material.type_matiere || material.materialType}
                              </Tag>
                              <span>
                                {material?.designation || "N/A"} (
                                {material?.thickness != null
                                  ? `${material.thickness}mm`
                                  : "-"}{" "}
                                ×
                                {material?.length != null
                                  ? `${material.length}mm`
                                  : "-"}{" "}
                                ×
                                {material?.width != null
                                  ? `${material.width}mm`
                                  : "-"}
                                )
                              </span>
                              <div>
                                <Text type="secondary">
                                  Disponible: {material.remaining_quantity}
                                </Text>
                              </div>
                            </div>
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <InputNumber
                                min={0} // Allow 0 to remove
                                max={material.remaining_quantity}
                                value={
                                  currentSelection
                                    ? currentSelection.quantite
                                    : undefined
                                }
                                onChange={(value) =>
                                  handleMaterialSelect(material.id, value)
                                }
                                addonAfter="pièces"
                                placeholder="Qté"
                                style={{ width: 140, marginRight: 8 }}
                              />
                              {currentSelection && (
                                <Button
                                  type="link"
                                  danger
                                  onClick={() =>
                                    handleRemoveMaterial(material.id)
                                  }
                                >
                                  Retirer
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </List.Item>
                    );
                  }}
                />

                {selectedMaterials.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5}>
                      Matières sélectionnées pour ce travail
                    </Title>
                    <List
                      size="small"
                      bordered
                      dataSource={selectedMaterials}
                      renderItem={(item) => {
                        const material = clientMaterials.find(
                          (m) => m.id === item.materialId
                        );
                        return (
                          <List.Item>
                            <Text>
                              {material?.designation ||
                                material?.type_matiere ||
                                "Matériau inconnu"}{" "}
                              ({material?.thickness || "-"}mm) - {item.quantite}{" "}
                              pièce(s)
                            </Text>
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <Form.Item
              name="produit_id"
              label="Produit"
              rules={[
                { required: true, message: "Veuillez sélectionner un produit" },
              ]}
            >
              <Select
                showSearch
                placeholder="Rechercher un produit..."
                filterOption={false}
                onSearch={(value) => debouncedSearch(value, "product")}
                loading={productSearchLoading}
                notFoundContent={
                  productSearchLoading ? <Spin size="small" /> : null
                }
                options={productOptions}
              />
            </Form.Item>

            <Form.Item
              name="duree"
              label="Durée"
              rules={[{ required: true, message: "Veuillez saisir la durée" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="quantite"
              label="Quantité Produit" // Label changed for clarity
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir la quantité du produit",
                },
              ]}
            >
              <InputNumber min={0} step={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="remise" label="Remise(%)">
              <InputNumber
                min={0}
                step={1}
                style={{ width: "100%" }}
                placeholder="Ex: 5"
              />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Description du travail..." />
            </Form.Item>

            <Divider />

            <Form.Item>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    setSelectedMaterials([]);
                    setClientMaterials([]);
                    form.resetFields();
                  }}
                >
                  Annuler
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingWork ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* Bill Modal */}
        <Modal
          title="Préparation du bon de livraison"
          open={isBillModalVisible}
          width={900}
          onCancel={() => setIsBillModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setIsBillModalVisible(false)}>
              Annuler
            </Button>,
            <Button
              key="save"
              icon={<SaveOutlined />}
              onClick={async () => {
                const success = await saveBillableData(); // Await the promise
                if (success) {
                  message.success("Facture sauvegardée avec succès");
                  setIsBillModalVisible(false); // Close modal
                }
              }}
            >
              Sauvegarder
            </Button>,
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => {
                // Generate and print the PDF
                const success = generateBillPDF();
                if (success) {
                  message.success("BON généré avec succès");
                }
                // Modal stays open as requested
              }}
            >
              Imprimer bon
            </Button>,
          ]}
        >
          <div className="bill-form-container">
            {/* Invoice Number */}
            <div style={{ textAlign: "right", marginBottom: "10px" }}>
              <Text strong>BON N°: </Text>
              <Text>{invoiceNumber}</Text>
            </div>

            {/* Global bill settings */}
            <div className="client-info-header">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Date">
                    <DatePicker
                      style={{ width: "100%" }}
                      value={moment(billDate)}
                      onChange={(date) => {
                        const formattedDate = date
                          ? date.format("YYYY-MM-DD")
                          : moment().format("YYYY-MM-DD");
                        setBillDate(formattedDate);

                        // Update all items with the new date
                        const updatedItems = billableData.map((item) => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            date_facturation: formattedDate,
                          },
                        }));
                        setBillableData(updatedItems);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="Taux de TVA (%)">
                    <Select
                      style={{ width: "100%" }}
                      onChange={(value) => {
                        setTaxRate(value);

                        // Update all items with the new tax rate
                        const updatedItems = billableData.map((item) => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            taxe: value,
                          },
                        }));
                        setBillableData(updatedItems);
                      }}
                    >
                      <Option value={0}>0%</Option>
                      <Option value={7}>7%</Option>
                      <Option value={19}>19%</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: "10px 0" }} />

              {/* Client info from first item (assuming all items are for the same client) */}
              {billableData.length > 0 && (
                <div>
                  <h3>
                    Client:{" "}
                    {billableData[0].clientDetails?.nom_cf ||
                      billableData[0].client?.nom_client ||
                      "N/A"}
                  </h3>
                  <p>
                    Matricule Fiscale:{" "}
                    {billableData[0].clientDetails?.matricule_fiscale ||
                      billableData[0].client?.numero_fiscal ||
                      "N/A"}
                  </p>
                  <p>
                    Adresse:{" "}
                    {billableData[0].clientDetails?.adresse ||
                      billableData[0].client?.adresse ||
                      "N/A"}
                  </p>
                  <p>
                    Téléphone:{" "}
                    {billableData[0].clientDetails?.tel ||
                      billableData[0].client?.telephone ||
                      "N/A"}
                  </p>
                </div>
              )}
            </div>

            {/* List of billable items */}
            <List
              dataSource={billableData}
              renderItem={(item, index) => (
                <List.Item>
                  <Card
                    title={`Travail ${index + 1}: ${
                      item.produit_name || "Produit Inconnu"
                    }`}
                    style={{ width: "100%" }}
                  >
                    <Form layout="vertical">
                      {/* Section for Product */}
                      <Row
                        gutter={16}
                        style={{
                          marginBottom: 16,
                          borderBottom: "1px solid #f0f0f0",
                          paddingBottom: 16,
                        }}
                      >
                        <Col span={10}>
                          <Form.Item label="Produit / Service">
                            <Input
                              value={
                                item.produit_name +
                                (item.description
                                  ? ` - ${item.description}`
                                  : "")
                              }
                              disabled
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item label="Qté Produit">
                            <InputNumber
                              style={{ width: "100%" }}
                              min={0}
                              value={item.billable.quantite_produit}
                              onChange={(value) => {
                                const newData = [...billableData];
                                newData[index].billable.quantite_produit =
                                  value;
                                setBillableData(newData);
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item label="Prix U. Produit">
                            <InputNumber
                              style={{ width: "100%" }}
                              min={0}
                              step={0.001}
                              value={item.billable.prix_unitaire_produit}
                              onChange={(value) => {
                                const newData = [...billableData];
                                newData[index].billable.prix_unitaire_produit =
                                  value;
                                setBillableData(newData);
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item label="Total HT Produit">
                            <InputNumber
                              style={{ width: "100%" }}
                              min={0}
                              step={0.001}
                              value={(
                                (item.billable.prix_unitaire_produit || 0) *
                                (item.billable.quantite_produit || 0)
                              ).toFixed(3)}
                              disabled
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Materials section if available */}
                      {item.matiere_usages &&
                        item.matiere_usages.length > 0 && (
                          <div>
                            <Divider orientation="left">
                              Matériaux utilisés pour ce travail
                            </Divider>
                            <Table
                              className="material-table"
                              size="small"
                              pagination={false}
                              dataSource={item.matiere_usages}
                              columns={[
                                {
                                  title: "Matériau",
                                  dataIndex: "nom_matiere",
                                  key: "nom_matiere",
                                  render: (text, record) => (
                                    <Space>
                                      <Tag color="blue">
                                        {record.type_matiere}
                                      </Tag>
                                      <span>{text}</span>
                                    </Space>
                                  ),
                                },
                                {
                                  title: "Dimensions",
                                  key: "dimensions",
                                  render: (_, record) => (
                                    <span>
                                      {record.thickness
                                        ? `${record.thickness}mm`
                                        : "-"}{" "}
                                      ×
                                      {record.length
                                        ? `${record.length}mm`
                                        : "-"}{" "}
                                      ×
                                      {record.width ? `${record.width}mm` : "-"}
                                    </span>
                                  ),
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
                                  render: (text, record, materialIndex) => (
                                    <InputNumber
                                      style={{ width: "100%" }}
                                      min={0}
                                      precision={3}
                                      value={record.prix_unitaire}
                                      onChange={(value) => {
                                        // Ensure value is a number, default to 0 if invalid
                                        const newPrice =
                                          value === null || isNaN(value)
                                            ? 0
                                            : value;

                                        setBillableData((prevBillableData) => {
                                          return prevBillableData.map(
                                            (item, i) => {
                                              if (i === index) {
                                                // `index` is from the outer List's renderItem
                                                const updatedMatiereUsages =
                                                  item.matiere_usages.map(
                                                    (mat, mi) => {
                                                      if (
                                                        mi === materialIndex
                                                      ) {
                                                        // `materialIndex` is from the column's render
                                                        return {
                                                          ...mat,
                                                          prix_unitaire:
                                                            newPrice,
                                                        };
                                                      }
                                                      return mat;
                                                    }
                                                  );
                                                // Recalculate item's total_ht if necessary, though it's mostly for display here
                                                // and final totals are calculated in the summary.
                                                return {
                                                  ...item,
                                                  matiere_usages:
                                                    updatedMatiereUsages,
                                                };
                                              }
                                              return item;
                                            }
                                          );
                                        });
                                      }}
                                    />
                                  ),
                                },
                                {
                                  title: "Total",
                                  key: "total",
                                  render: (_, record) => (
                                    <span>
                                      {(
                                        record.prix_unitaire *
                                        record.quantite_utilisee
                                      ).toFixed(3)}{" "}
                                    </span>
                                  ),
                                },
                              ]}
                            />
                          </div>
                        )}
                    </Form>
                  </Card>
                </List.Item>
              )}
            />

            {/* Summary section */}
            <Card className="summary-card" style={{ marginTop: 16 }}>
              <Row justify="end">
                <Col span={8}>
                  <div style={{ textAlign: "right" }}>
                    <p>
                      <strong>Total HT:</strong>{" "}
                      {billableData
                        .reduce((sum, item) => {
                          const productTotal =
                            (item.billable.prix_unitaire_produit || 0) *
                            (item.billable.quantite_produit || 0);
                          let materialTotalForItem = 0;
                          if (
                            item.matiere_usages &&
                            item.matiere_usages.length > 0
                          ) {
                            materialTotalForItem = item.matiere_usages.reduce(
                              (materialSum, mat) =>
                                materialSum +
                                (mat.prix_unitaire || 0) *
                                  (mat.quantite_utilisee || 0),
                              0
                            );
                          }
                          return sum + productTotal + materialTotalForItem;
                        }, 0)
                        .toFixed(3)}{" "}
                    </p>
                    <p>
                      <strong>TVA ({taxRate}%):</strong>{" "}
                      {(
                        (billableData.reduce((sum, item) => {
                          const productTotal =
                            (item.billable.prix_unitaire_produit || 0) *
                            (item.billable.quantite_produit || 0);
                          let materialTotalForItem = 0;
                          if (
                            item.matiere_usages &&
                            item.matiere_usages.length > 0
                          ) {
                            materialTotalForItem = item.matiere_usages.reduce(
                              (materialSum, mat) =>
                                materialSum +
                                (mat.prix_unitaire || 0) *
                                  (mat.quantite_utilisee || 0),
                              0
                            );
                          }
                          return sum + productTotal + materialTotalForItem;
                        }, 0) *
                          taxRate) /
                        100
                      ).toFixed(3)}{" "}
                    </p>
                    <p className="total-ttc">
                      <strong>Total TTC:</strong>{" "}
                      {(
                        billableData.reduce((sum, item) => {
                          const productTotal =
                            (item.billable.prix_unitaire_produit || 0) *
                            (item.billable.quantite_produit || 0);
                          let materialTotalForItem = 0;
                          if (
                            item.matiere_usages &&
                            item.matiere_usages.length > 0
                          ) {
                            materialTotalForItem = item.matiere_usages.reduce(
                              (materialSum, mat) =>
                                materialSum +
                                (mat.prix_unitaire || 0) *
                                  (mat.quantite_utilisee || 0),
                              0
                            );
                          }
                          return sum + productTotal + materialTotalForItem;
                        }, 0) *
                        (1 + taxRate / 100)
                      ).toFixed(3)}{" "}
                    </p>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        </Modal>
      </div>
    </Content>
  );
};

export default WorkManagementPage;
