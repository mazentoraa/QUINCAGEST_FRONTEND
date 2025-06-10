import axios from 'axios';
import { getApiService } from '../../../services/apiServiceFactory';

const { cdsService } = getApiService();

export const getPlansTraite = async () => {
  const data = await cdsService.getPlansTraite();
  return data;
};

export const createPlanTraite = async (planData) => {
  const response = await cdsService.createPlanTraite(planData);
  return response;
};

export const updateTraiteStatus = async (traiteId, statusData) => {
  const response = await axios.patch(`http://localhost:8000/api/traites/${traiteId}/update-status/`, statusData);
  return response.data;
};
