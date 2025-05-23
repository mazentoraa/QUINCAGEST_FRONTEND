const API_BASE_URL = '/api'; // Adjust if your API base URL is different

const clientMaterialService = {
  getMaterialsByClient: async (clientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/client-materials/${clientId}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : [];
    } catch (error) {
      console.error(`Error fetching materials for client ${clientId}:`, error);
      return [];
    }
  },

  getAllMaterials: async (filters = {}) => {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/client-materials/all/${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : [];
    } catch (error) {
      console.error("Error fetching all client materials:", error);
      return [];
    }
  },

  getMaterialById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/client-materials/material/${id}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : null;
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error);
      throw error;
    }
  },

  addClientMaterial: async (materialData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/client-materials/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Error adding client material:', error);
      throw error;
    }
  },

  updateClientMaterial: async (id, materialData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/client-materials/material/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error(`Error updating client material ${id}:`, error);
      throw error;
    }
  },

  deleteClientMaterial: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/client-materials/material/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return { success: true };
    } catch (error) {
      console.error(`Error deleting client material ${id}:`, error);
      throw error;
    }
  },

  generateDeliveryNote: async (materialIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/client-materials/generate-delivery-note/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ material_ids: materialIds }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Error generating delivery note:', error);
      throw error;
    }
  },

  saveBill: async (billData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/client-materials/save-bill/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text && text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Error saving bill:', error);
      throw error;
    }
  },
};

export default clientMaterialService;
