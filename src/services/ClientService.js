const API_BASE_URL = '/api'; // Adjust if your API base URL is different

const clientService = {
  getClients: async (filters = {}) => {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/clients/${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : [];
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  },

  getClientById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${id}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : null;
    } catch (error) {
      console.error(`Error fetching client ${id}:`, error);
      throw error;
    }
  },

  searchClients: async (searchTerm) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/search/?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : [];
    } catch (error) {
      console.error(`Error searching for clients with term "${searchTerm}":`, error);
      return [];
    }
  },

  createClient: async (clientData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  updateClient: async (id, clientData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error(`Error updating client ${id}:`, error);
      throw error;
    }
  },

  deleteClient: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return { success: true };
    } catch (error) {
      console.error(`Error deleting client ${id}:`, error);
      throw error;
    }
  },
};

export default clientService;
