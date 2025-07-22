import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

import {
  Button,
  Table,
  Form,
  Row,
  Col,
  Card,
  Tag,
  Modal,
  Alert,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Divider,
  Typography,
  notification,
  Spin,
  Statistic,
  Layout,
  Tooltip,
  Popconfirm,
  Badge,
  message
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  SwapOutlined,
  ReloadOutlined,
  SearchOutlined,
  PrinterOutlined,
  FilePdfOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import DevisPdfService from "../../features/devis/services/DevisPdfService";
import {
  FileDoneOutlined,
   DollarCircleOutlined,
  ClockCircleOutlined,

} from "@ant-design/icons";
import CdsService from "../../services/CdsService";
import devisService from "../../services/DevisService";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Content } = Layout;

// Helper functions for formatting and display
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("fr-TN", {
    style: "decimal",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount || 0);
};

const translateStatus = (status) => {
  const statusMap = {
    draft: "Brouillon",
    sent: "Envoyé",
    accepted: "Accepté",
    rejected: "Rejeté",
    expired: "Expiré",
    converted: "Converti",
  };
  return statusMap[status] || status;
};

const getStatusTagColor = (status) => {
  const colorMap = {
    draft: "default",
    sent: "processing",
    accepted: "success",
    rejected: "error",
    expired: "warning",
    converted: "blue",
  };
  return colorMap[status] || "default";
};

