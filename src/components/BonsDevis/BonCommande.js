import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Modal,
  message,
  Tooltip,
  Row,
  Col,
  Divider,
  Tag,
  Layout,
  Alert,
  Popconfirm,
  Typography,
  Statistic,
  Spin,
  Card,
  Badge,
} from "antd";
import {
  PrinterOutlined,
  EditOutlined,
  FilePdfOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileDoneOutlined,
  SearchOutlined,
  DollarCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

 // <-- Ajoute cette ligne

import { getApiService } from "../../services/apiServiceFactory";
import ClientService from "../../features/clientManagement/services/ClientService";
import ProductService from "../../components/BonsDevis/ProductService";
import BonCommandePdfApiService from "../../features/orders/services/BonCommandePdfApiService";
import { useNavigate } from "react-router-dom";

import moment from "moment";


const { orderService } = getApiService();
const { Option } = Select;

const { Title, Text } = Typography;

// Fix the formatCurrency function
const formatCurrency = (amount, currency = " ") => {
  return new Intl.NumberFormat("fr-TN", {
    style: "decimal",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount || 0);
};

const translateOrderStatus = (status) => {
  const statusMap = {
    pending: "En attente",
    processing: "En cours",
    completed: "Terminée",
    cancelled: "Annulée",
    invoiced: "Facturée",
  };
  return statusMap[status] || status;
};

export default function BonCommande() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  // Filter and search state variables
  const [searchText, setSearchText] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [priceRange, setPriceRange] = useState([null, null]); // [min, max]
  const [filteredOrders, setFilteredOrders] = useState([]);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [drawerForm] = Form.useForm();

  const [availableProducts, setAvailableProducts] = useState([]);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [productForm] = Form.useForm();
  const [currentProductsInDrawer, setCurrentProductsInDrawer] = useState([]);

  // New state variables for creating orders
  const [isCreating, setIsCreating] = useState(false);
  const [availableClients, setAvailableClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [newOrderProducts, setNewOrderProducts] = useState([]);

   const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

  const recalculateTotalsInDrawer = (products, taxRate) => {
    const montantHt = products.reduce((sum, p) => sum + p.prix_total, 0);
    const montantTva = montantHt * (taxRate / 100);
    const montantTtc = montantHt + montantTva;
    drawerForm.setFieldsValue({
      montant_ht_display: montantHt,
      montant_tva_display: montantTva,
      montant_ttc_display: montantTtc,
    });
    if (editingOrder) {
      setEditingOrder((prev) => ({
        ...prev,
        montant_ht: montantHt,
        montant_tva: montantTva,
        montant_ttc: montantTtc,
      }));
    }
  };

  // Update ClientService method to match the implementation
  const fetchAvailableClients = useCallback(async () => {
    try {
      // Update to use the correct method name from ClientService
      const clients = await ClientService.get_all_clients();
      setAvailableClients(clients);
    } catch (err) {
      message.error("Failed to fetch clients: " + err.message);
    }
  }, []);

  // Fix the fetchOrders function to handle errors properly
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
      setFilteredOrders(data); // Initialize filteredOrders with all orders
    } catch (err) {
      setError(err.message || "Failed to fetch orders");
      message.error("Failed to fetch orders: " + err.message);
      console.error("Order fetch error details:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to filter orders based on search criteria
  const filterOrders = useCallback(() => {
    if (!orders.length) return;

    let result = [...orders];

    // Filter by search text (client name, order number, or notes)
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (order) =>
          (order.nom_client &&
            order.nom_client.toLowerCase().includes(searchLower)) ||
          (order.numero_commande &&
            order.numero_commande.toLowerCase().includes(searchLower)) ||
          (order.notes && order.notes.toLowerCase().includes(searchLower))
      );
    }

    // Filter by client
    if (selectedClientFilter) {
      result = result.filter(
        (order) => order.client_id === selectedClientFilter
      );
    }

    // Filter by status
    if (selectedStatus) {
      result = result.filter((order) => order.statut === selectedStatus);
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day").valueOf();
      const endDate = dateRange[1].endOf("day").valueOf();

      result = result.filter((order) => {
        const orderDate = moment(order.date_commande).valueOf();
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Filter by price range
    if (priceRange[0] !== null || priceRange[1] !== null) {
      result = result.filter((order) => {
        const montantTtc = Number(order.montant_ttc) || 0;
        const minOk = priceRange[0] === null || montantTtc >= priceRange[0];
        const maxOk = priceRange[1] === null || montantTtc <= priceRange[1];
        return minOk && maxOk;
      });
    }

    setFilteredOrders(result);
  }, [
    orders,
    searchText,
    selectedClientFilter,
    selectedStatus,
    dateRange,
    priceRange,
  ]);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const fetchAvailableProducts = useCallback(async () => {
    try {
      const response = await ProductService.getProducts();
      // Check if response has a results property (paginated response)
      const products = response.results ? response.results : response;

      // Map API products to the expected structure with prix_unitaire
      const mappedProducts = products.map((product) => ({
        ...product,
        prix_unitaire: product.prix, // Map the prix field to prix_unitaire for compatibility
      }));
      setAvailableProducts(mappedProducts);
      console.log("Available products:", mappedProducts); // Debug log
    } catch (err) {
      console.error("Error fetching products:", err);
      message.error("Failed to fetch available products: " + err.message);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchAvailableProducts();
    fetchAvailableClients();
  }, [fetchOrders, fetchAvailableProducts, fetchAvailableClients]);

  const handleEditOrder = async (order) => {
    
    setLoading(true);
    try {
      const fullOrderDetails = await orderService.getOrderById(order.id);
       console.log("✅ fullOrderDetails:", fullOrderDetails);
      if (fullOrderDetails) {
        setEditingOrder(fullOrderDetails);
        setCurrentProductsInDrawer(fullOrderDetails.produit_commande || []);
   drawerForm.setFieldsValue({
        ...fullOrderDetails,
        client_id: fullOrderDetails.client,
        date_commande: fullOrderDetails.date_commande
          ? moment(fullOrderDetails.date_commande)
          : null,
        date_livraison_prevue: fullOrderDetails.date_livraison_prevue
          ? moment(fullOrderDetails.date_livraison_prevue)
          : null,
        timbre_fiscal: fullOrderDetails.timbre_fiscal ?? 0, // Utiliser 0 si null
        tax_rate: fullOrderDetails.tax_rate ?? 0,
        notes: fullOrderDetails.notes ?? "", // Utiliser chaîne vide si null
        conditions_paiement: fullOrderDetails.conditions_paiement ?? "",
      });

        setIsDrawerVisible(true);
      } else {
        message.error("Order details not found.");
      }
    } catch (err) {
      message.error("Failed to fetch order details: " + err.message);
    }
    setLoading(false);
  };
const navigate = useNavigate();

  // Function to create a new order
  const handleCreateOrder = () => {
    setIsCreating(true);
    setEditingOrder(null);
    setCurrentProductsInDrawer([]);

    // Initialize with default values
    drawerForm.resetFields();
    drawerForm.setFieldsValue({
      date_commande: moment(),
      date_livraison_prevue: moment().add(7, "days"),
      tax_rate: 0,
      timbre_fiscal: 0,
      statut: "pending",
      conditions_paiement: "À régler dans les 30 jours",
    });

    setIsDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerVisible(false);
    setEditingOrder(null);
    setCurrentProductsInDrawer([]);
    setNewOrderProducts([]);
    setIsCreating(false);
    setSelectedClientId(null);
    drawerForm.resetFields();
  };

  const handleDrawerSave = async () => {
    try {
      setFormError(null);
      setSuccessMessage(null);
      const values = await drawerForm.validateFields();
      setLoading(true);

      if (isCreating) {
        // Creating a new order
        if (!selectedClientId) {
          message.error("Veuillez sélectionner un client");
          setLoading(false);
          return;
        }

        if (newOrderProducts.length === 0) {
          message.error("Veuillez ajouter au moins un produit à la commande");
          setLoading(false);
          return;
        }

        const allOrders = await orderService.getOrders();
        const currentYear = new Date().getFullYear();
        const currentYearOrders = allOrders.filter(order => 
          order.numero_commande?.includes(`-${currentYear}-`)
        );
        let maxSequence = 0;
        currentYearOrders.forEach(order => {
          const parts = order.numero_commande.split('-');
          const sequencePart = parts[parts.length - 1];
          const sequenceNumber = parseInt(sequencePart, 10) || 0;

          if (sequenceNumber > maxSequence) {
            maxSequence = sequenceNumber;
          }
         });
         const newSequence = String(maxSequence + 1).padStart(5, '0');
        // Generate a random order number
        const randomOrderNumber =  `CMD-${new Date().getFullYear()}-${newSequence}`;
        const montant_ht = newOrderProducts.reduce((sum, p) => sum + p.prix_total, 0);
        const montant_tva = montant_ht * (values.tax_rate / 100);
        const montant_ttc = montant_ht + montant_tva;
        console.log('new order products ', newOrderProducts)
        const orderPayload = {
          client_id: selectedClientId,
          client: selectedClientId, // Add client field as required by backend
          numero_commande: randomOrderNumber, // Add randomly generated order number
          date_commande: values.date_commande
            ? values.date_commande.format("YYYY-MM-DD")
            : moment().format("YYYY-MM-DD"),
          date_livraison_prevue: values.date_livraison_prevue
            ? values.date_livraison_prevue.format("YYYY-MM-DD")
            : null,
          statut: values.statut || "pending",
          notes: values.notes || "",
          conditions_paiement: values.conditions_paiement || "",
          tax_rate: values.tax_rate || 0,
          timbre_fiscal: values.timbre_fiscal ?? 0,
          montant_ht:montant_ht,
          montant_tva:montant_tva,
          montant_ttc:montant_ttc,
          produits: newOrderProducts.map((p) => ({
            produit: p.produit,
            quantite: p.quantite,
            prix_unitaire: p.prix_unitaire,
            remise_pourcentage: p.remise_pourcentage || 0,
          })),
        };

        console.log("saving",orderPayload);
        const createdOrder = await orderService.createOrder(orderPayload);
        message.success(
          `Commande ${createdOrder.numero_commande} créée avec succès!`
        );
        setSuccessMessage("Commande ajoutée avec succès !");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const montant_ht = currentProductsInDrawer.reduce( (sum, p) => sum + (p.prix_total || 0),
        0)
        const montant_tva = montant_ht * (values.tax_rate / 100);
        const montant_ttc = montant_ht + montant_tva;
        // Updating an existing order
        const orderPayload = {
          ...editingOrder,
          ...values,
          date_commande: values.date_commande
            ? values.date_commande.format("YYYY-MM-DD")
            : null,
          date_livraison_prevue: values.date_livraison_prevue
            ? values.date_livraison_prevue.format("YYYY-MM-DD")
            : null,
          produits: currentProductsInDrawer.map((p) => ({
            produit: p.produit_id,
            quantite: p.quantite,
            prix_unitaire: p.prix_unitaire,
            remise_pourcentage: p.remise_pourcentage || 0,
          })),
          tax_rate: values.tax_rate,
          timbre_fiscal: values.timbre_fiscal ?? 0,
          montant_ht:montant_ht,
          montant_tva:montant_tva,
          montant_ttc:montant_ttc,
        };
        delete orderPayload.montant_ht_display;
        delete orderPayload.montant_tva_display;
        delete orderPayload.montant_ttc_display;

        const updatedOrder = await orderService.updateOrder(
          editingOrder.id,
          orderPayload
        );

        setEditingOrder(updatedOrder);
        recalculateTotalsInDrawer(
          updatedOrder.produits || currentProductsInDrawer,
          updatedOrder.tax_rate || values.tax_rate
        );
        message.success("Commande mise à jour avec succès!");
        setSuccessMessage("Commande mise à jour avec succès !");
        setTimeout(() => setSuccessMessage(null), 3000);
      }

      handleDrawerClose();
      fetchOrders();
    } catch (errorInfo) {
      console.error("Failed to save order:", errorInfo);
      message.error(
        "Échec de la sauvegarde. " +
          (errorInfo.message || "Check console for details.")

      );
      setFormError(
        "Erreur lors de la création du Commande. Veuillez vérifier les champs."
      );
      setTimeout(() => setFormError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductToDrawerOrder = () => {
    productForm.resetFields();
    setIsProductModalVisible(true);
  };

  const handleProductModalSave = async () => {
    try {
      const values = await productForm.validateFields();
      const productDetails = availableProducts.find(
        (p) => p.id === values.produit_id
      );
      if (!productDetails) {
        message.error("Selected product not found.");
        return;
      }

      const newProductData = {
        produit: values.produit_id,
        nom_produit: productDetails.nom_produit,
        quantite: values.quantite,
        prix_unitaire:
          values.prix_unitaire !== undefined
            ? values.prix_unitaire
            : productDetails.prix_unitaire,
        remise_pourcentage: values.remise_pourcentage || 0,
      };
      newProductData.prix_total =
        newProductData.quantite *
        newProductData.prix_unitaire *
        (1 - newProductData.remise_pourcentage / 100);

      if (isCreating) {
        // Check if the product already exists in the order
        const existingProduct = newOrderProducts.find(
          (p) => p.produit_id === values.produit_id
        );

        if (existingProduct) {
          // If product exists, update the quantity instead of adding a duplicate
          const updatedProducts = newOrderProducts.map((p) =>
            p.produit_id === values.produit_id
              ? {
                  ...p,
                  quantite: p.quantite + values.quantite,
                  prix_total:
                    (p.quantite + values.quantite) *
                    p.prix_unitaire *
                    (1 - (p.remise_pourcentage || 0) / 100),
                }
              : p
          );
          setNewOrderProducts(updatedProducts);
          setCurrentProductsInDrawer(updatedProducts);
          message.success("Quantité du produit mise à jour");
        } else {
          // For new order, just add to local state if product doesn't exist yet
          const tempId = `temp-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`;
          setNewOrderProducts([
            ...newOrderProducts,
            { ...newProductData, id: tempId },
          ]);
          setCurrentProductsInDrawer([
            ...newOrderProducts,
            { ...newProductData, id: tempId },
          ]);
          message.success("Produit ajouté à la commande");
        }
      } else {
        // For existing order, check if product already exists
        const existingProduct = currentProductsInDrawer.find(
          (p) => p.produit_id === values.produit_id
        );

        if (existingProduct) {
          // If product exists, show warning and don't add
          message.warning(
            "Ce produit existe déjà dans la commande. Veuillez le supprimer et le rajouter avec la quantité totale souhaitée."
          );
          setIsProductModalVisible(false);
          return;
        }

        // Call API to add product if it doesn't exist already
        const addedProductFromApi = await orderService.addProductToOrder(
          editingOrder.id,
          newProductData
        );
        setCurrentProductsInDrawer([
          ...currentProductsInDrawer,
          addedProductFromApi,
        ]);
        recalculateTotalsInDrawer(
          [...currentProductsInDrawer, addedProductFromApi],
          drawerForm.getFieldValue("tax_rate")
        );
        message.success("Produit ajouté à la commande");
      }

      setIsProductModalVisible(false);
    } catch (errorInfo) {
      console.log("Product modal save failed:", errorInfo);
      message.error("Failed to add product.");
    }
  };

  const handleRemoveProductFromDrawerOrder = async (
    produitCommandeIdToRemove
  ) => {
    try {
      if (isCreating) {
        // For new order, just remove from local state
        const updatedProducts = newOrderProducts.filter(
          (p) => p.id !== produitCommandeIdToRemove
        );
        setNewOrderProducts(updatedProducts);
        setCurrentProductsInDrawer(updatedProducts);
      } else {
        // For existing order, call API
        await orderService.removeProductFromOrder(
          editingOrder.id,
          produitCommandeIdToRemove
        );
        const updatedProducts = currentProductsInDrawer.filter(
          (p) => p.id !== produitCommandeIdToRemove
        );
        setCurrentProductsInDrawer(updatedProducts);
        recalculateTotalsInDrawer(
          updatedProducts,
          drawerForm.getFieldValue("tax_rate")
        );
      }
      message.success("Product removed.");
    } catch (error) {
      console.error("Failed to remove product:", error);
      message.error("Failed to remove product: " + error.message);
    }
  };

  const handlePrintOrderPDF = async (orderRecord) => {
    const hideLoading = message.loading("Génération du PDF en cours...", 0);

    try {
      // Fetch complete order details
      const detailedOrder = await orderService.getOrderById(orderRecord.id);
      if (!detailedOrder) {
        message.error(
          "Données de commande non trouvées pour la génération du PDF."
        );
        hideLoading();
        return;
      }
      console.log("record ",orderRecord)
      console.log("detailed",detailedOrder)
      // Find the client in availableClients list
      let clientDetailsForPdf = null;
      const clientIdToFind =
        detailedOrder.client_id ||
        (typeof detailedOrder.client === "number"
          ? detailedOrder.client
          : null);

      if (clientIdToFind) {
        clientDetailsForPdf = availableClients.find(
          (client) => client.id === clientIdToFind
        );
      }

      let mappedProduitCommande;

      if (
        detailedOrder.produit_commande &&
        detailedOrder.produit_commande.length > 0
      ) {
        mappedProduitCommande = detailedOrder.produit_commande.map(
          (orderProduct) => {
            const productDetailsFromCatalog = availableProducts.find(
              (p) => p.id === (orderProduct.produit_id || orderProduct.produit)
            );

            const nomProduit =
              orderProduct.nom_produit ||
              productDetailsFromCatalog?.nom_produit ||
              `Produit ID ${
                orderProduct.produit_id || orderProduct.produit || "N/A"
              }`;
            const ref_produit = orderProduct.ref_produit || "N/A";
            const prixUnitaire =
              orderProduct.prix_unitaire ??
              productDetailsFromCatalog?.prix_unitaire ??
              0;

            const quantite = Number(orderProduct.quantite) || 0;
            const remisePourcentage =
              Number(orderProduct.remise_pourcentage) || 0;

            const calculatedLineTotal =
              quantite * prixUnitaire * (1 - remisePourcentage / 100);

            const prixTotal =
              typeof orderProduct.prix_total === "number"
                ? orderProduct.prix_total
                : calculatedLineTotal;

            return {
              id: orderProduct.id,
              produit_id: orderProduct.produit_id || orderProduct.produit,
              nom_produit: nomProduit,
              ref_produit : ref_produit , 
              quantite: quantite,
              prix_unitaire: prixUnitaire,
              remise_pourcentage: remisePourcentage,
              prix_total: prixTotal,
         
            };
          }
        );
      } else if (
        detailedOrder.produits_details &&
        detailedOrder.produits_details.length > 0
      ) {
        console.warn(
          "BonCommande.js: `produit_commande` is empty. Using `produits_details` as a fallback for PDF generation. Quantities will be assumed as 1 and discounts as 0."
        );
        mappedProduitCommande = detailedOrder.produits_details.map(
          (detailProduct) => {
            const productDetailsFromCatalog = availableProducts.find(
              (p) => p.id === detailProduct.id
            );
            const nomProduit =
              detailProduct.nom_produit ||
              productDetailsFromCatalog?.nom_produit ||
              `Produit ID ${detailProduct.id || "N/A"}`;
            const ref_produit = detailProduct.ref_produit || "N/A";
            // Assuming 'prix' in produits_details is the unit price
            const prixUnitaire =
              detailProduct.prix ??
              productDetailsFromCatalog?.prix_unitaire ??
              0;
            const quantite = 1; // Assumption: quantity is 1
            const remisePourcentage = 0; // Assumption: no discount

            return {
              produit_id: detailProduct.id,
              nom_produit: nomProduit,
              ref_produit:ref_produit , 
              quantite: quantite,
              prix_unitaire: prixUnitaire,
              remise_pourcentage: remisePourcentage,
              prix_total:
                quantite * prixUnitaire * (1 - remisePourcentage / 100),
            };
          }
        );
      } else {
        mappedProduitCommande = [];
      }

      // Check if mappedProduitCommande is empty and log if necessary
      if (mappedProduitCommande.length === 0) {
        console.warn(
          "BonCommande.js: No products will be listed in the PDF. `produit_commande` and `produits_details` (fallback) are empty or unavailable.",
          detailedOrder
        );
      }

      // Map the order data to match the PDF service expectations
      const orderDataForPDF = {
        ...detailedOrder,
        produit_commande: mappedProduitCommande,
        // Format dates properly
        date_commande: detailedOrder.date_commande
          ? moment(detailedOrder.date_commande).format("DD/MM/YYYY")
          : "",
        date_livraison_prevue: detailedOrder.date_livraison_prevue
          ? moment(detailedOrder.date_livraison_prevue).format("DD/MM/YYYY")
          : "",
        // Ensure all required fields are present
        numero_commande: detailedOrder.numero_commande || "",

        // Correctly source client information
        nom_client:
          clientDetailsForPdf?.nom_complet ||
          clientDetailsForPdf?.nom ||
          detailedOrder.client?.nom_complet ||
          detailedOrder.client?.nom ||
          detailedOrder.nom_client ||
          "",

        client_address:
          clientDetailsForPdf?.adresse ||
          detailedOrder.client?.adresse ||
          detailedOrder.client_address ||
          detailedOrder.adresse ||
          "",
        client_tax_id:
          clientDetailsForPdf?.numero_fiscal ||
          detailedOrder.client?.numero_fiscal ||
          detailedOrder.client_tax_id ||
          detailedOrder.numero_fiscal ||
          "",
        client_phone:
          clientDetailsForPdf?.telephone ||
          detailedOrder.client?.telephone ||
          detailedOrder.client_phone ||
          detailedOrder.telephone_client ||
          "",
        statut: detailedOrder.statut || "",
        conditions_paiement: detailedOrder.conditions_paiement || "",
        notes: detailedOrder.notes || "",
        montant_ht: detailedOrder.montant_ht || 0,
        montant_tva: detailedOrder.montant_tva || 0,
        montant_ttc: detailedOrder.montant_ttc || 0,
        tax_rate: detailedOrder.tax_rate || 0,
        timbre_fiscal: detailedOrder.timbre_fiscal ?? 0,
      };

      console.log("Order data for PDF:", orderDataForPDF); // Debug log

      // Use the new PDF API service
      const filename = `BonCommande_${detailedOrder.numero_commande}.pdf`;
      await BonCommandePdfApiService.generateOrderPDF(
        orderDataForPDF,
        filename
      );

      hideLoading();
      message.success("PDF généré avec succès");
    } catch (error) {
      hideLoading();
      console.error("Error generating PDF:", error);
      message.error("Erreur lors de la génération du PDF: " + error.message);
    }
  };

  const handlePrintSelectedOrdersSummary = async () => {
    if (selectedRows.length === 0) {
      message.warn("Aucune commande sélectionnée pour l'impression.");
      return;
    }

    const hideLoading = message.loading(
      "Génération du récapitulatif des commandes...",
      0
    );

    try {
      // Create a summary data object
      const summaryData = {
        title: "RÉCAPITULATIF DES COMMANDES",
        generation_date: moment().format("DD/MM/YYYY à HH:mm"),
        orders_count: selectedRows.length,
        orders: selectedRows,
        total_amount: selectedRows.reduce(
          (sum, order) => sum + (Number(order.montant_ttc) || 0),
          0
        ),
      };

      // Generate summary using the new PDF service
      const summaryHTML = generateOrdersSummaryHTML(summaryData);

      // Use the PDF API service directly with custom HTML
      const response = await fetch(BonCommandePdfApiService.API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BonCommandePdfApiService.API_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `html=${encodeURIComponent(summaryHTML)}`,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.file) {
          BonCommandePdfApiService.openPDFInNewWindow(
            data.file,
            `Récapitulatif_Commandes_${moment().format("YYYYMMDD")}.pdf`
          );
          hideLoading();
          message.success("Récapitulatif des commandes généré avec succès");
        } else {
          throw new Error("Unexpected API response format for summary PDF");
        }
      } else {
        const errorText = await response.text();
        throw new Error(
          `API Error for summary PDF: ${response.status} - ${errorText}`
        );
      }
    } catch (error) {
      hideLoading();
      console.error("Error generating order summary PDF:", error);
      message.error(
        "Erreur lors de la génération du PDF récapitulatif: " + error.message
      );
    }
  };

  const generateOrdersSummaryHTML = (summaryData) => {
    return `
      <html>
        <head>
          <title>${summaryData.title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              font-size: 14px;
              color: #000;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
            }
            .summary-info { 
              margin-bottom: 20px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f2f2f2; 
            }
            .total { 
              font-weight: bold; 
            }
            .company-header {
              text-align: center;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="company-header">
            <h2>YUCCAINFO</h2>
            <p>Solutions ERP<br>
               Dar Chaabane Fehri, Nabeul, Tunisia<br>
               Tél. : +216 23 198 524 / +216 97 131 795</p>
          </div>
          <div class="header">
            <h1>${summaryData.title}</h1>
            <p>Généré le ${summaryData.generation_date}</p>
          </div>
          <div class="summary-info">
            <p><strong>Nombre de commandes:</strong> ${
              summaryData.orders_count
            }</p>
            <p><strong>Montant total TTC:</strong> ${formatCurrency(
              summaryData.total_amount
            )}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Montant TTC</th>
              </tr>
            </thead>
            <tbody>
              ${summaryData.orders
                .map(
                  (order) => `
                <tr>
                  <td>${order.numero_commande || ""}</td>
                  <td>${order.nom_client || ""}</td>
                  <td>${
                    order.date_commande
                      ? moment(order.date_commande).format("DD/MM/YYYY")
                      : ""
                  }</td>
                  <td>${translateOrderStatus(order.statut)}</td>
                  <td>${formatCurrency(order.montant_ttc)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      setLoading(true);
      await orderService.deleteOrder(orderId);
      message.success("Commande supprimée avec succès");
      fetchOrders();
    } catch (error) {
      message.error("Erreur lors de la suppression: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warn("Aucune commande sélectionnée");
      return;
    }

    try {
      setLoading(true);
      await Promise.all(
        selectedRowKeys.map((id) => orderService.deleteOrder(id))
      );
      message.success(`${selectedRowKeys.length} commande(s) supprimée(s)`);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      fetchOrders();
    } catch (error) {
      message.error("Erreur lors de la suppression: " + error.message);
    } finally {
      setLoading(false);
    }
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

  const columns = [
    {
      title: "N° Commande",
      dataIndex: "numero_commande",
      key: "numero_commande",
      sorter: (a, b) =>
        (a.numero_commande || "").localeCompare(b.numero_commande || ""),
    },
    {
      title: "Client",
      dataIndex: "nom_client",
      key: "nom_client",
      sorter: (a, b) => (a.nom_client || "").localeCompare(b.nom_client || ""),
    },
    {
      title: "Date Commande",
      dataIndex: "date_commande",
      key: "date_commande",
      render: (date) => (date ? moment(date).format("DD/MM/YYYY") : ""),
      sorter: (a, b) =>
        moment(a.date_commande).valueOf() - moment(b.date_commande).valueOf(),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{translateOrderStatus(status)}</Tag>
      ),
    },
    {
      title: "Montant TTC",
      dataIndex: "montant_ttc",
      key: "montant_ttc",
      render: (amount) => formatCurrency(amount),
      sorter: (a, b) =>
        (Number(a.montant_ttc) || 0) - (Number(b.montant_ttc) || 0),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Modifier">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditOrder(record)}
            />
          </Tooltip>
          <Tooltip title="Imprimer PDF">
            <Button
              icon={<FilePdfOutlined />}
              size="small"
              onClick={() => handlePrintOrderPDF(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cette commande ?"
              onConfirm={() => handleDeleteOrder(record.id)}
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys, newSelectedRows) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedClientFilter(null);
    setSelectedStatus(null);
    setDateRange(null);
    setPriceRange([null, null]);
  };

  const totalAmount = filteredOrders.reduce(
    (sum, order) => sum + (Number(order.montant_ttc) || 0),
    0
  );

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchOrders}>
              Réessayer
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <Layout.Content style={{ padding: "24px" }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col span={24}>
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
        Bons de Commande
      </Title>
      <Text type="secondary">
        Suivi des commandes 
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
  onClick={() => navigate('/commandes/corbeille')}
>
  Corbeille
</Button>

  </Space>
</div>

            </Col>
          </Row>
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
          
          {/* Statistics */}



<Row gutter={16} style={{ marginBottom: 16 }}>
  {/* Total commandes */}
  <Col span={6}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Total Commandes
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
        {filteredOrders.length}
      </Text>
    </Card>
  </Col>

  {/* Montant total TTC */}
  <Col span={6}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Montant Total TTC
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
        {formatCurrency(totalAmount)}
      </Text>
    </Card>
  </Col>

  {/* En attente */}
  <Col span={6}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        En Attente
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          color: "#fa8c16",
        }}
      >
        <ClockCircleOutlined style={{ marginRight: 8 }} />
        {filteredOrders.filter((o) => o.statut === "pending").length}
      </Text>
    </Card>
  </Col>

  {/* Terminées */}
  <Col span={6}>
    <Card bordered={false}>
      <Title level={4} style={{ color: "#555", fontWeight: "600" }}>
        Terminées
      </Title>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          color: "#52c41a",
        }}
      >
        <CheckCircleOutlined style={{ marginRight: 8 }} />
        {filteredOrders.filter((o) => o.statut === "completed").length}
      </Text>
    </Card>
  </Col>
</Row>




          <Divider />

          {/* Filters */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Input
                placeholder="Rechercher..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Client"
                value={selectedClientFilter}
                onChange={setSelectedClientFilter}
                allowClear
                style={{ width: "100%" }}
              >
                {availableClients.map((client) => (
                  <Option key={client.id} value={client.id}>
                    {client.nom_complet || client.nom}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Statut"
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
                style={{ width: "100%" }}
              >
                <Option value="pending">En attente</Option>
                <Option value="processing">En cours</Option>
                <Option value="completed">Terminée</Option>
                <Option value="cancelled">Annulée</Option>
           
              </Select>
            </Col>
            <Col span={6}>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                placeholder={["Date début", "Date fin"]}
                style={{ width: "100%" }}
              />
            </Col>
            <Col span={4}>
              <Button onClick={clearFilters}>Effacer filtres</Button>
            </Col>
          </Row>

          {/* Action buttons */}
{/* Ligne des 2 boutons alignés à droite */}
<Row justify="end" gutter={16} style={{ marginBottom: 16 }}>
  <Col>
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={handleCreateOrder}
    >
      Nouvelle Commande
    </Button>
  </Col>

</Row>

{/* Ligne des boutons sélection, en position normale (gauche) */}
{selectedRowKeys.length > 0 && (
  <Row gutter={16} style={{ marginBottom: 16 }}>
    <Col>
      <Badge count={selectedRowKeys.length}>
        <Button
          icon={<PrinterOutlined />}
          onClick={handlePrintSelectedOrdersSummary}
        >
          Imprimer Sélection
        </Button>
      </Badge>
    </Col>
    <Col>
      <Popconfirm
        title="Supprimer les commandes sélectionnées ?"
        onConfirm={handleDeleteSelected}
        okText="Oui"
        cancelText="Non"
      >
        <Button danger icon={<DeleteOutlined />}>
          Supprimer Sélection
        </Button>
      </Popconfirm>
    </Col>
  </Row>
)}

        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            // rowSelection={rowSelection}
            pagination={{
              total: filteredOrders.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} sur ${total} commandes`,
            }}
          
          />
        </Spin>
      </Card>

      {/* Order Drawer */}
      <Drawer
        title={
          isCreating
            ? "Nouvelle Commande"
            : `Modifier Commande ${editingOrder?.numero_commande || ""}`
        }
        width={800}
        onClose={handleDrawerClose}
        open={isDrawerVisible}
        extra={
          <Space>
            <Button onClick={handleDrawerClose}>Annuler</Button>
            <Button type="primary" onClick={handleDrawerSave} loading={loading}>
              {isCreating ? "Créer" : "Sauvegarder"}
            </Button>
          </Space>
        }
      >
        <Form form={drawerForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="client_id"
                label="Client"
                rules={[
                  {
                    required: true,
                    message: "Veuillez sélectionner un client",
                  },
                ]}
              >
                <Select
                  placeholder="Sélectionner un client"
                  value={selectedClientId}
                  onChange={setSelectedClientId}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {availableClients.map((client) => (
                    <Option key={client.id} value={client.id}>
                      {client.nom_client || client.nom}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="statut" label="Statut">
                <Select>
                  <Option value="pending">En attente</Option>
                  <Option value="processing">En cours</Option>
                  <Option value="completed">Terminée</Option>
                  <Option value="cancelled">Annulée</Option>
                
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
            <Form.Item name="date_commande" label="Date Commande">
  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
</Form.Item>

            </Col> 
              <Col span={12}>
              <Form.Item name="timbre_fiscal" label="Timbre Fiscal">
  <InputNumber min={0} step={0.001} style={{ width: "100%" }} />
</Form.Item>

            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="tax_rate" 
                label="Taux TVA (%)"
                // rules={[{ required: true, message: "Veuillez sélectionner un taux de TVA" }]}
              >
                <Select
                  style={{ width: "100%" }}
                  onChange={(value) => {
                    recalculateTotalsInDrawer(currentProductsInDrawer, value);
                  }}
                >
                  
                  <Option value={0}>0%</Option>
                  <Option value={7}>7%</Option>
                  <Option value={19}>19%</Option>
                </Select>
              </Form.Item>
            </Col>
          
          </Row>

          <Form.Item name="conditions_paiement" label="Conditions de Paiement">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Divider>Produits</Divider>

          <Button
            type="dashed"
            onClick={handleAddProductToDrawerOrder}
            style={{ width: "100%", marginBottom: 16 }}
            icon={<PlusOutlined />}
          >
            Ajouter un Produit
          </Button>

          <Table
            dataSource={currentProductsInDrawer}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
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
                title: "Prix Unitaire",
                dataIndex: "prix_unitaire",
                key: "prix_unitaire",
                render: (prix) => formatCurrency(prix),
              },
              {
                title: "Remise %",
                dataIndex: "remise_pourcentage",
                key: "remise_pourcentage",
                render: (remise) => `${remise || 0}%`,
              },
              {
                title: "Prix Total",
                dataIndex: "prix_total",
                key: "prix_total",
                render: (prix) => formatCurrency(prix),
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, record) => (
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      handleRemoveProductFromDrawerOrder(record.id)
                    }
                  />
                ),
              },
            ]}
          />

          <Divider />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="montant_ht_display" label="Montant HT">
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(value) => formatCurrency(value)}
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="montant_tva_display" label="Montant TVA">
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(value) => formatCurrency(value)}
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="montant_ttc_display" label="Montant TTC">
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(value) => formatCurrency(value)}
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* Product Modal */}
      <Modal
        title="Ajouter un Produit"
        open={isProductModalVisible}
        onOk={handleProductModalSave}
        onCancel={() => setIsProductModalVisible(false)}
        okText="Ajouter"
        cancelText="Annuler"
      >
        <Form form={productForm} layout="vertical">
          <Form.Item
            name="produit_id"
            label="Produit"
            rules={[
              { required: true, message: "Veuillez sélectionner un produit" },
            ]}
          >
            <Select
              placeholder="Sélectionner un produit"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableProducts.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.nom_produit} -{" "}
                  {formatCurrency(product.prix_unitaire)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantite"
            label="Quantité"
            rules={[
              { required: true, message: "Veuillez saisir une quantité" },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="prix_unitaire" label="Prix Unitaire (optionnel)">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item name="remise_pourcentage" label="Remise (%)">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout.Content>
  );
}
