// No ficheiro services/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("senai_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});