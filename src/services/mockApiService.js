/**
 * This file provides mock API services for local development and testing
 * when the backend is not available or not yet implemented.
 * It simulates API responses with local data.
 */

// Mock order data
const mockOrders = [
  { 
    id: 1, 
    numero_commande: "CMD-2025-001", 
    client_id: 5, 
    nom_client: "Client Alpha", 
    date_commande: "2025-05-03", 
    date_livraison_prevue: "2025-05-10", 
    statut: "pending", 
    montant_ht: 1250.0, 
    montant_tva: 250.0, 
    montant_ttc: 1500.0, 
    tax_rate: 20, 
    devis_numero: "DEV-2025-001", 
    notes: "Urgent", 
    conditions_paiement: "Net 30" 
  },
  { 
    id: 2, 
    numero_commande: "CMD-2025-002", 
    client_id: 6, 
    nom_client: "Client Beta", 
    date_commande: "2025-05-04", 
    date_livraison_prevue: "2025-05-12", 
    statut: "processing", 
    montant_ht: 800.0, 
    montant_tva: 160.0, 
    montant_ttc: 960.0, 
    tax_rate: 20, 
    devis_numero: null, 
    notes: "", 
    conditions_paiement: "50/50" 
  },
  { 
    id: 3, 
    numero_commande: "CMD-2025-003", 
    client_id: 5, 
    nom_client: "Client Alpha", 
    date_commande: "2025-05-05", 
    date_livraison_prevue: "2025-05-15", 
    statut: "completed", 
    montant_ht: 2000.0, 
    montant_tva: 400.0, 
    montant_ttc: 2400.0, 
    tax_rate: 20, 
    devis_numero: "DEV-2025-002", 
    notes: "Handle with care", 
    conditions_paiement: "On delivery" 
  }
];

// Mock order details
const mockOrderDetails = {
  1: { 
    id: 1, 
    numero_commande: "CMD-2025-001", 
    client_id: 5, 
    nom_client: "Client Alpha", 
    devis: 1, 
    devis_numero: "DEV-2025-001", 
    produit_commande: [
      { 
        id: 101, 
        produit_id: 1, 
        nom_produit: "Laser Cut Steel Plate", 
        quantite: 5, 
        prix_unitaire: 200.0, 
        remise_pourcentage: 0, 
        prix_total: 1000.0 
      }, 
      { 
        id: 102, 
        produit_id: 3, 
        nom_produit: "Engraved Sign", 
        quantite: 2, 
        prix_unitaire: 125.0, 
        remise_pourcentage: 0, 
        prix_total: 250.0 
      }
    ], 
    date_commande: "2025-05-03", 
    date_livraison_prevue: "2025-05-10", 
    statut: "pending", 
    tax_rate: 20, 
    montant_ht: 1250.0, 
    montant_tva: 250.0, 
    montant_ttc: 1500.0, 
    notes: "Urgent order", 
    conditions_paiement: "50% à la commande, 50% à la livraison" 
  },
  2: { 
    id: 2, 
    numero_commande: "CMD-2025-002", 
    client_id: 6, 
    nom_client: "Client Beta", 
    devis: null, 
    devis_numero: null, 
    produit_commande: [
      { 
        id: 201, 
        produit_id: 2, 
        nom_produit: "Aluminum Sheet 2mm", 
        quantite: 10, 
        prix_unitaire: 80.0, 
        remise_pourcentage: 5, 
        prix_total: 760.0 
      }
    ], 
    date_commande: "2025-05-04", 
    date_livraison_prevue: "2025-05-12", 
    statut: "processing", 
    tax_rate: 20, 
    montant_ht: 760.0, 
    montant_tva: 152.0, 
    montant_ttc: 912.0, 
    notes: "Standard processing", 
    conditions_paiement: "Net 30" 
  },
  3: { 
    id: 3, 
    numero_commande: "CMD-2025-003", 
    client_id: 5, 
    nom_client: "Client Alpha", 
    devis: 2, 
    devis_numero: "DEV-2025-002", 
    produit_commande: [
      { 
        id: 301, 
        produit_id: 4, 
        nom_produit: "Custom Bracket", 
        quantite: 20, 
        prix_unitaire: 100.0, 
        remise_pourcentage: 10, 
        prix_total: 1800.0 
      }
    ], 
    date_commande: "2025-05-05", 
    date_livraison_prevue: "2025-05-15", 
    statut: "completed", 
    tax_rate: 20, 
    montant_ht: 1800.0, 
    montant_tva: 360.0, 
    montant_ttc: 2160.0, 
    notes: "Fragile items", 
    conditions_paiement: "Full payment upfront" 
  }
};

