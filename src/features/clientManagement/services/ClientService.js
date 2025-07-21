import axios from 'axios';
import ClientModel from '../models/ClientModel';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, '');
const API_URL = `${API_BASE_URL}/clients`;

const ClientService = {
  get_all_clients: async () => {
    try {
      const response = await axios.get(API_URL + '/');
      console.log("resp client", response.data)
      
      let client_data;
      if (response.data && response.data.results !== undefined) {
        client_data = response.data.results;
      } else {
        client_data = response.data || [];
      }
      
      return client_data.map(client => new ClientModel(client));
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  // Nouvelle méthode pour récupérer les clients supprimés (corbeille)
  get_deleted_clients: async () => {
    try {
      const response = await axios.get(`${API_URL}/deleted/`);
      console.log("resp deleted clients", response.data)
      
      let client_data;
      if (response.data && response.data.results !== undefined) {
        client_data = response.data.results;
      } else {
        client_data = response.data || [];
      }
      
      return client_data.map(client => new ClientModel(client));
    } catch (error) {
      console.error('Error fetching deleted clients:', error);
      throw error;
    }
  },

  get_client_by_id: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/`);
      return new ClientModel(response.data);
    } catch (error) {
      console.error(`Error fetching client with id ${id}:`, error);
      throw error;
    }
  },

  create_client: async (client_data) => {
    try {
      const response = await axios.post(API_URL + '/', client_data);
      return new ClientModel(response.data);
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  update_client: async (id, client_data) => {
    try {
      const response = await axios.put(`${API_URL}/${id}/`, client_data);
      return new ClientModel(response.data);
    } catch (error) {
      console.error(`Error updating client with id ${id}:`, error);
      throw error;
    }
  },

  // Suppression logique (déplacer vers la corbeille)
  delete_client: async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}/soft_delete/`);
      return response.data;
    } catch (error) {
      console.error(`Error soft deleting client with id ${id}:`, error);
      throw error;
    }
  },

  // Restaurer un client de la corbeille
  restore_client: async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}/restore/`);
      return new ClientModel(response.data);
    } catch (error) {
      console.error(`Error restoring client with id ${id}:`, error);
      throw error;
    }
  },

  // Suppression définitive (hard delete)
  permanent_delete_client: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error permanently deleting client with id ${id}:`, error);
      throw error;
    }
  },

  search_clients: async (query) => {
    try {
      if (!query || query.trim() === '') {
        return [];
      }

      const response = await axios.get(`${API_URL}/search/`, {
        params: { query }
      });

      return response.data.map(client => new ClientModel(client));
    } catch (error) {
      console.error('Error searching clients:', error);
      throw error;
    }
  }
};

export default ClientService;