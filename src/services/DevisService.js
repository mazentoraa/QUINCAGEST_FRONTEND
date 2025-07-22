const API_BASE_URL =  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api"

const devisService = {
  getDevis: async (filters = {}) => {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/devis/${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : [];
    } catch (error) {
      console.error("Error fetching quotes:", error);
      return [];
    }
  },

  getDevisById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devis/${id}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : null;
    } catch (error) {
      console.error(`Error fetching quote ${id}:`, error);
      throw error;
    }
  },

  createDevis: async (devisData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devis/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(devisData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  },

  updateDevis: async (id, devisData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devis/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(devisData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error(`Error updating quote ${id}:`, error);
      throw error;
    }
  },

  partialUpdateDevis: async (id, devisData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devis/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(devisData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error(`Error partially updating quote ${id}:`, error);
      throw error;
    }
  },

  deleteDevis: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devis/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return { success: true };
    } catch (error) {
      console.error(`Error deleting quote ${id}:`, error);
      throw error;
    }
  },

  addProductToDevis: async (devisId, productData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devis/${devisId}/add_product/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error(`Error adding product to quote ${devisId}:`, error);
      throw error;
    }
  },

  removeProductFromDevis: async (devisId, productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devis/${devisId}/remove_product/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ produit: productId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error(`Error removing product ${productId} from quote ${devisId}:`, error);
      throw error;
    }
  },

  convertToCommande: async (devisId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devis/${devisId}/convert_to_commande/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmation: true }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error(`Error converting quote ${devisId} to order:`, error);
      throw error;
    }
  },

  getDevisByClient: async (clientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devis/by_client/?client_id=${clientId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : [];
    } catch (error) {
      console.error(`Error fetching quotes for client ${clientId}:`, error);
      return [];
    }
  },
};

export default devisService;
