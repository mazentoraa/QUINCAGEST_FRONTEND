// FournisseurService.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

class FournisseurService {
  static async getAll() {
    const response = await axios.get(`${API_BASE_URL}/fournisseurs/`);
    return response.data;
  }

  static async getById(id) {
    const response = await axios.get(`${API_BASE_URL}/fournisseurs/${id}/`);
    return response.data;
  }

  static async create(fournisseur) {
    const response = await axios.post(`${API_BASE_URL}/fournisseurs/`, fournisseur);
    return response.data;
  }

  static async update(id, fournisseur) {
    const response = await axios.put(`${API_BASE_URL}/fournisseurs/${id}/`, fournisseur);
    return response.data;
  }

  static async delete(id) {
    await axios.delete(`${API_BASE_URL}/fournisseurs/${id}/`);
    return true;
  }

  // Nouvelles méthodes pour la corbeille
  static async getTrash() {
    const response = await axios.get(`${API_BASE_URL}/fournisseurs/trash/`);
    return response.data;
  }

  static async restore(id) {
    const response = await axios.post(`${API_BASE_URL}/fournisseurs/${id}/restore/`);
    return response.data;
  }

  static async permanentDelete(id) {
    await axios.delete(`${API_BASE_URL}/fournisseurs/${id}/permanent_delete/`);
    return true;
  }
}

export default FournisseurService;