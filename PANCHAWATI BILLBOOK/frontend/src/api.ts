import axios from 'axios';
import { useAuthStore } from './store/useAuthStore';

// Use relative URL so Vite proxy handles it in dev, use absolute in production
export const API_URL = import.meta.env.PROD ? 'https://backend-nine-phi-tms0hdue3l.vercel.app/api' : '/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to automatically attach the token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
