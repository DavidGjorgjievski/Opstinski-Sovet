import axios from 'axios';
import { triggerSessionExpired } from '../context/sessionModalHelper';
import { pageKeyFromPath } from '../utils/pageKeyFromPath';

// Create Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Attach JWT and session token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const sessionToken = localStorage.getItem('sessionToken');
  if (sessionToken) {
    config.headers['X-Session-Token'] = sessionToken;
  }

  if (config.url?.includes('/heartbeat')) {
    const label = localStorage.getItem('currentPageLabel') || pageKeyFromPath(window.location.pathname);
    const truncated = label.length > 200 ? label.substring(0, 200) : label;
    config.headers['X-Current-Page'] = encodeURIComponent(truncated);
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
