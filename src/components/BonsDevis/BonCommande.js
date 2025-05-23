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
} from "@ant-design/icons";
import { jsPDF, autoTable } from "../../utils/pdfSetup";

import { getApiService } from "../../services/apiServiceFactory";
import ClientService from "../../features/clientManagement/services/ClientService";
import ProductService from "../../components/BonsDevis/ProductService";

import moment from "moment";

const { orderService } = getApiService();
const { Option } = Select;
const { Title } = Typography;

// Fix the formatCurrency function
const formatCurrency = (amount, currency = "TND") => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
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
      if (fullOrderDetails) {
        setEditingOrder(fullOrderDetails);
        setCurrentProductsInDrawer(fullOrderDetails.produit_commande || []);
        drawerForm.setFieldsValue({
          ...fullOrderDetails,
          date_commande: fullOrderDetails.date_commande
            ? moment(fullOrderDetails.date_commande)
            : null,
          date_livraison_prevue: fullOrderDetails.date_livraison_prevue
            ? moment(fullOrderDetails.date_livraison_prevue)
            : null,
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

        // Generate a random order number
        const randomOrderNumber = `CMD-${new Date().getFullYear()}-${Math.floor(
          10000 + Math.random() * 90000
        )}`;

        // Get client object from availableClients
        const selectedClient = availableClients.find(
          (client) => client.id === selectedClientId
        );

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
          tax_rate: values.tax_rate || 20,
          produits: newOrderProducts.map((p) => ({
            produit: p.produit_id,
            quantite: p.quantite,
            prix_unitaire: p.prix_unitaire,
            remise_pourcentage: p.remise_pourcentage || 0,
          })),
        };

        const createdOrder = await orderService.createOrder(orderPayload);
        message.success(
          `Commande ${createdOrder.numero_commande} créée avec succès!`
        );
      } else {
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
        produit_id: values.produit_id,
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

  const handlePrintOrderPDF = (orderRecord) => {
    const hideLoading = message.loading("Génération du PDF en cours...", 0);

    (async () => {
      try {
        // Create a new document with proper landscape orientation for better table rendering
        const doc = new jsPDF();

        // Fetch complete order details
        const detailedOrder = await orderService.getOrderById(orderRecord.id);
        if (!detailedOrder) {
          message.error(
            "Données de commande non trouvées pour la génération du PDF."
          );
          hideLoading();
          return;
        }

        // Title and header
        doc.setFontSize(20);
        doc.text("BON DE COMMANDE", 105, 20, { align: "center" });

        // Company info
        doc.setFontSize(16);
        doc.text("Votre Société", 20, 30);
        doc.setFontSize(10);
        doc.text("Adresse: 123 Rue de la Métallurgie, Tunis", 20, 35);
        doc.text("Tél: +216 xx xxx xxx", 20, 40);
        doc.text("Email: contact@societe.com", 20, 45);

        // Order details
        doc.setFontSize(10);
        doc.text(`Bon N°: ${detailedOrder.numero_commande}`, 170, 30, {
          align: "right",
        });
        doc.text(
          `Date de commande: ${moment(detailedOrder.date_commande).format(
            "DD/MM/YYYY"
          )}`,
          170,
          35,
          { align: "right" }
        );
        doc.text(
          `Date livr. prévue: ${moment(
            detailedOrder.date_livraison_prevue
          ).format("DD/MM/YYYY")}`,
          170,
          40,
          { align: "right" }
        );

        // Status with color
        const statusObj = {
          pending: { label: "En attente", color: [255, 193, 7] },
          processing: { label: "En cours", color: [0, 123, 255] },
          completed: { label: "Terminée", color: [40, 167, 69] },
          cancelled: { label: "Annulée", color: [220, 53, 69] },
          invoiced: { label: "Facturée", color: [23, 162, 184] },
        };

        const status = statusObj[detailedOrder.statut] || {
          label: translateOrderStatus(detailedOrder.statut),
          color: [108, 117, 125],
        };

        // Divider
        doc.line(20, 60, 190, 60);

        // Client Information
        doc.setFontSize(14);
        doc.text("Client", 20, 70);
        doc.setFontSize(10);
        doc.text(`Nom: ${detailedOrder.nom_client || "N/A"}`, 20, 75);
        doc.text(`Adresse: ${detailedOrder.adresse || "N/A"}`, 20, 80);
        doc.text(
          `Matricule Fiscale: ${detailedOrder.numero_fiscal || "N/A"}`,
          20,
          85
        );
        doc.text(`Tél: ${detailedOrder.telephone_client || "N/A"}`, 20, 90);

        // Status
        doc.setFillColor(status.color[0], status.color[1], status.color[2]);
        doc.roundedRect(170, 45, 25, 8, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.text(status.label, 182.5, 50, { align: "center" });
        doc.setTextColor(0, 0, 0);

        // Products table
        if (
          detailedOrder.produit_commande &&
          detailedOrder.produit_commande.length > 0
        ) {
          const tableColumn = [
            "Produit",
            "Quantité",
            "Prix Unitaire",
            "Remise (%)",
            "Total HT",
          ];
          const tableRows = [];
          detailedOrder.produit_commande.forEach((item) => {
            const totalItem =
              item.quantite *
              item.prix_unitaire *
              (1 - (item.remise_pourcentage || 0) / 100);
            const row = [
              item.nom_produit || `Produit ID ${item.produit_id}`,
              item.quantite,
              formatCurrency(item.prix_unitaire),
              item.remise_pourcentage || 0,
              formatCurrency(totalItem),
            ];
            tableRows.push(row);
          });

          // Call autoTable on the document instance with improved styling
          autoTable(doc, {
            startY: 100,
            head: [tableColumn],
            body: tableRows,
            theme: "grid",
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
              0: { cellWidth: 70 },
              4: { halign: "right" },
            },
            headStyles: {
              fillColor: [50, 50, 50],
              textColor: [255, 255, 255],
              fontStyle: "bold",
            },
          });

          // Get the final Y position directly from the document
          let finalY = doc.lastAutoTable.finalY || 120;

          // Totals with improved layout
          // Rectangle for the totals
          doc.setFillColor(240, 240, 240);
          doc.rect(110, finalY + 10, 80, 30, "F");
          doc.setDrawColor(180, 180, 180);
          doc.rect(110, finalY + 10, 80, 30);

          doc.setFontSize(10);
          doc.text(`Montant HT:`, 115, finalY + 17);
          doc.text(
            `${formatCurrency(detailedOrder.montant_ht)}`,
            185,
            finalY + 17,
            { align: "right" }
          );

          doc.text(`TVA (${detailedOrder.tax_rate || 0}%):`, 115, finalY + 24);
          doc.text(
            `${formatCurrency(detailedOrder.montant_tva || 0)}`,
            185,
            finalY + 24,
            { align: "right" }
          );

          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.text(`Total TTC:`, 115, finalY + 33);
          doc.text(
            `${formatCurrency(detailedOrder.montant_ttc || 0)}`,
            185,
            finalY + 33,
            { align: "right" }
          );
          doc.setFont(undefined, "normal");

          finalY += 50;

          // Add notes if present
          if (detailedOrder.notes) {
            doc.setFontSize(11);
            doc.text("Notes:", 20, finalY);
            doc.setFontSize(10);

            const splitNotes = doc.splitTextToSize(detailedOrder.notes, 170);
            doc.text(splitNotes, 20, finalY + 7);
            finalY += splitNotes.length * 5 + 10;
          }

          // Add payment terms if present
          if (detailedOrder.conditions_paiement) {
            doc.setFontSize(11);
            doc.text("Conditions de Paiement:", 20, finalY);
            doc.setFontSize(10);

            const splitTerms = doc.splitTextToSize(
              detailedOrder.conditions_paiement,
              170
            );
            doc.text(splitTerms, 20, finalY + 7);
            finalY += splitTerms.length * 5 + 15;
          }
        } else {
          doc.setFontSize(12);
          doc.text("Aucun produit dans cette commande.", 105, 120, {
            align: "center",
          });
        }

        // Common part - determine position based on previous content
        let currentY;

        if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
          currentY = doc.lastAutoTable.finalY + 40;
        } else {
          currentY = 150;
        }

        // Show totals if available
        if (
          detailedOrder.montant_ht !== undefined ||
          detailedOrder.montant_ttc !== undefined
        ) {
          // Rectangle for the totals
          doc.setFillColor(240, 240, 240);
          doc.rect(110, currentY - 30, 80, 30, "F");
          doc.setDrawColor(180, 180, 180);
          doc.rect(110, currentY - 30, 80, 30);

          doc.setFontSize(10);
          doc.text(`Montant HT:`, 115, currentY - 23);
          doc.text(
            `${formatCurrency(detailedOrder.montant_ht || 0)}`,
            185,
            currentY - 23,
            { align: "right" }
          );

          doc.text(
            `TVA (${detailedOrder.tax_rate || 0}%):`,
            115,
            currentY - 16
          );
          doc.text(
            `${formatCurrency(detailedOrder.montant_tva || 0)}`,
            185,
            currentY - 16,
            { align: "right" }
          );

          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.text(`Total TTC:`, 115, currentY - 7);
          doc.text(
            `${formatCurrency(detailedOrder.montant_ttc || 0)}`,
            185,
            currentY - 7,
            { align: "right" }
          );
          doc.setFont(undefined, "normal");
        }

        // Add notes if present
        if (detailedOrder.notes) {
          doc.setFontSize(11);
          doc.text("Notes:", 20, currentY);
          doc.setFontSize(10);

          const splitNotes = doc.splitTextToSize(detailedOrder.notes, 170);
          doc.text(splitNotes, 20, currentY + 7);
          currentY += splitNotes.length * 5 + 15;
        }

        // Add payment terms if present
        if (detailedOrder.conditions_paiement) {
          doc.setFontSize(11);
          doc.text("Conditions de Paiement:", 20, currentY);
          doc.setFontSize(10);

          const splitTerms = doc.splitTextToSize(
            detailedOrder.conditions_paiement,
            170
          );
          doc.text(splitTerms, 20, currentY + 7);
          currentY += splitTerms.length * 5 + 15;
        }

        // Add signature area
        const signatureY = Math.min(240, currentY);
        doc.setFontSize(10);
        doc.text("Signature Client:", 20, signatureY);
        doc.rect(20, signatureY + 5, 70, 20);

        doc.text("Signature Société:", 120, signatureY);
        doc.rect(120, signatureY + 5, 70, 20);

        // Add footer
        doc.setFontSize(8);
        doc.text("Merci pour votre confiance !", 105, 285, { align: "center" });

        // Save the PDF
        doc.save(`BonCommande_${detailedOrder.numero_commande}.pdf`);

        // Show success message
        hideLoading();
        message.success("PDF généré avec succès");
      } catch (e) {
        hideLoading();
        message.error("Erreur lors de la génération du PDF: " + e.message);
        console.error("PDF generation error:", e);

        try {
          // Create a simpler error document
          const errorDoc = new jsPDF();
          errorDoc.setFontSize(18);
          errorDoc.text(
            "Erreur lors de la génération du Bon de Commande",
            105,
            20,
            { align: "center" }
          );
          errorDoc.setFontSize(12);
          errorDoc.text(
            `Référence: ${orderRecord.numero_commande || "N/A"}`,
            105,
            30,
            { align: "center" }
          );
          errorDoc.setFontSize(10);
          errorDoc.text(`Erreur: ${e.message}`, 20, 50);
          errorDoc.text(
            `Veuillez contacter le service informatique avec cette référence d'erreur.`,
            20,
            60
          );
          errorDoc.save(
            `BonCommande_${orderRecord.numero_commande || "erreur"}.pdf`
          );
        } catch (innerError) {
          console.error("Failed to generate even the error PDF:", innerError);
        }
      }
    })();
  };

  const handlePrintSelectedOrdersSummary = () => {
    if (selectedRows.length === 0) {
      message.warn("Aucune commande sélectionnée pour l'impression.");
      return;
    }

    const hideLoading = message.loading(
      "Génération du récapitulatif des commandes...",
      0
    );

    try {
      const doc = new jsPDF();

      // Title and header
      doc.setFontSize(20);
      doc.text("RÉCAPITULATIF DES COMMANDES", 105, 20, { align: "center" });

      // Date of generation
      doc.setFontSize(10);
      doc.text(`Généré le: ${moment().format("DD/MM/YYYY à HH:mm")}`, 195, 30, {
        align: "right",
      });
      doc.text(`Nombre de commandes: ${selectedRows.length}`, 195, 35, {
        align: "right",
      });

      // Company info
      doc.setFontSize(16);
      doc.text("Votre Société", 20, 30);
      doc.setFontSize(10);
      doc.text("Adresse: 123 Rue de la Métallurgie, Tunis", 20, 35);
      doc.text("Tél: +216 xx xxx xxx", 20, 40);

      // Divider
      doc.line(20, 45, 190, 45);

      const tableColumn = [
        "N° Commande",
        "Client",
        "Date",
        "Statut",
        "Montant TTC",
      ];
      const tableRows = [];

      let totalAmount = 0;

      selectedRows.forEach((order) => {
        const orderData = [
          order.numero_commande,
          order.nom_client,
          moment(order.date_commande).format("DD/MM/YYYY"),
          translateOrderStatus(order.statut),
          formatCurrency(order.montant_ttc),
        ];
        tableRows.push(orderData);

        // Calculate total amount
        totalAmount += Number(order.montant_ttc) || 0;
      });

      // Call autoTable on the doc instance with improved styling
      autoTable(doc, {
        startY: 50,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          4: { halign: "right" },
        },
        headStyles: {
          fillColor: [50, 50, 50],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });

      // Get the final Y position directly from the document
      const finalY = doc.lastAutoTable.finalY || 120;

      // Add total amount
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(
        `Montant Total TTC: ${formatCurrency(totalAmount)}`,
        195,
        finalY + 15,
        { align: "right" }
      );
      doc.setFont(undefined, "normal");

      // Add footer
      doc.setFontSize(8);
      doc.text("Document à usage interne uniquement", 105, 285, {
        align: "center",
      });

      // Save the PDF
      doc.save(`Récapitulatif_Commandes_${moment().format("YYYYMMDD")}.pdf`);

      // Show success message
      hideLoading();
      message.success("Récapitulatif des commandes généré avec succès");
    } catch (error) {
      hideLoading();
      console.error("Error generating order summary PDF:", error);
      message.error("Erreur lors de la génération du PDF récapitulatif");
    }
  };

  const handleGenerateInvoiceAPI = async (order) => {
    if (order.statut !== "completed" && order.statut !== "processing") {
      Modal.confirm({
        title: "Confirmation de génération de facture",
        content: `La commande N°${order.numero_commande} n'est pas au statut "Terminée". Voulez-vous quand même tenter de générer la facture ?`,
        okText: "Oui, générer",
        cancelText: "Annuler",
        onOk: async () => {
          await proceedWithInvoiceGeneration(order);
        },
      });
    } else {
      await proceedWithInvoiceGeneration(order);
    }
  };

  const proceedWithInvoiceGeneration = async (order) => {
    setLoading(true);
    try {
      const response = await orderService.generateInvoiceFromOrder(order.id);
      message.success(response.success + ` ID Facture: ${response.invoice_id}`);
      fetchOrders();
    } catch (err) {
      message.error(
        "Failed to generate invoice: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "N° Commande",
      dataIndex: "numero_commande",
      key: "numero_commande",
      sorter: (a, b) => a.numero_commande.localeCompare(b.numero_commande),
      fixed: "left",
      width: 180,
    },
    {
      title: "Client",
      dataIndex: "nom_client",
      key: "nom_client",
      sorter: (a, b) => a.nom_client.localeCompare(b.nom_client),
      width: 200,
    },
    {
      title: "Date Commande",
      dataIndex: "date_commande",
      key: "date_commande",
      render: (text) => moment(text).format("DD/MM/YYYY"),
      sorter: (a, b) =>
        moment(a.date_commande).unix() - moment(b.date_commande).unix(),
      width: 150,
    },
    {
      title: "Date Liv. Prévue",
      dataIndex: "date_livraison_prevue",
      key: "date_livraison_prevue",
      render: (text) => moment(text).format("DD/MM/YYYY"),
      width: 150,
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => (
        <Tag
          color={
            status === "completed"
              ? "green"
              : status === "invoiced"
              ? "blue"
              : status === "pending"
              ? "gold"
              : status === "processing"
              ? "processing"
              : "volcano"
          }
        >
          {translateOrderStatus(status)}
        </Tag>
      ),
      width: 120,
    },
    {
      title: "Montant HT",
      dataIndex: "montant_ht",
      key: "montant_ht",
      render: (text) => formatCurrency(text),
      width: 150,
      align: "right",
    },
    {
      title: "Montant TTC",
      dataIndex: "montant_ttc",
      key: "montant_ttc",
      render: (text) => formatCurrency(text),
      width: 150,
      align: "right",
    },
    {
      title: "N° Devis Orig.",
      dataIndex: "devis",
      key: "devis",
      render: (text) => text || "-",
      width: 150,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier Commande">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditOrder(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Imprimer Bon de Commande (PDF)">
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => handlePrintOrderPDF(record)}
              size="small"
            />
          </Tooltip>
          {(record.statut === "completed" || record.statut === "processing") &&
            !record.facture_numero && (
              <Tooltip title="Générer Facture">
                <Button
                  icon={<FileDoneOutlined />}
                  onClick={() => handleGenerateInvoiceAPI(record)}
                  size="small"
                />
              </Tooltip>
            )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      setSelectedRows(rows);
    },
  };

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
      key: "prix_unitaire",
      render: (val) => formatCurrency(val),
      width: 100,
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
          title="Sûr de supprimer ce produit?"
          onConfirm={() => handleRemoveProductFromDrawerOrder(record.id)}
        >
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Layout.Content style={{ padding: "20px" }}>
      <Card title="Gestion des Bons de Commande">
        {/* Statistics Row */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card size="small">
              <Statistic
                title="Total commandes"
                value={filteredOrders.length}
                suffix={`/ ${orders.length}`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card size="small">
              <Statistic
                title="Montant total TTC"
                value={filteredOrders.reduce(
                  (sum, order) => sum + (Number(order.montant_ttc) || 0),
                  0
                )}
                formatter={(value) => formatCurrency(value)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card size="small">
              <Statistic
                title="En attente"
                value={
                  filteredOrders.filter((order) => order.statut === "pending")
                    .length
                }
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card size="small">
              <Statistic
                title="Terminées"
                value={
                  filteredOrders.filter((order) => order.statut === "completed")
                    .length
                }
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
        </Row>

        <Row style={{ marginBottom: 16 }} gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Rechercher par client, N° commande..."
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
              {availableClients.map((client) => (
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
              <Option value="pending">En attente</Option>
              <Option value="processing">En cours</Option>
              <Option value="completed">Terminée</Option>
              <Option value="cancelled">Annulée</Option>
              <Option value="invoiced">Facturée</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={10} lg={6}>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              onChange={(dates) => setDateRange(dates)}
              placeholder={["Date début", "Date fin"]}
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
              {(searchText ||
                selectedClientFilter ||
                selectedStatus ||
                dateRange ||
                priceRange[0] !== null ||
                priceRange[1] !== null) && (
                <Button
                  onClick={() => {
                    setSearchText("");
                    setSelectedClientFilter(null);
                    setSelectedStatus(null);
                    setDateRange(null);
                    setPriceRange([null, null]);
                  }}
                >
                  Effacer tous les filtres
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateOrder}
              >
                Nouvelle Commande
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={handlePrintSelectedOrdersSummary}
                disabled={selectedRowKeys.length === 0}
              >
                Imprimer Sélection
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchOrders}>
                Actualiser
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          rowSelection={rowSelection}
          bordered
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
          scroll={{ x: 1500 }}
          size="middle"
          locale={{
            emptyText:
              searchText ||
              selectedClientFilter ||
              selectedStatus ||
              dateRange ||
              priceRange[0] !== null ||
              priceRange[1] !== null
                ? "Aucune commande ne correspond aux critères de recherche"
                : "Aucune commande disponible",
          }}
        />

        {filteredOrders.length === 0 && orders.length > 0 && (
          <Alert
            message="Filtrage actif"
            description="Aucune commande ne correspond aux critères de recherche. Essayez de modifier vos filtres."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>


      <Drawer
        title={
          isCreating
            ? "Nouvelle Commande"
            : editingOrder
            ? `Modifier Commande: ${editingOrder.numero_commande}`
            : ""
        }
        width={window.innerWidth > 900 ? 900 : "90%"}
        onClose={handleDrawerClose}
        open={isDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        destroyOnClose
        footer={
          <Space
            style={{
              textAlign: "right",
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={handleDrawerClose}>Annuler</Button>
            <Button onClick={handleDrawerSave} type="primary" loading={loading}>
              {isCreating ? "Créer" : "Sauvegarder"}
            </Button>
          </Space>
        }
      >
        <Form
          form={drawerForm}
          layout="vertical"
          initialValues={{ tax_rate: 20 }}
        >
          {isCreating ? (
            // Form for creating a new order
            <>
              <Row gutter={16}>
                <Col xs={24} sm={24}>
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
                      showSearch
                      placeholder="Sélectionner un client"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        String(option?.children || "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      onChange={(value) => setSelectedClientId(value)}
                    >
                      {availableClients.map((client) => (
                        <Option key={client.id} value={client.id}>
                          {client.nom_client}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="date_commande"
                    label="Date Commande"
                    rules={[
                      { required: true, message: "Date de commande requise" },
                    ]}
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="date_livraison_prevue"
                    label="Date Livraison Prévue"
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="statut"
                    label="Statut"
                    rules={[{ required: true, message: "Statut requis" }]}
                  >
                    <Select placeholder="Sélectionner un statut">
                      <Option value="pending">En attente</Option>
                      <Option value="processing">En cours</Option>
                      <Option value="completed">Terminée</Option>
                      <Option value="cancelled">Annulée</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="tax_rate"
                    label="Taux de TVA (%)"
                    rules={[{ required: true, message: "Taux de TVA requis" }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} max={100} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="notes" label="Notes">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="conditions_paiement"
                    label="Conditions de Paiement"
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>Produits de la Commande</Divider>
              <Button
                onClick={handleAddProductToDrawerOrder}
                type="dashed"
                icon={<PlusOutlined />}
                style={{ marginBottom: 16 }}
              >
                Ajouter Produit
              </Button>
              <Table
                rowKey="id"
                columns={productColumnsInDrawer}
                dataSource={newOrderProducts}
                pagination={false}
                size="small"
                bordered
                scroll={{ x: 600 }}
              />

              {newOrderProducts.length > 0 && (
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
                      value={newOrderProducts.reduce(
                        (sum, p) => sum + p.prix_total,
                        0
                      )}
                      formatter={(val) => formatCurrency(val)}
                    />
                    <Statistic
                      title="Montant TVA"
                      value={
                        newOrderProducts.reduce(
                          (sum, p) => sum + p.prix_total,
                          0
                        ) *
                        (drawerForm.getFieldValue("tax_rate") / 100)
                      }
                      formatter={(val) => formatCurrency(val)}
                    />
                    <Title level={5} style={{ marginTop: 10 }}>
                      Montant TTC:{" "}
                      {formatCurrency(
                        newOrderProducts.reduce(
                          (sum, p) => sum + p.prix_total,
                          0
                        ) *
                          (1 + drawerForm.getFieldValue("tax_rate") / 100)
                      )}
                    </Title>
                  </Col>
                </Row>
              )}
            </>
          ) : (
            editingOrder && (
              // Form for editing an existing order
              <>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="numero_commande" label="N° Commande">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Client">
                      <Input value={editingOrder.nom_client} disabled />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="date_commande"
                      label="Date Commande"
                      rules={[
                        { required: true, message: "Date de commande requise" },
                      ]}
                    >
                      <DatePicker
                        format="DD/MM/YYYY"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="date_livraison_prevue"
                      label="Date Livraison Prévue"
                    >
                      <DatePicker
                        format="DD/MM/YYYY"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="statut"
                      label="Statut"
                      rules={[{ required: true, message: "Statut requis" }]}
                    >
                      <Select placeholder="Sélectionner un statut">
                        <Option value="pending">En attente</Option>
                        <Option value="processing">En cours</Option>
                        <Option value="completed">Terminée</Option>
                        <Option value="cancelled">Annulée</Option>
                        <Option value="invoiced">Facturée</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="tax_rate"
                      label="Taux de TVA (%)"
                      rules={[
                        { required: true, message: "Taux de TVA requis" },
                      ]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        max={100}
                        onChange={() =>
                          setTimeout(
                            () =>
                              recalculateTotalsInDrawer(
                                currentProductsInDrawer,
                                drawerForm.getFieldValue("tax_rate")
                              ),
                            0
                          )
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="notes" label="Notes">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="conditions_paiement"
                      label="Conditions de Paiement"
                    >
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider>Produits de la Commande</Divider>
                <Button
                  onClick={handleAddProductToDrawerOrder}
                  type="dashed"
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 16 }}
                  disabled={!editingOrder}
                >
                  Ajouter Produit
                </Button>
                <Table
                  rowKey="id"
                  columns={productColumnsInDrawer}
                  dataSource={currentProductsInDrawer}
                  pagination={false}
                  size="small"
                  bordered
                  scroll={{ x: 600 }}
                />
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
                      value={editingOrder.montant_ht}
                      formatter={(val) => formatCurrency(val)}
                    />
                    <Statistic
                      title="Montant TVA"
                      value={editingOrder.montant_tva}
                      formatter={(val) => formatCurrency(val)}
                    />
                    <Title level={5} style={{ marginTop: 10 }}>
                      Montant TTC: {formatCurrency(editingOrder.montant_ttc)}
                    </Title>
                  </Col>
                </Row>
              </>
            )
          )}
        </Form>
      </Drawer>

      <Modal
        title="Ajouter Produit à la Commande"
        open={isProductModalVisible}
        onCancel={() => setIsProductModalVisible(false)}
        onOk={handleProductModalSave}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form
          form={productForm}
          layout="vertical"
          initialValues={{ quantite: 1, remise_pourcentage: 0 }}
        >
          <Form.Item
            name="produit_id"
            label="Produit"
            rules={[
              { required: true, message: "Veuillez sélectionner un produit" },
            ]}
          >
            <Select
              showSearch
              placeholder="Sélectionner un produit"
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.children || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => {
                const selectedProd = availableProducts.find(
                  (p) => p.id === value
                );
                if (selectedProd) {
                  productForm.setFieldsValue({
                    prix_unitaire:
                      selectedProd.prix_unitaire || selectedProd.prix,
                  });
                }
              }}
            >
              {availableProducts.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.nom_produit} ({formatCurrency(p.prix_unitaire || p.prix)})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantite"
            label="Quantité"
            rules={[
              { required: true, message: "Quantité requise" },
              {
                type: "number",
                min: 0.01,
                message: "La quantité doit être positive",
              },
            ]}
          >
            <InputNumber min={0.01} style={{ width: "100%" }} step={0.1} />
          </Form.Item>
          <Form.Item
            name="prix_unitaire"
            label="Prix Unitaire"
            rules={[
              { required: true, message: "Prix requis" },
              { type: "number", min: 0, message: "Prix invalide" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={0.01}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            name="remise_pourcentage"
            label="Remise (%)"
            rules={[
              { type: "number", min: 0, max: 100, message: "Remise invalide" },
            ]}
          >
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout.Content>
  );
}
