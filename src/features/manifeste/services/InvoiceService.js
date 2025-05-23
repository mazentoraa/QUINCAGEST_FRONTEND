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
   * Generate a unique invoice number
   * @returns {string} - A unique invoice number
   */
  generateInvoiceNumber() {
    const today = new Date();
    const year = today.getFullYear().toString().substr(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `F${year}${month}${day}-${sequence}`;
  }
}

export default new InvoiceService();
