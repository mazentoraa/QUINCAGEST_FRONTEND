import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

export const categoryService = {
  // Categories
  getCategories: () => axios.get(`${API_BASE}/categories/list_tree/`),
  getCategorie: (id) => axios.get(`${API_BASE}/categories/${id}/`),
  createCategorie: (data) => axios.post(`${API_BASE}/categories/`, data),
  updateCategorie: (id, data) => axios.put(`${API_BASE}/categories/${id}/`, data),
  deleteCategorie: (id) => axios.delete(`${API_BASE}/categories/${id}/`),

  // Sous-Categories
  getSousCategories: () => axios.get(`${API_BASE}/sous-categories/`),
  getSousCategorie: (id) => axios.get(`${API_BASE}/sous-categories/${id}/`),
  createSousCategorie: (data) => axios.post(`${API_BASE}/sous-categories/`, data),
  updateSousCategorie: (id, data) => axios.put(`${API_BASE}/sous-categories/${id}/`, data),
  deleteSousCategorie: (id) => axios.delete(`${API_BASE}/sous-categories/${id}/`),
};
