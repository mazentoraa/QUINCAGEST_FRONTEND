// Fonctions utilitaires pour la manipulation des données

/**
 * Formate un prix en format monétaire tunisien
 * @param {number} price - Le prix à formater
 * @returns {string} - La chaîne formatée
 */
export const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.000 DT';
    
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(price) + ' DT';
  };
  
  /**
   * Formate une date au format tunisien
   * @param {string|Date} date - La date à formater
   * @returns {string} - La chaîne formatée
   */
  export const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  /**
   * Génère un numéro de facture basé sur la date et un compteur
   * @returns {string} - Numéro de facture
   */
  export const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Récupérer le dernier compteur du localStorage
    let counter = parseInt(localStorage.getItem('invoiceCounter') || '0');
    counter += 1;
    
    // Sauvegarder le nouveau compteur
    localStorage.setItem('invoiceCounter', counter.toString());
    
    // Formater le numéro (AAAAMMJJ-XXXX)
    return `${year}${month}${day}-${String(counter).padStart(4, '0')}`;
  };
  
  /**
   * Filtre les produits selon les critères spécifiés
   * @param {Array} products - Liste des produits
   * @param {Object} filters - Critères de filtrage
   * @returns {Array} - Liste filtrée
   */
  export const filterProducts = (products, filters) => {
    if (!products || !Array.isArray(products)) return [];
    if (!filters) return products;
    
    return products.filter(product => {
      // Filtre par texte de recherche
      if (filters.searchText && !productMatchesSearch(product, filters.searchText)) {
        return false;
      }
      
      // Filtre par type de matériau
      if (filters.materialType && product.materialType !== filters.materialType) {
        return false;
      }
      
      // Filtre par épaisseur
      if (filters.thickness && product.thickness !== filters.thickness) {
        return false;
      }
      
      // Filtre par disponibilité de stock
      if (filters.inStock === true && product.quantity <= 0) {
        return false;
      }
      
      return true;
    });
  };
  
  /**
   * Vérifie si un produit correspond au texte de recherche
   * @param {Object} product - Le produit à vérifier
   * @param {string} searchText - Texte de recherche
   * @returns {boolean} - true si le produit correspond
   */
  const productMatchesSearch = (product, searchText) => {
    if (!searchText) return true;
    
    const search = searchText.toLowerCase();
    
    // Recherche dans différents champs
    return (
      (product.name && product.name.toLowerCase().includes(search)) ||
      (product.description && product.description.toLowerCase().includes(search)) ||
      (product.materialType && product.materialType.toLowerCase().includes(search))
    );
  };
  
  /**
   * Calcule le total d'une commande
   * @param {Array} orderItems - Éléments de la commande
   * @returns {Object} - Totaux calculés
   */
  export const calculateOrderTotals = (orderItems) => {
    if (!orderItems || !Array.isArray(orderItems)) {
      return { subtotal: 0, tax: 0, total: 0 };
    }
    
    const subtotal = orderItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    // TVA à 19% (standard en Tunisie)
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(3)),
      tax: parseFloat(tax.toFixed(3)),
      total: parseFloat(total.toFixed(3))
    };
  };
  
  /**
   * Vérifie si un produit a suffisamment de stock pour une commande
   * @param {Object} product - Le produit à vérifier
   * @param {number} requestedQuantity - Quantité demandée
   * @returns {boolean} - true si le stock est suffisant
   */
  export const hasEnoughStock = (product, requestedQuantity) => {
    if (!product) return false;
    return product.quantity >= requestedQuantity;
  };
  
  /**
   * Met à jour les stocks après une commande
   * @param {Array} products - Liste des produits
   * @param {Array} orderItems - Éléments de la commande
   * @returns {Array} - Liste des produits mise à jour
   */
  export const updateStockAfterOrder = (products, orderItems) => {
    if (!products || !orderItems) return products;
    
    // Créer une copie profonde des produits
    const updatedProducts = JSON.parse(JSON.stringify(products));
    
    // Mettre à jour les quantités
    orderItems.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        updatedProducts[productIndex].quantity -= item.quantity;
      }
    });
    
    return updatedProducts;
  };