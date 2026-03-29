import axios from 'axios';
import { getAccessToken, refreshTokens, clearSession } from './auth';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized and retry once with a refreshed token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshTokens();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearSession();
        // Redirect to login (this would usually be handled by a navigation service or state change)
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
