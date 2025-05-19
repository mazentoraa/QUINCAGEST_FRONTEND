import axios from 'axios';
import ClientModel from '../models/ClientModel';

const API_URL = 'http://localhost:8000/api/clients';

const ClientService = {
  get_all_clients: async () => {
    try {
      const response = await axios.get(API_URL + '/');
      // Handle both array and paginated response formats
      let client_data;
      if (response.data && response.data.results !== undefined) {
        client_data = response.data.results;
      } else {
        client_data = response.data || [];
      }
      
      // Convert to model objects
      return client_data.map(client => new ClientModel(client));
    } catch (error) {
      console.error('Error fetching clients:', error);
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
      // Use the data directly without any transformation
      const response = await axios.post(API_URL + '/', client_data);
      return new ClientModel(response.data);
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  update_client: async (id, client_data) => {
    try {
      // Use the data directly without any transformation
      const response = await axios.put(`${API_URL}/${id}/`, client_data);
      return new ClientModel(response.data);
    } catch (error) {
      console.error(`Error updating client with id ${id}:`, error);
      throw error;
    }
  },

  delete_client: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting client with id ${id}:`, error);
      throw error;
    }
  },

  search_clients: async (query) => {
    try {
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
