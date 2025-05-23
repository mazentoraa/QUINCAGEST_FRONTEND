import axios from 'axios';

// API base URL - replace with your actual API endpoint
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const API_URL = `${API_BASE_URL}/client-matieres`;
class ClientMaterialService {
  /**
   * Get all materials for a specific client
   * @param {number} clientId - The client ID
   * @returns {Promise<Array>} - List of client materials
   */
  async getMaterialsByClientId(clientId) {
    try {
      const response = await axios.get(`${API_URL}/client-matieres/?client_id=${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching materials for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new material entry for a client
   * @param {Object} materialData - The material data
   * @returns {Promise<Object>} - The created material
   */
  async createMaterial(materialData) {
    try {
      const response = await axios.post(`${API_URL}/client-matieres/`, materialData);
      return response.data;
    } catch (error) {
      console.error('Error creating client material:', error);
      throw error;
    }
  }

  /**
   * Update an existing material entry
   * @param {number} materialId - The material ID
   * @param {Object} materialData - The updated material data
   * @returns {Promise<Object>} - The updated material
   */
  async updateMaterial(materialId, materialData) {
    try {
      const response = await axios.put(`${API_URL}/client-matieres/${materialId}/`, materialData);
      return response.data;
    } catch (error) {
      console.error(`Error updating client material ${materialId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a material entry
   * @param {number} materialId - The material ID to delete
   * @returns {Promise<Object>} - The response data
   */
  async deleteMaterial(materialId) {
    try {
      const response = await axios.delete(`${API_URL}/client-matieres/${materialId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting client material ${materialId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new material invoice
   * @param {Object} invoiceData - The invoice data containing client ID and materials array
   * @returns {Promise<Object>} - The created invoice
   */
  async createMaterialInvoice(invoiceData) {
    try {
      const response = await axios.post(`${API_URL}/factures-matieres/`, invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error creating material invoice:', error);
      throw error;
    }
  }

  /**
   * Get all material invoices with optional query parameters
   * @param {Object} queryParams - Optional query parameters object
   * @returns {Promise<Array>} - List of material invoices
   */
  async getAllMaterialInvoices(queryParams = {}) {
    try {
      // Convert queryParams object to URL search params
      const params = new URLSearchParams();
      
      // Add each query parameter to the URL
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      
      // Generate query string
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      // Log the complete URL being called for debugging
      const requestUrl = `${API_URL}/factures-matieres${queryString}`;
      console.log('Calling API URL:', requestUrl);
      
      const response = await axios.get(requestUrl);
      
      // Log response data summary
      console.log(`API response status: ${response.status}, data length: ${Array.isArray(response.data) ? response.data.length : 'Not an array'}`);
      
      // Check if response is empty and handle accordingly
      if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        console.log('Empty response data from API');
        return []; // Return empty array instead of null/undefined
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching material invoices:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      throw error;
    }
  }

  /**
   * Get material invoices for a specific client
   * @param {number} clientId - The client ID
   * @returns {Promise<Array>} - List of material invoices for the client
   */
  async getMaterialInvoicesByClientId(clientId) {
    try {
      const response = await axios.get(`${API_URL}/factures-matieres/?client=${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching material invoices for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific material invoice by ID
   * @param {number} invoiceId - The invoice ID
   * @returns {Promise<Object>} - The invoice details
   */
  async getMaterialInvoiceById(invoiceId) {
    try {
      const response = await axios.get(`${API_URL}/factures-matieres/${invoiceId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching material invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Update a material invoice
   * @param {number} invoiceId - The invoice ID
   * @param {Object} invoiceData - The updated invoice data
   * @returns {Promise<Object>} - The updated invoice
   */
  async updateMaterialInvoice(invoiceId, invoiceData) {
    try {
      const response = await axios.put(`${API_URL}/factures-matieres/${invoiceId}/`, invoiceData);
      return response.data;
    } catch (error) {
      console.error(`Error updating material invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a material invoice
   * @param {number} invoiceId - The invoice ID to delete
   * @returns {Promise<Object>} - The response data
   */
  async deleteMaterialInvoice(invoiceId) {
    try {
      const response = await axios.delete(`${API_URL}/factures-matieres/${invoiceId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting material invoice ${invoiceId}:`, error);
      throw error;
    }
  }
}

export default new ClientMaterialService();
