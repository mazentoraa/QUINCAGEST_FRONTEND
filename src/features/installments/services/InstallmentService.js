import axios from 'axios';
import { getApiService } from '../../../services/apiServiceFactory';

// Supprime le slash final s'il existe
const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");

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
    `${BASE_URL}/traites/${traiteId}/update-status/`,
    statusData
  );
  return response.data;
};

export const updatePlanStatus = async (planId, statusData) => {
  const response = await axios.put(
    `${BASE_URL}/plans-traite/${planId}/update-status/`,
    statusData
  );
  return response.data;
};


export const softDeleteInstallment = async (planId) => {
  const response = await axios.patch(
    `${BASE_URL}/plans-traite/${planId}/soft-delete/`,
    { is_deleted: true }
  );
  return response.data;
};