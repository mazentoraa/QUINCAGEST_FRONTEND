import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const API_URL = `${API_BASE_URL}/cds`;

class CdsService {
  async getOrders() {
    try {
      const response = await axios.get(`${API_URL}/`);
      // Handle both array and paginated response formats
      if (response.data && response.data.results !== undefined) {
        return response.data.results;
      }
      return response.data || [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }

  async getOrderById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order with id ${id}:`, error);
      throw error;
    }
  }

  async createOrder(orderData) {
    try {
      const response = await axios.post(`${API_URL}/`, orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async updateOrder(id, orderData) {
    try {
      const response = await axios.put(`${API_URL}/${id}/`, orderData);
      return response.data;
    } catch (error) {
      console.error(`Error updating order with id ${id}:`, error);
      throw error;
    }
  }

  async addProductToOrder(orderId, productData) {
    try {
      const response = await axios.post(
        `${API_URL}/${orderId}/products/`,
        productData
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding product to order ${orderId}:`, error);
      throw error;
    }
  }

  async removeProductFromOrder(orderId, productId) {
    try {
      const response = await axios.delete(
        `${API_URL}/${orderId}/products/${productId}/`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error removing product ${productId} from order ${orderId}:`,
        error
      );
      throw error;
    }
  }

  async generateInvoiceFromOrder(orderId) {
    try {
      const response = await axios.post(
        `${API_URL}/${orderId}/generate-invoice/`
      );
      return response.data;
    } catch (error) {
      console.error(`Error generating invoice from order ${orderId}:`, error);
      throw error;
    }
  }
}

export default new CdsService();
