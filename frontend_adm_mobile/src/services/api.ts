import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

function obterApiHost(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return `http://${host}:3001`;
    }
  }
  return 'http://localhost:3001';
}

export const API_HOST = obterApiHost();

export const api = axios.create({
  baseURL: API_HOST,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('senai_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');

    // Se o token salvo expirou ou ficou inválido, limpa a sessão armazenada
    if (status === 401 && !url.includes('/login') && !url.includes('/auth')) {
      await AsyncStorage.multiRemove(['senai_token', 'senai_user', 'usuario']);
    }

    return Promise.reject(error);
  },
);

export function resolverUrlImagemMobile(url?: string | null): string | null {
  if (!url) return null;

  if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, API_HOST);
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const caminhoLimpo = url.replace(/\\/g, '/').replace(/^\//, '');
  return `${API_HOST}/${caminhoLimpo}`;
}