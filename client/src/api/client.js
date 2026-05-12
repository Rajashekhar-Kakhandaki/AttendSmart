import axios from 'axios';
import { queryClient } from '../main';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired or invalid token)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Cancel in-flight queries and wipe cache before redirecting
      queryClient.cancelQueries();
      queryClient.clear();
      localStorage.removeItem('bs_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
