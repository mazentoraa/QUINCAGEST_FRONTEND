import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const API_URL = `${API_BASE_URL}/bon-livraison-matieres`;

class BonLivraisonMatiereService {
  async getAll() {
    const response = await axios.get(`${API_URL}/`);
    const data = response.data;
    return Array.isArray(data) ? data : data.results || [];
  }

  async getById(id) {
    const response = await axios.get(`${API_URL}/${id}/`);
    return response.data;
  }

  async create(data) {
    const response = await axios.post(`${API_URL}/`, data);
    return response.data;
  }

  async update(id, data) {
    const response = await axios.put(`${API_URL}/${id}/`, data);
    return response.data;
  }

  async delete(id) {
    const response = await axios.delete(`${API_URL}/${id}/`);
    return response.data;
  }
}

export default new BonLivraisonMatiereService();
