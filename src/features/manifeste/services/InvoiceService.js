import axios from 'axios';

// API base URL - replace with your actual API endpoint
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const API_URL = `${API_BASE_URL}`;

class InvoiceService {
  /**
   * Create a new invoice from selected works
   * @param {Object} invoiceData - The invoice data (date_emission, date_echeance, tax_rate, statut, numero_facture)
   * @param {Array} workIds - IDs of the works to include in the invoice
   * @param {number} clientId - ID of the client for this invoice
   * @returns {Promise<Object>} - The created invoice
   */
  async createInvoice(invoiceData, clientId) {
    try {
      if (!clientId) {
        throw new Error("Client ID is required");
      }

      const requestData = {
        ...invoiceData,
        context: {
            client : clientId,
          client_id: clientId,
        }
      };
      console.log(requestData)
      const response = await axios.post(`${API_URL}/factures/`, requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get all invoices
   * @returns {Promise<Array>} - List of invoices
   */
  async getAllInvoices() {
    try {
      const response = await axios.get(`${API_URL}/factures/`);
      console.log("in",response.data)
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoices for a specific client
   * @param {number} clientId - The client ID
   * @returns {Promise<Array>} - List of invoices for the client
   */
  async getInvoicesByClientId(clientId) {
    try {
      const response = await axios.get(`${API_URL}/factures/?client_id=${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoices for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific invoice by ID
   * @param {number} invoiceId - The invoice ID
   * @returns {Promise<Object>} - The invoice details
   */
  async getInvoiceById(invoiceId) {
    try {
      const response = await axios.get(`${API_URL}/factures/${invoiceId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Update an invoice
   * @param {number} invoiceId - The invoice ID
   * @param {Object} invoiceData - The updated invoice data
   * @returns {Promise<Object>} - The updated invoice
   */
  async updateInvoice(invoiceId, invoiceData) {
    try {
      const response = await axios.put(`${API_URL}/factures/${invoiceId}/`, invoiceData);
      return response.data;
    } catch (error) {
      console.error(`Error updating invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an invoice
   * @param {number} invoiceId - The invoice ID to delete
   * @returns {Promise<void>}
   */
  async deleteInvoice(invoiceId) {
    try {
      await axios.delete(`${API_URL}/factures/${invoiceId}/`);
    } catch (error) {
      console.error(`Error deleting invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Update invoice status
   * @param {number} invoiceId - The invoice ID
   * @param {string} status - The new status (e.g., 'paid', 'pending', 'cancelled')
   * @returns {Promise<Object>} - The updated invoice
   */
  async updateInvoiceStatus(invoiceId, status) {
    try {
      const response = await axios.patch(`${API_URL}/factures/${invoiceId}/`, { statut: status });
      return response.data;
    } catch (error) {
      console.error(`Error updating invoice ${invoiceId} status:`, error);
      throw error;
    }
  }

  /**
   * Get all deleted invoices (corbeille) - Support pour tous les types
   * @param {string} nature - 'facture', 'avoir-facture', ou 'avoir'
   * @returns {Promise<Array>} - List of deleted invoices
   */
  async getDeletedInvoices(nature = 'facture') {
    try {
      // Validation de la nature
      const validNatures = ['facture', 'avoir-facture', 'avoir'];
      if (!validNatures.includes(nature)) {
        console.warn(`Nature invalide: ${nature}. Utilisation de 'facture' par défaut.`);
        nature = 'facture';
      }

      const response = await axios.get(`${API_URL}/cds/?deleted=true&nature=${encodeURIComponent(nature)}`);
      console.log(`Deleted ${nature} response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching deleted ${nature}:`, error);
      throw error;
    }
  }

  /**
   * Restore a deleted invoice - Support pour tous les types
   * @param {number} invoiceId - The invoice ID to restore
   * @param {string} nature - 'facture', 'avoir-facture', ou 'avoir'
   * @returns {Promise<Object>} - The restored invoice
   */
  async restoreInvoice(invoiceId, nature = 'facture') {
    try {
      // Validation de la nature
      const validNatures = ['facture', 'avoir-facture', 'avoir'];
      if (!validNatures.includes(nature)) {
        console.warn(`Nature invalide: ${nature}. Utilisation de 'facture' par défaut.`);
        nature = 'facture';
      }

      const response = await axios.post(
        `${API_URL}/cds/${invoiceId}/restore/?nature=${encodeURIComponent(nature)}`
      );
      console.log(`${nature} ${invoiceId} restored:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error restoring ${nature} ${invoiceId}:`, error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Messages d'erreur plus spécifiques
        if (error.response.status === 400) {
          const errorData = error.response.data;
          if (errorData.error && errorData.error.includes('Nature mismatch')) {
            throw new Error(`Impossible de restaurer: le type de document ne correspond pas (${errorData.requested_nature} vs ${errorData.record_nature})`);
          } else if (errorData.error && errorData.error.includes('not deleted')) {
            throw new Error('Ce document n\'est pas dans la corbeille');
          }
        } else if (error.response.status === 404) {
          throw new Error('Document non trouvé');
        }
      } else if (error.request) {
        console.error('Request was made but no response received:', error.request);
        throw new Error('Erreur de connexion au serveur');
      } else {
        console.error('Error setting up request:', error.message);
      }

      throw error;
    }
  }

  /**
   * Soft delete an invoice (move to corbeille) - Support pour tous les types
   * @param {number} invoiceId - The invoice ID to soft delete
   * @returns {Promise<Object>} - Success message
   */
  async softDeleteInvoice(invoiceId) {
    try {
      const response = await axios.post(`${API_URL}/cds/${invoiceId}/delete_logically/`);
      console.log('Invoice moved to corbeille:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error moving invoice ${invoiceId} to corbeille:`, error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.error && errorData.error.includes('already deleted')) {
          throw new Error('Ce document est déjà dans la corbeille');
        }
      } else if (error.response?.status === 404) {
        throw new Error('Document non trouvé');
      }
      
      throw error;
    }
  }

  /**
   * Permanently delete a logically deleted invoice - Support pour tous les types
   * @param {number} invoiceId - The invoice ID to permanently delete
   * @returns {Promise<Object>} - Success message
   */
  async permanentlyDeleteInvoice(invoiceId) {
    try {
      const response = await axios.delete(`${API_URL}/cds/${invoiceId}/delete_permanently/`);
      console.log(`Invoice ${invoiceId} deleted permanently:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error permanently deleting invoice ${invoiceId}:`, error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.error && errorData.error.includes('pas dans la corbeille')) {
          throw new Error('Ce document n\'est pas dans la corbeille. Suppression logique requise d\'abord.');
        }
      } else if (error.response?.status === 404) {
        throw new Error('Document non trouvé');
      }
      
      throw error;
    }
  }

  /**
   * Generate a unique invoice number
   * @returns {string} - A unique invoice number
   */
  generateInvoiceNumber(existingData = []) {
    const currentYear = new Date().getFullYear();
    console.log("Existing data:", existingData);
    const current = existingData.filter(invoice => {
      return invoice.numero_bon && invoice.numero_bon.startsWith(`BL-${currentYear}-`);
    });
    
    let maxNumber = 0;
    existingData.forEach(invoice => {
      const parts = invoice.numero_facture.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2]);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    const newNumber = maxNumber + 1;
    return `BL-${currentYear}-${String(newNumber).padStart(5, '0')}`;
  }

  /**
   * Get statistics for different document types
   * @returns {Promise<Object>} - Statistics object
   */
  async getStatistics() {
    try {
      const [factures, avoirs, avoirFactures, deletedFactures, deletedAvoirs, deletedAvoirFactures] = await Promise.allSettled([
        axios.get(`${API_URL}/cds/?deleted=false&nature=facture`),
        axios.get(`${API_URL}/cds/?deleted=false&nature=avoir`),
        axios.get(`${API_URL}/cds/?deleted=false&nature=avoir-facture`),
        axios.get(`${API_URL}/cds/?deleted=true&nature=facture`),
        axios.get(`${API_URL}/cds/?deleted=true&nature=avoir`),
        axios.get(`${API_URL}/cds/?deleted=true&nature=avoir-facture`)
      ]);

      return {
        active: {
          factures: factures.status === 'fulfilled' ? factures.value.data.length : 0,
          avoirs: avoirs.status === 'fulfilled' ? avoirs.value.data.length : 0,
          avoirFactures: avoirFactures.status === 'fulfilled' ? avoirFactures.value.data.length : 0,
        },
        deleted: {
          factures: deletedFactures.status === 'fulfilled' ? deletedFactures.value.data.length : 0,
          avoirs: deletedAvoirs.status === 'fulfilled' ? deletedAvoirs.value.data.length : 0,
          avoirFactures: deletedAvoirFactures.status === 'fulfilled' ? deletedAvoirFactures.value.data.length : 0,
        }
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
}

export default new InvoiceService();