// Mock product data
const mockProducts = [
  { id: 1, nom_produit: "Laser Cut Steel Plate", prix_unitaire: 200.00 },
  { id: 2, nom_produit: "Aluminum Sheet 2mm", prix_unitaire: 150.00 },
  { id: 3, nom_produit: "Engraved Sign", prix_unitaire: 125.00 },
  { id: 4, nom_produit: "Custom Bracket", prix_unitaire: 75.00 },
];

// Mock client data
const mockClients = [
  { id: 5, nom_client: "Client Alpha", email: "alpha@example.com", telephone: "0123456789", adresse: "123 Alpha St" },
  { id: 6, nom_client: "Client Beta", email: "beta@example.com", telephone: "0987654321", adresse: "456 Beta Ave" },
  { id: 7, nom_client: "Client Gamma", email: "gamma@example.com", telephone: "0123498765", adresse: "789 Gamma Blvd" },
];

// Mock devis (quotes) data
const mockDevis = [
  {
    id: 1,
    numero_devis: "DEV-2025-001",
    client_id: 5,
    nom_client: "Client Alpha",
    date_emission: "2025-05-01",
    date_validite: "2025-05-16",
    statut: "converted",
    tax_rate: 20,
    montant_ht: 1250.0,
    montant_tva: 250.0,
    montant_ttc: 1500.0,
    conditions_paiement: "50% à la commande, 50% à la livraison"
  },
  {
    id: 2,
    numero_devis: "DEV-2025-002",
    client_id: 5,
    nom_client: "Client Alpha",
    date_emission: "2025-05-02",
    date_validite: "2025-05-17",
    statut: "converted",
    tax_rate: 20,
    montant_ht: 2000.0,
    montant_tva: 400.0,
    montant_ttc: 2400.0,
    conditions_paiement: "Full payment upfront"
  },
  {
    id: 3,
    numero_devis: "DEV-2025-003",
    client_id: 6,
    nom_client: "Client Beta",
    date_emission: "2025-05-06",
    date_validite: "2025-05-21",
    statut: "sent",
    tax_rate: 20,
    montant_ht: 500.0,
    montant_tva: 100.0,
    montant_ttc: 600.0,
    conditions_paiement: "Net 30"
  },
];

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API service
const mockApiService = {
  // Orders
  getOrders: async () => {
    await delay(300); // Simulate network delay
    return [...mockOrders];
  },
  
  getOrderById: async (id) => {
    await delay(200);
    return mockOrderDetails[id] || null;
  },
  
  updateOrder: async (id, data) => {
    await delay(300);
    console.log(`Updating order ${id} with data:`, data);
    const updatedOrder = { ...mockOrderDetails[id], ...data };
    mockOrderDetails[id] = updatedOrder;
    
    // Also update the order in the list
    const index = mockOrders.findIndex(o => o.id === id);
    if (index >= 0) {
      mockOrders[index] = { ...mockOrders[index], ...data };
    }
    
    return updatedOrder;
  },
  
  createOrder: async (data) => {
    await delay(300);
    const newId = Math.max(...mockOrders.map(o => o.id)) + 1;
    const newOrder = {
      id: newId,
      ...data
    };
    
    mockOrders.push(newOrder);
    mockOrderDetails[newId] = newOrder;
    
    return newOrder;
  },
  
  deleteOrder: async (id) => {
    await delay(200);
    const index = mockOrders.findIndex(o => o.id === id);
    if (index >= 0) {
      mockOrders.splice(index, 1);
    }
    delete mockOrderDetails[id];
    return { success: true };
  },
  
  addProductToOrder: async (orderId, productData) => {
    await delay(200);
    const order = mockOrderDetails[orderId];
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    const productId = productData.produit_id;
    const product = mockProducts.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    const newProductLineId = Math.max(0, ...order.produit_commande.map(p => p.id)) + 1;
    
    const prixUnitaire = productData.prix_unitaire || product.prix_unitaire;
    const remisePourcentage = productData.remise_pourcentage || 0;
    const prixTotal = (productData.quantite * prixUnitaire) * (1 - (remisePourcentage / 100));
    
    const newProductLine = {
      id: newProductLineId,
      produit_id: productId,
      nom_produit: product.nom_produit,
      quantite: productData.quantite,
      prix_unitaire: prixUnitaire,
      remise_pourcentage: remisePourcentage,
      prix_total: prixTotal
    };
    
    order.produit_commande.push(newProductLine);
    
    // Recalculate totals
    const montantHt = order.produit_commande.reduce((sum, p) => sum + p.prix_total, 0);
    const montantTva = montantHt * (order.tax_rate / 100);
    const montantTtc = montantHt + montantTva;
    
    order.montant_ht = montantHt;
    order.montant_tva = montantTva;
    order.montant_ttc = montantTtc;
    
    // Also update the order in the list
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex >= 0) {
      mockOrders[orderIndex].montant_ht = montantHt;
      mockOrders[orderIndex].montant_tva = montantTva;
      mockOrders[orderIndex].montant_ttc = montantTtc;
    }
    
    return newProductLine;
  },
  
  removeProductFromOrder: async (orderId, produitCommandeId) => {
    await delay(200);
    const order = mockOrderDetails[orderId];
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    const productIndex = order.produit_commande.findIndex(p => p.id === produitCommandeId);
    if (productIndex === -1) {
      throw new Error(`Product line with ID ${produitCommandeId} not found in order ${orderId}`);
    }
    
    order.produit_commande.splice(productIndex, 1);
    
    // Recalculate totals
    const montantHt = order.produit_commande.reduce((sum, p) => sum + p.prix_total, 0);
    const montantTva = montantHt * (order.tax_rate / 100);
    const montantTtc = montantHt + montantTva;
    
    order.montant_ht = montantHt;
    order.montant_tva = montantTva;
    order.montant_ttc = montantTtc;
    
    // Also update the order in the list
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex >= 0) {
      mockOrders[orderIndex].montant_ht = montantHt;
      mockOrders[orderIndex].montant_tva = montantTva;
      mockOrders[orderIndex].montant_ttc = montantTtc;
    }
    
    return { success: true };
  },
  
  updateOrderStatus: async (orderId, newStatus) => {
    await delay(200);
    const order = mockOrderDetails[orderId];
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    order.statut = newStatus;
    
    // Also update the order in the list
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex >= 0) {
      mockOrders[orderIndex].statut = newStatus;
    }
    
    return order;
  },
  
  generateInvoiceFromOrder: async (orderId) => {
    await delay(500);
    const order = mockOrderDetails[orderId];
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    if (order.statut !== 'completed' && order.statut !== 'processing') {
      throw new Error(`Order must be in 'completed' or 'processing' status to generate invoice`);
    }
    
    const invoiceId = `INV-${orderId}-${Math.floor(Math.random() * 1000)}`;
    
    order.statut = 'invoiced';
    order.facture = invoiceId;
    order.facture_numero = invoiceId;
    
    // Also update the order in the list
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex >= 0) {
      mockOrders[orderIndex].statut = 'invoiced';
      mockOrders[orderIndex].facture = invoiceId;
      mockOrders[orderIndex].facture_numero = invoiceId;
    }
    
    return { 
      success: "Invoice generated successfully", 
      invoice_id: invoiceId 
    };
  },
  
  // Products
  getProducts: async () => {
    await delay(200);
    return [...mockProducts];
  },
  
  // Clients
  getClients: async () => {
    await delay(200);
    return [...mockClients];
  },
  
  searchClients: async (searchTerm) => {
    await delay(200);
    const lowercaseTerm = searchTerm.toLowerCase();
    return mockClients.filter(client => 
      client.nom_client.toLowerCase().includes(lowercaseTerm) || 
      client.id.toString().includes(lowercaseTerm)
    );
  },
  
  // Devis (Quotes)
  getDevis: async () => {
    await delay(200);
    return [...mockDevis];
  },
};

export default mockApiService;
