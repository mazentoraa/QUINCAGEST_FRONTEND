import axios from 'axios';
import MaterialModel from '../models/MaterialModel';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const API_URL = `${API_BASE_URL}/matiere-achat`;

const MaterialAchatService = {
  getAllMaterial: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/`, { params });
      const rawData = response.data;

      const data = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData.results)
        ? rawData.results
        : [];

      return data.map((item) => new MaterialModel(item));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des matières achetées :', error);
      throw error;
    }
  },

  getMaterialById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/`);
      return new MaterialModel(response.data);
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de la matière ID ${id} :`, error);
      throw error;
    }
  },

  createMaterial: async (materialData) => {
    try {
      const payload = typeof materialData.to_api_format === 'function'
        ? materialData.to_api_format()
        : new MaterialModel(materialData).to_api_format();

      console.log("✅ Données envoyées (create):", payload);
      const response = await axios.post(`${API_URL}/`, payload);
      return new MaterialModel(response.data);
    } catch (error) {
      console.error('❌ Erreur lors de la création de la matière :', error.response?.data || error);
      throw error;
    }
  },

  updateMaterial: async (id, materialData) => {
    try {
      const payload = typeof materialData.to_api_format === 'function'
        ? materialData.to_api_format()
        : new MaterialModel(materialData).to_api_format();

      console.log("✏️ Données envoyées (update):", payload);
      const response = await axios.put(`${API_URL}/${id}/`, payload);
      return new MaterialModel(response.data);
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour de la matière ID ${id} :`, error.response?.data || error);
      throw error;
    }
  },

  deleteMaterial: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de la matière ID ${id} :`, error.response?.data || error);
      throw error;
    }
  }
};

export default MaterialAchatService;
