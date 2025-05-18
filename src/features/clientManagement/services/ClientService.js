import axios from 'axios';
import ClientModel from '../models/ClientModel';

const API_URL = 'http://localhost:8000/api/clients';

const ClientService = {
  getAllClients: async () => {
    try {
      const response = await axios.get(API_URL + '/');
      // Handle both array and paginated response formats
      let clientData;
      if (response.data && response.data.results !== undefined) {
        clientData = response.data.results;
      } else {
        clientData = response.data || [];
      }
      
      // Convert snake_case API response to camelCase model objects
      return clientData.map(client => new ClientModel(client));
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  getClientById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/`);
      return new ClientModel(response.data);
    } catch (error) {
      console.error(`Error fetching client with id ${id}:`, error);
      throw error;
    }
  },

  createClient: async (clientData) => {
    try {
      // Convert camelCase to snake_case for Django backend
      const formattedData = new ClientModel(clientData).toApiFormat();
      
      const response = await axios.post(API_URL + '/', formattedData);
      return new ClientModel(response.data);
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  updateClient: async (id, clientData) => {
    try {
      // Convert camelCase to snake_case for Django backend
      const formattedData = new ClientModel(clientData).toApiFormat();

      const response = await axios.put(`${API_URL}/${id}/`, formattedData);
      return new ClientModel(response.data);
    } catch (error) {
      console.error(`Error updating client with id ${id}:`, error);
      throw error;
    }
  },

  deleteClient: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting client with id ${id}:`, error);
      throw error;
    }
  },

  searchClients: async (query) => {
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
