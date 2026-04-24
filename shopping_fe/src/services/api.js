import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error) => {
  const status = error?.response?.status;
  const payload = error?.response?.data;

  if (status === 401) {
    return 'Unauthorized. Please log in again.';
  }

  if (status === 403) {
    return payload?.message || 'Forbidden. You do not have permission for this action.';
  }

  if (status >= 500) {
    return payload?.message || 'Server error. Please try again later.';
  }

  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return Object.values(payload.data).join(' ');
  }

  if (payload?.message) {
    return payload.message;
  }

  return error?.message || 'Something went wrong.';
};

export const unwrapData = (response) => response.data?.data;

export default api;
