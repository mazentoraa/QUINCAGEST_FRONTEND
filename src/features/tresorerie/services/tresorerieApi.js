import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const API_URL = `${API_BASE_URL}`;

export const fetchKPIs = (evolution_weeks = '30d') => axios.get(`${API_URL}/kpis/?evolution_weeks=${evolution_weeks}`);
export const fetchSchedule = () => axios.get(`${API_URL}/schedule/`);
export const fetchTraites = (params) => axios.get(`${API_URL}/tresorerietraites/`, { params });
export const fetchPeriodData = (period = 'week') => axios.get(`${API_URL}/period/`, { params: { period } });