import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

class ConsommableService {
  static async getAll() {
    try {
      const response = await axios.get(`${API_BASE_URL}/consommables/`);
      return Array.isArray(response.data.results) ? response.data.results : response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des consommables :", error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/consommables/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du consommable ${id} :`, error);
      throw error;
    }
  }

  static async create(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}/consommables/`, data, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du consommable :", error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const response = await axios.put(`${API_BASE_URL}/consommables/${id}/`, data, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du consommable ${id} :`, error.response?.data || error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/consommables/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du consommable ${id} :`, error);
      throw error;
    }
  }
}

export default ConsommableService;
