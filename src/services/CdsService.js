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

  async getPlansTraite() {
    try {
      const response = await axios.get(`${API_BASE_URL}/plans-traite/`);
      if (response.data && response.data.results !== undefined) {
        return response.data.results;
      }
      return response.data || [];
    } catch (error) {
      console.error("Error fetching plans-traite:", error);
      throw error;
    }
  }

  async createPlanTraite(planData) {
    const payload = {
      numero_commande: planData.numero_commande,
      nombre_traite: planData.nombre_traite,
      date_premier_echeance: planData.date_premier_echeance,
      periode: planData.periode || 30,
      montant_total: planData.montant_total || 0,
      periode_str: planData.periode_str,
      
      nom_raison_sociale: planData.nom_raison_sociale || '',
      matricule_fiscal: planData.matricule_fiscal || '',
  
      tireur_nom: planData.tireur_nom || '',
      tireur_matricule: planData.tireur_matricule || '',
      tireur_adresse: planData.tireur_adresse || '',
  
      tire_nom: planData.tire_nom || '',
      tire_matricule: planData.tire_matricule || '',
      tire_adresse: planData.tire_adresse || '',
  
      acceptation: planData.acceptation || '',
      aval: planData.aval || '',
      bank_name: planData.bank_name || '',
      bank_address: planData.bank_address || '',
      rip: planData.rip || '',
      
      date_creation: planData.date_creation || new Date().toISOString(),
      mode_paiement: planData.mode_paiement || 'traite',
    };
  
    console.log("✅ Payload envoyé à /plans-traite/ :", payload);
  
    try {
      const response = await axios.post(`${API_BASE_URL}/plans-traite/`, payload);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur création plan-traite :", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
      }
      throw error;
    }
  }
  



  async updateTraiteStatus(traiteId, statusData) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/traites/${traiteId}/update_status/`, statusData);
      return response.data;
    } catch (error) {
      console.error("Error updating traite status:", error);
      throw error;
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

export default  new CdsService();  