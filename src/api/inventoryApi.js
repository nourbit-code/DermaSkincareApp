import axios from 'axios';

const API_URL = 'http://localhost:8000/api/inventory'; // backend URL

export const getInventory = () => axios.get(`${API_URL}/`);
export const addStock = (item) => axios.post(`${API_URL}/add`, item);
export const useItem = (itemId, quantity, appointmentId) => 
    axios.post(`${API_URL}/use`, { itemId, quantity, appointmentId });
export const undoUsage = (usageId) => axios.post(`${API_URL}/undo`, { usageId });
export const getReport = (from, to) => axios.get(`${API_URL}/report?from=${from}&to=${to}`);
