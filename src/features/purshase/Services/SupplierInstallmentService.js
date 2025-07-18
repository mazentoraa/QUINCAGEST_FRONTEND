import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const PLANS_ENDPOINT = `${API_BASE_URL}/plans-traite-fournisseur/`;
const TRAITES_ENDPOINT = `${API_BASE_URL}/traites-fournisseur/`;

const SupplierInstallmentService = {
  async createPlan(payload) {
    const response = await axios.post(PLANS_ENDPOINT, payload);
    return response.data;
  },
  async getAllPlans() {
    const response = await axios.get(PLANS_ENDPOINT);
    return response.data.results || response.data;
  },
  async getAllTraites() {
    const response = await axios.get(TRAITES_ENDPOINT);
    return response.data.results || response.data;
  },
  async deleteTraite(id) {
    return axios.delete(`${TRAITES_ENDPOINT}${id}/`);
  },
  async deletePlan(id) {
    return axios.delete(`${PLANS_ENDPOINT}${id}/`);
  },
  async updatePlan(id, payload) {
    // PATCH pour mettre à jour le plan (statuts traites)
    const response = await axios.patch(`${PLANS_ENDPOINT}${id}/`, payload);
    return response.data;
  },
};

export default SupplierInstallmentService;
