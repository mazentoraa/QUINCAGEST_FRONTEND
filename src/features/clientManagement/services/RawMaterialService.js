import axios from 'axios';
import RawMaterialModel from '../models/RawMaterialModel';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const API_URL = `${API_BASE_URL}/matieres`;

const RawMaterialService = {
  get_all_materials: async () => {
    
    try {
      const response = await axios.get(`${API_URL}/`);
      
      // Handle both array and paginated response formats
      let materials_data;
      if (response.data && response.data.results !== undefined) {
        materials_data = response.data.results;
      } else {
        materials_data = response.data || [];
      }
      
      // Convert snake_case API response to snake_case model objects
      return materials_data.map(material => new RawMaterialModel(material));
    } catch (error) {
      console.error('Error fetching all materials:', error);
      throw error;
    }
  },

  get_materials_by_client_id: async (client_id) => {
    try {
      const response = await axios.get(`${API_URL}/by_client/`, {
        params: { client_id: client_id }
      });
      
      // Handle both array and paginated response formats
      let materials_data;
      if (response.data && response.data.results !== undefined) {
        materials_data = response.data.results;
      } else {
        materials_data = response.data || [];
      }
      
      // Convert snake_case API response to snake_case model objects
      return materials_data.map(material => new RawMaterialModel(material));
    } catch (error) {
      console.error(`Error fetching materials for client ${client_id}:`, error);
      throw error;
    }
  },

  get_material_by_id: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/`);
      return new RawMaterialModel(response.data);
    } catch (error) {
      console.error(`Error fetching material with id ${id}:`, error);
      throw error;
    }
  },

  add_material_to_client: async (client_id, material_data) => {
    try {
      // Ensure client ID is set
      const data = {
        ...material_data,
        client_id: client_id,
        // Make sure quantite is explicitly sent as an integer
        quantite: material_data.quantite !== undefined ? parseInt(material_data.quantite, 10) : 0
      };
      
      // Only send fields expected by the Django serializer
      const formatted_data = new RawMaterialModel(data).to_api_format();
      
      // Log the data being sent to API for debugging
      console.log('Adding material with data:', formatted_data);
      
      const response = await axios.post(API_URL + '/', formatted_data);
      return new RawMaterialModel(response.data);
    } catch (error) {
      console.error('Error adding material:', error);
      throw error;
    }
  },

update_material: async (id, material_data) => {
  try {
    // Ensure client_id is included and converted to integer
    if (material_data.client_id) {
      material_data.client_id = parseInt(material_data.client_id, 10);
    }
    
    // Ensure quantite is sent as an integer
    if (material_data.quantite !== undefined) {
      material_data.quantite = parseInt(material_data.quantite, 10);
    }
    
    // Only send fields expected by the Django serializer
    const formatted_data = new RawMaterialModel(material_data).to_api_format();
    
    // Log the data being sent to API for debugging
    console.log('Sending to API:', formatted_data);
    
    // Appel API
    const response = await axios.put(`${API_URL}/${id}/`, formatted_data);

    // ✅ Maintenant, response est définie
    console.log("Réponse API update:", response);
    console.log('Données envoyées au serveur:', formatted_data);

    return new RawMaterialModel(response.data);
  } catch (error) {
    console.error(`Error updating material with id ${id}:`, error);
    
    // Log the full error response for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    throw error;
  }
},

  delete_material: async (id) => {
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
