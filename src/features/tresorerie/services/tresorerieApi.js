import axios from "axios";

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api/tresorerie").replace(/\/+$/, '');

const API_URL = `${API_BASE_URL}`;

export const fetchKPIs = () => axios.get(`${API_URL}/kpis/`);
export const fetchSchedule = () => axios.get(`${API_URL}/schedule/`);
export const fetchTraites = (params) => axios.get(`${API_URL}/traites/`, { params });
export const fetchPeriodData = (period = 'week') => axios.get(`${API_URL}/period/`, { params: { period } });