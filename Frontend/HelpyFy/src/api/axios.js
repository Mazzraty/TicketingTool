import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// 🔐 Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
console.log("API URL:", import.meta.env.VITE_API_URL);
  console.log("TOKEN:", token); // debug

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;