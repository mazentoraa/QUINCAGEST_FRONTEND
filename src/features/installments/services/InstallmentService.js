import axios from 'axios';
import { getApiService } from '../../../services/apiServiceFactory';

// Détecte automatiquement l'URL d'API selon l'environnement
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";



const { cdsService } = getApiService();

export const getPlansTraite = async () => {
  const data = await cdsService.getPlansTraite();
  console.log("!!traiite", data);
  return data;
};

export const createPlanTraite = async (planData) => {
  const response = await cdsService.createPlanTraite(planData);
  return response;
};

export const updateTraiteStatus = async (traiteId, statusData) => {
  const response = await axios.patch(
    `${API_BASE_URL}/api/traites/${traiteId}/update-status/`,
    statusData
  );
  return response.data;
};

export const updatePlanStatus = async (planId, statusData) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/plans-traite/${planId}/update-status/`,
    statusData
  );
  return response.data;
};