export default function Devis() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [devisList, setDevisList] = useState([]);
  const [devisDetail, setDevisDetail] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showInvoiceConvertModal, setShowInvoiceConvertModal] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState(null);
  const [invoiceConvertSuccess, setInvoiceConvertSuccess] = useState(null);
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  

  // New state variables for enhanced features
  const [currentView, setCurrentView] = useState("list");
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [currentProductsInDrawer, setCurrentProductsInDrawer] = useState([]);
  // const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filteredDevisList, setFilteredDevisList] = useState([]); // Initialize as empty array

  const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

  // Filter and search state
  const [searchText, setSearchText] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [priceRange, setPriceRange] = useState([null, null]); // [min, max]
  const [timbreFiscal, setTimbreFiscal] = useState(0); // [min, max]


  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
  // randomId of 2 letter and 3 digits placed randomly in the string
  const randomId = `ID-${Math.random()
    .toString(36)
    .substring(2, 4)
    .toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const currentYear = new Date().getFullYear();
        const currentYearsDevis = filteredDevisList.filter(devis =>
          devis.numero_devis?.includes(`DEV-${currentYear}-`)
        );
        let maxSequence = 0;
         currentYearsDevis.forEach(dev => {
           const parts = dev.numero_devis.split('-');
           const sequencePart = parts[parts.length - 1];
           const sequenceNumber = parseInt(sequencePart, 10) || 0;

           if (sequenceNumber > maxSequence) {
             maxSequence = sequenceNumber;
           }
         });
         const newSequence = String(maxSequence + 1).padStart(5, '0');

        // Generate a random order number
        const randomOrderNumber = `DEV-${new Date().getFullYear()}-${newSequence}`;
  const initialFormValues = {
    numero_devis:randomOrderNumber,
    client: undefined,
    date_emission: dayjs(),
    date_validite: dayjs().add(15, "days"),
    statut: "draft",
    tax_rate: 0,
    timbre_fiscal: 0.00,
    notes: "",
    remarques:
      "Remarques :\n_ Validité du devis : 15 jours.\n_ Ce devis doit être accepté et signé pour valider la commande",
    conditions_paiement: "50% à la commande, 50% à la livraison",
    produits: [],
  };

  // Function to filter devis based on search criteria
  const filterDevisList = useCallback(() => {
    if (!Array.isArray(devisList) || !devisList.length) return;

    let result = [...devisList];

    // Filter by search text (client name, devis number, or notes)
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (devis) =>
          (devis.nom_client &&
            devis.nom_client.toLowerCase().includes(searchLower)) ||
          (devis.numero_devis &&
            devis.numero_devis.toLowerCase().includes(searchLower)) ||
          (devis.remarques &&
            devis.remarques.toLowerCase().includes(searchLower))
      );
    }

    // Filter by client
    if (selectedClientFilter) {
      result = result.filter((devis) => devis.client === selectedClientFilter);
    }

    // Filter by status
    if (selectedStatus) {
      result = result.filter((devis) => devis.statut === selectedStatus);
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day").valueOf();
      const endDate = dateRange[1].endOf("day").valueOf();

      result = result.filter((devis) => {
        const devisDate = dayjs(devis.date_emission).valueOf();
        return devisDate >= startDate && devisDate <= endDate;
      });
    }

    // Filter by price range
    if (priceRange[0] !== null || priceRange[1] !== null) {
      result = result.filter((devis) => {
        const montantTtc = Number(devis.montant_ttc) || 0;
        const minOk = priceRange[0] === null || montantTtc >= priceRange[0];
        const maxOk = priceRange[1] === null || montantTtc <= priceRange[1];
        return minOk && maxOk;
      });
    }

    setFilteredDevisList(result);
  }, [
    devisList,
    searchText,
    selectedClientFilter,
    selectedStatus,
    dateRange,
    priceRange,
  ]);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    filterDevisList();
  }, [filterDevisList]);

  // Fetch quotes list
  const fetchDevisList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/devis/`);
      // Handle both paginated and direct array responses
      let responseData;
      if (
        response.data &&
        response.data.results &&
        Array.isArray(response.data.results)
      ) {
        responseData = response.data.results;
      } else if (Array.isArray(response.data)) {
        responseData = response.data;
      } else {
        responseData = [];
      }
      setDevisList(responseData);
      setFilteredDevisList(responseData);
      setError(null);
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: "Impossible de charger la liste des devis",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch quote details
  const fetchDevisDetail = async (devisId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/devis/${devisId}/`);
      setDevisDetail(response.data);
      setCurrentProductsInDrawer(response.data.produit_devis || []);
      setError(null);
      return response.data;
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: "Impossible de charger les détails du devis",
      });
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients for dropdown - ensure we always return an array
  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/`);
      // Check if response.data has a results property (paginated) or is directly an array
      let clientsData;
      if (
        response.data &&
        response.data.results &&
        Array.isArray(response.data.results)
      ) {
        clientsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        clientsData = response.data;
      } else {
        clientsData = [];
      }
      setClients(clientsData);
      return clientsData;
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: "Impossible de charger la liste des clients",
      });
      console.error("Erreur lors du chargement des clients:", err);
      return [];
    }
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/produits/`);
      // Handle both paginated and direct array responses
      let productsData;
      if (
        response.data &&
        response.data.results &&
        Array.isArray(response.data.results)
      ) {
        productsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else {
        productsData = [];
      }
      setProducts(productsData);
      return productsData;
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: "Impossible de charger la liste des produits",
      });
      console.error("Erreur lors du chargement des produits:", err);
      return [];
    }
  };

  // Initialize data and handle URL params
  useEffect(() => {
    fetchDevisList();
    fetchClients();
    fetchProducts();

    // Check if we have an ID in the URL and should load detail view
    if (id) {
      fetchDevisDetail(id).then((devisData) => {
        if (devisData) {
          setCurrentView("detail");
        }
      });
    }
  }, [id]);

  // Handle editing a devis
  
  const handleEditDevis = async (devis) => {
    setLoading(true);
    try {
      const fullDevisDetails = await fetchDevisDetail(devis.id);
      if (fullDevisDetails) {
        setDevisDetail(fullDevisDetails);
        setCurrentProductsInDrawer(fullDevisDetails.produit_devis || []);

        form.setFieldsValue({
          ...fullDevisDetails,
          date_emission: dayjs(fullDevisDetails.date_emission),
          date_validite: dayjs(fullDevisDetails.date_validite),
          client: fullDevisDetails.client,
          produits:
            fullDevisDetails.produit_devis?.map((p) => ({
              produit: p.produit,
              quantite: p.quantite,
              prix_unitaire: p.prix_unitaire,
              remise_pourcentage: p.remise_pourcentage,
            })) || [],
        });

        setIsDrawerVisible(true);
        setCurrentView("edit");
      } else {
        notification.error({
          message: "Erreur",
          description: "Détails du devis introuvables",
        });
      }
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: "Erreur lors de la récupération des détails du devis",
      });
    } finally {
      setLoading(false);
    }
  };
   const handleDeleteDevis = async (Id) => {
      try {
          setLoading(true);
          await axios.delete(`${API_BASE_URL}/devis/${Id}/`);
          
          message.success("Bon supprimé avec succès"); 
          fetchDevisList();
          // setDevisList(prevDevis => prevDevis.filter(note => note.id !== Id));
          // setTotalRecords(prevTotal => prevTotal - 1);
      } catch(error){
          message.error("Erreur lors de la suppression: " + error.message);
      } finally {
          setLoading(false)
      }
  
    }
  // Create new devis
  const handleCreateDevis = () => {
    form.resetFields();
    form.setFieldsValue(initialFormValues);
    setCurrentProductsInDrawer([]);
    setDevisDetail(null);
    setIsDrawerVisible(true);
    setCurrentView("create");
  };

  // Close drawer
  const handleDrawerClose = () => {
    setIsDrawerVisible(false);
    setCurrentView("list");
    setCurrentProductsInDrawer([]);
    form.resetFields();
  };

  // Calculate totals in drawer
  const recalculateTotalsInDrawer = (products, taxRate) => {
    const montantHt = products.reduce((sum, p) => sum + p.prix_total, 0);
    const montantTva = montantHt * (taxRate / 100);
    const montantTtc = montantHt + montantTva;

    form.setFieldsValue({
      montant_ht: montantHt,
      montant_tva: montantTva,
      montant_ttc: montantTtc,
    });

    if (devisDetail) {
      setDevisDetail((prev) => ({
        ...prev,
        montant_ht: montantHt,
        montant_tva: montantTva,
        montant_ttc: montantTtc,
      }));
    }
  };

  // Handle adding product to devis in drawer
  const handleAddProductToDrawer = () => {
    productForm.resetFields();
    setIsProductModalVisible(true);
  };

  // Handle product modal save
  const handleProductModalSave = async () => {
    try {
      const values = await productForm.validateFields();
      const productDetails = products.find((p) => p.id === values.produit);

      if (!productDetails) {
        notification.error({
          message: "Erreur",
          description: "Produit sélectionné introuvable",
        });
        return;
      }

      const newProductData = {
        produit: values.produit,
        nom_produit: productDetails.nom_produit,
        quantite: values.quantite,
        prix_unitaire:
          values.prix_unitaire !== undefined
            ? values.prix_unitaire
            : productDetails.prix,
        remise_pourcentage: values.remise_pourcentage || 0,
      };

      newProductData.prix_total =
        newProductData.quantite *
        newProductData.prix_unitaire *
        (1 - newProductData.remise_pourcentage / 100);

      // For create/edit, just update local state
      const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const updatedProducts = [
        ...currentProductsInDrawer,
        { ...newProductData, id: tempId },
      ];
      setCurrentProductsInDrawer(updatedProducts);

      // Remove the form.setFieldsValue for produits since we're handling it differently
      recalculateTotalsInDrawer(
        updatedProducts,
        form.getFieldValue("tax_rate") || 0
      );
      notification.success({
        message: "Succès",
        description: "Produit ajouté au devis",
      });

      setIsProductModalVisible(false);
    } catch (errorInfo) {
      console.error("Failed to save product:", errorInfo);
    }
  };

  // Handle remove product from devis in drawer
  const handleRemoveProductFromDrawer = (productId) => {
    const updatedProducts = currentProductsInDrawer.filter(
      (p) => p.id !== productId
    );
    setCurrentProductsInDrawer(updatedProducts);

    // Recalculate totals with updated products
    recalculateTotalsInDrawer(
      updatedProducts,
      form.getFieldValue("tax_rate") || 0
    );
  };

  // Submit handlers for create/edit
  const handleDrawerSave = async () => {
    try {
      setFormError(null);
      setSuccessMessage(null);
      const values = await form.validateFields();
      setLoading(true);

      // Format the date fields for API
      const formattedValues = {
        ...values,
        date_emission: values.date_emission?.format("YYYY-MM-DD"),
        date_validite: values.date_validite?.format("YYYY-MM-DD"),
        // Format products array from currentProductsInDrawer
        produits: currentProductsInDrawer.map((product) => ({
          produit: product.produit,
          quantite: product.quantite,
          prix_unitaire: product.prix_unitaire,
          remise_pourcentage: product.remise_pourcentage || 0,
        })),
      };
      console.log(values)
      if (currentView === "create") {
        const response = await axios.post(
          `${API_BASE_URL}/devis/`,
          formattedValues
        );
        notification.success({
          message: "Succès",
          description: "Devis créé avec succès",
        });
        setSuccessMessage("Devis crée avec succès !");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (currentView === "edit") {
        const devisId = devisDetail.id;
        await axios.put(`${API_BASE_URL}/devis/${devisId}/`, formattedValues);
        notification.success({
          message: "Succès",
          description: "Devis modifié avec succès",
        });
        setSuccessMessage("Devis modifié avec succès!");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchDevisDetail(devisId);
        setCurrentView("detail");
      }

      handleDrawerClose();
      fetchDevisList();
    } catch (err) {
      setError(
        "Erreur lors de la sauvegarde du devis. Veuillez vérifier les données."
      );
      notification.error({
        message: "Erreur",
        description: "Impossible d'enregistrer le devis",
      });
      setFormError(
        "Erreur lors de la création du Devis. Veuillez vérifier les champs."
      );
      setTimeout(() => setFormError(null), 4000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Convert quote to order - Updated to work from both list and detail views
  const handleConvertToOrder = async (devisToConvert = null) => {
    const targetDevis = devisToConvert || devisDetail;

    if (!targetDevis || !targetDevis.id) {
      notification.error({
        message: "Erreur",
        description: "Aucun devis sélectionné pour la conversion",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        confirmation: true,
        timbre_fiscal: targetDevis.timbre_fiscal ?? 0,
        notes: targetDevis.notes ?? "",
      };

      // 👉 Log ici pour voir les données envoyées
      console.log("🔄 Données envoyées pour conversion en commande :", payload);

      const response = await axios.post(
        `${API_BASE_URL}/devis/${targetDevis.id}/convert_to_commande/`,
        payload
      );

      setConvertSuccess({
        message: "Le devis a été converti en commande avec succès!",
        orderId: response.data.id,
        orderNumber: response.data.numero_commande,
      });

      notification.success({
        message: "Succès",
        description: "Le devis a été converti en commande avec succès!",
      });

      if (currentView === "detail" && devisDetail?.id === targetDevis.id) {
        await fetchDevisDetail(targetDevis.id);
      } else {
        await fetchDevisList();
      }

      setShowConvertModal(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Erreur lors de la conversion du devis en commande";
      setError(errorMessage);
      notification.error({
        message: "Erreur",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleConvertToInvoice = async (devisToConvert = null) => {
    const targetDevis = devisToConvert || devisDetail;
    if (!targetDevis || !targetDevis.id) {
      notification.error({
        message: "Erreur",
        description: "Aucun devis sélectionné pour la conversion",
      });
      return;
    }
    try{
      const fetchedDevis = await devisService.getDevisById(targetDevis.id)
      console.log('Fetched devis: ', fetchedDevis)
        try {
          setLoading(true);
          setError(null);
          const values = await invoiceForm.validateFields(); // Get and validate the form
    
          console.log("Form values:", values);
          console.log("Devis detail :", targetDevis);
          // Match facture backend expectations
          const payload = {
            ...targetDevis,
            date_commande: targetDevis.date_emission,
            statut: values.statut,
            date_livraison_prevue: values.date_livraison_prevue,
            mode_paiement: values.mode_paiement,
            type_facture: 'produit',
            produits: fetchedDevis.produit_devis,
            tax_rate: fetchedDevis.tax_rate,
            // devis: fetchedDevis.id
          };
    
          console.log("🔄 Données envoyées pour conversion en Facture :", payload);
    
          const response = await CdsService.createOrder(payload)
          console.log("response: ", response)
          setInvoiceConvertSuccess({
            message: "Le devis a été converti en facture avec succès!",
            orderId: response.id,
            orderNumber: response.numero_commande,
          });
    
          notification.success({
            message: "Succès",
            description: "Le devis a été converti en facture avec succès!",
          });
    
          setShowInvoiceConvertModal(false);
        } catch (err) {
          const errorMessage =
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Erreur lors de la conversion du devis en facture";
          setError(errorMessage);
          notification.error({
            message: "Erreur",
            description: errorMessage,
          });
        } finally {
          setLoading(false);
        }
      }catch(error){
        console.error('Error fetching Devis : ', error)
      }
    };


  // Status update handler
  const handleUpdateStatus = async (devisId, newStatus) => {
    try {
      setLoading(true);
      await axios.patch(`${API_BASE_URL}/devis/${devisId}/`, {
        statut: newStatus,
      });
      notification.success({
        message: "Succès",
        description: "Statut du devis mis à jour",
      });

      // If we're in detail view, refresh the detail
      if (currentView === "detail" && devisDetail?.id === devisId) {
        fetchDevisDetail(devisId);
      } else {
        fetchDevisList();
      }
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing devis details
  const handleViewDevisDetails = async (devis) => {
    const devisDetail = await fetchDevisDetail(devis.id);
    if (devisDetail) {
      setCurrentView("detail");
    }
  };

  // Generate PDF for devis - Updated to use DevisPdfService
  const handlePrintDevisPDF = async (devis) => {
    const notificationKey = `pdf-generation-${Date.now()}`;

    notification.info({
      key: notificationKey,
      message: "Génération du PDF",
      description: "Génération du PDF en cours...",
      duration: 0,
    });

    try {
      // Fetch detailed devis info for PDF
      const detailedDevis = await fetchDevisDetail(devis.id);
      if (!detailedDevis) {
        notification.error({
          message: "Erreur",
          description:
            "Impossible de générer le PDF: détails du devis introuvables",
        });
        notification.destroy(notificationKey);
        return;
      }
      console.log(devisDetail)
      // Find the client details from the clients array
      const clientDetails = clients.find(
        (client) => client.id === detailedDevis.client
      );

      // Prepare data for PDF service
      const pdfData = {
        ...detailedDevis,
        client_address: clientDetails?.adresse || "",
        client_tax_id: clientDetails?.numero_fiscal || "",
        client_phone: clientDetails?.telephone || "",
        code_client: clientDetails?.code_client || "",
        date_emission: dayjs(detailedDevis.date_emission).format("DD/MM/YYYY"),
        date_validite: dayjs(detailedDevis.date_validite).format("DD/MM/YYYY"),
      };
      console.log("details",pdfData)
      // Generate PDF using DevisPdfService
      await DevisPdfService.generateDevisPDF(
        pdfData,
        `Devis_${detailedDevis.numero_devis}.pdf`
      );

      // Show success
      notification.destroy(notificationKey);
      notification.success({
        message: "Succès",
        description: "PDF généré avec succès",
      });
    } catch (error) {
      notification.destroy(notificationKey);
      console.error("Error generating PDF:", error);
      notification.error({
        message: "Erreur",
        description: "Erreur lors de la génération du PDF",
      });
    }
  };

  // Main data columns for list view
  const columns = [
    {
      title: "№ Devis",
      dataIndex: "numero_devis",
      key: "numero_devis",
      sorter: (a, b) => a.numero_devis.localeCompare(b.numero_devis),
      fixed: "center",
      width: 120,
    },
    {
      title: "Client",
      dataIndex: "nom_client",
      key: "nom_client",
      sorter: (a, b) => a.nom_client.localeCompare(b.nom_client),
      width: 140,
    },
    {
      title: "Date d'émission",
      dataIndex: "date_emission",
      key: "date_emission",
      render: (text) => dayjs(text).format("DD/MM/YYYY"),
      sorter: (a, b) =>
        dayjs(a.date_emission).valueOf() - dayjs(b.date_emission).valueOf(),
      width: 90,
    },
    // {
    //   title: "Date de validité",
    //   dataIndex: "date_validite",
    //   key: "date_validite",
    //   render: (text) => dayjs(text).format("DD/MM/YYYY"),
    //   width: 130,
    // },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => (
        <Tag color={getStatusTagColor(status)}>{translateStatus(status)}</Tag>
      ),
      width: 70,
    },
    {
      title: "Montant HT",
      dataIndex: "montant_ht",
      key: "montant_ht",
      render: (text) => formatCurrency(text),
      width: 90,
      align: "right",
      sorter: (a, b) => a.montant_ht - b.montant_ht,
    },
    {
      title: "Montant TTC",
      dataIndex: "montant_ttc",
      key: "montant_ttc",
      render: (text) => formatCurrency(text),
      width: 90,
      align: "right",
      sorter: (a, b) => a.montant_ttc - b.montant_ttc,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Convertir en Facture">
            <Button
              icon={<SnippetsOutlined />}
                onClick={() => {
                  setDevisDetail(record);
                  setShowInvoiceConvertModal(true);
                }}
              size="small"
            />
          </Tooltip>
          {record.statut === "draft" && (
            <Tooltip title="Modifier">
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditDevis(record)}
                size="small"
              />
            </Tooltip>
          )}
          <Tooltip title="Imprimer PDF">
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => handlePrintDevisPDF(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
           <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cette devis ?"
              onConfirm={() =>  handleDeleteDevis(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Tooltip>
          {record.statut === "draft" && (
            <Tooltip title="Marquer comme envoyé">
              <Button
                icon={<SendOutlined />}
                onClick={() => handleUpdateStatus(record.id, "sent")}
                size="small"
              />
            </Tooltip>
          )}
          {record.statut === "sent" && (
            <>
              <Tooltip title="Marquer comme accepté">
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleUpdateStatus(record.id, "accepted")}
                  size="small"
                  type="primary"
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                />
              </Tooltip>
              <Tooltip title="Marquer comme rejeté">
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleUpdateStatus(record.id, "rejected")}
                  size="small"
                  danger
                />
              </Tooltip>
              
            </>
          )}
          {record.statut === "accepted" && (
            <Tooltip title="Convertir en commande">
              <Button
                icon={<SwapOutlined />}
                onClick={() => {
                  setDevisDetail(record);
                  setShowConvertModal(true);
                }}
                size="small"
                type="primary"
                style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
              />
            </Tooltip>
            
          )}
        </Space>
      ),
    },
  ];

  // Table row selection configuration
  // const rowSelection = {
  //   selectedRowKeys,
  //   onChange: (keys, rows) => {
  //     setSelectedRowKeys(keys);
  //     setSelectedRows(rows);
  //   },
  // };

  // Product columns for drawer
  const productColumnsInDrawer = [
    {
      title: "Produit",
      dataIndex: "nom_produit",
      key: "nom_produit",
      width: 200,
    },
    { title: "Qté", dataIndex: "quantite", key: "quantite", width: 80 },
    {
      title: "Prix U.",
      dataIndex: "prix_unitaire",
      key: "prix",
      render: (val) => formatCurrency(val),
      width: 120,
      align: "right",
    },
    {
      title: "Remise (%)",
      dataIndex: "remise_pourcentage",
      key: "remise_pourcentage",
      width: 100,
      align: "right",
    },
    {
      title: "Total HT",
      dataIndex: "prix_total",
      key: "prix_total",
      render: (val) => formatCurrency(val),
      width: 120,
      align: "right",
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="Voulez-vous supprimer ce produit ?"
          onConfirm={() => handleRemoveProductFromDrawer(record.id)}
        >
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  // Process a batch action on selected rows
  // const handleBatchAction = (action) => {
  //   if (selectedRowKeys.length === 0) {
  //     notification.warning({
  //       message: "Avertissement",
  //       description: "Veuillez sélectionner au moins un devis",
  //     });
  //     return;
  //   }

  //   const notificationKey = `batch-action-${Date.now()}`;

  //   notification.info({
  //     key: notificationKey,
  //     message: "Traitement en cours",
  //     description: `Traitement de ${selectedRowKeys.length} devis...`,
  //     duration: 0,
  //   });

  //   // Example: Batch generate PDFs
  //   if (action === "pdf") {
  //     Promise.all(selectedRows.map((devis) => handlePrintDevisPDF(devis)))
  //       .then(() => {
  //         notification.destroy(notificationKey);
  //         notification.success({
  //           message: "Succès",
  //           description: `${selectedRowKeys.length} PDFs générés avec succès`,
  //         });
  //       })
  //       .catch((err) => {
  //         notification.destroy(notificationKey);
  //         notification.error({
  //           message: "Erreur",
  //           description:
  //             "Une erreur est survenue lors de la génération des PDFs",
  //         });
  //         console.error(err);
  //       });
  //   }
  // };

  // Render the main list view
  
  const renderDevisList = () => (
    
    <Content style={{ padding: "20px" }}>
      <Card >
      {successMessage && (
            <div style={{   marginBottom: 16,
              padding: "12px",
              border: "1px solid #52c41a",
              backgroundColor: "#f6ffed",
              color: "#237804",
              borderRadius: "6px",
              fontWeight: 500,}}>
              ✅ {successMessage}
            </div>
          )}
           {formError && (
              <div style={{    marginBottom: 16,
                padding: "12px",
                border: "1px solid #ff4d4f",
                backgroundColor: "#fff1f0",
                color: "#a8071a",
                borderRadius: "6px",
                fontWeight: 500, }}>
                {formError}
              </div>
            )}
        {/* Statistics Row */}


<>

 <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  }}
>
  <Space size="large" align="center">
    <div style={{ position: 'relative' }}>
      <div
        style={{
          width: 48,
          height: 48,
          background: "#1890ff",
          borderRadius: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <FileDoneOutlined style={{ fontSize: 24, color: "#fff" }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: -8,
          right: -8,
          background: "#52c41a",
          color: "white",
          fontSize: 12,
          fontWeight: "bold",
          borderRadius: "50%",
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid white",
        }}
      >
        {/* Badge content si besoin */}
      </div>
    </div>

    <div>
      <Title
        level={2}
        style={{
          margin: 0,
          fontWeight: 700,
          color: "#1890ff",
          fontSize: "28px",
        }}
      >
        Devis
      </Title>
      <Text type="secondary">
        Suivi des devis envoyés
        <span style={{ color: "#52c41a", marginLeft: 8 }}>●</span>
      </Text>
    </div>
  </Space>

  <Space size="middle">
    <Button
      icon={<DeleteOutlined />}
      size="large"
      style={{
        borderRadius: '12px',
        height: '48px',
        padding: '0 20px',
        border: '2px solid #ef4444',
        color: '#ef4444',
        fontWeight: 600,
        background: '#ffffff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: '15px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
      }}
      onMouseEnter={(e) => {
        e.target.style.borderColor = '#dc2626';
        e.target.style.color = '#ffffff';
        e.target.style.background = '#ef4444';
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = '#ef4444';
        e.target.style.color = '#ef4444';
        e.target.style.background = '#ffffff';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)';
      }}
    >
      Corbeille
    </Button>
  </Space>
</div>




<Row gutter={16} style={{ marginBottom: 16 }}>
  {/* Total devis */}
  <Col xs={24} sm={12} md={6} lg={6}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Total devis
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
        {Array.isArray(filteredDevisList) ? filteredDevisList.length : 0} /{" "}
        {Array.isArray(devisList) ? devisList.length : 0}
      </Text>
    </Card>
  </Col>

  {/* Montant total TTC */}
  <Col xs={24} sm={12} md={6} lg={6}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Montant total TTC
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
        }}
      >
        <DollarCircleOutlined style={{ marginRight: 8, color: "#13c2c2" }} />
        {formatCurrency(
          (Array.isArray(filteredDevisList) ? filteredDevisList : []).reduce(
            (sum, devis) => sum + (Number(devis.montant_ttc) || 0),
            0
          )
        )}
      </Text>
    </Card>
  </Col>

  {/* En attente */}
  <Col xs={24} sm={12} md={6} lg={6}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        En attente
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: "#fa8c16",
          display: "flex",
          alignItems: "center",
        }}
      >
        <ClockCircleOutlined style={{ marginRight: 8 }} />
        {Array.isArray(filteredDevisList)
          ? filteredDevisList.filter((devis) => devis.statut === "sent").length
          : 0}
      </Text>
    </Card>
  </Col>

  {/* Acceptés */}
  <Col xs={24} sm={12} md={6} lg={6}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Acceptés
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: "#52c41a",
          display: "flex",
          alignItems: "center",
        }}
      >
        <CheckCircleOutlined style={{ marginRight: 8 }} />
        {Array.isArray(filteredDevisList)
          ? filteredDevisList.filter((devis) => devis.statut === "accepted")
              .length
          : 0}
      </Text>
    </Card>
  </Col>
</Row>


</>


        {/* Filters and Search */}
        <Row style={{ marginBottom: 16 }} gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Rechercher par client, N° devis..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filtrer par client"
              style={{ width: "100%" }}
              onChange={(value) => setSelectedClientFilter(value)}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {Array.isArray(clients) &&
                clients.map((client) => (
                  <Option key={client.id} value={client.id}>
                    {client.nom_client}
                  </Option>
                ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filtrer par statut"
              style={{ width: "100%" }}
              onChange={(value) => setSelectedStatus(value)}
              allowClear
            >
              <Option value="draft">Brouillon</Option>
              <Option value="sent">Envoyé</Option>
              <Option value="accepted">Accepté</Option>
              <Option value="rejected">Rejeté</Option>
              <Option value="expired">Expiré</Option>
              <Option value="converted">Converti</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              onChange={(dates) => setDateRange(dates)}
              placeholder={["Date début", "Date fin"]}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col xs={24} sm={12} md={10} lg={6}>
            <Form.Item label="Montant TTC" style={{ marginBottom: 0 }}>
              <Input.Group compact style={{ display: "flex" }}>
                <InputNumber
                  style={{ width: "50%" }}
                  placeholder="Min"
                  min={0}
                  step={100}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                  }
                  parser={(value) => value.replace(/\s+/g, "")}
                  onChange={(value) => setPriceRange([value, priceRange[1]])}
                />
                <InputNumber
                  style={{ width: "50%" }}
                  placeholder="Max"
                  min={0}
                  step={100}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                  }
                  parser={(value) => value.replace(/\s+/g, "")}
                  onChange={(value) => setPriceRange([priceRange[0], value])}
                />
              </Input.Group>
            </Form.Item>
          </Col>
         <Col flex="auto" style={{ textAlign: "right" }}>
  <Space>
    <Button
      onClick={() => {
        setSearchText("");
        setSelectedClientFilter(null);
        setSelectedStatus(null);
        setDateRange(null);
        setPriceRange([null, null]);
      }}
    >
      Effacer les filtres
    </Button>
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={handleCreateDevis}
    >
      Nouveau Devis
    </Button>
  </Space>
</Col>

          
        </Row>

        {/* Data Table */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={Array.isArray(filteredDevisList) ? filteredDevisList : []}
          loading={loading}
          // rowSelection={rowSelection}
          bordered
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            total: Array.isArray(filteredDevisList)
              ? filteredDevisList.length
              : 0,
            showTotal: (total) => `Total: ${total} devis`,
          }}
          // scroll={{ x: 1300 }}
          size="middle"
          locale={{
            emptyText:
              searchText ||
              selectedClientFilter ||
              selectedStatus ||
              dateRange ||
              priceRange[0] !== null ||
              priceRange[1] !== null
                ? "Aucun devis ne correspond aux critères de recherche"
                : "Aucun devis disponible",
          }}
        />

        {/* No results message */}
        {Array.isArray(filteredDevisList) &&
          filteredDevisList.length === 0 &&
          Array.isArray(devisList) &&
          devisList.length > 0 && (
            <Alert
              message="Filtrage actif"
              description="Aucun devis ne correspond aux critères de recherche. Essayez de modifier vos filtres."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
      </Card>

      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Content>
  );

  // Render detail view
  const renderDevisDetail = () => {
    if (loading) return <Spin size="large" tip="Chargement..." />;
    if (error) return <Alert message={error} type="error" showIcon />;
    if (!devisDetail)
      return <Alert message="Devis non trouvé" type="warning" showIcon />;

    // Columns for products table in details view
    const productColumns = [
      {
        title: "Produit",
        dataIndex: "nom_produit",
        key: "nom_produit",
      },
      {
        title: "Quantité",
        dataIndex: "quantite",
        key: "quantite",
      },
      {
        title: "Prix unitaire",
        dataIndex: "prix_unitaire",
        key: "prix_unitaire",
        render: (prix) => formatCurrency(prix),
      },
      {
        title: "Remise (%)",
        dataIndex: "remise_pourcentage",
        key: "remise_pourcentage",
        render: (remise) => `${remise}%`,
      },
      {
        title: "Total",
        dataIndex: "prix_total",
        key: "prix_total",
        render: (prix) => formatCurrency(prix),
        align: "right",
      },
    ];

    return (
      <Content style={{ padding: "20px" }}>
        <Card
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Devis: {devisDetail.numero_devis}</span>
              <Tag color={getStatusTagColor(devisDetail.statut)}>
                {translateStatus(devisDetail.statut)}
              </Tag>
            </div>
          }
          extra={
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => {
                  setCurrentView("list");
                  navigate("/devis");
                }}
              >
                Retour à la liste
              </Button>

              {devisDetail.statut === "accepted" && (
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  onClick={() => setShowConvertModal(true)}
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                >
                  Convertir en commande
                </Button>
              )}

              <Button
                icon={<FilePdfOutlined />}
                onClick={() => handlePrintDevisPDF(devisDetail)}
              >
                Imprimer
              </Button>
            </div>
          }
        >
          {/* Client and Devis Info */}
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small" title="Information Client">
                <p>
                  <strong>Client:</strong> {devisDetail.nom_client}
                </p>
                <p>
                  <strong>Date d'émission:</strong>{" "}
                  {dayjs(devisDetail.date_emission).format("DD/MM/YYYY")}
                </p>
                <p>
                  <strong>Valide jusqu'au:</strong>{" "}
                  {dayjs(devisDetail.date_validite).format("DD/MM/YYYY")}
                </p>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Conditions">
                <p>
                  <strong>Conditions de paiement:</strong>
                </p>
                <p>{devisDetail.conditions_paiement}</p>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Totaux">
                <Statistic
                  title="Total HT"
                  value={devisDetail.montant_ht}
                  formatter={(val) => formatCurrency(val)}
                />
                <Statistic
                  title={`TVA (${devisDetail.tax_rate}%)`}
                  name="tax_rate"
                  value={devisDetail.montant_tva}
                  formatter={(val) => formatCurrency(val)}
                />
                <Statistic
                  title="Total TTC"
                  value={devisDetail.montant_ttc}
                  formatter={(val) => formatCurrency(val)}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Products */}
          <Card title="Produits" style={{ marginTop: 16 }}>
            <Table
              columns={productColumns}
              dataSource={devisDetail.produit_devis || []}
              rowKey="id"
              pagination={false}
              bordered
              summary={(pageData) => {
                return (
                  <>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text strong>Total HT:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(devisDetail.montant_ht)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text strong>TVA ({devisDetail.tax_rate}%):</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(devisDetail.montant_tva)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text strong>Total TTC:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(devisDetail.montant_ttc)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                );
              }}
            />
          </Card>

          {/* Remarks and notes */}
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card title="Remarques">
                <pre style={{ whiteSpace: "pre-line" }}>
                  {devisDetail.remarques}
                </pre>
              </Card>
            </Col>
          </Row>

          {/* {devisDetail.notes && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card title="Notes internes">
                  <p>{devisDetail.notes}</p>
                </Card>
              </Col>
            </Row>
          )} */}
        </Card>
      </Content>
    );
  };

  // Render quote form (create/edit)
  const renderDevisForm = () => (
    <Modal
      title={currentView === "create" ? "Nouveau Devis" : "Modifier Devis"}
      open={isDrawerVisible}
      onCancel={handleDrawerClose}
      width={1000}
      footer={[
        <Button key="back" onClick={handleDrawerClose}>
          Annuler
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleDrawerSave}
        >
          {currentView === "create" ? "Créer" : "Modifier"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={initialFormValues}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Numéro de devis"
              name="numero_devis"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le numéro du devis",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Client"
              name="client"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner un client",
                },
              ]}
            >
              <Select
                placeholder="Sélectionner un client"
                showSearch
                optionFilterProp="children"
              >
                {Array.isArray(clients) &&
                  clients.map((client) => (
                    <Option key={client.id} value={client.id}>
                      {client.nom_client}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Date d'émission"
              name="date_emission"
              rules={[
                { required: true, message: "Veuillez sélectionner une date" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Date de validité"
              name="date_validite"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner une date de validité",
                },
              ]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Taux TVA (%)"
              name="tax_rate"
              rules={[
                { required: true, message: "Veuillez sélectionner le taux de TVA" },
              ]}
            >
              <Select
                placeholder="Sélectionnez un taux"
                style={{ width: "100%" }}
              >
                <Option value={0}>0%</Option>
                <Option value={7}>7%</Option>
                <Option value={19}>19%</Option>
              </Select>
              {/* <InputNumber
                min={0}
                max={100}
                style={{ width: "100%" }}
                precision={2}
              /> */}
            </Form.Item>
          </Col>
          <Col span={12}>
  <Form.Item
    label="Timbre fiscal"
    name="timbre_fiscal"
    rules={[{ required: true, message: "Veuillez indiquer le timbre fiscal" }]}
  >
    <InputNumber
      min={0}
      step={0.001}
      style={{ width: "100%" }}
      value={timbreFiscal}
      onChange={(value)=>setTimbreFiscal(value)}
    />
  </Form.Item>
</Col>

          <Col span={12}>
            <Form.Item
              label="Conditions de paiement"
              name="conditions_paiement"
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Produits</Divider>

        <Button
          type="dashed"
          onClick={handleAddProductToDrawer}
          style={{ marginBottom: 16 }}
          icon={<PlusOutlined />}
          block
        >
          Ajouter un produit
        </Button>

        <Table
          dataSource={currentProductsInDrawer}
          columns={productColumnsInDrawer}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 600 }}
        />

        {currentProductsInDrawer.length > 0 && (
          <Row
            gutter={16}
            style={{
              marginTop: 20,
              borderTop: "1px solid #f0f0f0",
              paddingTop: 20,
            }}
          >
            <Col
              xs={24}
              sm={{ span: 10, offset: 14 }}
              style={{ textAlign: "right" }}
            >
              <Statistic
                title="Montant HT"
                value={currentProductsInDrawer.reduce(
                  (sum, p) => sum + p.prix_total,
                  0
                )}
                formatter={(val) => formatCurrency(val)}
              />
              <Statistic
                title="Montant TVA"
                value={
                  currentProductsInDrawer.reduce(
                    (sum, p) => sum + p.prix_total,
                    0
                  ) *
                  (form.getFieldValue("tax_rate") / 100)
                }
                formatter={(val) => formatCurrency(val)}
              />
              <Title level={5} style={{ marginTop: 10 }}>
                Montant TTC:{" "}
                {formatCurrency(
                  currentProductsInDrawer.reduce(
                    (sum, p) => sum + p.prix_total,
                    0
                  ) *
                    (1 + form.getFieldValue("tax_rate") / 100)
                )}
              </Title>
            </Col>
          </Row>
        )}

        <Divider />

        <Form.Item label="Remarques" name="remarques">
          <TextArea rows={4} />
        </Form.Item>

        {/* <Form.Item label="Notes internes" name="notes">
          <TextArea rows={3} />
        </Form.Item> */}
      </Form>
    </Modal>
  );

  // Product add modal
  const renderProductModal = () => (
    <Modal
      title="Ajouter un produit"
      open={isProductModalVisible}
      onCancel={() => setIsProductModalVisible(false)}
      onOk={handleProductModalSave}
      okText="Ajouter"
      cancelText="Annuler"
    >
      <Form
        form={productForm}
        layout="vertical"
        initialValues={{ quantite: 1, remise_pourcentage: 0 }}
      >
        <Form.Item
          name="produit"
          label="Produit"
          rules={[
            { required: true, message: "Veuillez sélectionner un produit" },
          ]}
        >
          <Select
            showSearch
            placeholder="Sélectionner un produit"
            optionFilterProp="children"
            onChange={(value) => {
              const selectedProduct = products.find((p) => p.id === value);
              if (selectedProduct) {
                productForm.setFieldsValue({
                  prix_unitaire: selectedProduct.prix,
                });
              }
            }}
          >
            {products.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.nom_produit} - {formatCurrency(p.prix)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="quantite"
          label="Quantité"
          rules={[{ required: true, message: "Veuillez saisir une quantité" }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="prix_unitaire"
          label="Prix unitaire"
          rules={[
            { required: true, message: "Veuillez saisir un prix unitaire" },
          ]}
        >
          <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="remise_pourcentage" label="Remise (%)">
          <InputNumber min={0} max={100} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );

  // Main render logic
  return (
    <>
      {currentView === "list" && renderDevisList()}
      {currentView === "detail" && renderDevisDetail()}
      {isDrawerVisible && renderDevisForm()}
      {isProductModalVisible && renderProductModal()}

      {/* Global Convert Modal */}
      <Modal
        title="Convertir en commande"
        open={showConvertModal}
        onCancel={() => {
          setShowConvertModal(false);
          setConvertSuccess(null);
        }}
        footer={
          convertSuccess
            ? [
                <Button
                  key="close"
                  onClick={() => {
                    setShowConvertModal(false);
                    setConvertSuccess(null);
                  }}
                >
                  Fermer
                </Button>,
                <Button
                  key="view"
                  type="primary"
                  onClick={() => {
                    setShowConvertModal(false);
                    setConvertSuccess(null);
                  }}
                >
                  Voir la commande
                </Button>,
              ]
            : [
                <Button key="close" onClick={() => setShowConvertModal(false)}>
                  Annuler
                </Button>,
                <Button
                  key="convert"
                  type="primary"
                  loading={loading}
                  onClick={() => handleConvertToOrder()}
                >
                  Convertir
                </Button>,
              ]
        }
      >
        {convertSuccess ? (
          <Alert
            message={convertSuccess.message}
            description={`Commande #${convertSuccess.orderNumber} créée.`}
            type="success"
            showIcon
          />
        ) : (
          <div style={{ padding: "10px" }}>
            {devisDetail && (
              <div
                style={{
                  marginBottom: 15,
                  padding: 15,
                  backgroundColor: "#f6f6f6",
                  borderRadius: "6px",
                  border: "1px solid #d9d9d9",
                }}
              >
                <p>
                  <strong>Devis:</strong> {devisDetail.numero_devis}
                </p>
                <p>
                  <strong>Client:</strong> {devisDetail.nom_client}
                </p>
                <p>
                  <strong>Montant:</strong>{" "}
                  {formatCurrency(devisDetail.montant_ttc)}
                </p>
                <p>
                  <strong>Statut:</strong> {translateStatus(devisDetail.statut)}
                </p>
              </div>
            )}
            <p>Êtes-vous sûr de vouloir convertir ce devis en commande?</p>
            <p>
              <strong>Cette action ne peut pas être annulée.</strong>
            </p>
            <p>Une fois le devis converti:</p>
            <ul>
              <li>Le statut du devis sera mis à jour en "converti"</li>
              <li>
                Une nouvelle commande sera créée avec les mêmes produits et
                détails
              </li>
            </ul>
          </div>
        )}
      </Modal>
      {/* Convert to invoice Modal */}
      <Modal
        title="Convertir en facture"
        open={showInvoiceConvertModal}
        onCancel={() => {
          setShowInvoiceConvertModal(false);
          setInvoiceConvertSuccess(null);
        }}
        footer={[
                <Button key="close" onClick={() => setShowInvoiceConvertModal(false)}>
                  Annuler
                </Button>,
                <Button
                  key="convert"
                  type="primary"
                  loading={loading}
                  onClick={() => handleConvertToInvoice()}
                >
                  Convertir
                </Button>,
        ]}
      >
        <div style={{ padding: "10px" }}>
          {devisDetail && (
            <div
              style={{
                marginBottom: 15,
                padding: 15,
                backgroundColor: "#f6f6f6",
                borderRadius: "6px",
                border: "1px solid #d9d9d9",
              }}
            >
              <Form form={invoiceForm} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="statut" label="Statut">
                      <Select>
                        <Option value="pending">En attente</Option>
                        <Option value="processing">En cours</Option>
                        <Option value="completed">Terminée</Option>
                        <Option value="cancelled">Annulée</Option>
                        <Option value="invoiced">Facturée</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="date_livraison_prevue"
                      label="Date Livraison Prévue"
                      rules={[{ required: true, message: "Veuillez entrer une date" }]}
                    >
                      <Input
                        type="date"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>  
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="mode_paiement"
                      label="Mode de Paiement"
                      rules={[
                        {
                          required: true,
                          message: "Veuillez sélectionner un mode de paiement",
                        },
                      ]}
                      >
                      <Select placeholder="Sélectionner un mode de paiement">
                        <Option value="traite">Traite</Option>
                        <Option value="cash">Comptant</Option>
                        <Option value="cheque">Chèque</Option>
                        <Option value="virement">Virement Bancaire</Option>
                        <Option value="carte">Carte de crédit</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>  
              </Form>
              <p>
                <strong>Devis:</strong> {devisDetail.numero_devis}
              </p>
              <p>
                <strong>Client:</strong> {devisDetail.nom_client}
              </p>
              <p>
                <strong>Montant:</strong>{" "}
                {formatCurrency(devisDetail.montant_ttc)}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}