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
    Radio,
    Checkbox,
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
  import { getApiService } from "../../services/apiServiceFactory";
  import ClientService from "../../features/clientManagement/services/ClientService";
  import ProductService from "../../components/BonsDevis/ProductService";
  import moment from "moment";
  import FacturePdfApiService from "../../features/orders/services/FacturePdfApiService";
  import InvoiceService from "../../features/manifeste/services/InvoiceService";
  import { useNavigate } from 'react-router-dom';


  const { Text } = Typography;
  const { cdsService } = getApiService();
  const { Option } = Select;
  const { Title } = Typography;
  const formatCurrency = (amount, currency = " ") => {
    return new Intl.NumberFormat("fr-TN", {
      style: "decimal",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount || 0);
  };
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
  const translatePaymentMethod = (method) => {
    const methodMap = {
      cash: "Comptant",
      traite: "Traite",
      cheque: "Chèque",
      virement: "Virement",
      carte: "Carte",
    };
    return methodMap[method] || method || "N/A";
  };
  export default function Facture(props) {
    const [selectedBonDetails, setSelectedBonDetails] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [invoiceType, setInvoiceType] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [clientNameFilter, setClientNameFilter] = useState(""); // New client name filter
    const [clientCodeFilter, setClientCodeFilter] = useState("");
    const [selectedClientFilter, setSelectedClientFilter] = useState(null); // Client ID for filtering
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [dateRange, setDateRange] = useState(new Date());
    const [priceRange, setPriceRange] = useState([null, null]); // [min, max]
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [drawerForm] = Form.useForm();
    const date_commande_value = drawerForm.getFieldValue("date_commande");
    const date_commande_str = moment.isMoment(date_commande_value)
      ? date_commande_value.format("yyyy-MM-dd")
      : "";
    const [availableProducts, setAvailableProducts] = useState([]);
    const [availableBon, setAvailableBon] = useState([]);
    const [checkedBons, setCheckedBons] = useState([]);
    const [isProductModalVisible, setIsProductModalVisible] = useState(false);
    const [isBonModalVisible, setIsBonModalVisible] = useState(false);
    const [productForm] = Form.useForm();
    const [BonForm] = Form.useForm();
    const [currentProductsInDrawer, setCurrentProductsInDrawer] = useState([]);
    const [currentBonInDrawer, setCurrentBonInDrawer] = useState([]); // many bons
    const [isCreating, setIsCreating] = useState(false);
    const [availableClients, setAvailableClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [newOrderProducts, setNewOrderProducts] = useState([]);
    const [newOrderBon, setNewOrderBon] = useState([]);
  const navigate = useNavigate();

    const recalculateTotalsInDrawer = (products, taxRate, bons) => {
      const currentTaxRate =
        typeof taxRate === "number"
          ? taxRate
          : parseFloat(drawerForm.getFieldValue("tax_rate")) || 0;
      const timbreFiscal =
        parseFloat(drawerForm.getFieldValue("timbre_fiscal")) || 0;

      const montantHtB = bons.reduce((sum, b) => sum + (b.total_ttc || 0), 0);
      const montantHtP = products.reduce(
        (sum, p) => sum + (p.prix_total || 0),
        0
      );
      const montantHt = montantHtB + montantHtP;
      const montantTva = montantHt * (currentTaxRate / 100);
      const montantTtc = montantHt + montantTva + timbreFiscal;
      drawerForm.setFieldsValue({
        montant_ht_display: montantHt,
        montant_tva_display: montantTva,
        montant_ttc_display: montantTtc,
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

  const fetchAvailableBons = useCallback(async () => {
    try {
      const response = await InvoiceService.getAllInvoices();

      const Bons = Array.isArray(response.results) ? response.results : [];

      const mappedBons = Bons.map((bon) => ({
        ...bon,
        numero_facture: bon.numero_facture, // redundant but okay
      }));

      const filteredBons = selectedClientId
        ? mappedBons.filter(
            (bon) => bon.client_details?.id === selectedClientId
          )
        : [];

      setAvailableBon(filteredBons);
    } catch (err) {
      console.error("Error fetching bons:", err);
      message.error("Failed to fetch available bons: " + err.message);
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchAvailableBons();
  }, [fetchAvailableBons]);

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
    } catch (err) {
      console.error("Error fetching products:", err);
      message.error("Failed to fetch available products: " + err.message);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchAvailableProducts();
    fetchAvailableClients();
    fetchAvailableBons();
  }, [
    fetchAvailableProducts,
    fetchAvailableClients,
    fetchAvailableBons,
    props.nature
  ]);

  const handleEditOrder = async (order) => {
    setLoading(true);
    setIsCreating(false)
    try {
      const fullOrderDetails = await cdsService.getOrderById(order.id);
      const bons_list = await Promise.all(
        fullOrderDetails.bons.map(async(bonId) => {
        return await InvoiceService.getInvoiceById(bonId)
      }))
      console.log("fullOrderDetails", fullOrderDetails)
      setInvoiceType(fullOrderDetails.type_facture)
      const formattedBonsList = [
        // ...currentBonInDrawer,
        ...bons_list.map(bon => ({
          ...bon,
          nom_client: bon.client_name,
          bon_numero: bon.numero_facture,
        }))
      ]
      console.log(formattedBonsList)
      setCurrentBonInDrawer(formattedBonsList)
      if (fullOrderDetails) {
        setEditingOrder(fullOrderDetails);
        // Map products from produits_details or produit_commande
        let mappedProducts = [];
        if(fullOrderDetails.type_facture==='produit'){
          if (
            fullOrderDetails.produit_commande &&
            fullOrderDetails.produit_commande.length > 0
          ) {
            mappedProducts = fullOrderDetails.produit_commande.map((product) => ({
              id: product.id,
              produit_id: product.produit_id || product.produit,
              bon_id: product.bonId,
              bon_numero: product.bon_numero,
              nom_produit: product.nom_produit,
              quantite: Number(product.quantite) || 1,
              prix_unitaire: Number(product.prix_unitaire) || 0,
              remise_pourcentage: Number(product.remise_pourcentage) || 0,
              prix_total: Number(product.prix_total) || 0,
            }));
            console.log(mappedProducts)
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

        }else{ // Type facture == bon
          mappedProducts = formattedBonsList.map((bon) => 
              bon.items.map((product)=>({
                id: product.produit_id,
                produit_id: product.produit_id || product.produit,
                bon_id: bon.id,
                bon_numero: bon.bon_numero,
                nom_produit: product.nom_produit,
                quantite: Number(product.billable.quantite) || 1,
                prix_unitaire: Number(product.billable.prix_unitaire) || 0,
                remise_pourcentage: Number(product.remise_percent_produit) || 0,
                remise: Number(product.remise_produit) || 0,
                prix_total: product.billable.prix_unitaire*product.billable.quantite-product.remise_produit,
              }))
            );
            console.log(mappedProducts)
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
          date_commande: moment(fullOrderDetails.date_commande).format("YYYY-MM-DD"),
          date_livraison_prevue: moment(fullOrderDetails.date_livraison_prevue).format("YYYY-MM-DD"),
          mode_paiement: fullOrderDetails.mode_paiement || "cash",
          statut: fullOrderDetails.statut || "pending",
          tax_rate: fullOrderDetails.tax_rate || 0,
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

      if (editingOrder) {
        setEditingOrder((prev) => ({
          ...prev,
          montant_ht: montantHt,
          montant_tva: montantTva,
          montant_ttc: montantTtc,
          timbre_fiscal: timbreFiscal,
        }));

      }
    };
    const fetchAvailableClients = useCallback(async () => {
      try {
        const clients = await ClientService.get_all_clients();
        setAvailableClients(clients);
      } catch (err) {
        message.error("Failed to fetch clients: " + err.message);
      }
    }, []);
    const fetchOrders = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await cdsService.getOrders(props.nature)
        console.log(data)
        setOrders(data);
        setFilteredOrders(data); // Initialize filteredOrders with all orders
      } catch (err) {
        setError(err.message || "Failed to fetch orders");
        message.error("Failed to fetch orders: " + err.message);
        console.error("Order fetch error details:", err);
      } finally {
        setLoading(false);
      }
    }, [props.nature]);
    const filterOrders = useCallback(() => {
      if (!orders.length) return;
      let result = [...orders];
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
        const finalMontantHt = ProdMontantHt + BonMontant;
        const finalMontantTva = finalMontantHt * (taxRate / 100);
        const finalMontantTtc = finalMontantHt + finalMontantTva + timbreFiscal;
        setInvoiceType(values.type_facture)
        console.log("values: ", values)
        const orderPayload = {
          nature: props.nature, // Facture ou avoir
          client_id: selectedClientId,
          client: selectedClientId,
          date_commande: toISO(values.date_commande),
          date_livraison_prevue: toISO(values.date_livraison_prevue),
          type_facture: values.type_facture || "",
          statut: values.statut || "pending",
          notes: values.notes || "",
          conditions_paiement: values.conditions_paiement || "",
          mode_paiement: values.mode_paiement || "cash",
          tax_rate: taxRate,
          timbre_fiscal: timbreFiscal,
          montant_ht: finalMontantHt,
          montant_tva: finalMontantTva,
          montant_ttc: finalMontantTtc,
          produits: [
            // Manual products
            ...newOrderProducts.map((p) => ({
              produit: p.produit_id || p.produit,
              quantite: p.quantite,
              prix_unitaire: p.prix_unitaire,
              remise_pourcentage: p.remise_pourcentage || 0,
            })),
            // Bon products
            ...currentBonInDrawer.flatMap(bon => bon.items) 
              .filter(
                (item) =>
                  item.billable?.quantite > 0 &&
                  item.billable?.prix_unitaire > 0
              )
              .map((item) => ({
                bon_id: item.bonId || item.bon_id,
                bon_numero: item.bon_numero,
                produit: item.produit_id || item.produit || item.id,
                quantite: item.billable.quantite,
                prix_unitaire: item.billable.prix_unitaire,
              })),
          ], 
          bons: currentBonInDrawer.map((bon)=> bon.bon_id || bon.id),
        };
        
        
        console.log("newOrderBon ", newOrderBon)
        console.log("currentBonInDrawer ", currentBonInDrawer)
        console.log("orderPayload ", orderPayload)
        const createdOrder = await cdsService.createOrder(orderPayload);
        message.success(
          `${props.nature == 'facture'? 'Facture' : 'Avoir'} ${
            createdOrder.numero_commande || formatInvoiceNumber(createdOrder)
          } créé${props.nature == 'facture'? 'e' : ''} avec succès!`
      }
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
      if (selectedClientFilter) {
        result = result.filter((order) => {
          const orderClientIdentifier =
            order.client_id !== undefined && order.client_id !== null
              ? order.client_id
              : typeof order.client === "number"
              ? order.client
              : null;
          return orderClientIdentifier === selectedClientFilter;
        });
      }
      if (selectedStatus) {
        result = result.filter((order) => order.statut === selectedStatus);
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].startOf("day").valueOf();
        const endDate = dateRange[1].endOf("day").valueOf();
        // Destructure to safely separate product lists from the rest of the order data
        const { produit_commande, produits, ...restOfEditingOrder } =
          editingOrder;
        setInvoiceType(values.type_facture)
        console.log(currentProductsInDrawer)
        //  Extract products from bons 
        const bonsProducts = await Promise.all(
          currentBonInDrawer.map(async (bon) => {
            const fullBon = await InvoiceService.getInvoiceById(bon.bon_id || bon.id);
            console.log(fullBon)
            return fullBon.items.map(p => ({
              bonId: fullBon.id,
              bon_numero: fullBon.numero_facture,
              produit: p.produit || p.produit_id,
              produit_nom: p.nom_produit,
              quantite: p.billable.quantite,
              prix_unitaire: p.billable.prix_unitaire,
            }));
          })
        );
        const flatBonProducts = bonsProducts.flat();
        const orderPayload = {
          ...restOfEditingOrder, // Base with existing data (excluding old product lists)
          ...values, // Override with form values (like notes, dates, status, client_id if changed)
          date_commande: toISO(values.date_commande),
          date_livraison_prevue: toISO(values.date_livraison_prevue),
          tax_rate: taxRate,
          type_facture: values.type_facture,
          timbre_fiscal: timbreFiscal, // Add timbre fiscal
          montant_ht: finalMontantHt,
          montant_tva: finalMontantTva,
          montant_ttc: finalMontantTtc,
          // Use 'produit_commande' as the key for line items
          produit_commande: values.type_facture === "produit"
            ?
            currentProductsInDrawer.map((p) => ({
              id: p.id,
              // bon_id: p.bon_id || p.bonId,
              // bon_numero: p.bon_numero,
              produit: p.produit_id || p.produit,
              quantite: p.quantite,
              prix_unitaire: p.prix_unitaire,
              remise_pourcentage: p.remise_pourcentage || 0,
            }))
            :
            // 2. Products from bons
            flatBonProducts
          ,
          mode_paiement: values.mode_paiement,
          bons: currentBonInDrawer.map((bon)=> bon.bon_id || bon.id)
        };
        console.log("currentProductsInDrawer", currentProductsInDrawer)
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
        console.log("orderPayload", orderPayload)
        console.log("updatedOrder", updatedOrder)
        setCheckedBons([])
        // The setEditingOrder and recalculateTotalsInDrawer might be redundant here if closing drawer
        // but good for consistency if drawer remained open.
        // setEditingOrder(updatedOrder);
        console.log(currentBonInDrawer)
        recalculateTotalsInDrawer(updatedOrder.produit_commande, updatedOrder.tax_rate || taxRate, currentBonInDrawer);
        message.success(`${props.nature == 'facture'? 'Facture mise' : 'Avoir mis'} à jour avec succès!`);
        result = result.filter((order) => {
          const orderDate = moment(order.date_commande).valueOf();
          return orderDate >= startDate && orderDate <= endDate;
        });
      }
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
    useEffect(() => {
      filterOrders();
    }, [filterOrders]);
    const fetchAvailableBons = useCallback(async () => {
      try {
        const response = await InvoiceService.getAllInvoices();
        const Bons = Array.isArray(response.results) ? response.results : [];
        const mappedBons = Bons.map((bon) => ({
          ...bon,
          numero_facture: bon.numero_facture, // redundant but okay
        }));
        const filteredBons = selectedClientId
          ? mappedBons.filter(
              (bon) => bon.client_details?.id === selectedClientId
            )
          : [];
        setAvailableBon(filteredBons);
      } catch (err) {
        console.error("Error fetching bons:", err);
        message.error("Failed to fetch available bons: " + err.message);
      }
    }, [selectedClientId]);
    useEffect(() => {
      fetchAvailableBons();
    }, [fetchAvailableBons]);
    const fetchAvailableProducts = useCallback(async () => {
      try {
        const response = await ProductService.getProducts();
        const products = response.results ? response.results : response;
        const mappedProducts = products.map((product) => ({
          ...product,
          prix_unitaire: product.prix, // Map the prix field to prix_unitaire for compatibility
        }));
        setAvailableProducts(mappedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        message.error("Failed to fetch available products: " + err.message);
      }
    }, []);
    useEffect(() => {
      fetchOrders();
      fetchAvailableProducts();
      fetchAvailableClients();
      fetchAvailableBons();
    }, [
      fetchAvailableProducts,
      fetchAvailableClients,
      fetchAvailableBons,
      props.nature
    ]);
    const handleEditOrder = async (order) => {
      setLoading(true);
      setIsCreating(false)
      try {
        const fullOrderDetails = await cdsService.getOrderById(order.id);
        const bons_list = await Promise.all(
          fullOrderDetails.bons.map(async(bonId) => {
          return await InvoiceService.getInvoiceById(bonId)
        }))
        console.log("fullOrderDetails", fullOrderDetails)
        setInvoiceType(fullOrderDetails.type_facture)
        const formattedBonsList = [
          ...currentBonInDrawer,
          ...bons_list.map(bon => ({
            ...bon,
            nom_client: bon.client_name,
            bon_numero: bon.numero_facture,
          }))
        ]
        setCurrentBonInDrawer(formattedBonsList)
        if (fullOrderDetails) {
          setEditingOrder(fullOrderDetails);
          let mappedProducts = [];
          if (
            fullOrderDetails.produit_commande &&
            fullOrderDetails.produit_commande.length > 0
          ) {
            mappedProducts = fullOrderDetails.produit_commande.map((product) => ({
              id: product.id,
              produit_id: product.produit_id || product.produit,
              bon_id: product.bonId,
              bon_numero: product.bon_numero,
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
            const totalAmount = Number(fullOrderDetails.montant_ht) || 0;
            const productsCount = fullOrderDetails.produits_details.length;
            mappedProducts = fullOrderDetails.produits_details.map(
              (product, index) => {
                const unitPrice = Number(product.prix) || 0;
                let calculatedQuantity = 1;
                let calculatedTotal = unitPrice;
                if (productsCount === 1 && totalAmount > 0 && unitPrice > 0) {
                  calculatedQuantity = Math.round(totalAmount / unitPrice);
                  calculatedTotal = totalAmount;
                } else if (productsCount > 1) {
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
          const clientId =
            fullOrderDetails.client_id ||
            (typeof fullOrderDetails.client === "number"
              ? fullOrderDetails.client
              : null) ||
            fullOrderDetails.client?.id ||
            null;
          setSelectedClientId(clientId);
          drawerForm.setFieldsValue({
            ...fullOrderDetails,
            client_id: clientId,
            date_commande: moment(fullOrderDetails.date_commande).format("YYYY-MM-DD"),
            date_livraison_prevue: moment(fullOrderDetails.date_livraison_prevue).format("YYYY-MM-DD"),
            mode_paiement: fullOrderDetails.mode_paiement || "cash",
            statut: fullOrderDetails.statut || "pending",
            tax_rate: fullOrderDetails.tax_rate || 0,
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
    const handleCreateOrder = () => {
      setIsCreating(true);
      setEditingOrder(null);
      setCurrentProductsInDrawer([]);
      setCurrentBonInDrawer([]);
      drawerForm.resetFields();
      drawerForm.setFieldsValue({
        date_commande: moment().format("YYYY-MM-DD"),
        date_livraison_prevue: moment().format("YYYY-MM-DD"),
        tax_rate: 0,
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
      setCurrentBonInDrawer([]);
      setNewOrderProducts([]);
      setNewOrderBon([]);
      setIsCreating(false);
      setSelectedClientId(null);
      drawerForm.resetFields();
      setInvoiceType("")
    };
    const handleDrawerSave = async () => {
      try {
        const values = await drawerForm.validateFields(); 
        function toISO(d) {
          if (!d) return null;
          // string? assume it's already "YYYY-MM-DD"
          if (typeof d === "string") return d;
          // otherwise a Moment
          return d.format("YYYY-MM-DD");
        }
        setLoading(true);
        const taxRate = parseFloat(values.tax_rate) || 0;
        const timbreFiscal =  (props.nature == 'facture'? parseFloat(values.timbre_fiscal) || 1 : 0);
        if (isCreating) {
          if (!selectedClientId) {
            message.error("Veuillez sélectionner un client");
            setLoading(false);
            return;
          }
          if (newOrderProducts.length === 0 && newOrderBon.length === 0) {
            message.error("Veuillez ajouter au moins un produit/bon à la commande");
            setLoading(false);
            return;
          }
          const ProdMontantHt = newOrderProducts.reduce(
            (sum, p) => sum + (p.prix_total || 0),
            0
          );
          const BonMontant = newOrderBon.reduce(
            (sum, b) => sum + (b.billable?.prix_unitaire || 0),
            0
          );
          const finalMontantHt = ProdMontantHt + BonMontant;
          const finalMontantTva = finalMontantHt * (taxRate / 100);
          const finalMontantTtc = finalMontantHt + finalMontantTva + timbreFiscal;
          setInvoiceType(values.type_facture)
          console.log("values: ", values)
          const orderPayload = {
            nature: props.nature, // Facture ou avoir
            client_id: selectedClientId,
            client: selectedClientId,
            date_commande: toISO(values.date_commande),
            date_livraison_prevue: toISO(values.date_livraison_prevue),
            type_facture: values.type_facture || "",
            statut: values.statut || "pending",
            notes: values.notes || "",
            conditions_paiement: values.conditions_paiement || "",
            mode_paiement: values.mode_paiement || "cash",
            tax_rate: taxRate,
            timbre_fiscal: timbreFiscal,
            montant_ht: finalMontantHt,
            montant_tva: finalMontantTva,
            montant_ttc: finalMontantTtc,
            produits: [
              ...newOrderProducts.map((p) => ({
                produit: p.produit_id || p.produit,
                quantite: p.quantite,
                prix_unitaire: p.prix_unitaire,
                remise_pourcentage: p.remise_pourcentage || 0,
              })),
              ...newOrderBon
                .filter(
                  (item) =>
                    item.billable?.quantite > 0 &&
                    item.billable?.prix_unitaire > 0
                )
                .map((item) => ({
                  bonId: item.bonId,
                  bon_numero: item.bon_numero,
                  produit: item.produit_id || item.produit || item.id,
                  quantite: item.billable.quantite,
                  prix_unitaire: item.billable.prix_unitaire,
                })),
            ], 
            bons: currentBonInDrawer.map((bon)=> bon.bon_id || bon.id),
          };
          
          console.log("newOrderBon ", newOrderBon)
          console.log("currentBonInDrawer ", currentBonInDrawer)
          console.log("orderPayload ", orderPayload)
          const createdOrder = await cdsService.createOrder(orderPayload);
          message.success(
            `${props.nature == 'facture'? 'Facture' : 'Avoir'} ${
              createdOrder.numero_commande || formatInvoiceNumber(createdOrder)
            } créé${props.nature == 'facture'? 'e' : ''} avec succès!`
          );
        } else {
          const finalMontantHt = currentProductsInDrawer.reduce(
            (sum, p) => sum + (p.prix_total || 0),
            0
          );
          console.log(currentProductsInDrawer)
          const finalMontantTva = finalMontantHt * (taxRate / 100);
          const finalMontantTtc = finalMontantHt + finalMontantTva + timbreFiscal;
          const { produit_commande, produits, ...restOfEditingOrder } =
            editingOrder;
          setInvoiceType(values.type_facture)
          console.log(currentProductsInDrawer)
          const bonsProducts = await Promise.all(
            currentBonInDrawer.map(async (bon) => {
              const fullBon = await InvoiceService.getInvoiceById(bon.bon_id || bon.id);
              console.log(fullBon)
              return fullBon.items.map(p => ({
                bonId: fullBon.id,
                bon_numero: fullBon.numero_facture,
                produit: p.produit || p.produit_id,
                produit_nom: p.nom_produit,
                quantite: p.quantite,
                prix_unitaire: p.prix_unitaire,
              }));
            })
          );
          const flatBonProducts = bonsProducts.flat();
          const orderPayload = {
            ...restOfEditingOrder, // Base with existing data (excluding old product lists)
            ...values, // Override with form values (like notes, dates, status, client_id if changed)
            date_commande: toISO(values.date_commande),
            date_livraison_prevue: toISO(values.date_livraison_prevue),
            tax_rate: taxRate,
            type_facture: values.type_facture,
            timbre_fiscal: timbreFiscal, // Add timbre fiscal
            montant_ht: finalMontantHt,
            montant_tva: finalMontantTva,
            montant_ttc: finalMontantTtc,
            produit_commande: [
              ...currentProductsInDrawer.map((p) => ({
                id: p.id,
                produit: p.produit_id || p.produit,
                quantite: p.quantite,
                prix_unitaire: p.prix_unitaire,
                remise_pourcentage: p.remise_pourcentage || 0,
              })),
              ...flatBonProducts
            ],
            mode_paiement: values.mode_paiement,
            bons: currentBonInDrawer.map((bon)=> bon.bon_id || bon.id)
          };
          if (values.client_id) {
            orderPayload.client_id = values.client_id;
            orderPayload.client = values.client_id; // Ensure backend compatibility
          }
          delete orderPayload.montant_ht_display; // These are UI only
          delete orderPayload.montant_tva_display;
          delete orderPayload.montant_ttc_display;
          if (orderPayload.client && typeof orderPayload.client === "object") {
            orderPayload.client = orderPayload.client_id;
          }
          const updatedOrder = await cdsService.updateOrder(
            editingOrder.id,
            orderPayload
          );
          console.log("updatedOrder", updatedOrder)
          console.log("orderPayload", orderPayload)
          setCheckedBons([])
          console.log(currentBonInDrawer)
          recalculateTotalsInDrawer(updatedOrder.produit_commande, updatedOrder.tax_rate || taxRate, currentBonInDrawer);
          message.success(`${props.nature == 'facture'? 'Facture mise' : 'Avoir mis'} à jour avec succès!`);
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
    const handleAddBonToDrawerOrder = () => {
      if (!selectedClientId) {
        message.warning("Veuillez d'abord sélectionner un client.");
        return;
      }
      fetchAvailableBons();
      BonForm.resetFields();
      setIsBonModalVisible(true);
    };
    const handleBonModalSave = async () => {
      try {
        const values = await BonForm.validateFields();
        const selectedBonNumbers = values.numero_facture || [];
      setCurrentBonInDrawer(updatedBonList);
      setNewOrderBon(allNewItems);
      console.log("updatedBonList", updatedBonList  )
      console.log("allNewItems", allNewItems)
      // Update products
      const bonProducts = updatedBonList.flatMap((bon)=>bon.items.flat()) // Extract products from bon
      // // If a product is already included, sum the quantity
      // const productMap = new Map();
      // bonProducts.forEach((product) => {
      //   const existing = productMap.get(product.produit_id);
      //   if (existing) {
      //     existing.billable.quantite += product.billable.quantite;
      //   } else {
      //     // on le clone pour éviter les effets de bord
      //     productMap.set(product.produit_id, { ...product });
      //   }
      // });
      // const mergedProducts = Array.from(productMap.values());
      // Format to fit
      const formattedProducts = bonProducts.map((p)=>{
        return{
          ...p,
          quantite: p.billable.quantite,
          prix_unitaire: p.billable.prix_unitaire,
          remise_pourcentage: p.remise_percent_produit,
          remise: p.remise_produit,
          prix_total: p.billable.quantite * p.billable.prix_unitaire - p.remise_produit
        }
      })
      console.log(formattedProducts)
      setCurrentProductsInDrawer(formattedProducts)
      const currentTaxRate = drawerForm.getFieldValue("tax_rate") || 0;
      recalculateTotalsInDrawer(newOrderProducts, currentTaxRate, updatedBonList);    
      message.success(`${addedCount} bon(s) ajouté(s) avec succès !`);
      setIsBonModalVisible(false);
    } catch (err) {
      console.error("Erreur lors de la validation des bons:", err);
      message.error("Échec de l'ajout des bons");
    }
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
      if (editingProduct) {
        // We're editing
        const updatedProducts = currentProductsInDrawer.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                quantite: values.quantite,
                prix_unitaire: values.prix_unitaire,
                remise_pourcentage: values.remise_pourcentage || 0,
                prix_total:
                  values.quantite *
                  values.prix_unitaire *
                  (1 - (values.remise_pourcentage || 0) / 100),
              }
            : p

        if (!Array.isArray(selectedBonNumbers) || selectedBonNumbers.length === 0) {
          message.error("Aucun bon sélectionné");
          return;
        }
        const selectedBons = availableBon.filter(bon =>
          selectedBonNumbers.includes(bon.numero_facture)

        );
        if (selectedBons.length === 0) {
          message.error("Aucun bon valide trouvé");
          return;
        }
        let addedCount = 0;
        let updatedBonList = [...currentBonInDrawer];
        let allNewItems = [...newOrderBon];
        const existingProductIds = new Set(
          allNewItems.map((item) => item.produit_id || item.produit)
        );
        for (const bon of selectedBons) {
          const bonAlreadyAdded = currentBonInDrawer.some(
            (b) => b.bon_numero === bon.numero_facture
          );
          if (bonAlreadyAdded) {
            continue;
          }
          bon.items.forEach((item)=> {
            item.bonId = bon.id
            item.bon_numero = bon.numero_facture
          })
          const newBonData = {
            bon_id: bon.id,
            bon_numero: bon.numero_facture,
            nom_client: bon.client_details?.nom_client || "",
            date_emission: bon.date_emission,
            statut: bon.statut,
            total_ttc: bon.total_ttc,
            items_count: bon.items?.length || 0,
            items: bon.items || []
          };
          updatedBonList.push(newBonData);
          const newItems = bon.items || [];
          const uniqueNewItems = newItems.filter(
            (item) => !existingProductIds.has(item.produit_id || item.produit)
          );
          uniqueNewItems.forEach((item) =>
            existingProductIds.add(item.produit_id || item.produit)
          );
          allNewItems = [...allNewItems, ...uniqueNewItems];
          addedCount++;
        }
        if (addedCount === 0) {
          message.warning("Tous les bons sélectionnés sont déjà ajoutés.");
          return;
        }
        setCurrentBonInDrawer(updatedBonList);
        setNewOrderBon(allNewItems);
        console.log("updatedBonList", updatedBonList  )
        console.log("allNewItems", allNewItems)
        const currentTaxRate = drawerForm.getFieldValue("tax_rate") || 0;
        recalculateTotalsInDrawer(newOrderProducts, currentTaxRate, updatedBonList);
        message.success(`${addedCount} bon(s) ajouté(s) avec succès !`);
        setIsBonModalVisible(false);
      } catch (err) {
        console.error("Erreur lors de la validation des bons:", err);
        message.error("Échec de l'ajout des bons");
      }
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
        if (editingProduct) {
          const updatedProducts = currentProductsInDrawer.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  quantite: values.quantite,
                  prix_unitaire: values.prix_unitaire,
                  remise_pourcentage: values.remise_pourcentage || 0,
                  prix_total:
                    values.quantite *
                    values.prix_unitaire *
                    (1 - (values.remise_pourcentage || 0) / 100),
                }
              : p
          );
          setCurrentProductsInDrawer(updatedProducts);
          if (isCreating){
            setNewOrderProducts(updatedProducts);
          }
          setEditingProduct(null);
          setIsProductModalVisible(false);
          recalculateTotalsInDrawer(
            updatedProducts,
            drawerForm.getFieldValue("tax_rate"),
            currentBonInDrawer
          );
          message.success("Produit modifié avec succès");
        } else {
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
            setIsProductModalVisible(false);
            message.success("Quantité du produit mise à jour");
          } else {
            const tempId = `temp-${Date.now()}-${Math.floor(
              Math.random() * 1000
            )}`;
            const productToAdd = { ...newProductData, id: tempId };
            updatedNewOrderProducts = [...newOrderProducts, productToAdd];
            setIsProductModalVisible(false);
            message.success("Produit ajouté à la commande");
          }
          setNewOrderProducts(updatedNewOrderProducts);
          setCurrentProductsInDrawer(updatedNewOrderProducts);
          recalculateTotalsInDrawer(updatedNewOrderProducts, currentTaxRate);
          recalculateTotalsInDrawer(
            updatedNewOrderProducts,
            currentTaxRate,
            currentBonInDrawer
          );
        } else {
          const existingProductInDrawerIndex = currentProductsInDrawer.findIndex(
            (p) => (p.produit_id || p.produit) === values.produit_id
          );
          if (existingProductInDrawerIndex > -1) {
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
            recalculateTotalsInDrawer(
              updatedProductsInDrawer,
              currentTaxRate,
              currentBonInDrawer
            );
            setIsProductModalVisible(false);
            message.success("Produit mis à jour dans la commande");
          } else {
            const addedProductFromApi = await cdsService.addProductToOrder(
              editingOrder.id,
              newProductData // Send newProductData, backend assigns ID to the line item
            );
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
            recalculateTotalsInDrawer(
              newProductsList,
              currentTaxRate,
              currentBonInDrawer
            );
            setIsProductModalVisible(false);
            message.success("Produit ajouté à la commande");
          }
        }
      } }catch (errorInfo) {
        console.log("Product modal save failed:", errorInfo);
        message.error(
          "Failed to add product: " + (errorInfo.message || "Unknown error")
        );
      }
    };
    const handleRemoveBonFromDrawer = async (bonId) => {
      console.log(
        "Current bon IDs:",
        currentBonInDrawer.map((b) => b.bon_id || b.id)
      );
      try {
        const updatedBonList = currentBonInDrawer.filter(
          (bon) => bon.bon_numero !== bonId
        );
        setCurrentBonInDrawer(updatedBonList);
        const updatedNewOrderBon = newOrderBon.filter(
          (item) => item.bon_numero !== bonId // If your bon items have `bon_id`
        );
        setNewOrderBon(updatedNewOrderBon);
        setCheckedBons((prev) => prev.filter((val) => val !== bonId));
        setSelectedBonDetails((prev) =>
          Array.isArray(prev) ? prev.filter((bon) =>
            bon.bon_numero !== bonId &&
            bon.numero_facture !== bonId &&
            bon.id !== bonId
          ) : []
        );
        const currentTaxRate = drawerForm.getFieldValue("tax_rate") || 0;
        recalculateTotalsInDrawer(
          newOrderProducts,
          currentTaxRate,
          updatedBonList
        );
        message.success("Bon supprimé avec succès !");
      } catch (error) {
        console.error("Erreur lors de la suppression du bon:", error);
        message.error("Échec de la suppression du bon");
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
      console.log(detailedOrder)
      setCurrentBonInDrawer(detailedOrder.bons)
      setInvoiceType(detailedOrder.type_facture)
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
          recalculateTotalsInDrawer(
            updatedProducts,
            currentTaxRate,
            currentBonInDrawer
          );
        } else {
          const productToRemove = currentProductsInDrawer.find(
            (p) => p.id === produitIdToRemove
          );
          if (!productToRemove) {
            message.error("Produit non trouvé");
            return;
          }
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
          recalculateTotalsInDrawer(
            updatedProducts,
            currentTaxRate,
            currentBonInDrawer
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
        const detailedOrder = await cdsService.getOrderById(orderRecord.id);
        if (!detailedOrder) {
          message.error(
            "Données de commande non trouvées pour la génération du PDF."
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
            bon_id: orderProduct.bon_id,
            bon_numero: orderProduct.bon_numero,
            code_produit:
              orderProduct.code_produit ||
              productDetailsFromCatalog?.code_produit ||
              "XX",
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

          hideLoading();
          return;
        }
        setCurrentBonInDrawer(detailedOrder.bons)
        setInvoiceType(detailedOrder.type_facture)
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
            console.log(detailedOrder)
            console.log(orderProduct)

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
              bon_id: orderProduct.bonId,
              bon_numero: orderProduct.bon_numero,
              code_produit:
                orderProduct.code_produit ||
                productDetailsFromCatalog?.code_produit ||
                "XX",
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
        if (mappedProduitCommande.length === 0) {
          console.warn(
            "BonCommande.js: No products will be listed in the PDF. `produit_commande` and `produits_details` (fallback) are empty or unavailable.",
            detailedOrder
          );
        }
        const orderDataForPDF = {
          ...detailedOrder,
          produit_commande: mappedProduitCommande,
          date_commande: detailedOrder.date_commande
            ? moment(detailedOrder.date_commande).format("DD/MM/YYYY")
            : "",
          date_livraison_prevue: detailedOrder.date_livraison_prevue
            ? moment(detailedOrder.date_livraison_prevue).format("DD/MM/YYYY")
            : "",
          numero_commande: detailedOrder.numero_commande || "",
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
          conditions_paiement: detailedOrder.conditions_paiement || "",
          mode_paiement: translatePaymentMethod(detailedOrder.mode_paiement), // Add this
          notes: detailedOrder.notes || "",
          timbre_fiscal: detailedOrder.timbre_fiscal || 1, // Add timbre fiscal
          montant_ht: detailedOrder.montant_ht || 0,
          montant_tva: detailedOrder.montant_tva || 0,
          montant_ttc: detailedOrder.montant_ttc || 0,
          tax_rate: detailedOrder.tax_rate || 0,
          type_facture: detailedOrder.type_facture || '.'
        };
        console.log("Order data for PDF:", orderDataForPDF); // Debug log
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
        const summaryHTML = generateOrdersSummaryHTML(summaryData);
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
          <th>N° ${props.nature == 'facture' ? 'Facture' : 'Avoir'}</th>
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
            ${props.nature == 'facture'?
            <tr>
              <td colspan="4" style="text-align: right; font-weight: bold;">Timbre Fiscal:</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(
                summaryData.timbreFiscal || 0
              )}</td>
            </tr>
            : ''}
          </body>
        </html>
      `;
    };
    const { deleteInvoice } = useContext(InvoiceContext);
const handleDeleteOrder = async (orderId) => {
  try {
    setLoading(true);
    await deleteInvoice(orderId); // met en corbeille (is_deleted = true)
    message.success("Commande déplacée dans la corbeille");
    fetchOrders(); // recharge depuis le backend (filtre déjà les supprimées)
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
    await Promise.all(selectedRowKeys.map((id) => deleteInvoice(id)));
    message.success(`${selectedRowKeys.length} commande(s) déplacée(s) dans la corbeille`);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    fetchOrders(); // recharge la liste propre
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
        title: `N° ${props.nature == 'facture' ? 'Facture' : 'Avoir'}`,
        dataIndex: "id",
        key: "id",
        defaultSortOrder: "descend",
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
        sorter: (a, b) =>
          (a.code_client || "").localeCompare(b.code_client || ""),
      },
      {
        title: `Date ${props.nature == 'facture' ? 'Facture' : 'Avoir'}`,
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
          const total = (Number(amount) || 0);
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
                title={`Êtes-vous sûr de vouloir supprimer ${props.nature == 'facture' ? 'cette facture' : 'cet avoir'} ?`}
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
                  <FileDoneOutlined /> {props.nature == 'facture' ? 'Factures' : 'Avoirs'}
                </Title>
              </Col>
            </Row>
  6
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title= {`Total ${props.nature == 'facture' ? 'Factures' : 'Avoirs'}`}
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
              <Col xs={24} sm={12} md={8} lg={6}>
                <DatePicker.RangePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder={["Date début", "Date fin"]}
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
                  {props.nature == 'facture' ? 'Nouvelle Facture' : 'Nouveau Avoir'}
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
  <Col>
  <Button
    type="default"
    icon={<DeleteOutlined />}
    onClick={() => navigate("/factures/corbeille")}
  >
    Corbeille
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
                      title={`Supprimer les ${props.nature == 'facture' ? 'factures' : 'avoirs'} sélectionnées ?`}
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
              dataSource={filteredOrders} // Initial sort
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
              ? `${props.nature == 'facture' ? 'Nouvelle Facture' : 'Nouveau Avoir'}`
              : `Modifier ${props.nature == 'facture' ? 'Facture' : 'Avoir'} ${editingOrder?.numero_commande || ""}`
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
                <Form.Item
                  name="date_commande"
                  label={`Date ${props.nature == 'facture' ? 'Facture' : 'Avoir'}`}
                  rules={[
                    { required: true, message: "Veuillez entrer une date" },
                  ]}
                >
                    <Input type="date" style={{ width: "100%" }} />
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
                <Form.Item name="tax_rate" label="Taux TVA (%)">
                  <Select
                    style={{ width: "100%" }}
                    onChange={(value) =>
                      recalculateTotalsInDrawer(
                        currentProductsInDrawer,
                        value,
                        currentBonInDrawer
                      )
                    }
                    options={[
                      { value: 0, label: "0%" },
                      { value: 7, label: "7%" },
                      { value: 19, label: "19%" },
                    ]}
                    placeholder="Sélectionnez un taux"
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
                    <Option value="traite">Traite</Option>
                    <Option value="cash">Comptant</Option>
                    <Option value="cheque">Chèque</Option>
                    <Option value="virement">Virement Bancaire</Option>
                    <Option value="carte">Carte de crédit</Option>
                  </Select>
                </Form.Item>
              </Col>
              {props.nature == 'facture'?
                <Col span={12}>
                  <Form.Item name="timbre_fiscal" label="Timbre Fiscal">
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      step={0.01}
                      onChange={(value) => {
                        const currentTaxRate =
                          drawerForm.getFieldValue("tax_rate") || 0;
                        recalculateTotalsInDrawer(
                          currentProductsInDrawer,
                          currentTaxRate,
                          currentBonInDrawer
                        );
                      }}
                      />
                  </Form.Item>
                </Col> 
              : ''}
              <Col span={12}>
                <Form.Item
                  label={`Type ${props.nature == 'facture' ? 'de facture' : 'd\'avoir'}`}
                  name="type_facture"
                  rules={[
                    {
                      required: true,
                      message: `Veuillez sélectionner un type ${props.nature == 'facture' ? 'de facture' : 'd\'avoir'}`,
                    },
                  ]}
                >
                  <Select 
                    placeholder="Choisir"
                    value={invoiceType}
                    onChange={(value) => setInvoiceType(value)}
                    default=""
                  >
                    <Option value="produit">Produit</Option>
                    <Option value="bon">Bon de livraison</Option>
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
            {invoiceType=="bon"?(
              <>
                <Divider>Bon de livraison</Divider>
                <Button
                  type="dashed"
                  onClick={handleAddBonToDrawerOrder}
                  style={{ width: "100%", marginBottom: 16 }}
                  icon={<PlusOutlined />}
                >
                  Ajouter un Bon
                </Button>
                <Table
                  dataSource={currentBonInDrawer}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "Bon de livraison",
                      dataIndex: "bon_numero",
                      key: "bon_numero",
                    },
                    {
                      title: "Client",
                      dataIndex: "nom_client",
                      key: "nom_client",
                    },
                    {
                      title: "Date",
                      dataIndex: "date_emission",
                      key: "date_emission",
                    },
                    {
                      title: "Prix Total",
                      dataIndex: "total_ttc",
                      key: "total_ttc",
                      render: (prix) => formatCurrency(prix),
                    },
                    {
                      title: "Actions",
                      key: "actions",
                      render: (_, record) => (
                        <Space>
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            handleRemoveBonFromDrawer(record.bon_numero || record.id)
                          }
                        />
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ): invoiceType == "produit" ? (
              <>
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
                        <Space>
                        <Button
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => {
                            productForm.setFieldsValue({
                              produit_id: record.produit_id,
                              quantite: record.quantite,
                              prix_unitaire: record.prix_unitaire,
                              remise_pourcentage: record.remise_pourcentage,
                            });
                            setEditingProduct(record); // set the product being edited
                            setIsProductModalVisible(true);
                          }}
                        />
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
                        </Space>
                      ),
                    },
                  ]}
                />

                <Divider />
              </>
            ): ''}

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
              {props.nature == 'facture'?
                <Col span={8}>
                  <Form.Item name="timbre_fiscal" label="Timbre Fiscal">
                    <InputNumber
                      style={{ width: "100%" }}
                      formatter={(value) => formatCurrency(value)}
                      disabled
                    />
                  </Form.Item>
                </Col>
              : ''}
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
          onCancel={() => {
            setEditingProduct(null);
            setIsProductModalVisible(false);
          }}
          
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
                disabled={!!editingProduct}
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
                parser={(value) => value.replace(/\\s?|(,*)/g, "")}
              />
            </Form.Item>
            <Form.Item name="remise_pourcentage" label="Remise (%)">
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </Modal>
        {/* Bon Modal */}
        <Modal
          title="Ajouter un Bon"
          open={isBonModalVisible}
          onOk={handleBonModalSave}
          onCancel={() => setIsBonModalVisible(false)}
          okText="Ajouter"
          cancelText="Annuler"
        >
          <Form form={BonForm} layout="vertical">
            <Form.Item
              name="numero_facture"
              label="Bon de livraison"
              rules={[
                { required: true, message: "Veuillez sélectionner un Bon" },
              ]}
            >
              {availableBon.length === 0 ? (
                <Alert
                  message="Il n'y a pas de bon de livraison disponible"
                  type="info"
                  showIcon
                />
              ) : (
                <Checkbox.Group
          value={checkedBons}
          onChange={(checkedValues) => {
            setCheckedBons(checkedValues);
            // Optional: update BonForm or other logic
            BonForm.setFieldsValue({ numero_facture: checkedValues });

            console.log("✅ Checked bons:", checkedValues);
          }}
          >
          {availableBon.map((bon) => (
            <Checkbox key={bon.numero_facture} value={bon.numero_facture}>
              {bon.numero_facture} - {bon.client_details?.nom_client}
            </Checkbox>
              ))}
            </Checkbox.Group>
                        )}
            {checkedBons.length > 0 && (
              <div
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  padding: "12px",
                  marginTop: "16px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p><strong>Articles inclus:</strong></p>
                <ul style={{ paddingLeft: 20 }}>
                  {availableBon
                    .filter(bon => checkedBons.includes(bon.numero_facture))
                    .map((bon, bonIndex) => (
                      <li key={bonIndex}>
                        <strong>
                          Bon N° {bon.bon_numero || bon.numero_facture || bon.id} – Total TTC: {bon.total_ttc}
                        </strong>
                        <ul style={{ paddingLeft: 20 }}>
                          {(bon.items || []).map((item, itemIndex) => (
                            <li key={itemIndex}>
                              {item.nom_produit || "Produit"} – Qté: {item.billable?.quantite ?? "?"}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            </Form.Item>
          </Form>
        </Modal>
      </Layout.Content>
    );
  }