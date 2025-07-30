// services/avanceService.js
import axios from 'axios';

// Base URL de l'API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Configuration Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur global pour la gestion des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ==============================
// SERVICE EMPLOYÉS
// ==============================
export const employeService = {
  getAllEmployees: async () => {
    try {
      const response = await api.get('/employes/');
      return response.data.results || response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/employes/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  searchEmployees: async (search) => {
    try {
      const response = await api.get(`/employes/?search=${search}`);
      return response.data.results || response.data;
    } catch (error) {
      throw error;
    }
  },
};

// ==============================
// SERVICE AVANCES
// ==============================
export const avanceService = {
  getAllAvances: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.statut && filters.statut !== 'Tous') params.append('statut', filters.statut);
      if (filters.employee) params.append('employee', filters.employee);

      const response = await api.get(`/avances/?${params.toString()}`);
      return response.data.results || response.data;
    } catch (error) {
      throw error;
    }
  },

  getAvanceById: async (id) => {
    try {
      const response = await api.get(`/avances/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createAvance: async (data) => {
    try {
      const response = await api.post('/avances/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateAvance: async (id, data) => {
    try {
      const response = await api.put(`/avances/${id}/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteAvance: async (id) => {
    try {
      const response = await api.delete(`/avances/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateStatus: async (id, statut) => {
    try {
      const response = await api.patch(`/avances/${id}/update_status/`, { statut });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStatistics: async () => {
    try {
      const response = await api.get('/avances/statistics/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// ==============================
// SERVICE REMBOURSEMENTS
// ==============================
export const remboursementService = {
  getAllRemboursements: async (avanceId = null) => {
    try {
      const params = avanceId ? `?avance=${avanceId}` : '';
      const response = await api.get(`/remboursements/${params}`);
      return response.data.results || response.data;
    } catch (error) {
      throw error;
    }
  },

  createRemboursement: async (data) => {
    try {
      const response = await api.post('/remboursements/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateRemboursement: async (id, data) => {
    try {
      const response = await api.put(`/remboursements/${id}/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteRemboursement: async (id) => {
    try {
      const response = await api.delete(`/remboursements/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// ==============================
// UTILITAIRE POUR LES ERREURS
// ==============================
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;

    if (status === 400) {
      if (data.error) return data.error;
      if (data.non_field_errors) return data.non_field_errors.join(', ');
      return 'Données invalides';
    }

    if (status === 404) return 'Ressource non trouvée';
    if (status === 500) return 'Erreur interne du serveur';

    return data.error || data.message || 'Erreur serveur';
  } else if (error.request) {
    return 'Impossible de contacter le serveur';
  } else {
    return error.message || 'Erreur inconnue';
  }
};
