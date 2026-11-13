// No ficheiro services/api.ts
import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3001").trim().replace(/\/+$/, "");

export const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("senai_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});