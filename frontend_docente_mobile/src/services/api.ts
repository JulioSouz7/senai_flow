import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { LoginResponse, MobileSession } from '@/types/mobile';

const SESSION_KEY = 'senai_flow_session';
const LOCAL_API_URL = 'http://localhost:3001';

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || LOCAL_API_URL;
export const usesLocalApiFallback = apiBaseUrl === LOCAL_API_URL;

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/usuarios/login', { email, senha });
  return data;
}

api.interceptors.request.use(async (config) => {
  if (config.url === '/usuarios/login') return config;
  const stored = await SecureStore.getItemAsync(SESSION_KEY);
  if (stored) {
    const session = JSON.parse(stored) as MobileSession;
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export async function getStoredSession(): Promise<MobileSession | null> {
  const stored = await SecureStore.getItemAsync(SESSION_KEY);
  if (!stored) return null;
  return JSON.parse(stored) as MobileSession;
}

export async function storeSession(session: MobileSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearStoredSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const message = axiosError.response?.data?.message ?? axiosError.response?.data?.error;
    if (message) return message;
    if (!axiosError.response) {
      return `Não foi possível conectar à API em ${apiBaseUrl}. Confira a rede e a configuração EXPO_PUBLIC_API_URL.`;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
