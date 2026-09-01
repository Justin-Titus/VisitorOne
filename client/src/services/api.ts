/// <reference types="vite/client" />
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env['VITE_API_BASE_URL'] ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const axiosError = error as {
      response?: { data?: { message?: string }; status?: number };
      message?: string;
    };
    const message = axiosError.response?.data?.message ?? 'Something went wrong';
    if (axiosError.response?.status === 401) {
      localStorage.removeItem('vpms-token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    toast.error(message, { id: 'api-error-toast' });
    return Promise.reject(error);
  },
);

export default api;
