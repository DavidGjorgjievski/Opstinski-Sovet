import axios from 'axios';
import { triggerSessionExpired } from '../context/sessionModalHelper';

// Create Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// Global response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      // Only trigger once per session
      if (!window.sessionExpiredTriggered) {
        window.sessionExpiredTriggered = true;
        triggerSessionExpired();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
