import React, { useState, useEffect, useCallback, useContext } from "react";
import { InvoiceContext } from "../../contexts/InvoiceContext";

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
} from "@ant-design/icons";

import { getApiService } from "../../services/apiServiceFactory";
import ClientService from "../../features/clientManagement/services/ClientService";
import ProductService from "../../components/BonsDevis/ProductService";

import moment from "moment";
import FacturePdfApiService from "../../features/orders/services/FacturePdfApiService";

const { cdsService } = getApiService();
const { Option } = Select;
const { Title } = Typography;

// Fix the formatCurrency function
const formatCurrency = (amount, currency = "TND") => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(amount || 0);
};

// Helper to format invoice number as FAC-YYYY-NNNNN
const formatInvoiceNumber = (order) => {
    return order.numero_commande;
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

// You might want to define translations for payment methods as well
const translatePaymentMethod = (method) => {
  const methodMap = {
    cash: "Espèces",
    traite: "Traite",
    mixte: "Mixte",
  };
  return methodMap[method] || method || "N/A"; // Return method itself or N/A if not in map
};

export default function BonCommande() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  // Filter and search state variables
  const [searchText, setSearchText] = useState("");
  const [clientNameFilter, setClientNameFilter] = useState(""); // New client name filter
  const [clientCodeFilter, setClientCodeFilter] = useState("");
  // Removed selectedClientFilter state
  const [selectedClientFilter, setSelectedClientFilter] = useState(null); // Client ID for filtering
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

  const recalculateTotalsInDrawer = (products, taxRate) => {
    const currentTaxRate =
      typeof taxRate === "number"
        ? taxRate
        : parseFloat(drawerForm.getFieldValue("tax_rate")) || 0;
    const timbreFiscal =
      parseFloat(drawerForm.getFieldValue("timbre_fiscal")) || 0;

    const montantHt = products.reduce((sum, p) => sum + (p.prix_total || 0), 0);
    const montantTva = montantHt * (currentTaxRate / 100);
    const montantTtc = montantHt + montantTva + timbreFiscal;

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
        timbre_fiscal: timbreFiscal,
      }));
    }
    // For new orders, the form fields are the source of truth for totals until save.
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
      const data = await cdsService.getOrders();
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

    // Filter by client name (separate from search text)
    if (clientNameFilter) {
      const clientNameLower = clientNameFilter.toLowerCase();
      result = result.filter(
        (order) =>
          order.nom_client &&
          order.nom_client.toLowerCase().includes(clientNameLower)
      );
    }
    if (clientCodeFilter) {
      const clientCodeLower = clientCodeFilter.toLowerCase();
      result = result.filter(
        (order) =>
          order.code_client &&
          order.code_client.toLowerCase().includes(clientCodeLower)
      );
    }

    // Filter by client
    if (selectedClientFilter) {
      result = result.filter((order) => {
        // Accommodate client ID being in order.client_id or order.client (if it's a number)
        const orderClientIdentifier =
          order.client_id !== undefined && order.client_id !== null
            ? order.client_id
            : typeof order.client === "number"
            ? order.client
            : null;
        return orderClientIdentifier === selectedClientFilter;
      });
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
    clientNameFilter,
    clientCodeFilter,
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
      const fullOrderDetails = await cdsService.getOrderById(order.id);
      if (fullOrderDetails) {
        setEditingOrder(fullOrderDetails);

        // Map products from produits_details or produit_commande
        let mappedProducts = [];

        if (
          fullOrderDetails.produit_commande &&
          fullOrderDetails.produit_commande.length > 0
        ) {
          // Use produit_commande if available (preferred)
          mappedProducts = fullOrderDetails.produit_commande.map((product) => ({
            id: product.id,
            produit_id: product.produit_id || product.produit,
            nom_produit: product.nom_produit,
            quantite: Number(product.quantite) || 1,
            prix_unitaire: Number(product.prix_unitaire) || 0,
            remise_pourcentage: Number(product.remise_pourcentage) || 0,
            prix_total: Number(product.prix_total) || 0,
          }));
        } else if (
          fullOrderDetails.produits_details &&
          fullOrderDetails.produits_details.length > 0
        ) {
          // Fallback to produits_details and calculate missing fields
          const totalAmount = Number(fullOrderDetails.montant_ht) || 0;
          const productsCount = fullOrderDetails.produits_details.length;

          mappedProducts = fullOrderDetails.produits_details.map(
            (product, index) => {
              // Calculate quantity based on total amount and product price
              const unitPrice = Number(product.prix) || 0;
              let calculatedQuantity = 1;
              let calculatedTotal = unitPrice;

              // If we have total amount and this is the only product, calculate quantity
              if (productsCount === 1 && totalAmount > 0 && unitPrice > 0) {
                calculatedQuantity = Math.round(totalAmount / unitPrice);
                calculatedTotal = totalAmount;
              } else if (productsCount > 1) {
                // For multiple products, distribute the total amount proportionally
                const productPortion = totalAmount / productsCount;
                if (unitPrice > 0) {
                  calculatedQuantity = Math.round(productPortion / unitPrice);
                }
                calculatedTotal = calculatedQuantity * unitPrice;
              }

              return {
                id: `${product.id}`,
                produit_id: product.id,
                nom_produit: product.nom_produit,
                quantite: calculatedQuantity,
                prix_unitaire: unitPrice,
                remise_pourcentage: 0, // No discount info available
                prix_total: calculatedTotal,
              };
            }
          );
        }

        setCurrentProductsInDrawer(mappedProducts);

        // Extract client ID from various possible locations
        const clientId =
          fullOrderDetails.client_id ||
          (typeof fullOrderDetails.client === "number"
            ? fullOrderDetails.client
            : null) ||
          fullOrderDetails.client?.id ||
          null;

        // Set the selected client ID for the dropdown
        setSelectedClientId(clientId);

        // Populate form with all order data
        drawerForm.setFieldsValue({
          ...fullOrderDetails,

          client_id: clientId,
          date_commande: fullOrderDetails.date_commande
            ? moment(fullOrderDetails.date_commande)
            : null,
          date_livraison_prevue: fullOrderDetails.date_livraison_prevue
            ? moment(fullOrderDetails.date_livraison_prevue)
            : null,
          mode_paiement: fullOrderDetails.mode_paiement || "cash",
          statut: fullOrderDetails.statut || "pending",
          tax_rate: fullOrderDetails.tax_rate || 20,
          timbre_fiscal: fullOrderDetails.timbre_fiscal || 1, // Add timbre fiscal
          conditions_paiement: fullOrderDetails.conditions_paiement || "",
          notes: fullOrderDetails.notes || "",
          // Set display fields for totals
          montant_ht_display: fullOrderDetails.montant_ht || 0,
          montant_tva_display: fullOrderDetails.montant_tva || 0,
          montant_ttc_display: fullOrderDetails.montant_ttc || 0,
        });

        setIsDrawerVisible(true);
      } else {
        message.error("Order details not found.");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      message.error("Failed to fetch order details: " + err.message);
    }
    setLoading(false);
  };

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
      tax_rate: 20,
      timbre_fiscal: 0, // Default timbre fiscal
      statut: "pending",
      conditions_paiement: "À régler dans les 30 jours",
      mode_paiement: "cash", // Default payment method
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
      const values = await drawerForm.validateFields(); // Contains form fields like tax_rate, client_id etc.
      setLoading(true);

      const taxRate = parseFloat(values.tax_rate) || 0;
      const timbreFiscal = parseFloat(values.timbre_fiscal) || 1;

      if (isCreating) {
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

        // Remove random number generation - let backend handle it
        // const randomOrderNumber = `FAC-${new Date().getFullYear()}-${Math.floor(
        //   10000 + Math.random() * 90000
        // )}`;

        // Recalculate totals based on the final product list (newOrderProducts) and tax rate
        const finalMontantHt = newOrderProducts.reduce(
          (sum, p) => sum + (p.prix_total || 0),
          0
        );
        const finalMontantTva = finalMontantHt * (taxRate / 100);
        const finalMontantTtc = finalMontantHt + finalMontantTva + timbreFiscal;

        const orderPayload = {
          client_id: selectedClientId,
          client: selectedClientId,
          // numero_commande: randomOrderNumber, // Remove this line - backend will generate
          date_commande: values.date_commande
            ? values.date_commande.format("YYYY-MM-DD")
            : moment().format("YYYY-MM-DD"),
          date_livraison_prevue: values.date_livraison_prevue
            ? values.date_livraison_prevue.format("YYYY-MM-DD")
            : null,
          statut: values.statut || "pending",
          notes: values.notes || "",
          conditions_paiement: values.conditions_paiement || "",
          mode_paiement: values.mode_paiement || "cash",
          tax_rate: taxRate,
          timbre_fiscal: timbreFiscal,
          montant_ht: finalMontantHt,
          montant_tva: finalMontantTva,
          montant_ttc: finalMontantTtc,
          produits: newOrderProducts.map((p) => ({
            produit: p.produit_id || p.produit,
            quantite: p.quantite,
            prix_unitaire: p.prix_unitaire,
            remise_pourcentage: p.remise_pourcentage || 0,
          })),
        };

        const createdOrder = await cdsService.createOrder(orderPayload);
        message.success(
          `Commande ${
            createdOrder.numero_commande || formatInvoiceNumber(createdOrder)
          } créée avec succès!`
        );
      } else {
        // Updating an existing order
        // Recalculate totals based on currentProductsInDrawer and tax rate from form
        const finalMontantHt = currentProductsInDrawer.reduce(
          (sum, p) => sum + (p.prix_total || 0),
          0
        );
        const finalMontantTva = finalMontantHt * (taxRate / 100);
        const finalMontantTtc = finalMontantHt + finalMontantTva + timbreFiscal;

        // Destructure to safely separate product lists from the rest of the order data
        const { produit_commande, produits, ...restOfEditingOrder } =
          editingOrder;

        const orderPayload = {
          ...restOfEditingOrder, // Base with existing data (excluding old product lists)
          ...values, // Override with form values (like notes, dates, status, client_id if changed)
          date_commande: values.date_commande
            ? values.date_commande.format("YYYY-MM-DD")
            : null,
          date_livraison_prevue: values.date_livraison_prevue
            ? values.date_livraison_prevue.format("YYYY-MM-DD")
            : null,

          tax_rate: taxRate,
          timbre_fiscal: timbreFiscal, // Add timbre fiscal
          montant_ht: finalMontantHt,
          montant_tva: finalMontantTva,
          montant_ttc: finalMontantTtc,
          // Use 'produit_commande' as the key for line items
          produit_commande: currentProductsInDrawer.map((p) => ({
            id: p.id, // ID of the produit_commande line item, crucial for updates
            produit: p.produit_id || p.produit, // ID of the product from catalog
            quantite: p.quantite,
            prix_unitaire: p.prix_unitaire,
            remise_pourcentage: p.remise_pourcentage || 0,
          })),
          mode_paiement: values.mode_paiement,
        };
        // If client_id is in `values` (meaning it could have been changed in the form for an existing order)
        if (values.client_id) {
          orderPayload.client_id = values.client_id;
          orderPayload.client = values.client_id; // Ensure backend compatibility
        }

        delete orderPayload.montant_ht_display; // These are UI only
        delete orderPayload.montant_tva_display;
        delete orderPayload.montant_ttc_display;
        // Remove other client fields if client_id is the source of truth and `editingOrder` had expanded client object
        if (orderPayload.client && typeof orderPayload.client === "object") {
          orderPayload.client = orderPayload.client_id;
        }

        const updatedOrder = await cdsService.updateOrder(
          editingOrder.id,
          orderPayload
        );
        // The setEditingOrder and recalculateTotalsInDrawer might be redundant here if closing drawer
        // but good for consistency if drawer remained open.
        // setEditingOrder(updatedOrder);
        // recalculateTotalsInDrawer(updatedOrder.produit_commande || currentProductsInDrawer, updatedOrder.tax_rate || taxRate);
        message.success("Commande mise à jour avec succès!");
      }

      handleDrawerClose();
      fetchOrders();
    } catch (errorInfo) {
      console.error("Failed to save order:", errorInfo);
      message.error(
        "Échec de la sauvegarde. " +
          (errorInfo.message || "Check console for details.")
      );
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
        produit: values.produit_id, // This is the actual product ID
        produit_id: values.produit_id, // Keep for consistency if used elsewhere
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

      const currentTaxRate = drawerForm.getFieldValue("tax_rate") || 0;

      if (isCreating) {
        const existingProductIndex = newOrderProducts.findIndex(
          (p) => (p.produit_id || p.produit) === values.produit_id
        );

        let updatedNewOrderProducts;
        if (existingProductIndex > -1) {
          updatedNewOrderProducts = newOrderProducts.map((p, index) =>
            index === existingProductIndex
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
          message.success("Quantité du produit mise à jour");
        } else {
          const tempId = `temp-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`;
          const productToAdd = { ...newProductData, id: tempId };
          updatedNewOrderProducts = [...newOrderProducts, productToAdd];
          message.success("Produit ajouté à la commande");
        }
        setNewOrderProducts(updatedNewOrderProducts);
        setCurrentProductsInDrawer(updatedNewOrderProducts);
        recalculateTotalsInDrawer(updatedNewOrderProducts, currentTaxRate);
      } else {
        // For existing order
        const existingProductInDrawerIndex = currentProductsInDrawer.findIndex(
          (p) => (p.produit_id || p.produit) === values.produit_id
        );

        if (existingProductInDrawerIndex > -1) {
          // Logic to update existing product quantity in an existing order
          // This might involve an API call to update the line item or you might prefer
          // the user to remove and re-add. For simplicity, let's assume an update:
          const updatedProductsInDrawer = currentProductsInDrawer.map(
            (p, index) =>
              index === existingProductInDrawerIndex
                ? {
                    ...p,
                    quantite: p.quantite + values.quantite, // Or replace: values.quantite
                    prix_unitaire: newProductData.prix_unitaire, // Update price if changed
                    remise_pourcentage: newProductData.remise_pourcentage,
                    prix_total:
                      (p.quantite + values.quantite) *
                      newProductData.prix_unitaire *
                      (1 - (newProductData.remise_pourcentage || 0) / 100),
                  }
                : p
          );
          setCurrentProductsInDrawer(updatedProductsInDrawer);
          recalculateTotalsInDrawer(updatedProductsInDrawer, currentTaxRate);
          message.success("Produit mis à jour dans la commande");
          // Note: You'd typically need to reflect this change in `editingOrder.produit_commande`
          // and the backend would need to handle updates to existing line items.
          // The current `addProductToOrder` might just add a new line.
          // If `addProductToOrder` handles updates, this local update might be redundant before API call.
        } else {
          // Call API to add product if it doesn't exist already
          // The backend should return the full product line item, including its own ID
          const addedProductFromApi = await cdsService.addProductToOrder(
            editingOrder.id,
            newProductData // Send newProductData, backend assigns ID to the line item
          );
          // Ensure addedProductFromApi has prix_total or calculate it
          if (
            addedProductFromApi &&
            typeof addedProductFromApi.prix_total === "undefined"
          ) {
            addedProductFromApi.prix_total =
              (addedProductFromApi.quantite || 0) *
              (addedProductFromApi.prix_unitaire || 0) *
              (1 - (addedProductFromApi.remise_pourcentage || 0) / 100);
          }
          const newProductsList = [
            ...currentProductsInDrawer,
            addedProductFromApi,
          ];
          setCurrentProductsInDrawer(newProductsList);
          recalculateTotalsInDrawer(newProductsList, currentTaxRate);
          message.success("Produit ajouté à la commande");
        }
      }
      setIsProductModalVisible(false);
    } catch (errorInfo) {
      console.log("Product modal save failed:", errorInfo);
      message.error(
        "Failed to add product: " + (errorInfo.message || "Unknown error")
      );
    }
  };

  const handleRemoveProductFromDrawerOrder = async (
    produitIdToRemove // This could be tempId for new orders, or actual DB ID for existing
  ) => {
    try {
      const currentTaxRate = drawerForm.getFieldValue("tax_rate") || 0;
      if (isCreating) {
        const updatedProducts = newOrderProducts.filter(
          (p) => p.id !== produitIdToRemove // tempId comparison
        );
        setNewOrderProducts(updatedProducts);
        setCurrentProductsInDrawer(updatedProducts);
        recalculateTotalsInDrawer(updatedProducts, currentTaxRate);
      } else {
        // For existing order, find the product to get the correct produit_id
        const productToRemove = currentProductsInDrawer.find(
          (p) => p.id === produitIdToRemove
        );

        if (!productToRemove) {
          message.error("Produit non trouvé");
          return;
        }

        // Use produit_id instead of the PdC id for removal
        const actualProductId =
          productToRemove.produit_id || productToRemove.produit;

        await cdsService.removeProductFromOrder(
          editingOrder.id,
          actualProductId // Send the actual product ID, not the PdC ID
        );
        const updatedProducts = currentProductsInDrawer.filter(
          (p) => p.id !== produitIdToRemove
        );
        setCurrentProductsInDrawer(updatedProducts);
        recalculateTotalsInDrawer(updatedProducts, currentTaxRate);
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
      const detailedOrder = await cdsService.getOrderById(orderRecord.id);
      if (!detailedOrder) {
        message.error(
          "Données de commande non trouvées pour la génération du PDF."
        );
        hideLoading();
        return;
      }

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

      // Filter produit_commande to only include products with quantite > 0
      let filteredProduitCommande = [];
      if (
        detailedOrder.produit_commande &&
        detailedOrder.produit_commande.length > 0
      ) {
        filteredProduitCommande = detailedOrder.produit_commande.filter(
          (product) => Number(product.quantite) > 0
        );
      }

      let mappedProduitCommande;

      if (filteredProduitCommande.length > 0) {
        mappedProduitCommande = filteredProduitCommande.map((orderProduct) => {
          const productDetailsFromCatalog = availableProducts.find(
            (p) => p.id === (orderProduct.produit_id || orderProduct.produit)
          );

          const nomProduit =
            orderProduct.nom_produit ||
            productDetailsFromCatalog?.nom_produit ||
            `Produit ID ${
              orderProduct.produit_id || orderProduct.produit || "N/A"
            }`;

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
            quantite: quantite,
            prix_unitaire: prixUnitaire,
            remise_pourcentage: remisePourcentage,
            prix_total: prixTotal,
          };
        });
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
        // Removed statut from printed invoice as per user request
        conditions_paiement: detailedOrder.conditions_paiement || "",
        mode_paiement: translatePaymentMethod(detailedOrder.mode_paiement), // Add this
        notes: detailedOrder.notes || "",
        timbre_fiscal: detailedOrder.timbre_fiscal || 1, // Add timbre fiscal
        montant_ht: detailedOrder.montant_ht || 0,
        montant_tva: detailedOrder.montant_tva || 0,
        montant_ttc: detailedOrder.montant_ttc || 0,
        tax_rate: detailedOrder.tax_rate || 20,
      };

      console.log("Order data for PDF:", orderDataForPDF); // Debug log

      // Use the new PDF API service
      const filename = `BonCommande_${detailedOrder.numero_commande}.pdf`;
      await FacturePdfApiService.generateOrderPDF(orderDataForPDF, filename);

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
      const response = await fetch(FacturePdfApiService.API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FacturePdfApiService.API_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `html=${encodeURIComponent(summaryHTML)}`,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.file) {
          FacturePdfApiService.openPDFInNewWindow(
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
            <h2>RM METALASER</h2>
            <p>Découpes Métaux<br>
               Rue hedi khfecha Z Madagascar 3047 - Sfax ville<br>
               Tél. : +216 20 366 150</p>
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
        <th>N° Facture</th>
        <th>Client</th>
        <th>Date</th>
        <!-- Removed Statut column as per user request -->
        <th>Mode Paiement</th> {/* Added Mode Paiement header */}
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
              <!-- Removed Statut cell as per user request -->
              <td>${translatePaymentMethod(
                order.mode_paiement
              )}</td> {/* Added Mode Paiement data */}
              <td>${formatCurrency(order.montant_ttc)}</td>
            </tr>
          `
                )
                .join("")}
            </tbody>
          </table>
          <tr>
            <td colspan="4" style="text-align: right; font-weight: bold;">Timbre Fiscal:</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(
              summaryData.timbreFiscal || 0
            )}</td>
          </tr>
        </body>
      </html>
    `;
  };

  const { deleteInvoice } = useContext(InvoiceContext);

  const handleDeleteOrder = async (orderId) => {
    try {
      setLoading(true);
      await deleteInvoice(orderId);
      // Optimistically update UI by removing deleted order immediately
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId)
      );
      message.success("Commande supprimée avec succès");
      // Optionally refresh orders from backend to ensure consistency
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
      // Optimistically update UI by removing selected orders immediately
      setOrders((prevOrders) =>
        prevOrders.filter((order) => !selectedRowKeys.includes(order.id))
      );
      // Use deleteInvoice from InvoiceContext for consistent state management
      await Promise.all(selectedRowKeys.map((id) => deleteInvoice(id)));
      message.success(`${selectedRowKeys.length} commande(s) supprimée(s)`);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      // Refresh orders from backend to ensure consistency
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
      title: "N° Facture",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => (a.id || 0) - (b.id || 0),
      render: (id, record) => formatInvoiceNumber(record),
    },
    {
      title: "Client",
      dataIndex: "nom_client",
      key: "nom_client",
      sorter: (a, b) => (a.nom_client || "").localeCompare(b.nom_client || ""),
    },
     {
      title: "Code Client",
      dataIndex: "code_client",
      key: "code_client",
      sorter: (a, b) => (a.code_client || "").localeCompare(b.code_client || ""),
    },
    {
      title: "Date Facture",
      dataIndex: "date_commande",
      key: "date_commande",
      render: (date) => (date ? moment(date).format("DD/MM/YYYY") : ""),
      sorter: (a, b) =>
        moment(a.date_commande).valueOf() - moment(b.date_commande).valueOf(),
    },
    {
      title: "Date Livraison",
      dataIndex: "date_livraison_prevue",
      key: "date_livraison_prevue",
      render: (date) => (date ? moment(date).format("DD/MM/YYYY") : ""),
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
      title: "Timbre",
      dataIndex: "timbre",
      key: "timbre",
      render: () => formatCurrency(1),
      sorter: (a, b) => 0, // No sorting needed as value is constant
    },
    {
      title: "Mode Paiement", // New Column
      dataIndex: "mode_paiement",
      key: "mode_paiement",
      render: (method) => translatePaymentMethod(method),
      sorter: (a, b) =>
        (a.mode_paiement || "").localeCompare(b.mode_paiement || ""),
    },
    {
      title: "Montant TTC",
      dataIndex: "montant_ttc",
      key: "montant_ttc",
      render: (amount, record) => {
        // Add timbre (1 TND) to montant_ttc
        const total = (Number(amount) || 0) + 1;
        return formatCurrency(total);
      },
      sorter: (a, b) =>
        (Number(a.montant_ttc) || 0) + 1 - ((Number(b.montant_ttc) || 0) + 1),
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
    setClientNameFilter("");
    setClientCodeFilter("");
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
              <Title level={2}>
                <FileDoneOutlined /> Factures
              </Title>
            </Col>
          </Row>

          {/* Statistics */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic
                title="Total Factures"
                value={filteredOrders.length}
                prefix={<FileDoneOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Montant Total TTC"
                value={totalAmount}
                formatter={(value) => formatCurrency(value)}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="En Attente"
                value={
                  filteredOrders.filter((o) => o.statut === "pending").length
                }
                valueStyle={{ color: "#fa8c16" }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Terminées"
                value={
                  filteredOrders.filter((o) => o.statut === "completed").length
                }
                valueStyle={{ color: "#52c41a" }}
              />
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
                    {client.nom_complet || client.nom || client.nom_client}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Input
                placeholder="Code Client"
                value={clientCodeFilter}
                onChange={(e) => setClientCodeFilter(e.target.value)}
                allowClear
                style={{ width: "100%" }}
              />
                
            </Col>
            <Col span={4}>
              <Input
                placeholder="Filtrer par nom client"
                value={clientNameFilter}
                onChange={(e) => setClientNameFilter(e.target.value)}
                allowClear
                style={{ width: "100%" }}
              />
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
                <Option value="invoiced">Facturée</Option>
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
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateOrder}
              >
                Nouvelle Facture
              </Button>
            </Col>
            <Col>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchOrders}
                loading={loading}
              >
                Actualiser
              </Button>
            </Col>
            {selectedRowKeys.length > 0 && (
              <>
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
                    title="Supprimer les Facture sélectionnées ?"
                    onConfirm={handleDeleteSelected}
                    okText="Oui"
                    cancelText="Non"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      Supprimer Sélection
                    </Button>
                  </Popconfirm>
                </Col>
              </>
            )}
          </Row>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            rowSelection={rowSelection}
            pagination={{
              total: filteredOrders.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} sur ${total} commandes`,
            }}
            scroll={{ x: 1300 }} // Adjusted scroll width
          />
        </Spin>
      </Card>

      {/* Order Drawer */}
      <Drawer
        title={
          isCreating
            ? "Nouvelle Facture"
            : `Modifier Facture ${editingOrder?.numero_commande || ""}`
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
                  <Option value="invoiced">Facturée</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date_commande" label="Date Facture">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date_livraison_prevue"
                label="Date Livraison Prévue"
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tax_rate" label="Taux TVA (%)">
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: "100%" }}
                  onChange={(value) => {
                    recalculateTotalsInDrawer(currentProductsInDrawer, value);
                  }}
                />
              </Form.Item>
            </Col>
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
                  <Option value="cash">Espèces</Option>
                  <Option value="credit_card">Carte de crédit</Option>
                  <Option value="bank_transfer">Virement bancaire</Option>
                  <Option value="cheque">Chèque</Option>
                  <Option value="traite">Traite</Option>
                  {/* Add other payment methods as needed */}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="timbre_fiscal" label="Timbre Fiscal (TND)">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  step={0.01}
                  onChange={(value) => {
                    recalculateTotalsInDrawer(currentProductsInDrawer);
                  }}
                />
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
                      handleRemoveProductFromDrawerOrder(
                        record.product_id || record.id
                      )
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
              <Form.Item name="timbre_fiscal" label="Timbre Fiscal">
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
