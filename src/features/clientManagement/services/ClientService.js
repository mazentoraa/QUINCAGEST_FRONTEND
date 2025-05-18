import axios from 'axios';

const API_URL = '/api/clients';

const ClientService = {
  getAllClients: async () => {
    try {
      const response = await axios.get(API_URL + '/');
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  getClientById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching client with id ${id}:`, error);
      throw error;
    }
  },

  createClient: async (clientData) => {
    try {
      // Convert camelCase to snake_case for Django backend
      const formattedData = {
        nom_client: clientData.nomClient,
        numero_fiscal: clientData.numeroFiscal,
        adresse: clientData.adresse,
        telephone: clientData.telephone,
        nom_responsable: clientData.nomResponsable,
        email: clientData.email,
        email_responsable: clientData.emailResponsable,
        telephone_responsable: clientData.telephoneResponsable,
        autre_numero: clientData.autreNumero,
        informations_complementaires: clientData.informationsComplementaires
      };

      const response = await axios.post(API_URL + '/', formattedData);
      return response.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  updateClient: async (id, clientData) => {
    try {
      // Convert camelCase to snake_case for Django backend
      const formattedData = {
        nom_client: clientData.nomClient,
        numero_fiscal: clientData.numeroFiscal,
        adresse: clientData.adresse,
        telephone: clientData.telephone,
        nom_responsable: clientData.nomResponsable,
        email: clientData.email,
        email_responsable: clientData.emailResponsable,
        telephone_responsable: clientData.telephoneResponsable,
        autre_numero: clientData.autreNumero,
        informations_complementaires: clientData.informationsComplementaires
      };

      const response = await axios.put(`${API_URL}/${id}/`, formattedData);
      return response.data;
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
      return response.data;
    } catch (error) {
      console.error('Error searching clients:', error);
      throw error;
    }
  }
};

export default ClientService;
