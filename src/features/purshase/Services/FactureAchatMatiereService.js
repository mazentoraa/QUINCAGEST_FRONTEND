import axios from "axios";

// 🔧 Assure-toi que cette URL correspond bien à ton routeur Django REST
// Tu as dans urls.py : router.register(r"factures-achat-matieres", ...)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const ENDPOINT = `${API_BASE_URL}/factures-achat-matieres/`;

const FactureAchatMatiereService = {
  async getAll() {
    try {
      const response = await axios.get(ENDPOINT);
      return response.data.results || response.data;
    } catch (error) {
      console.error("Erreur getAll factures :", error.response?.data || error.message);
      throw error;
    }
  },

  async create(facture) {
    try {
      const response = await axios.post(ENDPOINT, facture);
      return response.data;
    } catch (error) {
      console.error("Erreur création facture :", error.response?.data || error.message);
      throw error;
    }
  },

  async update(id, facture) {
    try {
      const response = await axios.put(`${ENDPOINT}${id}/`, facture);
      return response.data;
    } catch (error) {
      console.error("Erreur mise à jour facture :", error.response?.data || error.message);
      throw error;
    }
  },

  async delete(id) {
    try {
      await axios.delete(`${ENDPOINT}${id}/`);
    } catch (error) {
      console.error("Erreur suppression facture :", error.response?.data || error.message);
      throw error;
    }
  },
};

export default FactureAchatMatiereService;
