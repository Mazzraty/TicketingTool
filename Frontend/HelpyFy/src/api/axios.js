import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

/**
 * 🔐 REQUEST INTERCEPTOR
 * Attach JWT token automatically
 */
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 🚨 RESPONSE INTERCEPTOR
 * Handle expired/invalid token globally
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // 🔐 ONLY logout for invalid/expired token
    if (status === 401) {
      const hasStoredUser = Boolean(localStorage.getItem("user"));

      if (hasStoredUser) {
        window.dispatchEvent(new Event("auth:logout"));
      } else {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }

);

export default api;