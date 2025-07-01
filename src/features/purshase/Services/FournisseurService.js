import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api/fournisseurs";

class FournisseurService {
  static async getAll() {
    const response = await axios.get(`${API_BASE_URL}/`);
    // Ici tu peux adapter si backend renvoie { results: [...] }
    return response.data;
  }

  static async getById(id) {
    const response = await axios.get(`${API_BASE_URL}/${id}/`);
    return response.data;
  }

  static async create(fournisseur) {
    const response = await axios.post(`${API_BASE_URL}/`, fournisseur);
    return response.data;
  }

  static async update(id, fournisseur) {
    const response = await axios.put(`${API_BASE_URL}/${id}/`, fournisseur);
    return response.data;
  }

  static async delete(id) {
    await axios.delete(`${API_BASE_URL}/${id}/`);
    // Pas besoin de retourner response.data si 204 No Content
    return true;
  }
}

export default FournisseurService;
