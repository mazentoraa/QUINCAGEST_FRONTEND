import axios from 'axios';
import RawMaterialModel from '../models/RawMaterialModel';

const API_URL = 'http://localhost:8000/api/matieres';

const RawMaterialService = {
  getMaterialsByClientId: async (clientId) => {
    try {
      const response = await axios.get(`${API_URL}/by_client/`, {
        params: { client_id: clientId }
      });
      
      // Handle both array and paginated response formats
      let materialsData;
      if (response.data && response.data.results !== undefined) {
        materialsData = response.data.results;
      } else {
        materialsData = response.data || [];
      }
      
      // Convert snake_case API response to camelCase model objects
      return materialsData.map(material => new RawMaterialModel(material));
    } catch (error) {
      console.error(`Error fetching materials for client ${clientId}:`, error);
      throw error;
    }
  },

  getMaterialById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/`);
      return new RawMaterialModel(response.data);
    } catch (error) {
      console.error(`Error fetching material with id ${id}:`, error);
      throw error;
    }
  },

  addMaterialToClient: async (clientId, materialData) => {
    try {
      // Ensure client ID is set
      const data = {
        ...materialData,
        clientId: clientId
      };
      
      // Convert camelCase to snake_case for Django backend
      // Only send fields expected by the Django serializer
      const formattedData = new RawMaterialModel(data).toApiFormat();
      
      const response = await axios.post(API_URL + '/', formattedData);
      return new RawMaterialModel(response.data);
    } catch (error) {
      console.error('Error adding material:', error);
      throw error;
    }
  },

  updateMaterial: async (id, materialData) => {
    try {
      // Convert camelCase to snake_case for Django backend
      // Only send fields expected by the Django serializer
      const formattedData = new RawMaterialModel(materialData).toApiFormat();

      const response = await axios.put(`${API_URL}/${id}/`, formattedData);
      return new RawMaterialModel(response.data);
    } catch (error) {
      console.error(`Error updating material with id ${id}:`, error);
      throw error;
    }
  },

  deleteMaterial: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting material with id ${id}:`, error);
      throw error;
    }
  }
};

export default RawMaterialService;
