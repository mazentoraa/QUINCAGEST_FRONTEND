import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const API_URL = `${API_BASE_URL}/commandes`;

class OrderService {
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
        `${API_URL}/${orderId}/add_product/`,
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
      const response = await axios.delete(`${API_URL}/${orderId}/remove_product/`, { data: { produit: productId } });
      if (response.status === 204) {
        console.log("Product removed successfully!");
        // Handle success (e.g., update UI)
      } else {
        console.log("Unexpected status code:", response.status);
        // Handle unexpected status
      }
    } catch (error) {
      console.error("Error removing product:", error);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log("Response data:", error.response.data);
        console.log("Response status:", error.response.status);
        console.log("Response headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log("No response received:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      console.log(error.config);
      // Handle error (e.g., display error message to the user)
    }
  }

  async deleteOrder(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting order with id ${id}:`, error);
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
  async getDeletedOrders() {
  try {
    const response = await axios.get(`${API_URL}/deleted/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching deleted orders:", error);
    throw error;
  }
}
async restoreOrder(id) {
  try {
    const response = await axios.post(`${API_URL}/${id}/restore/`);
    return response.data;
  } catch (error) {
    console.error(`Error restoring order ${id}:`, error);
    throw error;
  }
}

}

export default new OrderService();
