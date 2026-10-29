import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// Adiciona o token salvo no localStorage em TODAS as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('senai_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});