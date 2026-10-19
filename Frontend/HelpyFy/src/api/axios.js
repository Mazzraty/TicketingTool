import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  withCredentials: true,
});

/**
 * 🔐 REQUEST INTERCEPTOR
 * Attach JWT token automatically
 */
api.interceptors.request.use(
  (config) => {
    const role = localStorage.getItem("role");
    if (role === "super_admin" || role === "it_support") {
      try {
        const activeCompany = JSON.parse(
          localStorage.getItem("activeCompany") || "null"
        );
        const company = activeCompany?.companyId || activeCompany;
        const companyId = company?._id || company;

        if (companyId) {
          config.headers = config.headers || {};
          config.headers["X-Company-Id"] = String(companyId);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    }

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