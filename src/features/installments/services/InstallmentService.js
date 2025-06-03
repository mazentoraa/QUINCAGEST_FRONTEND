import { getApiService } from '../../../services/apiServiceFactory';

const { cdsService } = getApiService();

const BASE_URL = '/api/plans-traite/';

export const getPlanTraitess = async () => {
  const data = await cdsService.getPlansTraite();
  return data;
};

export const createPlanTraite = async (planData) => {
  const response = await cdsService.createPlanTraite(planData);
  return response;
};

export const updateTraiteStatus = async (traiteId, statusData) => {
  const response = await cdsService.updateTraiteStatus(traiteId, statusData);
  return response;
};
