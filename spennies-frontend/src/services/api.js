import axios from 'axios';
import { auth } from '../config/firebase';

const waitForAuth = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request
// Add auth token to every request
api.interceptors.request.use(async (config) => {
  let user = auth.currentUser;
  
  if (!user) user = await waitForAuth();
  
  if (user) {
    // 🔥 KEY FIX: Force Refresh Token on every request to ensure validity
    const token = await user.getIdToken(true);
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response Interceptor with Retry Logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const user = auth.currentUser;
        if (user) {
          console.log("🔄 Refreshing token and retrying...");
          const newToken = await user.getIdToken(true); // Force refresh
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed", refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;